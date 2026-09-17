import { Request, Response, NextFunction } from "express";
import * as AuthService from "../services/auth.service";
import { AppError } from "../middlewares/error.middleware";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await AuthService.registerUser(req.body);
    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await AuthService.loginUser(req.body);
    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────────────────────────────
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError(401, "Authentication required.");
    }

    const profile = await AuthService.getUserProfile(req.user.id);
    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully.",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}
