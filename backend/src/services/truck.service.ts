import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/error.middleware";
import { TruckStatus, ShipmentStatus } from "@prisma/client";
import { broadcast } from "../lib/websocket";

// ─────────────────────────────────────────────────────────────────────────────
// Create Truck
// ─────────────────────────────────────────────────────────────────────────────
export async function createTruck(data: {
  name: string;
  plateNumber: string;
  capacity?: number;
}) {
  return prisma.truck.create({
    data: {
      name: data.name.trim(),
      plateNumber: data.plateNumber.trim().toUpperCase(),
      capacity: data.capacity ?? 20,
      status: TruckStatus.INACTIVE,
    },
    include: { driver: { include: { user: { select: { name: true, email: true } } } }, shipments: true },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Get All Trucks
// ─────────────────────────────────────────────────────────────────────────────
export async function getTrucks() {
  return prisma.truck.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      driver: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      shipments: {
        include: { customer: { select: { id: true, name: true, company: true } } },
      },
      _count: { select: { shipments: true } },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Get Truck by ID
// ─────────────────────────────────────────────────────────────────────────────
export async function getTruckById(id: string) {
  const truck = await prisma.truck.findUnique({
    where: { id },
    include: {
      driver: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      shipments: {
        include: {
          customer: { select: { id: true, name: true, company: true } },
          statusHistory: { orderBy: { updatedAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { shipments: true } },
    },
  });

  if (!truck) throw new AppError(404, "Truck not found.");
  return truck;
}

// ─────────────────────────────────────────────────────────────────────────────
// Update Truck (name, plateNumber, capacity, status)
// ─────────────────────────────────────────────────────────────────────────────
export async function updateTruck(
  id: string,
  data: { name?: string; plateNumber?: string; capacity?: number; status?: TruckStatus }
) {
  await getTruckById(id);
  return prisma.truck.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name.trim() }),
      ...(data.plateNumber && { plateNumber: data.plateNumber.trim().toUpperCase() }),
      ...(data.capacity !== undefined && { capacity: data.capacity }),
      ...(data.status && { status: data.status }),
    },
    include: {
      driver: { include: { user: { select: { id: true, name: true, email: true } } } },
      shipments: true,
      _count: { select: { shipments: true } },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete Truck
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteTruck(id: string) {
  await getTruckById(id);
  // Unload all shipments before deleting
  await prisma.shipment.updateMany({ where: { truckId: id }, data: { truckId: null } });
  return prisma.truck.delete({ where: { id } });
}

// ─────────────────────────────────────────────────────────────────────────────
// Load a shipment onto a truck
// ─────────────────────────────────────────────────────────────────────────────
export async function loadShipmentToTruck(truckId: string, shipmentId: string) {
  const truck = await getTruckById(truckId);

  if (truck.status === TruckStatus.ACTIVE) {
    throw new AppError(400, "Cannot load shipments onto an ACTIVE truck mid-journey.");
  }

  const currentCount = truck._count.shipments;
  if (currentCount >= truck.capacity) {
    throw new AppError(400, `Truck is at full capacity (${truck.capacity} parcels).`);
  }

  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
  if (!shipment) throw new AppError(404, "Shipment not found.");
  if (shipment.truckId) throw new AppError(400, "Shipment is already loaded on a truck.");
  if (shipment.status !== ShipmentStatus.PENDING) {
    throw new AppError(400, "Only PENDING shipments can be loaded onto a truck.");
  }

  return prisma.shipment.update({
    where: { id: shipmentId },
    data: { truckId },
    include: { customer: { select: { id: true, name: true, company: true } } },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Unload a shipment from a truck
// ─────────────────────────────────────────────────────────────────────────────
export async function unloadShipmentFromTruck(truckId: string, shipmentId: string) {
  const truck = await getTruckById(truckId);
  if (truck.status === TruckStatus.ACTIVE) {
    throw new AppError(400, "Cannot unload shipments from an ACTIVE truck mid-journey.");
  }

  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
  if (!shipment || shipment.truckId !== truckId) {
    throw new AppError(404, "Shipment is not loaded on this truck.");
  }

  return prisma.shipment.update({
    where: { id: shipmentId },
    data: { truckId: null },
    include: { customer: { select: { id: true, name: true, company: true } } },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Assign driver to truck (allotment)
// ─────────────────────────────────────────────────────────────────────────────
export async function assignDriverToTruck(truckId: string, driverId: string) {
  const truck = await getTruckById(truckId);
  if (truck.status === TruckStatus.ACTIVE) {
    throw new AppError(400, "Cannot re-assign driver to an ACTIVE truck.");
  }
  if (truck.status === TruckStatus.INACTIVE) {
    throw new AppError(400, "Cannot assign driver to an INACTIVE (under maintenance) truck.");
  }

  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) throw new AppError(404, "Driver not found.");
  if (!driver.isApproved) throw new AppError(403, "Driver is not approved yet.");
  if (!driver.isOnDuty) throw new AppError(400, "Driver is not on duty.");

  // Check if driver is already on another truck
  const existingTruck = await prisma.truck.findFirst({ where: { driverId } });
  if (existingTruck && existingTruck.id !== truckId) {
    throw new AppError(409, "Driver is already assigned to another truck.");
  }

  return prisma.truck.update({
    where: { id: truckId },
    data: { driverId, status: TruckStatus.READY },
    include: {
      driver: { include: { user: { select: { id: true, name: true, email: true } } } },
      shipments: true,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Remove driver from truck
// ─────────────────────────────────────────────────────────────────────────────
export async function removeDriverFromTruck(truckId: string) {
  const truck = await getTruckById(truckId);
  if (truck.status === TruckStatus.ACTIVE) {
    throw new AppError(400, "Cannot remove driver from an ACTIVE truck.");
  }

  return prisma.truck.update({
    where: { id: truckId },
    data: { driverId: null, status: TruckStatus.NO_ALLOTMENT },
    include: {
      driver: { include: { user: { select: { id: true, name: true, email: true } } } },
      shipments: true,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto-allot available on-duty drivers to NO_ALLOTMENT trucks (FIFO)
// ─────────────────────────────────────────────────────────────────────────────
export async function autoAllotDrivers() {
  // Get trucks that need a driver (ordered oldest first)
  const needsDriver = await prisma.truck.findMany({
    where: { status: TruckStatus.NO_ALLOTMENT },
    orderBy: { createdAt: "asc" },
  });

  // Get all approved, on-duty, unassigned drivers
  const availableDrivers = await prisma.driver.findMany({
    where: {
      isApproved: true,
      isOnDuty: true,
      truck: null, // no truck currently assigned
    },
    orderBy: { createdAt: "asc" },
  });

  const allotments: Array<{ truckId: string; driverId: string }> = [];

  for (let i = 0; i < Math.min(needsDriver.length, availableDrivers.length); i++) {
    const truck = needsDriver[i];
    const driver = availableDrivers[i];

    await prisma.truck.update({
      where: { id: truck.id },
      data: { driverId: driver.id, status: TruckStatus.READY },
    });

    allotments.push({ truckId: truck.id, driverId: driver.id });
  }

  // Check for shortage and broadcast if needed
  const unallocatedTrucks = needsDriver.length - availableDrivers.length;
  if (unallocatedTrucks > 0) {
    broadcast({
      event: "driver_shortage_alert",
      shortageCount: unallocatedTrucks,
      readyTrucks: needsDriver.length,
      availableDrivers: availableDrivers.length,
      timestamp: new Date().toISOString(),
    } as any);
  }

  return {
    allotmentsCreated: allotments.length,
    allotments,
    shortageCount: Math.max(0, unallocatedTrucks),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Check driver shortage
// ─────────────────────────────────────────────────────────────────────────────
export async function checkDriverShortage() {
  const [readyTrucksCount, availableDriversCount] = await Promise.all([
    prisma.truck.count({ where: { status: TruckStatus.NO_ALLOTMENT } }),
    prisma.driver.count({ where: { isApproved: true, isOnDuty: true, truck: null } }),
  ]);

  const shortageCount = Math.max(0, readyTrucksCount - availableDriversCount);

  return {
    readyTrucks: readyTrucksCount,
    availableDrivers: availableDriversCount,
    shortageCount,
    hasShortage: shortageCount > 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Start Journey — truck becomes ACTIVE; all loaded shipments become IN_TRANSIT
// ─────────────────────────────────────────────────────────────────────────────
export async function startJourney(truckId: string) {
  const truck = await getTruckById(truckId);

  if (truck.status !== TruckStatus.READY) {
    throw new AppError(400, `Truck must be in READY status to start journey. Current: ${truck.status}`);
  }
  if (!truck.driverId) {
    throw new AppError(400, "No driver is assigned to this truck.");
  }

  const shipmentIds = truck.shipments.map((s) => s.id);

  await prisma.$transaction(async (tx) => {
    // Mark truck active
    await tx.truck.update({ where: { id: truckId }, data: { status: TruckStatus.ACTIVE } });

    if (shipmentIds.length > 0) {
      // Bulk update all shipments to IN_TRANSIT
      await tx.shipment.updateMany({
        where: { id: { in: shipmentIds } },
        data: { status: ShipmentStatus.IN_TRANSIT },
      });

      // Create audit history entries for each shipment
      await tx.shipmentStatusHistory.createMany({
        data: shipmentIds.map((id) => ({
          shipmentId: id,
          status: ShipmentStatus.IN_TRANSIT,
        })),
      });
    }
  });

  // Broadcast individual shipment status updates so all client tables update instantly
  for (const shipment of truck.shipments) {
    broadcast({
      event: "shipment_status_changed",
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      customerName: (shipment as any).customer?.name ?? undefined,
      status: "IN_TRANSIT",
      timestamp: new Date().toISOString(),
    });
  }

  // Broadcast truck status change
  broadcast({
    event: "truck_status_changed",
    truckId,
    truckName: truck.name,
    plateNumber: truck.plateNumber,
    status: "ACTIVE",
    shipmentsUpdated: shipmentIds.length,
    timestamp: new Date().toISOString(),
  } as any);

  return getTruckById(truckId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Complete Journey — driver reaches delivery hub; shipments become OUT_FOR_DELIVERY
// ─────────────────────────────────────────────────────────────────────────────
export async function completeJourney(truckId: string) {
  const truck = await getTruckById(truckId);

  if (truck.status !== TruckStatus.ACTIVE) {
    throw new AppError(400, `Truck must be ACTIVE to complete journey. Current: ${truck.status}`);
  }

  const shipmentIds = truck.shipments.map((s) => s.id);

  await prisma.$transaction(async (tx) => {
    if (shipmentIds.length > 0) {
      // Transition all loaded shipments to OUT_FOR_DELIVERY when driver reaches delivery hub/point
      await tx.shipment.updateMany({
        where: { id: { in: shipmentIds } },
        data: {
          status: ShipmentStatus.OUT_FOR_DELIVERY,
          truckId: null, // unloaded at delivery hub for local delivery agent
        },
      });

      // Create audit history entries for OUT_FOR_DELIVERY
      await tx.shipmentStatusHistory.createMany({
        data: shipmentIds.map((id) => ({
          shipmentId: id,
          status: ShipmentStatus.OUT_FOR_DELIVERY,
        })),
      });
    }

    // Return truck to NO_ALLOTMENT and remove driver assignment (ready for next warehouse run)
    await tx.truck.update({
      where: { id: truckId },
      data: { status: TruckStatus.NO_ALLOTMENT, driverId: null },
    });
  });

  // Broadcast individual shipment status updates so all client tables update instantly to OUT_FOR_DELIVERY
  for (const shipment of truck.shipments) {
    broadcast({
      event: "shipment_status_changed",
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      customerName: (shipment as any).customer?.name ?? undefined,
      status: "OUT_FOR_DELIVERY",
      timestamp: new Date().toISOString(),
    });
  }

  broadcast({
    event: "truck_status_changed",
    truckId,
    truckName: truck.name,
    plateNumber: truck.plateNumber,
    status: "NO_ALLOTMENT",
    shipmentsUpdated: shipmentIds.length,
    timestamp: new Date().toISOString(),
  } as any);

  return getTruckById(truckId);
}
