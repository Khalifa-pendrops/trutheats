import { Response } from "express";
import { AuthenticatedRequest } from "../../types";
import Product from "../products/product.model";
import VerificationCode from "../verification/verificationCode.model";
import ScanEvent from "../verification/scanEvent.model";
import Manufacturer from "../manufacturers/manufacturer.model";

export const getAnalyticsSummary = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const manufacturer = await Manufacturer.findOne({
    userId: req.user!.userId,
    status: "approved",
  });

  if (!manufacturer) {
    res.status(403).json({
      success: false,
      error: "Manufacturer profile not found or not approved",
    });
    return;
  }

  const mfrId = manufacturer._id;

  const [
    totalProducts,
    totalCodesIssued,
    totalScans,
    genuineScans,
    suspiciousScans,
    fakeScans,
    recentFlags,
  ] = await Promise.all([
    Product.countDocuments({ manufacturerId: mfrId, isActive: true }),
    VerificationCode.countDocuments({ manufacturerId: mfrId }),
    ScanEvent.countDocuments({ manufacturerId: mfrId }),
    ScanEvent.countDocuments({ manufacturerId: mfrId, result: "genuine" }),
    ScanEvent.countDocuments({ manufacturerId: mfrId, result: "suspicious" }),
    ScanEvent.countDocuments({ manufacturerId: mfrId, result: "fake" }),
    ScanEvent.find({
      manufacturerId: mfrId,
      result: { $in: ["suspicious", "fake"] },
    })
      .sort({ scannedAt: -1 })
      .limit(20)
      .populate("productId", "name brand imageUrl")
      .lean(),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalProducts,
      totalCodesIssued,
      totalScans,
      scansByResult: {
        genuine: genuineScans,
        suspicious: suspiciousScans,
        fake: fakeScans,
      },
      recentFlags: recentFlags.map((flag) => ({
        id: flag._id,
        scannedAt: flag.scannedAt,
        result: flag.result,
        location: flag.location,
        product: flag.productId || null,
        code: flag.code,
      })),
    },
  });
};
