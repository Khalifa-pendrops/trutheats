import { Router } from "express";
import { Response } from "express";
import { requireAuth, requireRole } from "../../middleware/requireAuth";
import Manufacturer from "./manufacturer.model";
import { uploadMiddleware } from "../../middleware/upload";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";
import { AuthenticatedRequest } from "../../types";

const router = Router();

// This route should accept multipart/form-data — two file fields: logo (optional), certificate (required)
router.post(
  "/register",
  requireAuth,
  uploadMiddleware.fields([
    { name: "logo", maxCount: 1 },
    { name: "certificateOfRecognition", maxCount: 1 },
  ]),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const {
      companyName,
      napamsEmail,
      cacNumber,
      // contactPhone,
      // address,
      country,
      nafdacCofRNumber,
      termsAccepted,
    } = req.body;

    // Required field validation
    if (!companyName || !napamsEmail || !cacNumber) {
      res.status(400).json({
        success: false,
        error: "companyName, napamsEmail and cacNumber are required",
      });
      return;
    }

    // Terms must be accepted
    if (termsAccepted !== "true" && termsAccepted !== true) {
      res.status(400).json({
        success: false,
        error: "You must accept the Terms & Conditions",
      });
      return;
    }

    // Certificate of Recognition is required
    const files = req.files as Record<string, Express.Multer.File[]>;
    if (!files?.certificateOfRecognition?.[0]) {
      res.status(400).json({
        success: false,
        error: "Certificate of Recognition image is required",
      });
      return;
    }

    // Check not already registered
    const existing = await Manufacturer.findOne({ userId: req.user!.userId });
    if (existing) {
      res.status(409).json({
        success: false,
        error: "A manufacturer profile already exists for this account",
      });
      return;
    }

    // Check CAC number not already registered
    const existingCac = await Manufacturer.findOne({
      cacNumber: cacNumber.trim(),
    });
    if (existingCac) {
      res.status(409).json({
        success: false,
        error: "A manufacturer with this CAC number is already registered",
      });
      return;
    }

    // Upload Certificate of Recognition
    const corFile = files.certificateOfRecognition[0];
    const { url: certificateUrl, publicId: certificatePublicId } =
      await uploadToCloudinary(corFile.buffer, "trusteats/certificates");

    // Upload logo if provided
    let logoUrl: string | undefined;
    let logoPublicId: string | undefined;
    if (files?.logo?.[0]) {
      const uploaded = await uploadToCloudinary(
        files.logo[0].buffer,
        "trusteats/logos",
      );
      logoUrl = uploaded.url;
      logoPublicId = uploaded.publicId;
    }

    const manufacturer = await Manufacturer.create({
      userId: req.user!.userId,
      companyName: companyName.trim(),
      napamsEmail: napamsEmail.toLowerCase().trim(),
      cacNumber: cacNumber.trim(),
      nafdacCofRNumber: nafdacCofRNumber?.trim(),
      certificateOfRecognitionUrl: certificateUrl,
      certificateOfRecognitionPublicId: certificatePublicId,
      // contactPhone: contactPhone.trim(),
      // address: address.trim(),
      country: country?.trim() || "Nigeria",
      logoUrl,
      logoPublicId,
      termsAcceptedAt: new Date(),
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message:
        "Manufacturer profile submitted successfully for review. An admin will review and approve your account.",
      data: { manufacturer },
    });
  },
);

router.get(
  "/me",
  requireAuth,
  requireRole("manufacturer"),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const manufacturer = await Manufacturer.findOne({
      userId: req.user!.userId,
    }).select("-certificateOfRecognitionPublicId -logoPublicId");

    if (!manufacturer) {
      res.status(404).json({
        success: false,
        error: "Manufacturer profile not found",
      });
      return;
    }

    res.status(200).json({ success: true, data: { manufacturer } });
  },
);

export default router;
