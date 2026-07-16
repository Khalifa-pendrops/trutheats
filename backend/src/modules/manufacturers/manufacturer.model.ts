import mongoose, { Schema, Document, Types } from "mongoose";
import { ManufacturerStatus } from "../../types";

export interface IManufacturer extends Document {
  userId: Types.ObjectId;
  companyName: string;
  nafdacNumber?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  country: string;
  logoUrl?: string;
  logoPublicId?: string;
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
    companyName: { type: String, required: true, trim: true, maxlength: 100 },
    nafdacNumber: { type: String, trim: true },
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "This email format is kind of invalid, sorry."],
    },
    contactPhone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    country: { type: String, required: true, default: "Nigeria" },
    logoUrl: { type: String },
    logoPublicId: { type: String, select: false },
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

ManufacturerSchema.index({ companyName: "text" });

export default mongoose.model<IManufacturer>(
  "Manufacturer",
  ManufacturerSchema,
);
