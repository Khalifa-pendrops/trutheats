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

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
    manufacturerId?: string;
  };
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
