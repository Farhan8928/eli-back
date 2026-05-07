import express from "express";
import { userController } from "../controllers/user.controller.js";
import { authGuard } from "../../../common/middleware/auth.middleware.js";
import { asyncHandler } from "../../../common/utils/asyncHandler.js";
import {
  uploadIdProof,
  uploadAddressProof,
} from "../../../common/middleware/kycUpload.middleware.js";

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
userRoutes.post(
  "/kyc/id-proof",
  uploadIdProof.single("file"),
  asyncHandler(userController.uploadKycIdProof),
);
userRoutes.post(
  "/kyc/address-proof",
  uploadAddressProof.single("file"),
  asyncHandler(userController.uploadKycAddressProof),
);

export { userRoutes };
