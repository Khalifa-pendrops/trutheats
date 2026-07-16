import { Response } from "express";
import { Types } from "mongoose";
import Batch from "./batch.model";
import Product from "../products/product.model";
import Manufacturer from "../manufacturers/manufacturer.model";
import AuditLog from "../admin/auditLog.model";
import { generateCodesForBatch } from "../verification/codeGeneration.service";
import { AuthenticatedRequest } from "../../types";

const resolveManufacturer = async (userId: string) => {
  const manufacturer = await Manufacturer.findOne({
    userId,
    status: "approved",
  });
  if (!manufacturer)
    throw Object.assign(
      new Error("Manufacturer profile not found or not approved"),
      { statusCode: 403 },
    );
  return manufacturer;
};

export const createBatch = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const manufacturer = await resolveManufacturer(req.user!.userId);
  const {
    productId,
    batchNumber,
    manufacturingDate,
    expiryDate,
    quantity,
    codeQuantity,
  } = req.body;

  if (
    !productId ||
    !batchNumber ||
    !manufacturingDate ||
    !expiryDate ||
    !quantity
  ) {
    res
      .status(400)
      .json({
        success: false,
        error:
          "productId, batchNumber, manufacturingDate, expiryDate and quantity are required",
      });
    return;
  }

  const product = await Product.findOne({
    _id: productId,
    manufacturerId: manufacturer._id,
    isActive: true,
  });

  if (!product) {
    res.status(404).json({ success: false, error: "Product not found" });
    return;
  }

  if (new Date(expiryDate) <= new Date(manufacturingDate)) {
    res
      .status(400)
      .json({
        success: false,
        error: "Expiry date must be after manufacturing date",
      });
    return;
  }

  const batch = await Batch.create({
    productId: product._id,
    manufacturerId: manufacturer._id,
    batchNumber: batchNumber.trim(),
    manufacturingDate: new Date(manufacturingDate),
    expiryDate: new Date(expiryDate),
    quantity: parseInt(quantity),
  });

  await AuditLog.create({
    action: "batch.created",
    performedBy: new Types.ObjectId(req.user!.userId),
    performedByRole: req.user!.role,
    targetId: batch._id,
    targetModel: "Batch",
    newValue: { batchNumber, productId, quantity },
    ipAddress: req.ip,
  });

  let generatedCodes: { code: string; qrCodeUrl: string }[] = [];
  const numCodes = Math.min(parseInt(codeQuantity) || 0, 10000);

  if (numCodes > 0) {
    generatedCodes = await generateCodesForBatch({
      productId: product._id as Types.ObjectId,
      batchId: batch._id as Types.ObjectId,
      manufacturerId: manufacturer._id as Types.ObjectId,
      quantity: numCodes,
    });

    await AuditLog.create({
      action: "verification_code.generated",
      performedBy: new Types.ObjectId(req.user!.userId),
      performedByRole: req.user!.role,
      targetId: batch._id,
      targetModel: "Batch",
      newValue: { codesGenerated: numCodes, batchNumber },
      ipAddress: req.ip,
    });
  }

  res.status(201).json({
    success: true,
    message: "Batch created",
    data: {
      batch,
      generatedCodes: generatedCodes.length > 0 ? generatedCodes : undefined,
    },
  });
};

export const getMyBatches = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const manufacturer = await resolveManufacturer(req.user!.userId);
  const { productId } = req.query;
  const filter: Record<string, unknown> = { manufacturerId: manufacturer._id };

  if (productId && typeof productId === "string") {
    const product = await Product.findOne({
      _id: productId,
      manufacturerId: manufacturer._id,
    });
    if (!product) {
      res.status(404).json({ success: false, error: "Product not found" });
      return;
    }
    filter.productId = productId;
  }

  const batches = await Batch.find(filter)
    .sort({ createdAt: -1 })
    .populate("productId", "name brand");

  res.status(200).json({ success: true, data: { batches } });
};
