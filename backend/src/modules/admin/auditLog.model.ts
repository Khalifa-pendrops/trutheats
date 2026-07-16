import mongoose, { Schema, Document, Types } from "mongoose";

export type AuditAction =
  | "manufacturer.approved"
  | "manufacturer.suspended"
  | "product.created"
  | "product.updated"
  | "product.deactivated"
  | "batch.created"
  | "batch.recalled"
  | "batch.flagged"
  | "verification_code.generated"
  | "verification_code.deactivated"
  | "report.reviewed"
  | "report.dismissed"
  | "user.suspended"
  | "user.deleted"
  | "admin.action";

export interface IAuditLog extends Document {
  action: AuditAction;
  performedBy: Types.ObjectId;
  performedByRole: string;
  targetId?: Types.ObjectId;
  targetModel?: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  notes?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, index: true },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    performedByRole: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId },
    targetModel: { type: String },
    previousValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    notes: { type: String, maxlength: 500 },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false },
  // Append-only — no delete or update endpoint exposed for any role.
);

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ targetId: 1, action: 1 });

export default mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
