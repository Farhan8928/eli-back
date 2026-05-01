import express from "express";
import { authController } from "../controllers/auth.controller.js";
import { validateRequest } from "../../../middlewares/validateRequest.js";
import { asyncHandler } from "../../../common/utils/asyncHandler.js";
import {
  authRegisterSchema,
  authLoginSchema,
  authVerifyOtpSchema,
  authForgotPasswordSchema,
} from "../auth.validation.js";

const authRoutes = express.Router();

authRoutes.post(
  "/register",
  validateRequest(authRegisterSchema),
  asyncHandler(authController.register),
);
authRoutes.post(
  "/login",
  validateRequest(authLoginSchema),
  asyncHandler(authController.login),
);
authRoutes.post(
  "/verify-otp",
  validateRequest(authVerifyOtpSchema),
  asyncHandler(authController.verifyOtp),
);
authRoutes.post(
  "/forgot-password",
  validateRequest(authForgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);

export { authRoutes };
