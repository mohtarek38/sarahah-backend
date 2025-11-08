import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

// Generate
export const generateToken = (payload, secret, options) => {
  return jwt.sign(payload, secret, options);
};

// Verify
export const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

// Google OAuth2 Client
const client = new OAuth2Client();
export const verifyGoogleToken = async (token) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};
