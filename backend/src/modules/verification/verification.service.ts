import crypto from "crypto";
import VerificationCode from "./verificationCode.model";
import ScanEvent from "./scanEvent.model";
import Batch from "../batches/batch.model";
import Manufacturer from "../manufacturers/manufacturer.model";
import { VerificationStatus } from "../../types";
import { Request } from "express";

export interface ScanStats {
  scansInWindow: number;
  distinctLocationsInWindow: number;
  windowHours: number;
}

export interface VerificationResult {
  status: VerificationStatus;
  product?: {
    name: string;
    brand: string;
    description: string;
    ingredients?: string;
    storageInfo?: string;
    countryOfOrigin: string;
    imageUrl?: string;
    category: string;
  };
  batch?: {
    batchNumber: string;
    manufacturingDate: Date;
    expiryDate: Date;
    status: string;
  };
  manufacturer?: {
    companyName: string;
    country: string;
    logoUrl?: string;
  };
  scanStats?: ScanStats;
  message: string;
  scannedAt: Date;
}

export const computeVerificationResult = async (
  code: string,
  req: Request,
  userId?: string,
): Promise<VerificationResult> => {
  const scannedAt = new Date();
  const ipHash = crypto
    .createHash("sha256")
    .update(req.ip || "unknown")
    .digest("hex");

  const verificationCode = await VerificationCode.findOne({ code })
    .populate({ path: "productId", populate: { path: "manufacturerId" } })
    .populate("batchId")
    .populate("manufacturerId");

  // Code not found means FAKE
  if (!verificationCode) {
    await ScanEvent.create({
      code,
      result: "fake",
      ipHash,
      userAgent: req.headers["user-agent"],
      userId: userId || undefined,
      location: extractLocation(req),
      scannedAt,
    });
    return {
      status: "fake",
      message: "This product could not be verified. It may be counterfeit.",
      scannedAt,
    };
  }

  // Code deactivated means FAKE
  if (!verificationCode.isActive) {
    await logAndIncrement(
      verificationCode,
      "fake",
      ipHash,
      req,
      userId,
      scannedAt,
    );
    return {
      status: "fake",
      message: "This verification code has been deactivated.",
      scannedAt,
    };
  }

  const batch = verificationCode.batchId as unknown as InstanceType<
    typeof Batch
  >;
  const manufacturer =
    verificationCode.manufacturerId as unknown as InstanceType<
      typeof Manufacturer
    >;
  const product = verificationCode.productId as unknown as {
    name: string;
    brand: string;
    description: string;
    ingredients?: string;
    storageInfo?: string;
    countryOfOrigin: string;
    imageUrl?: string;
    category: string;
  };

  // Manufacturer not approved means FAKE
  if (manufacturer.status !== "approved") {
    await logAndIncrement(
      verificationCode,
      "fake",
      ipHash,
      req,
      userId,
      scannedAt,
    );
    return {
      status: "fake",
      message: "This product's manufacturer is not verified.",
      scannedAt,
    };
  }

  // Batch recalled means FAKE
  if (batch.status === "recalled") {
    await logAndIncrement(
      verificationCode,
      "fake",
      ipHash,
      req,
      userId,
      scannedAt,
    );
    return buildResult(
      "fake",
      "This product batch has been recalled. Do not consume.",
      product,
      batch,
      manufacturer,
      scannedAt,
      await getScanStats(verificationCode._id as unknown as string),
    );
  }

  // Batch expired or flagged means SUSPICIOUS
  if (
    batch.status === "expired" ||
    batch.status === "flagged" ||
    batch.expiryDate < new Date()
  ) {
    await logAndIncrement(
      verificationCode,
      "suspicious",
      ipHash,
      req,
      userId,
      scannedAt,
    );
    return buildResult(
      "suspicious",
      "This product batch is expired or flagged for review. Use caution.",
      product,
      batch,
      manufacturer,
      scannedAt,
      await getScanStats(verificationCode._id as unknown as string),
    );
  }

  // Scan count exceeds expected threshold means SUSPICIOUS
  if (verificationCode.scanCount >= verificationCode.maxExpectedScans) {
    await logAndIncrement(
      verificationCode,
      "suspicious",
      ipHash,
      req,
      userId,
      scannedAt,
    );
    return buildResult(
      "suspicious",
      "This code has been scanned an unusual number of times. It may have been duplicated.",
      product,
      batch,
      manufacturer,
      scannedAt,
      await getScanStats(verificationCode._id as unknown as string),
    );
  }

  // All checks pass means GENUINE
  await logAndIncrement(
    verificationCode,
    "genuine",
    ipHash,
    req,
    userId,
    scannedAt,
  );
  return buildResult(
    "genuine",
    "This product is genuine and has passed all verification checks.",
    product,
    batch,
    manufacturer,
    scannedAt,
    await getScanStats(verificationCode._id as unknown as string),
  );
};

// Helpers

const logAndIncrement = async (
  verificationCode: InstanceType<typeof VerificationCode>,
  result: VerificationStatus,
  ipHash: string,
  req: Request,
  userId: string | undefined,
  scannedAt: Date,
): Promise<void> => {
  await Promise.all([
    ScanEvent.create({
      code: verificationCode.code,
      verificationCodeId: verificationCode._id,
      productId: verificationCode.productId,
      manufacturerId: verificationCode.manufacturerId,
      result,
      ipHash,
      userAgent: req.headers["user-agent"],
      userId: userId || undefined,
      location: extractLocation(req),
      scannedAt,
    }),
    VerificationCode.findByIdAndUpdate(verificationCode._id, {
      $inc: { scanCount: 1 },
    }),
  ]);
};

const getScanStats = async (verificationCodeId: string): Promise<ScanStats> => {
  const windowHours = 24;
  const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  const [scansInWindow, distinctLocations] = await Promise.all([
    ScanEvent.countDocuments({
      verificationCodeId,
      scannedAt: { $gte: windowStart },
    }),
    ScanEvent.distinct("location.city", {
      verificationCodeId,
      scannedAt: { $gte: windowStart },
    }),
  ]);

  return {
    scansInWindow,
    distinctLocationsInWindow: distinctLocations.filter(Boolean).length,
    windowHours,
  };
};

const extractLocation = (req: Request): { country?: string; city?: string } => {
  // Populated from POST /verify body if consumer sends geo context
  const body = req.body as { country?: string; city?: string };
  return {
    country: body?.country,
    city: body?.city,
  };
};

const buildResult = (
  status: VerificationStatus,
  message: string,
  product: {
    name: string;
    brand: string;
    description: string;
    ingredients?: string;
    storageInfo?: string;
    countryOfOrigin: string;
    imageUrl?: string;
    category: string;
  },
  batch: InstanceType<typeof Batch>,
  manufacturer: InstanceType<typeof Manufacturer>,
  scannedAt: Date,
  scanStats: ScanStats,
): VerificationResult => ({
  status,
  message,
  scannedAt,
  scanStats,
  product: {
    name: product.name,
    brand: product.brand,
    description: product.description,
    ingredients: product.ingredients,
    storageInfo: product.storageInfo,
    countryOfOrigin: product.countryOfOrigin,
    imageUrl: product.imageUrl,
    category: product.category,
  },
  batch: {
    batchNumber: batch.batchNumber,
    manufacturingDate: batch.manufacturingDate,
    expiryDate: batch.expiryDate,
    status: batch.status,
  },
  manufacturer: {
    companyName: manufacturer.companyName,
    country: manufacturer.country,
    logoUrl: manufacturer.logoUrl,
  },
});
