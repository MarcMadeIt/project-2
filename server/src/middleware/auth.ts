import { Request, Response, NextFunction } from "express";
import { getUserByToken } from "../db/users";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "admin" | "user";
    createdAt: string;
  };
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Manglende eller ugyldig authorization header.",
    });
  }

  const token = authHeader.substring("Bearer ".length).trim();
  const user = getUserByToken(token);

  if (!user) {
    return res.status(401).json({
      error: "Ugyldig eller udløbet token.",
    });
  }

  req.user = user;
  next();
}