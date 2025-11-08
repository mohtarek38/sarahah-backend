import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";
import fs from "node:fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadFileOnCloudinary = async (file, options) => {
  // console.log(file);
  const result = await cloudinary.uploader.upload(file, options);
  // delete file from local server after upload
  if (result && fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
  return result;
};

export const deleteFileFromCloudinary = async (publicId) => {
  const result = await cloudinary.uploader.destroy(publicId);
  return result;
};

export const uploadMultipleFilesOnCloudinary = async (files, options) => {
  const result = [];
  for (const file of files) {
    const { secure_url, public_id } = await uploadFileOnCloudinary(file, options);
    result.push({ secure_url, public_id });
  }
  return result;
};

export const getFileFromCloudinary = async (publicId, options) => {
  const result = await cloudinary.api.resource(publicId, options);
  return result;
};
