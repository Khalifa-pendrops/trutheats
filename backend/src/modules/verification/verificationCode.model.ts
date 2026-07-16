import mongoose, { Schema, Document, Types } from "mongoose";

export interface IVerificationCode extends Document {
  code: string;
  productId: Types.ObjectId;
  batchId: Types.ObjectId;
  manufacturerId: Types.ObjectId;
  qrCodeUrl: string;
  qrCodePublicId: string;
  scanCount: number;
  isActive: boolean;
}

const VerificationCodeSchema = new Schema<IVerificationCode>(
  {
    code: { type: String, required: true, unique: true, index: true },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
      index: true,
    },
    manufacturerId: {
      type: Schema.Types.ObjectId,
      ref: "Manufacturer",
      required: true,
      index: true,
    },
    qrCodeUrl: { type: String, required: true },
    qrCodePublicId: { type: String, required: true, select: false },
    scanCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Write-protected from manufacturer role — system and admin only.
// Verification result is COMPUTED at query time, never stored as a static field.

export default mongoose.model<IVerificationCode>(
  "VerificationCode",
  VerificationCodeSchema,
);
