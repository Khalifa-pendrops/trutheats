import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../users/user.model";
import Manufacturer from "../manufacturers/manufacturer.model";
import {
  issueTokens,
  setTokenCookies,
  clearTokenCookies,
} from "../../utils/token";
import { AuthenticatedRequest } from "../../types";

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, firstName, lastName, role } = req.body;

  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ success: false, error: "Invalid input" });
    return;
  }

  if (!email || !password || !firstName || !lastName) {
    res.status(400).json({ success: false, error: "All fields are required" });
    return;
  }

  if (password.length < 8 || password.length > 72) {
    res
      .status(400)
      .json({ success: false, error: "Password must be 8–72 characters" });
    return;
  }

  const allowedRoles = ["consumer", "manufacturer"];
  const assignedRole = allowedRoles.includes(role) ? role : "consumer";

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    res.status(409).json({
      success: false,
      error: "An account with same credential(s) already exists",
    });
    return;
  }

  const user = await User.create({
    email: email.toLowerCase().trim(),
    passwordHash: password,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    role: assignedRole,
  });

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: { userId: user._id, role: user.role },
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ success: false, error: "Invalid input" });
    return;
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+passwordHash +refreshTokenHash",
  );

  if (!user || !user.isActive) {
    res.status(401).json({ success: false, error: "Invalid credentials" });
    return;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(401).json({ success: false, error: "Invalid credentials" });
    return;
  }

  let manufacturerId: string | undefined;
  if (user.role === "manufacturer") {
    const manufacturer = await Manufacturer.findOne({ userId: user._id });
    manufacturerId = manufacturer?._id?.toString();
  }

  const { accessToken, refreshToken } = issueTokens({
    userId: user._id.toString(),
    role: user.role,
    manufacturerId,
  });

  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  user.lastLoginAt = new Date();
  await user.save();

  setTokenCookies(res, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
      },
    },
  });
};

export const logout = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  await User.findByIdAndUpdate(req.user!.userId, { refreshTokenHash: null });
  clearTokenCookies(res);
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    res.status(401).json({ success: false, error: "No refresh token" });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET as string,
    ) as { userId: string };
    const user = await User.findById(decoded.userId).select(
      "+refreshTokenHash",
    );

    if (!user || !user.refreshTokenHash) {
      res
        .status(401)
        .json({
          success: false,
          error:
            "Invalid refresh token or no user found with a valid refresh token",
        });
      return;
    }

    const isValid = await bcrypt.compare(token, user.refreshTokenHash);
    if (!isValid) {
      res.status(401).json({ success: false, error: "Invalid refresh token" });
      return;
    }

    let manufacturerId: string | undefined;
    if (user.role === "manufacturer") {
      const manufacturer = await Manufacturer.findOne({ userId: user._id });
      manufacturerId = manufacturer?._id?.toString();
    }

    const { accessToken, refreshToken: newRefreshToken } = issueTokens({
      userId: user._id.toString(),
      role: user.role,
      manufacturerId,
    });

    user.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    await user.save();

    setTokenCookies(res, accessToken, newRefreshToken);
    res.status(200).json({ success: true, message: "Token refreshed" });
  } catch {
    res
      .status(401)
      .json({ success: false, error: "Invalid or expired refresh token" });
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const user = await User.findById(req.user!.userId);
  if (!user) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }
  res.status(200).json({ success: true, data: { user } });
};
