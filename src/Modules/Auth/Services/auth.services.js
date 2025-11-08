import crypto from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import { hashSync, compareSync } from "bcrypt";
import { OAuth2Client } from "google-auth-library";

import User from "../../../DB/Models/users.model.js";
import BlackListedTokens from "../../../DB/Models/blacklisted-tokens.model.js";
import { generateToken, verifyToken, emitter, encrypt } from "../../../Utils/utils.barrel.js";
import { authProviderEnum } from "../../../Commons/user.commons.js";

export const signUpService = async (req, res) => {
  try {
    const { firstName, lastName, age, gender, phoneNumber, email, password } = req.body;
    const isEmailExist = await User.findOne({ email });
    if (isEmailExist) {
      return res.status(400).json({ message: "Email already exists" });
    }
    // Encrypt phone number before saving
    const encryptedPhoneNumber = encrypt(phoneNumber);
    // Hash password before saving
    const hashedPassword = hashSync(password, +process.env.BCRYPT_SALT_ROUNDS);
    // Generate OTP for email confirmation
    const otp = String(crypto.randomInt(100000, 999999));
    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      age,
      gender,
      phoneNumber: encryptedPhoneNumber,
      email,
      password: hashedPassword,
      otps: { confirmation: hashSync(otp, +process.env.BCRYPT_SALT_ROUNDS) },
    });
    // Send Email for registered user
    emitter.emit("sendEmailResend", {
      to: email,
      subject: "Confirmation Email",
      content: `
      <h1>Confirm Your Email!</h1>
      <p>Thank you for registering, ${firstName} ${lastName}!</p>
      <p>Your confirmation code is: <strong>${otp}</strong></p>
      `,
    });
    console.log(user);
    return res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const confirmEmailService = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    const user = await User.findOne({ email, isConfirmed: false });
    if (!user) {
      return res.status(404).json({ message: "User invalid or already confirmed" });
    }
    const isOtpValid = compareSync(otp, user.otps?.confirmation);
    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    user.isConfirmed = true;
    user.otps.confirmation = undefined;
    await user.save();
    return res.status(200).json({ message: "Email confirmed successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const loginService = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Invalid credentials" });
    }
    if (user.isConfirmed === false) {
      return res.status(403).json({ message: "Please confirm your email before logging in" });
    }
    if (user.authProvider !== authProviderEnum.EMAIL) {
      return res.status(400).json({ message: `Please log in using ${user.authProvider}` });
    }
    const isPasswordValid = compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // Generate JWT access token
    const accesstoken = generateToken({ _id: user._id, email: user.email }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRATION,
      jwtid: uuidv4(),
    });
    // Generate JWT refresh token
    const refreshtoken = generateToken({ _id: user._id, email: user.email }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION,
      jwtid: uuidv4(),
    });
    // Successful login
    return res.status(200).json({ message: "User signed in successfully", accesstoken, refreshtoken });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const logoutService = async (req, res) => {
  try {
    const { jti, expirationDate } = req.loggedInUser.token;
    await BlackListedTokens.create({
      tokenId: jti,
      expirationDate: new Date(expirationDate * 1000),
    });
    return res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const refreshTokenService = async (req, res) => {
  try {
    const { refreshtoken } = req.body;
    if (!refreshtoken) {
      return res.status(400).json({ message: "Missing refresh token" });
    }
    // Verify refresh token
    const decoded = verifyToken(refreshtoken, process.env.JWT_REFRESH_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }
    // Generate new access token
    const newAccessToken = generateToken({ _id: decoded._id, email: decoded.email }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRATION,
      jwtid: uuidv4(),
    });
    return res.status(200).json({ message: "New access token generated successfully", accesstoken: newAccessToken });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const googleAuthService = async (req, res) => {
  try {
    const { credential } = req.body; // JWT from Google
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { sub: googleId, email, email_verified, given_name, family_name } = ticket.getPayload();
    if (!email_verified) {
      return res.status(400).json({ message: "Google email not verified" });
    }
    let user = await User.findOne({ googleId });
    let isNewUser = false;
    if (!user) {
      // Sign up new user
      user = await User.create({
        firstName: given_name,
        lastName: family_name,
        email,
        googleId,
        isConfirmed: true,
        authProvider: authProviderEnum.GOOGLE,
        password: hashSync(crypto.randomBytes(16).toString("hex"), +process.env.BCRYPT_SALT_ROUNDS),
      });
      isNewUser = true;
    } else if (user.email !== email) {
      // Update email if changed
      user.email = email;
      await user.save();
    }
    // Generate JWT access token
    const accesstoken = generateToken({ _id: user._id, email: user.email }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRATION,
      jwtid: uuidv4(),
    });
    // Generate JWT refresh token
    const refreshtoken = generateToken({ _id: user._id, email: user.email }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION,
      jwtid: uuidv4(),
    });
    return res.status(200).json({ message: "User signed in successfully", accesstoken, refreshtoken });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const requestPasswordResetService = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await User.findOne({ email });
    if (!user || user.authProvider !== authProviderEnum.EMAIL || !user.isConfirmed) {
      return res.status(200).json({
        message: "If your email is registered, you will receive a password reset code",
      });
    }
    // Generate OTP for password reset
    const otp = String(crypto.randomInt(100000, 999999));
    user.otps.passwordReset = hashSync(otp, +process.env.BCRYPT_SALT_ROUNDS);
    await user.save();
    // Send Email for password reset
    emitter.emit("sendEmailResend", {
      to: email,
      subject: "Password Reset Request",
      content: `
      <h1>Password Reset Request</h1>
      <p>Hello ${user.firstName} ${user.lastName},</p>
      <p>Your password reset code is: <strong>${otp}</strong></p>
      <p>If you didn't request this, please ignore this email.</p>
      `,
    });
    return res.status(200).json({ message: "If your email is registered, you will receive a password reset code" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const resetPasswordService = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required" });
    }
    const user = await User.findOne({ email });
    if (!user || !user.otps.passwordReset) {
      return res.status(404).json({ message: "Invalid email or no password reset requested" });
    }
    const isOtpValid = compareSync(otp, user.otps.passwordReset);
    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    user.password = hashSync(newPassword, +process.env.BCRYPT_SALT_ROUNDS);
    user.otps.passwordReset = undefined;
    await user.save();
    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};
