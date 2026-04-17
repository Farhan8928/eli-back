const express = require("express");
const { mt5AccountController } = require("../controllers/mt5Account.controller");
const { asyncHandler } = require("../../../common/utils/asyncHandler");
const { authGuard } = require("../../../common/middleware/auth.middleware");
const { roleGuard } = require("../../../common/middleware/role.middleware");
const { validateRequest } = require("../../../middlewares/validateRequest");
const { mt5CreateMineSchema, mt5ResetPasswordSchema } = require("../mt5Account.validation");

const mt5AccountRoutes = express.Router();

mt5AccountRoutes.use(authGuard);

mt5AccountRoutes.get("/mine", roleGuard("client"), asyncHandler(mt5AccountController.getMine));
mt5AccountRoutes.post(
  "/mine",
  roleGuard("client"),
  validateRequest(mt5CreateMineSchema),
  asyncHandler(mt5AccountController.createMine)
);

mt5AccountRoutes.post(
  "/reset-password",
  roleGuard("superadmin"),
  validateRequest(mt5ResetPasswordSchema),
  asyncHandler(mt5AccountController.resetPasswordByAdmin)
);

module.exports = { mt5AccountRoutes };