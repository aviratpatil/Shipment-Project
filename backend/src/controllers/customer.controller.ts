import { Request, Response, NextFunction } from "express";
import * as CustomerService from "../services/customer.service";
import { CustomerStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/customers
// ─────────────────────────────────────────────────────────────────────────────
export async function createCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customer = await CustomerService.createCustomer(req.body);
    res.status(201).json({
      success: true,
      message: "Customer created successfully.",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/customers
// ─────────────────────────────────────────────────────────────────────────────
export async function getCustomers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status, search, page, limit } = req.query as Record<string, string | undefined>;
    const result = await CustomerService.getCustomers({
      status: status as CustomerStatus | undefined,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json({
      success: true,
      message: "Customers retrieved successfully.",
      data: result.customers,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/customers/:id
// ─────────────────────────────────────────────────────────────────────────────
export async function getCustomerById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customer = await CustomerService.getCustomerById(req.params.id);
    res.json({
      success: true,
      message: "Customer retrieved successfully.",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/customers/:id
// ─────────────────────────────────────────────────────────────────────────────
export async function updateCustomer(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customer = await CustomerService.updateCustomer(req.params.id, req.body);
    res.json({
      success: true,
      message: "Customer updated successfully.",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/customers/:id
// ─────────────────────────────────────────────────────────────────────────────
export async function softDeleteCustomer(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await CustomerService.softDeleteCustomer(req.params.id);
    res.json({
      success: true,
      message: "Customer deleted successfully.",
      data: null,
    });
  } catch (error) {
    next(error);
  }
}
