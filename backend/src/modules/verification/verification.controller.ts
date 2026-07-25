import { Request, Response } from "express";
import { computeVerificationResult } from "./verification.service";
import ScanEvent from "./scanEvent.model";
import { AuthenticatedRequest } from "../../types";

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const returnFakeResult = (res: Response): void => {
  res.status(200).json({
    success: true,
    data: {
      status: "fake",
      message: "This product could not be verified. It may be counterfeit.",
      scannedAt: new Date(),
    },
  });
};

// What the QR code URL points to. No auth, no body needed
export const verifyByCode = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const code = req.params.code as string;

  if (!code || !UUID_V4_REGEX.test(code.trim())) {
    returnFakeResult(res);
    return;
  }

  const authReq = req as AuthenticatedRequest;

  const result = await computeVerificationResult(
    code.trim(),
    req,
    authReq.user?.userId,
  );

  res.status(200).json({ success: true, data: result });
};

// App-based scan — consumer can send geo context for better fraud detection
export const verifyProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { code } = req.body;

  if (typeof code !== "string" || !code.trim()) {
    res
      .status(400)
      .json({ success: false, error: "Verification code is required" });
    return;
  }

  if (!UUID_V4_REGEX.test(code.trim())) {
    returnFakeResult(res);
    return;
  }

  const authReq = req as AuthenticatedRequest;
  const result = await computeVerificationResult(
    code.trim(),
    req,
    authReq.user?.userId,
  );

  res.status(200).json({ success: true, data: result });
};

export const getScanHistory = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(30, parseInt(req.query.limit as string) || 10);
  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    ScanEvent.find({ userId: req.user!.userId })
      .sort({ scannedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("productId", "name brand imageUrl"),
    ScanEvent.countDocuments({ userId: req.user!.userId }),
  ]);

  res.status(200).json({
    success: true,
    data: { events, total, page, pages: Math.ceil(total / limit) },
  });
};
