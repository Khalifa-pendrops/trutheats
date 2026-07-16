import mongoose, { Schema, Document, Types } from "mongoose";
import { VerificationStatus } from "../../types";

export interface IScanEvent extends Document {
  code: string;
  verificationCodeId?: Types.ObjectId;
  productId?: Types.ObjectId;
  manufacturerId?: Types.ObjectId;
  result: VerificationStatus;
  ipHash: string;
  userAgent?: string;
  userId?: Types.ObjectId;
  location?: { country?: string; city?: string };
  scannedAt: Date;
}

const ScanEventSchema = new Schema<IScanEvent>(
  {
    code: { type: String, required: true, index: true },
    verificationCodeId: {
      type: Schema.Types.ObjectId,
      ref: "VerificationCode",
    },
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    manufacturerId: { type: Schema.Types.ObjectId, ref: "Manufacturer" },
    result: {
      type: String,
      enum: ["genuine", "suspicious", "fake"],
      required: true,
    },
    ipHash: { type: String, required: true },
    userAgent: { type: String, maxlength: 300 },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    location: {
      country: { type: String },
      city: { type: String },
    },
    scannedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

ScanEventSchema.index({ code: 1, scannedAt: -1 });
ScanEventSchema.index({ productId: 1, scannedAt: -1 });
ScanEventSchema.index({ manufacturerId: 1, scannedAt: -1 });
ScanEventSchema.index({ result: 1, scannedAt: -1 });

export default mongoose.model<IScanEvent>("ScanEvent", ScanEventSchema);
