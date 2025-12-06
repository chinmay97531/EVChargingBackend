import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

