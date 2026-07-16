import { Router } from "express";
import { createBatch, getMyBatches } from "./batch.controller";
import { requireAuth, requireRole } from "../../middleware/requireAuth";

const router = Router();

router.use(requireAuth, requireRole("manufacturer"));

router.post("/", createBatch);
router.get("/", getMyBatches);

export default router;
