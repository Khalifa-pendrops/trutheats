import QRCode from "qrcode";

export const generateQRCodeDataURL = async (
  verificationCode: string,
): Promise<string> => {
  return QRCode.toDataURL(verificationCode, {
    errorCorrectionLevel: "H",
    type: "image/png",
    margin: 2,
    color: { dark: "#000000", light: "#FFFFFF" },
    width: 300,
  });
};

export const generateQRCodeBuffer = async (
  verificationCode: string,
): Promise<Buffer> => {
  return QRCode.toBuffer(verificationCode, {
    errorCorrectionLevel: "H",
    type: "png",
    margin: 2,
    width: 300,
  });
};
