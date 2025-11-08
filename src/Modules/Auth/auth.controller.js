import { Router } from "express";
import { signUpSchema, resetPasswordValidationSchema } from "../../Validators/Schemas/auth.schema.js";
import * as authServices from "./Services/auth.services.js";
import { authenticationMiddleware, validationMiddleware } from "../../Middlewares/middlewares.barrel.js";

const router = Router();

router.post("/register", validationMiddleware(signUpSchema), authServices.signUpService);
router.post("/confirm-email", authServices.confirmEmailService);
router.post("/login", authServices.loginService);
router.post("/google-auth", authServices.googleAuthService);
router.post("/refresh-token", authServices.refreshTokenService);
router.post("/logout", authenticationMiddleware, authServices.logoutService);
router.post("/request-password-reset", authServices.requestPasswordResetService);
router.post("/reset-password", validationMiddleware(resetPasswordValidationSchema), authServices.resetPasswordService);
export const authController = router;
