import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticateJwt } from "../middlewares/auth.middleware";
import { registerSchema, loginSchema } from "../schemas/auth.schema";

const router = Router();

// POST /api/auth/register
router.post(
  "/register",
  validate({ body: registerSchema }),
  register
);

// POST /api/auth/login
router.post(
  "/login",
  validate({ body: loginSchema }),
  login
);

// GET /api/auth/me (Protected)
router.get(
  "/me",
  authenticateJwt,
  getMe
);

export default router;
