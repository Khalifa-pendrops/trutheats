import mongoose, { Schema, Document, Types } from "mongoose";
import { ManufacturerStatus } from "../../types";

export interface IManufacturer extends Document {
  userId: Types.ObjectId;
  companyName: string;
  napamsEmail: string;
  cacNumber: string;
  nafdacNumber?: string;
  nafdacCofRNumber?: string;
  certificateOfRecognitionUrl?: string;
  certificateOfRecognitionPublicId?: string;
  contactPhone: string;
  address: string;
  country: string;
  logoUrl?: string;
  logoPublicId?: string;
  termsAcceptedAt?: Date;
  status: ManufacturerStatus;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  suspendedReason?: string;
}

const ManufacturerSchema = new Schema<IManufacturer>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    napamsEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid NAPAMS email"],
    },
    cacNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    nafdacNumber: {
      type: String,
      trim: true,
    },
    nafdacCofRNumber: {
      type: String,
      trim: true,
    },
    certificateOfRecognitionUrl: {
      type: String,
    },
    certificateOfRecognitionPublicId: {
      type: String,
      select: false,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      default: "Nigeria",
    },
    logoUrl: { type: String },
    logoPublicId: { type: String, select: false },
    termsAcceptedAt: { type: Date },
    status: {
      type: String,
      enum: ["pending", "approved", "suspended"],
      default: "pending",
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    suspendedReason: { type: String },
  },
  { timestamps: true },
);

// ManufacturerSchema.index({ companyName: "text" });
// ManufacturerSchema.index({ cacNumber: 1 });
ManufacturerSchema.index({ companyName: "text" });

export default mongoose.model<IManufacturer>(
  "Manufacturer",
  ManufacturerSchema,
);
