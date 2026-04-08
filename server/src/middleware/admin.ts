import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return res.status(401).json({
      error: "Bruger ikke autentificeret.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: "Kun admins har adgang til denne handling.",
    });
  }

  next();
}