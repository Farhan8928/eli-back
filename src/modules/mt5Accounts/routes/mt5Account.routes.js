const express = require("express");
const { Mt5AccountController } = require("../controllers/mt5Account.controller");
const { asyncHandler } = require("../../../common/utils/asyncHandler");
const { authGuard } = require("../../../common/middleware/auth.middleware");
const { roleGuard } = require("../../../common/middleware/role.middleware");
const { validate } = require("../../../common/middleware/validate.middleware");
const { createMt5AccountDto, resetMt5PasswordDto } = require("../dto/createMt5Account.dto");

const mt5AccountRoutes = express.Router();
const mt5AccountController = new Mt5AccountController();

mt5AccountRoutes.use(authGuard);

mt5AccountRoutes.get("/mine", roleGuard("client"), asyncHandler(mt5AccountController.getMine));
mt5AccountRoutes.post(
  "/mine",
  roleGuard("client"),
  validate(createMt5AccountDto),
  asyncHandler(mt5AccountController.createMine)
);

mt5AccountRoutes.post(
  "/reset-password",
  roleGuard("superadmin"),
  validate(resetMt5PasswordDto),
  asyncHandler(mt5AccountController.resetPasswordByAdmin)
);

module.exports = { mt5AccountRoutes };