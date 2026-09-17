import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_development_jwt_secret_key";

export interface AuthenticatedUserPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Middleware to authenticate requests using JWT in Authorization: Bearer <token>
 */
export function authenticateJwt(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Unauthorized access. No token provided.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Unauthorized access. Invalid or expired token.",
    });
    return;
  }
}

/**
 * Higher-order middleware to restrict route access based on allowed roles.
 * Must be placed AFTER authenticateJwt in the middleware chain.
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized access. Authentication required.",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to access this resource.",
      });
      return;
    }

    next();
  };
}
