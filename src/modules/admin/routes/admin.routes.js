const express = require("express");
const { AdminController } = require("../controllers/admin.controller");
const { authGuard } = require("../../../common/middleware/auth.middleware");
const { roleGuard } = require("../../../common/middleware/role.middleware");
const { asyncHandler } = require("../../../common/utils/asyncHandler");
const { validate } = require("../../../common/middleware/validate.middleware");
const { updateUserDto, userQueryDto } = require("../dto/manageUser.dto");

const adminRoutes = express.Router();
const adminController = new AdminController();

adminRoutes.use(authGuard, roleGuard("superadmin"));

adminRoutes.get("/clients", validate(userQueryDto, "query"), asyncHandler(adminController.listClients));
adminRoutes.patch("/users/:userId", validate(updateUserDto), asyncHandler(adminController.updateUser));
adminRoutes.delete("/users/:userId", asyncHandler(adminController.deleteUser));
adminRoutes.get("/analytics", asyncHandler(adminController.analytics));

module.exports = { adminRoutes };