const express = require("express");
const { TransactionController } = require("../controllers/transaction.controller");
const { authGuard } = require("../../../common/middleware/auth.middleware");
const { roleGuard } = require("../../../common/middleware/role.middleware");
const { validate } = require("../../../common/middleware/validate.middleware");
const { createTransactionDto } = require("../dto/transaction.dto");
const { asyncHandler } = require("../../../common/utils/asyncHandler");

const transactionRoutes = express.Router();
const transactionController = new TransactionController();

transactionRoutes.use(authGuard);

transactionRoutes.get("/mine", roleGuard("client"), asyncHandler(transactionController.getMine));
transactionRoutes.post(
  "/manual",
  roleGuard("superadmin"),
  validate(createTransactionDto),
  asyncHandler(transactionController.createManual)
);

module.exports = { transactionRoutes };