import jwt from "jsonwebtoken";
import { Response } from "express";
import { UserRole } from "../types";

interface TokenPayload {
  userId: string;
  role: UserRole;
  manufacturerId?: string;
}

export const issueTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET as string,
    {
      expiresIn: "15m",
    },
  );
  const refreshToken = jwt.sign(
    { userId: payload.userId },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: "7d" },
  );
  return { accessToken, refreshToken };
};

export const setTokenCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
): void => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/v1/auth/refresh",
  });
}; 

export const clearTokenCookies = (res: Response): void => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken", { path: "/api/v1/auth/refresh" });
};
