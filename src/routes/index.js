const express = require("express");
const { authRoutes } = require("../modules/auth/routes/auth.routes");
const { mt5AccountRoutes } = require("../modules/mt5Accounts/routes/mt5Account.routes");
const { adminRoutes } = require("../modules/admin/routes/admin.routes");
const { transactionRoutes } = require("../modules/transactions/routes/transaction.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/mt5-accounts", mt5AccountRoutes);
router.use("/admin", adminRoutes);
router.use("/transactions", transactionRoutes);

module.exports = { router };