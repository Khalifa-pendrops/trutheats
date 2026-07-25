import { Router } from "express";
import { getAnalyticsSummary } from "./analytics.controller";
import { requireAuth, requireRole } from "../../middleware/requireAuth";
import { noCache } from "../../middleware/noCache";

const router = Router();

router.get(
  "/summary",
  requireAuth,
  requireRole("manufacturer"),
  noCache,
  getAnalyticsSummary,
);

export default router;
