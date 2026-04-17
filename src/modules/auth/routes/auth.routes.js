const express = require("express");
const { AuthController } = require("../controllers/auth.controller");
const { validate } = require("../../../common/middleware/validate.middleware");
const { asyncHandler } = require("../../../common/utils/asyncHandler");
const { registerDto } = require("../dto/register.dto");
const { loginDto } = require("../dto/login.dto");

const authRoutes = express.Router();
const authController = new AuthController();

authRoutes.post("/register", validate(registerDto), asyncHandler(authController.register));
authRoutes.post("/login", validate(loginDto), asyncHandler(authController.login));

module.exports = { authRoutes };