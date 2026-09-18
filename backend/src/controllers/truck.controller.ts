import { Request, Response, NextFunction } from "express";
import * as TruckService from "../services/truck.service";

// GET /api/trucks
export async function getTrucks(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const trucks = await TruckService.getTrucks();
    res.json({ success: true, message: "Trucks retrieved successfully.", data: trucks });
  } catch (err) { next(err); }
}

// GET /api/trucks/shortage
export async function getShortageCheck(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await TruckService.checkDriverShortage();
    res.json({ success: true, message: "Shortage check complete.", data });
  } catch (err) { next(err); }
}

// GET /api/trucks/:id
export async function getTruckById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const truck = await TruckService.getTruckById(req.params.id);
    res.json({ success: true, message: "Truck retrieved successfully.", data: truck });
  } catch (err) { next(err); }
}

// POST /api/trucks
export async function createTruck(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const truck = await TruckService.createTruck(req.body);
    res.status(201).json({ success: true, message: "Truck created successfully.", data: truck });
  } catch (err) { next(err); }
}

// PUT /api/trucks/:id
export async function updateTruck(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const truck = await TruckService.updateTruck(req.params.id, req.body);
    res.json({ success: true, message: "Truck updated successfully.", data: truck });
  } catch (err) { next(err); }
}

// DELETE /api/trucks/:id
export async function deleteTruck(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    await TruckService.deleteTruck(req.params.id);
    res.json({ success: true, message: "Truck deleted successfully.", data: null });
  } catch (err) { next(err); }
}

// POST /api/trucks/:id/load
export async function loadShipment(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const shipment = await TruckService.loadShipmentToTruck(req.params.id, req.body.shipmentId);
    res.json({ success: true, message: "Shipment loaded onto truck.", data: shipment });
  } catch (err) { next(err); }
}

// POST /api/trucks/:id/unload
export async function unloadShipment(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const shipment = await TruckService.unloadShipmentFromTruck(req.params.id, req.body.shipmentId);
    res.json({ success: true, message: "Shipment unloaded from truck.", data: shipment });
  } catch (err) { next(err); }
}

// POST /api/trucks/:id/assign-driver
export async function assignDriver(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const truck = await TruckService.assignDriverToTruck(req.params.id, req.body.driverId);
    res.json({ success: true, message: "Driver assigned to truck.", data: truck });
  } catch (err) { next(err); }
}

// POST /api/trucks/:id/remove-driver
export async function removeDriver(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const truck = await TruckService.removeDriverFromTruck(req.params.id);
    res.json({ success: true, message: "Driver removed from truck.", data: truck });
  } catch (err) { next(err); }
}

// POST /api/trucks/auto-allot
export async function autoAllot(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await TruckService.autoAllotDrivers();
    res.json({ success: true, message: "Auto-allotment complete.", data: result });
  } catch (err) { next(err); }
}

// POST /api/trucks/:id/start-journey
export async function startJourney(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const truck = await TruckService.startJourney(req.params.id);
    res.json({ success: true, message: "Journey started. All shipments are now IN_TRANSIT.", data: truck });
  } catch (err) { next(err); }
}

// POST /api/trucks/:id/complete-journey
export async function completeJourney(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const truck = await TruckService.completeJourney(req.params.id);
    res.json({ success: true, message: "Journey completed. Truck returned to warehouse.", data: truck });
  } catch (err) { next(err); }
}
