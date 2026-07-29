import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import { UserRole } from "../../types";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  isActive: boolean;
  refreshTokenHash?: string;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  lastLoginAt?: Date;

  // just added these for the OTP switch from verification link
  emailVerified: boolean;
  emailVerificationOtp?: string;
  emailVerificationOtpExpiresAt?: Date;
  passwordResetOtp?: string;
  passwordResetOtpExpiresAt?: Date;

  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["consumer", "manufacturer", "admin"],
      default: "consumer",
    },
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    isActive: { type: Boolean, default: true },
    refreshTokenHash: { type: String, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    lastLoginAt: { type: Date },

    emailVerified: { type: Boolean, default: false },
    emailVerificationOtp: { type: String, select: false },
    emailVerificationOtpExpiresAt: { type: Date, select: false },
    passwordResetOtp: { type: String, select: false },
    passwordResetOtpExpiresAt: { type: Date, select: false },
  },
  { timestamps: true },
);

UserSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

UserSchema.methods.comparePassword = async function (
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokenHash;
  delete obj.passwordResetTokenHash;
  delete obj.passwordResetExpiresAt;
  delete obj.emailVerificationOtp;
  delete obj.emailVerificationOtpExpiresAt;
  delete obj.passwordResetOtp;
  delete obj.passwordResetOtpExpiresAt;
  return obj;
};

export default mongoose.model<IUser>("User", UserSchema);
