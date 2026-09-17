import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/error.middleware";
import { CreateCustomerInput, UpdateCustomerInput } from "../schemas/customer.schema";
import { CustomerStatus } from "@prisma/client";

export interface CustomerQueryFilters {
  status?: CustomerStatus;
  search?: string;
  page?: number;
  limit?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Create
// ─────────────────────────────────────────────────────────────────────────────
export async function createCustomer(data: CreateCustomerInput) {
  return prisma.customer.create({
    data: {
      name: data.name,
      email: data.email,
      company: data.company,
      status: data.status as CustomerStatus,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Read – paginated list, excluding soft-deleted records
// ─────────────────────────────────────────────────────────────────────────────
export async function getCustomers(filters: CustomerQueryFilters = {}) {
  const { status, search, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const where = {
    isDeleted: false,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { company: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [customers, total] = await prisma.$transaction([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { shipments: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    customers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Read – single customer with all shipments
// ─────────────────────────────────────────────────────────────────────────────
export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      shipments: {
        orderBy: { createdAt: "desc" },
        include: {
          statusHistory: { orderBy: { updatedAt: "desc" }, take: 5 },
        },
      },
    },
  });

  if (!customer) {
    throw new AppError(404, "Customer not found.");
  }
  if (customer.isDeleted) {
    throw new AppError(404, "Customer has been deleted.");
  }

  return customer;
}

// ─────────────────────────────────────────────────────────────────────────────
// Update
// ─────────────────────────────────────────────────────────────────────────────
export async function updateCustomer(id: string, data: UpdateCustomerInput) {
  // Ensure customer exists and is not soft-deleted
  await getCustomerById(id);

  return prisma.customer.update({
    where: { id },
    data: {
      ...(data.name ? { name: data.name } : {}),
      ...(data.email ? { email: data.email } : {}),
      ...(data.company ? { company: data.company } : {}),
      ...(data.status ? { status: data.status as CustomerStatus } : {}),
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Soft Delete
// ─────────────────────────────────────────────────────────────────────────────
export async function softDeleteCustomer(id: string) {
  // Ensure customer exists first
  await getCustomerById(id);

  return prisma.customer.update({
    where: { id },
    data: { isDeleted: true, status: CustomerStatus.Inactive },
  });
}
