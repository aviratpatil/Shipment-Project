import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { Prisma } from "@prisma/client";

/**
 * Global centralized error handler.
 * Must be registered LAST in the Express middleware chain.
 */
export const errorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  console.error("[Error]", err);

  // ── Zod Validation Errors ────────────────────────────────────────────────
  if (err instanceof ZodError) {
    const formatted = err.issues.map((e: z.ZodIssue) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formatted,
    });
    return;
  }

  // ── Prisma Known Request Errors ─────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        // Unique constraint violation
        const fields = (err.meta?.target as string[]) ?? ["field"];
        res.status(409).json({
          success: false,
          message: `A record with this ${fields.join(", ")} already exists.`,
          code: err.code,
        });
        return;
      }
      case "P2025":
        // Record not found
        res.status(404).json({
          success: false,
          message: err.meta?.cause ?? "Record not found.",
          code: err.code,
        });
        return;
      case "P2003":
        // Foreign key constraint failure
        res.status(400).json({
          success: false,
          message: "Related record does not exist.",
          code: err.code,
        });
        return;
      default:
        res.status(400).json({
          success: false,
          message: "Database error occurred.",
          code: err.code,
        });
        return;
    }
  }

  // ── Prisma Validation Errors ────────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      message: "Invalid data provided to database.",
    });
    return;
  }

  // ── Standard AppError (with statusCode) ─────────────────────────────────
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // ── Generic / Unhandled Errors ───────────────────────────────────────────
  const message =
    err instanceof Error ? err.message : "An unexpected error occurred.";

  res.status(500).json({
    success: false,
    message,
  });
};

/**
 * Custom application error with an HTTP status code.
 * Use this in services/controllers to throw domain-level errors.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
