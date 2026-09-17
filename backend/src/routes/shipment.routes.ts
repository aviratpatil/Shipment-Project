import { Router } from "express";
import {
  createShipment,
  getShipments,
  getShipmentById,
  updateShipmentStatus,
} from "../controllers/shipment.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticateJwt } from "../middlewares/auth.middleware";
import {
  createShipmentSchema,
  updateShipmentStatusSchema,
  shipmentIdParamSchema,
} from "../schemas/shipment.schema";

const router = Router();

// POST /api/shipments (Protected)
router.post(
  "/",
  authenticateJwt,
  validate({ body: createShipmentSchema }),
  createShipment
);

// GET /api/shipments (Public)
router.get("/", getShipments);

// GET /api/shipments/:id (Public)
router.get(
  "/:id",
  validate({ params: shipmentIdParamSchema }),
  getShipmentById
);

// PATCH /api/shipments/:id/status (Protected)
router.patch(
  "/:id/status",
  authenticateJwt,
  validate({ params: shipmentIdParamSchema, body: updateShipmentStatusSchema }),
  updateShipmentStatus
);

export default router;
