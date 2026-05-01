import express from "express";
import { userController } from "../controllers/user.controller.js";
import { authGuard } from "../../../common/middleware/auth.middleware.js";
import { asyncHandler } from "../../../common/utils/asyncHandler.js";

const userRoutes = express.Router();

userRoutes.use(authGuard);

userRoutes.get("/me", asyncHandler(userController.getMe));
userRoutes.patch("/profile", asyncHandler(userController.updateProfile));
userRoutes.patch(
  "/bank-details",
  asyncHandler(userController.updateBankDetails),
);
userRoutes.post(
  "/change-password",
  asyncHandler(userController.changePassword),
);
userRoutes.post("/kyc", asyncHandler(userController.uploadKyc));

export { userRoutes };
