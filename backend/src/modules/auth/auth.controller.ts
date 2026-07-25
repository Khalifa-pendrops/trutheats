import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../users/user.model";
import Manufacturer from "../manufacturers/manufacturer.model";
import {
  issueTokens,
  setTokenCookies,
  clearTokenCookies,
} from "../../utils/token";
import { AuthenticatedRequest } from "../../types";

export const register = async (req: Request, res: Response): Promise<void> => {
  const { fullName, email, password, confirmPassword, role } = req.body;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof fullName !== "string"
  ) {
    res.status(400).json({ success: false, error: "Invalid input" });
    return;
  }

  if (!fullName.trim() || !email.trim() || !password) {
    res.status(400).json({
      success: false,
      error: "Full name, email and password are required",
    });
    return;
  }

  if (password.length < 8 || password.length > 72) {
    res
      .status(400)
      .json({ success: false, error: "Password must be 8–72 characters" });
    return;
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    res.status(400).json({ success: false, error: "Passwords do not match" });
    return;
  }

  // Split fullName into firstName + lastName
  // Everything after the first space becomes lastName
  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0];
  const lastName =
    nameParts.length > 1 ? nameParts.slice(1).join(" ") : nameParts[0];

  // Admin accounts cannot be self-registered
  const allowedRoles = ["consumer", "manufacturer"];
  const assignedRole = allowedRoles.includes(role) ? role : "consumer";

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    res.status(409).json({
      success: false,
      error: "An account with this email already exists",
    });
    return;
  }

  const user = await User.create({
    email: email.toLowerCase().trim(),
    passwordHash: password,
    firstName,
    lastName,
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
        lastName: user.lastName,
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
      res.status(401).json({ success: false, error: "Invalid refresh token" });
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
    res.status(401).json({
      success: false,
      error: "Invalid or expired refresh token",
    });
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

export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email } = req.body;

  if (typeof email !== "string" || !email.trim()) {
    res.status(400).json({ success: false, error: "Email is required" });
    return;
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // Always return the same response. Do not reveal whether email exists
  const genericResponse = {
    success: true,
    message:
      "If an account with that email exists, a reset link has been sent.",
  };

  if (!user) {
    res.status(200).json(genericResponse);
    return;
  }

  // Generate a signed, time-limited reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Store hash + expiry on the user document
  await User.findByIdAndUpdate(user._id, {
    passwordResetTokenHash: resetTokenHash,
    passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  });

  const resetUrl = `${process.env.ALLOWED_ORIGIN}/reset-password?token=${resetToken}&id=${user._id}`;

  // We will send resetUrl via email  via Resend later
  // For now and testing — i logged to console
  console.log(`\n🔑 Password reset link for ${user.email}:\n${resetUrl}\n`);

  res.status(200).json(genericResponse);
};

export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { token, userId, newPassword, confirmPassword } = req.body;

  if (!token || !userId || !newPassword) {
    res.status(400).json({
      success: false,
      error: "Token, userId and newPassword are required",
    });
    return;
  }

  if (newPassword !== confirmPassword) {
    res.status(400).json({ success: false, error: "Passwords do not match" });
    return;
  }

  if (newPassword.length < 8 || newPassword.length > 72) {
    res
      .status(400)
      .json({ success: false, error: "Password must be 8–72 characters" });
    return;
  }

  // Hash the incoming token to compare with stored hash
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    _id: userId,
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() }, // not expired
  }).select("+passwordHash");

  if (!user) {
    res.status(400).json({
      success: false,
      error: "Invalid or expired reset token",
    });
    return;
  }

  // Update password and clear reset token fields
  user.passwordHash = newPassword; // pre-save hook hashes this
  (user as unknown as Record<string, unknown>).passwordResetTokenHash =
    undefined;
  (user as unknown as Record<string, unknown>).passwordResetExpiresAt =
    undefined;
  // Invalidate all existing sessions
  user.refreshTokenHash = undefined;
  await user.save();

  // Clear any active cookies
  clearTokenCookies(res);

  res.status(200).json({
    success: true,
    message: "Password reset successfully. Please log in again.",
  });
};
