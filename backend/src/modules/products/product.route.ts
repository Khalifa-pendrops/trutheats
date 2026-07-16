import { Router } from "express";
import {
  createProduct,
  getMyProducts,
  getProduct,
  updateProduct,
} from "./product.controller";
import { requireAuth, requireRole } from "../../middleware/requireAuth";
import { uploadMiddleware } from "../../middleware/upload";

const router = Router();

// All product routes require manufacturer role
router.use(requireAuth, requireRole("manufacturer"));

router.post("/", uploadMiddleware.single("image"), createProduct);
router.get("/", getMyProducts);
router.get("/:productId", getProduct);
router.patch("/:productId", uploadMiddleware.single("image"), updateProduct);

export default router;
