import { Request } from "express";
import { Types } from "mongoose";

export type UserRole = "consumer" | "manufacturer" | "admin";
export type VerificationStatus = "genuine" | "suspicious" | "fake";
export type ManufacturerStatus = "pending" | "approved" | "suspended";
export type BatchStatus = "active" | "expired" | "recalled" | "flagged";
export type ReportStatus =
  | "pending"
  | "under_review"
  | "resolved"
  | "dismissed";

export interface AuthenticatedUser {
  userId: string;
  role: UserRole;
  manufacturerId?: string;
}

// Properly extends Request so all Express properties are inherited. This is important for TypeScript to recognize the request object correctly in route handlers, as seen during first deployment on Render
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export type ObjectId = Types.ObjectId;
