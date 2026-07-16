import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import User from "../modules/users/user.model";
import Manufacturer from "../modules/manufacturers/manufacturer.model";
import Product from "../modules/products/product.model";
import Batch from "../modules/batches/batch.model";
import VerificationCode from "../modules/verification/verificationCode.model";
import { generateQRCodeBuffer } from "../utils/generateQRCode";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import configureCloudinary from "../config/cloudinary";

// Helpers

const hashPassword = (pw: string) => bcrypt.hash(pw, 12);

const makeDate = (yearsFromNow: number) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + yearsFromNow);
  return d;
};

const generateAndUploadCode = async (
  manufacturerId: mongoose.Types.ObjectId,
): Promise<{ code: string; qrCodeUrl: string; qrCodePublicId: string }> => {
  const code = uuidv4();
  const buffer = await generateQRCodeBuffer(code);
  const { url, publicId } = await uploadToCloudinary(
    buffer,
    `trusteats/qr-codes/${manufacturerId.toString()}`,
  );
  return { code, qrCodeUrl: url, qrCodePublicId: publicId };
};

// Seed data

const seed = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI not defined");

  configureCloudinary();
  await mongoose.connect(uri);
  console.log(
    "You're Connected to MongoDB Database:",
    mongoose.connection.name,
  );

  // Clear all collections
  await Promise.all([
    User.deleteMany({}),
    Manufacturer.deleteMany({}),
    Product.deleteMany({}),
    Batch.deleteMany({}),
    VerificationCode.deleteMany({}),
  ]);
  console.log("Cleared existing data");

  // Create Admin
  const adminPw = await hashPassword("Admin@4321");
  await User.collection.insertOne({
    email: "admin@trusteats.ng",
    passwordHash: adminPw,
    role: "admin",
    firstName: "Super",
    lastName: "Admin",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log("Admin created: admin@trusteats.ng / Admin@4321");

  // Create Manufacturers
  const mfrData = [
    {
      email: "lagos.dairies@trusteats.ng",
      password: "Manufacturer@1234",
      firstName: "Lagos",
      lastName: "Dairies",
      companyName: "Lagos Dairies Ltd",
      nafdacNumber: "NAFDAC/FD/2026/001234",
      contactEmail: "info@lagosdairies.ng",
      contactPhone: "+2348012345678",
      address: "14 Apapa Road, Lagos Island, Lagos",
    },
    {
      email: "chi.limited@trusteats.ng",
      password: "Manufacturer@1234",
      firstName: "Learnable",
      lastName: "Limited",
      companyName: "Learnable Limited Nigeria",
      nafdacNumber: "NAFDAC/FD/2019/005678",
      contactEmail: "info@learnablelimited.com.ng",
      contactPhone: "+2348023456789",
      address: "1, Centenary City, Enugu State, Nigeria",
    },
    {
      email: "finefoods@trusteats.ng",
      password: "Manufacturer@1234",
      firstName: "Fine",
      lastName: "Foods",
      companyName: "Fine Foods Nigeria",
      nafdacNumber: "NAFDAC/FD/2020/009012",
      contactEmail: "info@finefoods.ng",
      contactPhone: "+2348034567890",
      address: "7 Trans-Amadi Industrial Layout, Port Harcourt",
    },
  ];

  const manufacturers = [];

  for (const m of mfrData) {
    const pw = await hashPassword(m.password);
    const userResult = await User.collection.insertOne({
      email: m.email,
      passwordHash: pw,
      role: "manufacturer",
      firstName: m.firstName,
      lastName: m.lastName,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const manufacturer = await Manufacturer.create({
      userId: userResult.insertedId,
      companyName: m.companyName,
      nafdacNumber: m.nafdacNumber,
      contactEmail: m.contactEmail,
      contactPhone: m.contactPhone,
      address: m.address,
      country: "Nigeria",
      status: "approved",
      approvedAt: new Date(),
    });

    manufacturers.push(manufacturer);
    console.log(`🏭 Manufacturer created: ${m.companyName}`);
  }

  const [lagosDairies, chiLimited, fineFoods] = manufacturers;

  // ── 3. Create Products ─────────────────────────────────────────────────────
  const peakMilk = await Product.create({
    manufacturerId: lagosDairies._id,
    name: "Peak Full Cream Milk",
    brand: "Peak",
    description:
      "Full cream instant dry milk powder, fortified with vitamins A and D.",
    ingredients: "Whole milk powder, Vitamin A, Vitamin D3",
    storageInfo:
      "Store in a cool, dry place. Once opened, consume within 3 weeks.",
    countryOfOrigin: "Nigeria",
    category: "food",
  });

  const babyFormula = await Product.create({
    manufacturerId: lagosDairies._id,
    name: "NutriStart Infant Formula",
    brand: "NutriStart",
    description: "Premium infant formula for babies 0-6 months. WHO-compliant.",
    ingredients:
      "Lactose, Whey protein, Vegetable oils, DHA, ARA, Iron, Zinc, Vitamins",
    storageInfo: "Store below 25°C. Use within 4 weeks of opening.",
    countryOfOrigin: "Nigeria",
    category: "baby_product",
  });

  const juiceDrink = await Product.create({
    manufacturerId: chiLimited._id,
    name: "Hollandia Yoghurt Drink",
    brand: "Hollandia",
    description:
      "Probiotic yoghurt drink with live cultures. Strawberry flavour.",
    ingredients:
      "Skimmed milk, Sugar, Strawberry flavour, Live cultures (L. acidophilus)",
    storageInfo: "Keep refrigerated at 2-8°C.",
    countryOfOrigin: "Nigeria",
    category: "beverage",
  });

  const cookingOil = await Product.create({
    manufacturerId: fineFoods._id,
    name: "FineGold Vegetable Oil",
    brand: "FineGold",
    description: "Refined and bleached vegetable oil, cholesterol-free.",
    ingredients: "Refined vegetable oil (soybean)",
    storageInfo: "Store in a cool place away from direct sunlight.",
    countryOfOrigin: "Nigeria",
    category: "food",
  });

  const supplement = await Product.create({
    manufacturerId: fineFoods._id,
    name: "VitaBoost Multivitamin",
    brand: "VitaBoost",
    description: "Complete daily multivitamin with 23 essential nutrients.",
    ingredients:
      "Vitamins A, B1, B2, B6, B12, C, D3, E, K, Folic Acid, Iron, Calcium, Zinc",
    storageInfo: "Store below 30°C in a dry place.",
    countryOfOrigin: "Nigeria",
    category: "supplement",
  });

  console.log("📦 Products created");

  // ── 4. Create Batches ──────────────────────────────────────────────────────
  const activeBatch1 = await Batch.create({
    productId: peakMilk._id,
    manufacturerId: lagosDairies._id,
    batchNumber: "PKM-2024-001",
    manufacturingDate: new Date("2024-01-15"),
    expiryDate: makeDate(2),
    quantity: 5000,
    status: "active",
  });

  const activeBatch2 = await Batch.create({
    productId: babyFormula._id,
    manufacturerId: lagosDairies._id,
    batchNumber: "NSF-2024-003",
    manufacturingDate: new Date("2024-03-01"),
    expiryDate: makeDate(2),
    quantity: 2000,
    status: "active",
  });

  const activeBatch3 = await Batch.create({
    productId: juiceDrink._id,
    manufacturerId: chiLimited._id,
    batchNumber: "HYD-2024-007",
    manufacturingDate: new Date("2024-06-01"),
    expiryDate: makeDate(1),
    quantity: 10000,
    status: "active",
  });

  const activeBatch4 = await Batch.create({
    productId: cookingOil._id,
    manufacturerId: fineFoods._id,
    batchNumber: "FGO-2024-012",
    manufacturingDate: new Date("2024-04-01"),
    expiryDate: makeDate(2),
    quantity: 8000,
    status: "active",
  });

  const activeBatch5 = await Batch.create({
    productId: supplement._id,
    manufacturerId: fineFoods._id,
    batchNumber: "VBM-2024-005",
    manufacturingDate: new Date("2024-05-01"),
    expiryDate: makeDate(2),
    quantity: 3000,
    status: "active",
  });

  // Expired batch — returns suspicious
  const expiredBatch = await Batch.create({
    productId: peakMilk._id,
    manufacturerId: lagosDairies._id,
    batchNumber: "PKM-2022-OLD",
    manufacturingDate: new Date("2022-01-01"),
    expiryDate: new Date("2023-01-01"), // already expired
    quantity: 1000,
    status: "expired",
  });

  // Recalled batch — returns fake
  const recalledBatch = await Batch.create({
    productId: babyFormula._id,
    manufacturerId: lagosDairies._id,
    batchNumber: "NSF-2024-RECALL",
    manufacturingDate: new Date("2024-01-01"),
    expiryDate: makeDate(2),
    quantity: 500,
    status: "recalled",
    recallReason: "Contamination detected during routine quality inspection.",
  });

  console.log("📋 Batches created");

  // ── 5. Generate Verification Codes ────────────────────────────────────────
  // GENUINE codes — active batches, approved manufacturers
  const genuineBatches = [
    { batch: activeBatch1, manufacturerId: lagosDairies._id, count: 3 },
    { batch: activeBatch2, manufacturerId: lagosDairies._id, count: 2 },
    { batch: activeBatch3, manufacturerId: chiLimited._id, count: 3 },
    { batch: activeBatch4, manufacturerId: fineFoods._id, count: 2 },
    { batch: activeBatch5, manufacturerId: fineFoods._id, count: 2 },
  ];

  const genuineCodes: string[] = [];
  for (const { batch, manufacturerId, count } of genuineBatches) {
    for (let i = 0; i < count; i++) {
      const { code, qrCodeUrl, qrCodePublicId } =
        await generateAndUploadCode(manufacturerId);
      await VerificationCode.create({
        code,
        productId: batch.productId,
        batchId: batch._id,
        manufacturerId,
        qrCodeUrl,
        qrCodePublicId,
        isActive: true,
      });
      genuineCodes.push(code);
    }
  }

  // SUSPICIOUS codes — expired batch
  const suspiciousCodes: string[] = [];
  for (let i = 0; i < 3; i++) {
    const { code, qrCodeUrl, qrCodePublicId } = await generateAndUploadCode(
      lagosDairies._id as mongoose.Types.ObjectId,
    );
    await VerificationCode.create({
      code,
      productId: expiredBatch.productId,
      batchId: expiredBatch._id,
      manufacturerId: lagosDairies._id,
      qrCodeUrl,
      qrCodePublicId,
      isActive: true,
    });
    suspiciousCodes.push(code);
  }

  // FAKE (recalled batch) codes — return fake due to recalled batch
  const recalledCodes: string[] = [];
  for (let i = 0; i < 2; i++) {
    const { code, qrCodeUrl, qrCodePublicId } = await generateAndUploadCode(
      lagosDairies._id as mongoose.Types.ObjectId,
    );
    await VerificationCode.create({
      code,
      productId: recalledBatch.productId,
      batchId: recalledBatch._id,
      manufacturerId: lagosDairies._id,
      qrCodeUrl,
      qrCodePublicId,
      isActive: true,
    });
    recalledCodes.push(code);
  }

  // FAKE — deactivated codes (isActive: false)
  const deactivatedCodes: string[] = [];
  for (let i = 0; i < 2; i++) {
    const { code, qrCodeUrl, qrCodePublicId } = await generateAndUploadCode(
      chiLimited._id as mongoose.Types.ObjectId,
    );
    await VerificationCode.create({
      code,
      productId: activeBatch3.productId,
      batchId: activeBatch3._id,
      manufacturerId: chiLimited._id,
      qrCodeUrl,
      qrCodePublicId,
      isActive: false, // deactivated — returns fake
    });
    deactivatedCodes.push(code);
  }

  // ── 6. Create a consumer test user ────────────────────────────────────────
  const consumerPw = await hashPassword("Consumer@1234");
  await User.collection.insertOne({
    email: "consumer@trusteats.ng",
    passwordHash: consumerPw,
    role: "consumer",
    firstName: "Test",
    lastName: "Consumer",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n✅ Seed complete!\n");
  console.log("─────────────────────────────────────────────");
  console.log("ACCOUNTS");
  console.log("  Admin:        admin@trusteats.ng     / Admin@1234");
  console.log("  Manufacturer: lagos.dairies@trusteats.ng / Manufacturer@1234");
  console.log("  Manufacturer: chi.limited@trusteats.ng   / Manufacturer@1234");
  console.log("  Manufacturer: finefoods@trusteats.ng     / Manufacturer@1234");
  console.log("  Consumer:     consumer@trusteats.ng  / Consumer@1234");
  console.log("─────────────────────────────────────────────");
  console.log("VERIFICATION CODES");
  console.log("\n  ✅ GENUINE codes (active batch, approved manufacturer):");
  genuineCodes.forEach((c, i) => console.log(`     ${i + 1}. ${c}`));
  console.log("\n  ⚠️  SUSPICIOUS codes (expired batch):");
  suspiciousCodes.forEach((c, i) => console.log(`     ${i + 1}. ${c}`));
  console.log("\n  ❌ FAKE codes (recalled batch):");
  recalledCodes.forEach((c, i) => console.log(`     ${i + 1}. ${c}`));
  console.log("\n  ❌ FAKE codes (deactivated):");
  deactivatedCodes.forEach((c, i) => console.log(`     ${i + 1}. ${c}`));
  console.log("─────────────────────────────────────────────");
  console.log(
    `\nTotal codes seeded: ${genuineCodes.length + suspiciousCodes.length + recalledCodes.length + deactivatedCodes.length}`,
  );

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
