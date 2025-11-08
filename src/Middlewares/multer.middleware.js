import multer from "multer";
import fs from "node:fs";
import { allowedFileExtensions, fileTypes } from "../Commons/constants/files.constants.js";

function checkOrCreateFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
}
// Upload locally
export const localUpload = ({ folderPath = "others" }) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const fileDir = `uploads/${folderPath}`;
      checkOrCreateFolder(fileDir);
      cb(null, `uploads/${folderPath}`);
    },
    filename: (req, file, cb) => {
    //   console.log(`File info before uploading`, file);
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}___${file.originalname}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    const fileKey = file.mimetype.split("/")[0].toUpperCase();
    const fileType = fileTypes[fileKey];
    if (!fileType) return cb(new Error("Invalid file type"), false);
    const fileExtension = file.mimetype.split("/")[1];
    if (!allowedFileExtensions[fileType].includes(fileExtension)) return cb(new Error("Invalid file extension"), false);
    return cb(null, true);
  };
  return multer({ fileFilter, storage });
};
// Upload to host server disk
export const hostUpload = ({ limits = {} }) => {
  const storage = multer.diskStorage({
    filename: (req, file, cb) => {
    //   console.log(`File info before uploading`, file);
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}__${file.originalname}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    const fileKey = file.mimetype.split("/")[0].toUpperCase();
    const fileType = fileTypes[fileKey];
    if (!fileType) return cb(new Error("Invalid file type"), false);
    const fileExtension = file.mimetype.split("/")[1];
    if (!allowedFileExtensions[fileType].includes(fileExtension)) return cb(new Error("Invalid file extension"), false);
    return cb(null, true);
  };

  return multer({ fileFilter, storage, limits });
};
