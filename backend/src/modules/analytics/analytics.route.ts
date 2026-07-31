import { Router } from "express";
import { getAnalyticsSummary } from "./analytics.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { noCache } from "../../middleware/noCache";

const router = Router();

// Allow any authenticated user to fetch a summary. Manufacturers will receive
// manufacturer-scoped stats when their profile is approved; other users will
// receive a site-wide overview.
router.get(
  "/summary",
  requireAuth,
  noCache,
  getAnalyticsSummary,
);

export default router;
