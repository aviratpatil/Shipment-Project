import { Router } from "express";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  softDeleteCustomer,
} from "../controllers/customer.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticateJwt } from "../middlewares/auth.middleware";
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdParamSchema,
} from "../schemas/customer.schema";

const router = Router();

// POST /api/customers (Protected)
router.post(
  "/",
  authenticateJwt,
  validate({ body: createCustomerSchema }),
  createCustomer
);

// GET /api/customers (Public)
router.get("/", getCustomers);

// GET /api/customers/:id (Public)
router.get(
  "/:id",
  validate({ params: customerIdParamSchema }),
  getCustomerById
);

// PUT /api/customers/:id (Protected)
router.put(
  "/:id",
  authenticateJwt,
  validate({ params: customerIdParamSchema, body: updateCustomerSchema }),
  updateCustomer
);

// DELETE /api/customers/:id (Protected)
router.delete(
  "/:id",
  authenticateJwt,
  validate({ params: customerIdParamSchema }),
  softDeleteCustomer
);

export default router;
