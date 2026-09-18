import { Router } from "express";
import {
  getTrucks,
  getTruckById,
  createTruck,
  updateTruck,
  deleteTruck,
  loadShipment,
  unloadShipment,
  assignDriver,
  removeDriver,
  autoAllot,
  startJourney,
  completeJourney,
  getShortageCheck,
} from "../controllers/truck.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticateJwt, requireRole } from "../middlewares/auth.middleware";
import {
  createTruckSchema,
  updateTruckSchema,
  truckIdParamSchema,
  loadShipmentSchema,
  assignDriverSchema,
} from "../schemas/truck.schema";

const router = Router();

// ── Public routes ─────────────────────────────────────────────────────────────
// GET /api/trucks
router.get("/", getTrucks);

// GET /api/trucks/shortage (must be before /:id)
router.get("/shortage", getShortageCheck);
router.get("/shortage-check", getShortageCheck);

// GET /api/trucks/:id
router.get("/:id", validate({ params: truckIdParamSchema }), getTruckById);

// ── Protected: USER or ADMIN only ────────────────────────────────────────────
// POST /api/trucks
router.post(
  "/",
  authenticateJwt,
  requireRole(["ADMIN", "USER"]),
  validate({ body: createTruckSchema }),
  createTruck
);

// PUT /api/trucks/:id
router.put(
  "/:id",
  authenticateJwt,
  requireRole(["ADMIN", "USER"]),
  validate({ params: truckIdParamSchema, body: updateTruckSchema }),
  updateTruck
);

// DELETE /api/trucks/:id
router.delete(
  "/:id",
  authenticateJwt,
  requireRole(["ADMIN", "USER"]),
  validate({ params: truckIdParamSchema }),
  deleteTruck
);

// POST /api/trucks/:id/load
router.post(
  "/:id/load",
  authenticateJwt,
  requireRole(["ADMIN", "USER"]),
  validate({ params: truckIdParamSchema, body: loadShipmentSchema }),
  loadShipment
);

// POST /api/trucks/:id/unload
router.post(
  "/:id/unload",
  authenticateJwt,
  requireRole(["ADMIN", "USER"]),
  validate({ params: truckIdParamSchema, body: loadShipmentSchema }),
  unloadShipment
);

// POST /api/trucks/:id/assign-driver
router.post(
  "/:id/assign-driver",
  authenticateJwt,
  requireRole(["ADMIN", "USER"]),
  validate({ params: truckIdParamSchema, body: assignDriverSchema }),
  assignDriver
);

// POST /api/trucks/:id/remove-driver
router.post(
  "/:id/remove-driver",
  authenticateJwt,
  requireRole(["ADMIN", "USER"]),
  validate({ params: truckIdParamSchema }),
  removeDriver
);

// POST /api/trucks/auto-allot
router.post(
  "/auto-allot",
  authenticateJwt,
  requireRole(["ADMIN", "USER"]),
  autoAllot
);

// POST /api/trucks/:id/start-journey  — allowed by DRIVER too
router.post(
  "/:id/start-journey",
  authenticateJwt,
  requireRole(["ADMIN", "USER", "DRIVER"]),
  validate({ params: truckIdParamSchema }),
  startJourney
);

// POST /api/trucks/:id/complete-journey — allowed by DRIVER too
router.post(
  "/:id/complete-journey",
  authenticateJwt,
  requireRole(["ADMIN", "USER", "DRIVER"]),
  validate({ params: truckIdParamSchema }),
  completeJourney
);

export default router;
