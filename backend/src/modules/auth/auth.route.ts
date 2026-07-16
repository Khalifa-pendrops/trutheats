import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, logout, refresh, getMe } from "./auth.controller";
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: "Too many attempts — try again in 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", requireAuth, logout);
router.post("/refresh", refresh);
router.get("/me", requireAuth, getMe);

export default router;
