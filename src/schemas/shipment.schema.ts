import { z } from "zod";

const ShipmentStatusEnum = z.enum([
  "PENDING",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
]);

export const createShipmentSchema = z.object({
  trackingNumber: z.string().min(3, "Tracking number must be at least 3 characters"),
  customerId: z.string().uuid("Customer ID must be a valid UUID"),
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  status: ShipmentStatusEnum.default("PENDING"),
});

export const updateShipmentStatusSchema = z.object({
  status: ShipmentStatusEnum,
});

export const shipmentIdParamSchema = z.object({
  id: z.string().uuid("Shipment ID must be a valid UUID"),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentStatusInput = z.infer<typeof updateShipmentStatusSchema>;
