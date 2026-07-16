import { Router } from "express";
import rateLimit from "express-rate-limit";
import { verifyProduct, getScanHistory } from "./verification.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { noCache } from "../../middleware/noCache";

const router = Router();

// Aggressive rate limit — public endpoint, highest traffic
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 scans per IP per minute
  message: {
    success: false,
    error: "You have made too many scan attempts — please wait",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public — no auth required for scanning
router.post("/", verifyLimiter, verifyProduct);

// Auth required for scan history
router.get("/history", requireAuth, noCache, getScanHistory);

export default router;
