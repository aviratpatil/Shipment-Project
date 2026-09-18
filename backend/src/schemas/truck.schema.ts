import { z } from "zod";

export const createTruckSchema = z.object({
  name: z.string().min(2, "Truck name must be at least 2 characters"),
  plateNumber: z.string().min(4, "Plate number must be at least 4 characters"),
  capacity: z.number().int().min(1).max(500).optional().default(20),
});

export const updateTruckSchema = z.object({
  name: z.string().min(2).optional(),
  plateNumber: z.string().min(4).optional(),
  capacity: z.number().int().min(1).max(500).optional(),
  status: z.enum(["NO_ALLOTMENT", "READY", "ACTIVE", "INACTIVE"]).optional(),
});

export const truckIdParamSchema = z.object({
  id: z.string().uuid("Invalid truck ID"),
});

export const loadShipmentSchema = z.object({
  shipmentId: z.string().uuid("Invalid shipment ID"),
});

export const assignDriverSchema = z.object({
  driverId: z.string().uuid("Invalid driver ID"),
});

export type CreateTruckInput = z.infer<typeof createTruckSchema>;
export type UpdateTruckInput = z.infer<typeof updateTruckSchema>;
