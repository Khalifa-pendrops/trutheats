import { Router } from "express";
import rateLimit from "express-rate-limit";
import { submitReport, getMyReports } from "./report.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { uploadMiddleware } from "../../middleware/upload";

const router = Router();

// Rate limit — prevents crowd-flagging abuse
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    error: "You have submitted too many reports — please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public — anonymous reports allowed
router.post(
  "/",
  reportLimiter,
  uploadMiddleware.array("images", 3),
  submitReport,
);

// Auth required to view own reports
router.get("/my", requireAuth, getMyReports);

export default router;
