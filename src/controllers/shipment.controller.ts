import { Request, Response, NextFunction } from "express";
import * as ShipmentService from "../services/shipment.service";
import { ShipmentStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/shipments
// ─────────────────────────────────────────────────────────────────────────────
export async function createShipment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shipment = await ShipmentService.createShipment(req.body);
    res.status(201).json({
      success: true,
      message: "Shipment created successfully.",
      data: shipment,
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/shipments
// ─────────────────────────────────────────────────────────────────────────────
export async function getShipments(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shipments = await ShipmentService.getShipments();
    res.json({
      success: true,
      message: "Shipments retrieved successfully.",
      data: shipments,
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/shipments/:id
// ─────────────────────────────────────────────────────────────────────────────
export async function getShipmentById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shipment = await ShipmentService.getShipmentById(req.params.id);
    res.json({
      success: true,
      message: "Shipment retrieved successfully.",
      data: shipment,
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/shipments/:id/status
// ─────────────────────────────────────────────────────────────────────────────
export async function updateShipmentStatus(
  req: Request<{ id: string }, object, { status: ShipmentStatus }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const shipment = await ShipmentService.updateShipmentStatus(
      req.params.id,
      req.body.status
    );
    res.json({
      success: true,
      message: "Shipment status updated successfully.",
      data: shipment,
    });
  } catch (error) {
    next(error);
  }
}
