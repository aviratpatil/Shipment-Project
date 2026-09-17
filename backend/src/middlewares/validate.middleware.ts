import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

interface ValidationSchemas {
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
}

/**
 * Express middleware factory that validates req.body / req.query / req.params
 * against the provided Zod schemas.  Returns 400 with structured errors on failure.
 */
export const validate =
  (schemas: ValidationSchemas) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formatted = error.issues.map((e: z.ZodIssue) => ({
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
      next(error);
    }
  };
