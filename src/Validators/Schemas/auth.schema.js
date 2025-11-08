import Joi from "joi";
import { genderEnum, ageLimits, nameLimits } from "../../Commons/user.commons.js";

export const signUpSchema = {
  body: Joi.object({
    firstName: Joi.string().alphanum().min(nameLimits.MIN_NAME_LENGTH).max(nameLimits.MAX_NAME_LENGTH).required(),
    lastName: Joi.string().alphanum().min(nameLimits.MIN_NAME_LENGTH).max(nameLimits.MAX_NAME_LENGTH).required(),
    age: Joi.number().integer().min(ageLimits.MIN_AGE).max(ageLimits.MAX_AGE).required(),
    // prettier-ignore
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string()
      .min(8)
      .max(30)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .required()
      .messages({
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
        "string.min": "Password must be at least 8 characters long.",
        "string.max": "Password must not exceed 30 characters.",
        "any.required": "Password is required.",
        "string.empty": "Password cannot be empty.",
      }),
    confirmPassword: Joi.any().valid(Joi.ref("password")),
    // prettier-ignore
    gender: Joi.string().valid(...Object.values(genderEnum)),
    // prettier-ignore
    phoneNumber: Joi.string().pattern(/^\d{11}$/).required(),
  }),
};

export const resetPasswordValidationSchema = {
  body: Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
      "string.length": "OTP must be 6 digits",
      "string.pattern.base": "OTP must contain only numbers",
      "any.required": "OTP is required",
    }),
    newPassword: Joi.string()
      .min(8)
      .max(30)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .required()
      .messages({
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
        "string.min": "Password must be at least 8 characters long.",
        "string.max": "Password must not exceed 30 characters.",
        "any.required": "Password is required.",
        "string.empty": "Password cannot be empty.",
      }),
    confirmPassword: Joi.any().valid(Joi.ref("password")),
  }),
};
