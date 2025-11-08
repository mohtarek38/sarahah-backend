import crypto from "node:crypto";

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY); // Must be 256 bits (32 characters)
const IV_LENGTH = +process.env.IV_LENGTH; // For AES, this is always 16 bytes

export const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
};

export const decrypt = (encryptedData) => {
  const [ivHex, encryptedText] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};