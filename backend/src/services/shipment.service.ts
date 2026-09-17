import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/error.middleware";
import { CreateShipmentInput } from "../schemas/shipment.schema";
import { ShipmentStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Create
// ─────────────────────────────────────────────────────────────────────────────
export async function createShipment(data: CreateShipmentInput) {
  return prisma.shipment.create({
    data: {
      trackingNumber: data.trackingNumber,
      customerId: data.customerId,
      origin: data.origin,
      destination: data.destination,
      status: data.status as ShipmentStatus,
      // Seed an initial history entry
      statusHistory: {
        create: { status: (data.status as ShipmentStatus) ?? ShipmentStatus.PENDING },
      },
    },
    include: {
      customer: { select: { id: true, name: true, company: true } },
      statusHistory: true,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Read – full list with customer summary
// ─────────────────────────────────────────────────────────────────────────────
export async function getShipments() {
  return prisma.shipment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, name: true, company: true } },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Read – single shipment with full customer + audit history
// ─────────────────────────────────────────────────────────────────────────────
export async function getShipmentById(id: string) {
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      customer: true,
      statusHistory: { orderBy: { updatedAt: "desc" } },
    },
  });

  if (!shipment) {
    throw new AppError(404, "Shipment not found.");
  }

  return shipment;
}

// ─────────────────────────────────────────────────────────────────────────────
// Update status + append audit log entry (atomic transaction)
// ─────────────────────────────────────────────────────────────────────────────
export async function updateShipmentStatus(id: string, status: ShipmentStatus) {
  // Ensure shipment exists
  await getShipmentById(id);

  const [updatedShipment] = await prisma.$transaction([
    prisma.shipment.update({
      where: { id },
      data: { status },
      include: {
        customer: { select: { id: true, name: true, company: true } },
        statusHistory: { orderBy: { updatedAt: "desc" } },
      },
    }),
    prisma.shipmentStatusHistory.create({
      data: { shipmentId: id, status },
    }),
  ]);

  return updatedShipment;
}
