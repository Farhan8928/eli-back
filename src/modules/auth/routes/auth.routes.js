import express from "express";
import { authController } from "../controllers/auth.controller.js";
import { validateRequest } from "../../../middlewares/validateRequest.js";
import { asyncHandler } from "../../../common/utils/asyncHandler.js";
import { authRegisterSchema, authLoginSchema } from "../auth.validation.js";

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

export { authRoutes };
