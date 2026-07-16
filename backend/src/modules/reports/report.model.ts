import mongoose, { Schema, Document, Types } from "mongoose";
import sanitizeHtml from "sanitize-html";
import { ReportStatus } from "../../types";

const sanitise = (val: string) =>
  sanitizeHtml(val, { allowedTags: [], allowedAttributes: {} });

export interface IReport extends Document {
  code: string;
  productId?: Types.ObjectId;
  reportedBy?: Types.ObjectId;
  ipHash: string;
  comment?: string;
  imageUrls: string[];
  imagePublicIds: string[];
  status: ReportStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  reportedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    code: { type: String, required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User" },
    ipHash: { type: String, required: true },
    comment: { type: String, maxlength: 1000, set: sanitise },
    imageUrls: [{ type: String }],
    imagePublicIds: [{ type: String, select: false }],
    status: {
      type: String,
      enum: ["pending", "under_review", "resolved", "dismissed"],
      default: "pending",
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, maxlength: 1000 },
    reportedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

ReportSchema.index({ code: 1, reportedAt: -1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ productId: 1, status: 1 });

export default mongoose.model<IReport>("Report", ReportSchema);
