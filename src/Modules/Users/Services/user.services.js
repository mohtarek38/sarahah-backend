import User from "../../../DB/Models/users.model.js";
import Joi from "joi";
import mongoose from "mongoose";

import { deleteFileFromCloudinary, uploadFileOnCloudinary } from "../../../Services/cloudinary.service.js";
import { encrypt, decrypt } from "../../../Utils/utils.barrel.js";
import { publicFieldsEnum } from "../../../Commons/user.commons.js";

export const getProfileService = async (req, res) => {
  try {
    const { _id: userId } = req.loggedInUser?.user;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const retrievedFields = "firstName lastName email age gender phoneNumber bio profileImage createdAt hiddenFields";
    const user = await User.findById(userId).select(retrievedFields).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.phoneNumber) user.phoneNumber = decrypt(user.phoneNumber);
    return res.status(200).json({ message: "User profile fetched successfully", user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const updateProfileService = async (req, res) => {
  try {
    const { _id: userId } = req.loggedInUser?.user;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { firstName, lastName, age, gender, phoneNumber, bio } = req.body;
    // find user by id
    const updatedData = {};
    if (firstName) updatedData.firstName = firstName;
    if (lastName) updatedData.lastName = lastName;
    if (age) updatedData.age = age;
    if (gender) updatedData.gender = gender;
    if (phoneNumber) updatedData.phoneNumber = encrypt(phoneNumber);
    if (bio) updatedData.bio = bio;
    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({ message: "No data provided for update" });
    }
    // Update user information
    const user = await User.findByIdAndUpdate(userId, updatedData, { new: true });
    return res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const uploadProfileImageService = async (req, res) => {
  try {
    // cloudinary upload handled in middleware
    const { _id } = req.loggedInUser.user;
    const { path } = req.file;
    const { secure_url, public_id } = await uploadFileOnCloudinary(path, {
      folder: "sarahah/users/profiles",
      unique_filename: false,
      use_filename: true,
    });

    const user = await User.findByIdAndUpdate(_id, { profileImage: { secure_url, public_id } }, { new: true })
      .select("profileImage")
      .lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "Profile image uploaded successfully", user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const deleteProfileImageService = async (req, res) => {
  try {
    const { _id, profileImage } = req.loggedInUser.user;

    if (!profileImage?.public_id || !profileImage?.secure_url) {
      return res.status(400).json({ message: "No profile image to delete" });
    }

    await deleteFileFromCloudinary(profileImage.public_id);

    const user = await User.findByIdAndUpdate(_id, { $unset: { profileImage: "" } }, { new: true })
      .select("profileImage")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Profile image removed successfully", user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const getUserByNameOrEmail = async (req, res) => {
  try {
    const search = req.query.search?.trim();
    if (!search) return res.status(400).json({ message: "Missing search query" });
    let filter;
    // check if search is a valid email
    const emailSchema = Joi.string().email({ tlds: { allow: false } });
    const { error: emailError } = emailSchema.validate(search);
    if (!emailError) {
      // Valid email: exact match only (privacy)
      filter = { email: search.toLowerCase() };
    } else {
      const terms = search.split(/\s+/);
      if (terms.length === 2) {
        // Full name like "John Doe"
        filter = {
          $or: [
            { firstName: new RegExp(terms[0], "i"), lastName: new RegExp(terms[1], "i") },
            { firstName: new RegExp(terms[1], "i"), lastName: new RegExp(terms[0], "i") },
          ],
        };
      } else {
        // Single word: match first or last name
        const regex = new RegExp(search, "i");
        filter = { $or: [{ firstName: regex }, { lastName: regex }] };
      }
    }
    const users = await User.find(filter).select("firstName lastName profileImage bio");
    res.status(200).json({ message: "Users fetched successfully", users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const getUserByIdService = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Get public profile with hidden fields filtered
    const publicProfile = user.getPublicProfile();
    return res.status(200).json({ message: "User fetched successfully", user: publicProfile });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const toggleFieldVisibilityService = async (req, res) => {
  try {
    const { _id: userId } = req.loggedInUser?.user;
    const { field } = req.body;

    if (!field) {
      return res.status(400).json({ message: "Field name is required" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!Object.values(publicFieldsEnum).includes(field)) {
      return res.status(400).json({ message: "Invalid field name" });
    }
    // Check if field is already hidden
    const fieldIndex = user.hiddenFields.indexOf(field);
    fieldIndex > -1 ? user.hiddenFields.splice(fieldIndex, 1) : user.hiddenFields.push(field);
    await user.save();
    return res.status(200).json({ message: "Field visibility toggled", hiddenFields: user.hiddenFields });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};
