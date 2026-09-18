import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/error.middleware";
import { UserRole } from "@prisma/client";

const SALT_ROUNDS = 10;

// ─────────────────────────────────────────────────────────────────────────────
// Register a Driver (creates User + Driver record)
// ─────────────────────────────────────────────────────────────────────────────
export async function registerDriver(data: {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  licenseNumber: string;
  photoUrl?: string;
}) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase().trim() },
  });
  if (existingUser) throw new AppError(409, "A user with this email already exists.");

  const existingLicense = await prisma.driver.findUnique({
    where: { licenseNumber: data.licenseNumber.trim().toUpperCase() },
  });
  if (existingLicense) throw new AppError(409, "A driver with this license number already exists.");

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  return prisma.user.create({
    data: {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      password: hashedPassword,
      role: UserRole.DRIVER,
      driver: {
        create: {
          phone: data.phone.trim(),
          address: data.address.trim(),
          licenseNumber: data.licenseNumber.trim().toUpperCase(),
          photoUrl: data.photoUrl ?? null,
          isApproved: false,
          isOnDuty: false,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      driver: true,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Get all Drivers
// ─────────────────────────────────────────────────────────────────────────────
export async function getDrivers() {
  return prisma.driver.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
      truck: { select: { id: true, name: true, plateNumber: true, status: true } },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Get Driver by ID
// ─────────────────────────────────────────────────────────────────────────────
export async function getDriverById(id: string) {
  const driver = await prisma.driver.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
      truck: {
        include: {
          shipments: {
            include: { customer: { select: { id: true, name: true, company: true } } },
          },
        },
      },
    },
  });
  if (!driver) throw new AppError(404, "Driver not found.");
  return driver;
}

// ─────────────────────────────────────────────────────────────────────────────
// Get Driver profile by linked User ID (for DRIVER role login)
// ─────────────────────────────────────────────────────────────────────────────
export async function getDriverProfileByUserId(userId: string) {
  const driver = await prisma.driver.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
      truck: {
        include: {
          shipments: {
            include: { customer: { select: { id: true, name: true, company: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
  if (!driver) throw new AppError(404, "Driver profile not found for this user.");
  return driver;
}

// ─────────────────────────────────────────────────────────────────────────────
// Update Driver
// ─────────────────────────────────────────────────────────────────────────────
export async function updateDriver(
  id: string,
  data: {
    phone?: string;
    address?: string;
    licenseNumber?: string;
    photoUrl?: string;
    isOnDuty?: boolean;
    isApproved?: boolean;
  }
) {
  await getDriverById(id);
  return prisma.driver.update({
    where: { id },
    data: {
      ...(data.phone && { phone: data.phone.trim() }),
      ...(data.address && { address: data.address.trim() }),
      ...(data.licenseNumber && { licenseNumber: data.licenseNumber.trim().toUpperCase() }),
      ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
      ...(data.isOnDuty !== undefined && { isOnDuty: data.isOnDuty }),
      ...(data.isApproved !== undefined && { isApproved: data.isApproved }),
    },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      truck: { select: { id: true, name: true, plateNumber: true, status: true } },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete Driver (removes driver profile + user account)
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteDriver(id: string) {
  const driver = await getDriverById(id);
  // Remove driver from truck if assigned
  if (driver.truck) {
    await prisma.truck.update({
      where: { id: driver.truck.id },
      data: { driverId: null, status: "NO_ALLOTMENT" },
    });
  }
  // Cascade deletes the driver record; user is deleted by cascading from user→driver relation
  await prisma.driver.delete({ where: { id } });
  return prisma.user.delete({ where: { id: driver.userId } });
}

// ─────────────────────────────────────────────────────────────────────────────
// Approve Driver
// ─────────────────────────────────────────────────────────────────────────────
export async function approveDriver(id: string) {
  await getDriverById(id);
  return prisma.driver.update({
    where: { id },
    data: { isApproved: true, isOnDuty: true },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      truck: { select: { id: true, name: true, plateNumber: true, status: true } },
    },
  });
}
