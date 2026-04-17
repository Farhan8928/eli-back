import express from "express";
import {
  transactionController,
} from "../controllers/transaction.controller.js";
import { authGuard } from "../../../common/middleware/auth.middleware.js";
import { roleGuard } from "../../../common/middleware/role.middleware.js";
import { validateRequest } from "../../../middlewares/validateRequest.js";
import { transactionCreateManualSchema } from "../transaction.validation.js";
import { asyncHandler } from "../../../common/utils/asyncHandler.js";

const transactionRoutes = express.Router();

transactionRoutes.use(authGuard);

transactionRoutes.get(
  "/mine",
  roleGuard("client"),
  asyncHandler(transactionController.getMine),
);
transactionRoutes.post(
  "/manual",
  roleGuard("superadmin"),
  validateRequest(transactionCreateManualSchema),
  asyncHandler(transactionController.createManual),
);

export { transactionRoutes };
