import mongoose from "mongoose";
import { genderEnum, ageLimits, authProviderEnum, bioLimits, publicFieldsEnum } from "../../Commons/user.commons.js";
import { decrypt } from "../../Utils/encryption.utils.js";
// // Helper function to define required string fields
// const reqString = (options = {}) => ({ type: String, required: true, trim: true, ...options });

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    age: {
      type: Number,
      min: ageLimits.MIN_AGE,
      max: ageLimits.MAX_AGE,
    },
    gender: {
      type: String,
      enum: Object.values(genderEnum),
    },
    phoneNumber: { type: String, trim: true },
    profileImage: {
      secure_url: { type: String },
      public_id: { type: String },
    },
    bio: {
      type: String,
      maxlength: bioLimits.MAX_BIO_LENGTH,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: { unique: true, name: "idx_email_unique" },
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    hiddenFields: {
      type: [String],
      enum: Object.values(publicFieldsEnum), // Only these can be hidden
      default: [publicFieldsEnum.EMAIL, publicFieldsEnum.PHONE_NUMBER], // Start with everything public
    },
    password: {
      type: String,
      required: true,
    },
    otps: {
      confirmation: String,
      passwordReset: String,
    },
    googleId: {
      type: String,
      index: { unique: true, sparse: true, name: "idx_googleId_unique" },
    },
    authProvider: {
      type: String,
      enum: Object.values(authProviderEnum),
      default: authProviderEnum.EMAIL,
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});
userSchema.statics.softDelete = function (id) {
  return this.findByIdAndUpdate(id, { isDeleted: true });
};

// Method to get public profile (filters hidden fields)
userSchema.methods.getPublicProfile = function () {
  const profile = {
    _id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    bio: this.bio,
    profileImage: this.profileImage,
    age: this.age,
    gender: this.gender,
    email: this.email,
    phoneNumber: this.phoneNumber,
    createdAt: this.createdAt,
  };
  // Remove hidden fields (with safety check)
  if (Array.isArray(this.hiddenFields)) {
    this.hiddenFields.forEach((field) => delete profile[field]);
  }
  // Decrypt phone number if it exists and wasn't hidden
  if (profile.phoneNumber) {
    profile.phoneNumber = decrypt(profile.phoneNumber);
  }
  return profile;
};
const User = mongoose.model("User", userSchema);
export default User;
