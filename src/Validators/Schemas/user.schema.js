import Joi from "joi";
import { genderEnum, ageLimits, nameLimits, bioLimits } from "../../Commons/user.commons.js";

export const updateProfileSchema = {
  body: Joi.object({
    firstName: Joi.string().alphanum().min(nameLimits.MIN_NAME_LENGTH).max(nameLimits.MAX_NAME_LENGTH),
    lastName: Joi.string().alphanum().min(nameLimits.MIN_NAME_LENGTH).max(nameLimits.MAX_NAME_LENGTH),
    age: Joi.number().integer().min(ageLimits.MIN_AGE).max(ageLimits.MAX_AGE),
    gender: Joi.string().valid(...Object.values(genderEnum)),
    // prettier-ignore
    phoneNumber: Joi.string().pattern(/^\d{11}$/),
    bio: Joi.string().max(bioLimits.MAX_BIO_LENGTH).allow("", null),
  }).min(1),
};
