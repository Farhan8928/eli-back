import express from "express";
import { transactionController } from "../controllers/transaction.controller.js";
import { authGuard } from "../../../common/middleware/auth.middleware.js";
import { roleGuard } from "../../../common/middleware/role.middleware.js";
import { validateRequest } from "../../../middlewares/validateRequest.js";
import {
  transactionCreateManualSchema,
  transactionRequestSchema,
} from "../transaction.validation.js";
import { asyncHandler } from "../../../common/utils/asyncHandler.js";

const transactionRoutes = express.Router();

transactionRoutes.use(authGuard);

transactionRoutes.get(
  "/mine",
  roleGuard("client"),
  asyncHandler(transactionController.getMine),
);

transactionRoutes.post(
  "/deposit",
  roleGuard("client"),
  validateRequest(transactionRequestSchema),
  asyncHandler(transactionController.requestDeposit),
);

transactionRoutes.post(
  "/withdraw",
  roleGuard("client"),
  validateRequest(transactionRequestSchema),
  asyncHandler(transactionController.requestWithdrawal),
);

transactionRoutes.post(
  "/manual",
  roleGuard("superadmin"),
  validateRequest(transactionCreateManualSchema),
  asyncHandler(transactionController.createManual),
);

export { transactionRoutes };
