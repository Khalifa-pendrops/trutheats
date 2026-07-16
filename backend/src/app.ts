import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

import connectDB from "./config/db";
import configureCloudinary from "./config/cloudinary";
import { sanitiseQuery } from "./middleware/sanitiseQuery";
import { errorHandler } from "./middleware/errorHandler";

import authRoutes from "./modules/auth/auth.route";
import manufacturerRoutes from "./modules/manufacturers/manufacturer.route";
import productRoutes from "./modules/products/product.route";
import batchRoutes from "./modules/batches/batch.route";
import verificationRoutes from "./modules/verification/verification.route";
import reportRoutes from "./modules/reports/report.route";
import adminRoutes from "./modules/admin/admin.routes";

const app = express();

// Security middleware — has to come first
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(cookieParser());
app.use(sanitiseQuery);

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/manufacturers", manufacturerRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/batches", batchRoutes);
app.use("/api/v1/verify", verificationRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/admin", adminRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "TrustEats API",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Global error handler — must come last
app.use(errorHandler);

// Start this server
const PORT = parseInt(process.env.PORT || "5000", 10);

const start = async () => {
  configureCloudinary();
  await connectDB();
  app.listen(PORT, () => {
    console.log(
      `TrustEats API is live and running smoothly on http://localhost:${PORT}`,
    );
    console.log(`   Environment: ${process.env.NODE_ENV}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

export default app;
