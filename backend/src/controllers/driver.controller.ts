import { Request, Response, NextFunction } from "express";
import * as DriverService from "../services/driver.service";

// GET /api/drivers
export async function getDrivers(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const drivers = await DriverService.getDrivers();
    res.json({ success: true, message: "Drivers retrieved successfully.", data: drivers });
  } catch (err) { next(err); }
}

// GET /api/drivers/me (for DRIVER role)
export async function getMyDriverProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await DriverService.getDriverProfileByUserId(req.user!.id);
    res.json({ success: true, message: "Driver profile retrieved.", data: driver });
  } catch (err) { next(err); }
}

// GET /api/drivers/:id
export async function getDriverById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await DriverService.getDriverById(req.params.id);
    res.json({ success: true, message: "Driver retrieved successfully.", data: driver });
  } catch (err) { next(err); }
}

// POST /api/drivers/register
export async function registerDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await DriverService.registerDriver(req.body);
    res.status(201).json({ success: true, message: "Driver registered successfully. Awaiting approval.", data: driver });
  } catch (err) { next(err); }
}

// PUT /api/drivers/:id
export async function updateDriver(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await DriverService.updateDriver(req.params.id, req.body);
    res.json({ success: true, message: "Driver updated successfully.", data: driver });
  } catch (err) { next(err); }
}

// DELETE /api/drivers/:id
export async function deleteDriver(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    await DriverService.deleteDriver(req.params.id);
    res.json({ success: true, message: "Driver removed successfully.", data: null });
  } catch (err) { next(err); }
}

// POST /api/drivers/:id/approve
export async function approveDriver(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await DriverService.approveDriver(req.params.id);
    res.json({ success: true, message: "Driver approved and set to on-duty.", data: driver });
  } catch (err) { next(err); }
}
