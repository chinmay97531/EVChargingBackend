import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { AuthenticatedRequest } from "../types";
import { UnauthorizedError } from "../utils/errors";
import { sendError } from "../utils/response";

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const header = req.headers["token"] || req.headers["authorization"];

  if (!header) {
    sendError(res, "Authentication token required", 401);
    return;
  }

  try {
    const token = typeof header === "string" 
      ? header.replace("Bearer ", "") 
      : header[0]?.replace("Bearer ", "") || header[0];

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    req.userId = decoded.id;
    next();
  } catch (error) {
    sendError(res, "Invalid or expired token", 401);
  }
};

