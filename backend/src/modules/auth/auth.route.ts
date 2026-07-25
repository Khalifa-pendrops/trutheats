import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  logout,
  refresh,
  getMe,
  forgotPassword,
  resetPassword,
} from "./auth.controller";
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

const authLimiter = rateLimit({
  // windowMs: 15 * 60 * 1000,
  windowMs: 0 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: "Too many attempts — try again in 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit on password reset to prevent abuse
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    error: "Too many reset attempts — try again in 1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", requireAuth, logout);
router.post("/refresh", refresh);
router.get("/me", requireAuth, getMe);
router.post("/forgot-password", resetLimiter, forgotPassword);
router.post("/reset-password", resetLimiter, resetPassword);

export default router;
