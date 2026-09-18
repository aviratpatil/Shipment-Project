import { Router } from "express";
import {
  getDrivers,
  getDriverById,
  registerDriver,
  updateDriver,
  deleteDriver,
  approveDriver,
  getMyDriverProfile,
} from "../controllers/driver.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticateJwt, requireRole } from "../middlewares/auth.middleware";
import {
  registerDriverSchema,
  updateDriverSchema,
  driverIdParamSchema,
} from "../schemas/driver.schema";

const router = Router();

// GET /api/drivers — USER/ADMIN can see all drivers
router.get("/", authenticateJwt, requireRole(["ADMIN", "USER"]), getDrivers);

// GET /api/drivers/me — DRIVER sees their own profile (must be before /:id)
router.get("/me", authenticateJwt, requireRole(["DRIVER"]), getMyDriverProfile);

// GET /api/drivers/:id
router.get(
  "/:id",
  authenticateJwt,
  requireRole(["ADMIN", "USER"]),
  validate({ params: driverIdParamSchema }),
  getDriverById
);

// POST /api/drivers/register — USER/ADMIN registers new drivers
router.post(
  "/register",
  authenticateJwt,
  requireRole(["ADMIN", "USER"]),
  validate({ body: registerDriverSchema }),
  registerDriver
);

// PUT /api/drivers/:id
router.put(
  "/:id",
  authenticateJwt,
  requireRole(["ADMIN", "USER"]),
  validate({ params: driverIdParamSchema, body: updateDriverSchema }),
  updateDriver
);

// DELETE /api/drivers/:id
router.delete(
  "/:id",
  authenticateJwt,
  requireRole(["ADMIN", "USER"]),
  validate({ params: driverIdParamSchema }),
  deleteDriver
);

// POST /api/drivers/:id/approve — only ADMIN and USER can approve
router.post(
  "/:id/approve",
  authenticateJwt,
  requireRole(["ADMIN", "USER"]),
  validate({ params: driverIdParamSchema }),
  approveDriver
);

export default router;
