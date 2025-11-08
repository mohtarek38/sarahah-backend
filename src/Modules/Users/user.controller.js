import { Router } from "express";

import * as userServices from "./Services/user.services.js";
import { authenticationMiddleware, validationMiddleware, hostUpload } from "../../Middlewares/middlewares.barrel.js";
import { updateProfileSchema } from "../../Validators/Schemas/user.schema.js";

const router = Router();
router.get("/me", authenticationMiddleware, userServices.getProfileService);
router.get("/all", authenticationMiddleware, userServices.getUserByNameOrEmail);
router.patch("/me/updateprofile", validationMiddleware(updateProfileSchema), authenticationMiddleware, userServices.updateProfileService);
//prettier-ignore
router.post("/me/upload-profile",authenticationMiddleware,hostUpload({ limits: {fileSize: 1*1024*1024} }).single("profile"),userServices.uploadProfileImageService);
router.delete("/me/delete-profile-image", authenticationMiddleware, userServices.deleteProfileImageService);
router.patch("/me/toggle-field-visibility", authenticationMiddleware, userServices.toggleFieldVisibilityService);
router.get("/:userId", userServices.getUserByIdService);
export const userController = router;
