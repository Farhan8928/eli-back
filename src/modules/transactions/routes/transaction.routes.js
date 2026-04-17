const express = require("express");
const { transactionController } = require("../controllers/transaction.controller");
const { authGuard } = require("../../../common/middleware/auth.middleware");
const { roleGuard } = require("../../../common/middleware/role.middleware");
const { validateRequest } = require("../../../middlewares/validateRequest");
const { transactionCreateManualSchema } = require("../transaction.validation");
const { asyncHandler } = require("../../../common/utils/asyncHandler");

const transactionRoutes = express.Router();

transactionRoutes.use(authGuard);

transactionRoutes.get("/mine", roleGuard("client"), asyncHandler(transactionController.getMine));
transactionRoutes.post(
  "/manual",
  roleGuard("superadmin"),
  validateRequest(transactionCreateManualSchema),
  asyncHandler(transactionController.createManual)
);

module.exports = { transactionRoutes };