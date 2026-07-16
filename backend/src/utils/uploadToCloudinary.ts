import { cloudinary } from "../config/cloudinary";
import { v4 as uuidv4 } from "uuid";

interface UploadResult {
  url: string;
  publicId: string;
}

export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string,
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const publicId = `${folder}/${uuidv4()}`;
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png"],
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error || !result)
          return reject(error || new Error("Upload failed"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};
