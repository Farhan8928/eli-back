const express = require("express");
const { AdminController } = require("../controllers/admin.controller");
const { authGuard } = require("../../../common/middleware/auth.middleware");
const { roleGuard } = require("../../../common/middleware/role.middleware");
const { asyncHandler } = require("../../../common/utils/asyncHandler");
const { validateRequest } = require("../../../middlewares/validateRequest");
const {
	adminListClientsSchema,
	adminUpdateUserSchema,
	adminDeleteUserSchema
} = require("../admin.validation");

const adminRoutes = express.Router();
const adminController = new AdminController();

adminRoutes.use(authGuard, roleGuard("superadmin"));

adminRoutes.get(
	"/clients",
	validateRequest(adminListClientsSchema),
	asyncHandler(adminController.listClients)
);
adminRoutes.patch(
	"/users/:userId",
	validateRequest(adminUpdateUserSchema),
	asyncHandler(adminController.updateUser)
);
adminRoutes.delete(
	"/users/:userId",
	validateRequest(adminDeleteUserSchema),
	asyncHandler(adminController.deleteUser)
);
adminRoutes.get("/analytics", asyncHandler(adminController.analytics));

module.exports = { adminRoutes };