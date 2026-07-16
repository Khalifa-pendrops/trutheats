import mongoose, { Schema, Document, Types } from "mongoose";
import { BatchStatus } from "../../types";

export interface IBatch extends Document {
  productId: Types.ObjectId;
  manufacturerId: Types.ObjectId;
  batchNumber: string;
  manufacturingDate: Date;
  expiryDate: Date;
  quantity: number;
  status: BatchStatus;
  recallReason?: string;
  flaggedBy?: Types.ObjectId;
  flaggedAt?: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    manufacturerId: {
      type: Schema.Types.ObjectId,
      ref: "Manufacturer",
      required: true,
      index: true,
    },
    batchNumber: { type: String, required: true, trim: true, maxlength: 50 },
    manufacturingDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    quantity: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["active", "expired", "recalled", "flagged"],
      default: "active",
    },
    recallReason: { type: String, maxlength: 500 },
    flaggedBy: { type: Schema.Types.ObjectId, ref: "User" },
    flaggedAt: { type: Date },
  },
  { timestamps: true },
);

BatchSchema.index({ manufacturerId: 1, status: 1 });
BatchSchema.index({ productId: 1, status: 1 });
BatchSchema.index({ expiryDate: 1 });

export default mongoose.model<IBatch>("Batch", BatchSchema);
