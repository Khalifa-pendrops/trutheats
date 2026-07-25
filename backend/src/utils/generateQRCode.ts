import QRCode from "qrcode";

const buildVerificationUrl = (code: string): string => {
  const base = process.env.BASE_URL || "http://localhost:5000";
  return `${base}/api/v1/verify/${code}`;
};

// Returns base64 data URL. Used for previews
export const generateQRCodeDataURL = async (code: string): Promise<string> => {
  return QRCode.toDataURL(buildVerificationUrl(code), {
    errorCorrectionLevel: "H",
    type: "image/png",
    margin: 2,
    color: { dark: "#000000", light: "#FFFFFF" },
    width: 300,
  });
};

// Returns PNG buffer. Used for Cloudinary upload
export const generateQRCodeBuffer = async (code: string): Promise<Buffer> => {
  return QRCode.toBuffer(buildVerificationUrl(code), {
    errorCorrectionLevel: "H",
    type: "png",
    margin: 2,
    width: 300,
  });
};
