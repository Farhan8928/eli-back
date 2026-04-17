const express = require("express");
const { AuthController } = require("../controllers/auth.controller");
const { validateRequest } = require("../../../middlewares/validateRequest");
const { asyncHandler } = require("../../../common/utils/asyncHandler");
const { authRegisterSchema, authLoginSchema } = require("../auth.validation");

const authRoutes = express.Router();
const authController = new AuthController();

authRoutes.post("/register", validateRequest(authRegisterSchema), asyncHandler(authController.register));
authRoutes.post("/login", validateRequest(authLoginSchema), asyncHandler(authController.login));

module.exports = { authRoutes };