import crypto from "crypto";
import { Request, Response } from "express";
import Report from "./report.model";
import VerificationCode from "../verification/verificationCode.model";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";
import { AuthenticatedRequest } from "../../types";

export const submitReport = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { code, comment } = req.body;

  if (typeof code !== "string" || !code.trim()) {
    res.status(400).json({ success: false, error: "Product code is required" });
    return;
  }

  const ipHash = crypto
    .createHash("sha256")
    .update(req.ip || "unknown")
    .digest("hex");
  const verificationCode = await VerificationCode.findOne({
    code: code.trim(),
  });

  const imageUrls: string[] = [];
  if (req.files && Array.isArray(req.files)) {
    const files = (req.files as Express.Multer.File[]).slice(0, 3);
    for (const file of files) {
      const { url } = await uploadToCloudinary(
        file.buffer,
        "trusteats/reports",
      );
      imageUrls.push(url);
    }
  }

  const authReq = req as AuthenticatedRequest;

  const report = await Report.create({
    code: code.trim(),
    productId: verificationCode?.productId,
    reportedBy: authReq.user?.userId || undefined,
    ipHash,
    comment: comment?.trim(),
    imageUrls,
  });

  res.status(201).json({
    success: true,
    message: "Report submitted. Our team will review it.",
    data: { reportId: report._id },
  });
};

export const getMyReports = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const reports = await Report.find({ reportedBy: req.user!.userId })
    .sort({ reportedAt: -1 })
    .select("-imagePublicIds");

  res.status(200).json({ success: true, data: { reports } });
};
