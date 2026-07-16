import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/requireAuth";
import Manufacturer from "./manufacturer.model";
import { uploadMiddleware } from "../../middleware/upload";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";
import { AuthenticatedRequest } from "../../types";
import { Response } from "express";

const router = Router();

// Register manufacturer profile — user must already have manufacturer role
router.post(
  "/register",
  requireAuth,
  requireRole("manufacturer", "consumer"),
  uploadMiddleware.single("logo"),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const {
      companyName,
      nafdacNumber,
      contactEmail,
      contactPhone,
      address,
      country,
    } = req.body;

    if (!companyName || !contactEmail || !contactPhone || !address) {
      res.status(400).json({
        success: false,
        error:
          "companyName, contactEmail, contactPhone and address are required",
      });
      return;
    }

    const existing = await Manufacturer.findOne({ userId: req.user!.userId });
    if (existing) {
      res
        .status(409)
        .json({ success: false, error: "Manufacturer profile already exists" });
      return;
    }

    let logoUrl: string | undefined;
    if (req.file) {
      const uploaded = await uploadToCloudinary(
        req.file.buffer,
        "trusteats/logos",
      );
      logoUrl = uploaded.url;
    }

    const manufacturer = await Manufacturer.create({
      userId: req.user!.userId,
      companyName: companyName.trim(),
      nafdacNumber: nafdacNumber?.trim(),
      contactEmail: contactEmail.toLowerCase().trim(),
      contactPhone: contactPhone.trim(),
      address: address.trim(),
      country: country?.trim() || "Nigeria",
      logoUrl,
    });

    res.status(201).json({
      success: true,
      message:
        "Your manufacturer profile has been submitted for review. An admin will approve your account.",
      data: { manufacturer },
    });
  },
);

// Get own manufacturer profile
router.get(
  "/me",
  requireAuth,
  requireRole("manufacturer"),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const manufacturer = await Manufacturer.findOne({
      userId: req.user!.userId,
    });
    if (!manufacturer) {
      res
        .status(404)
        .json({ success: false, error: "Manufacturer profile not found" });
      return;
    }
    res.status(200).json({ success: true, data: { manufacturer } });
  },
);

export default router;
