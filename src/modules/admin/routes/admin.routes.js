import express from "express";
import { adminController } from "../controllers/admin.controller.js";
import { authGuard } from "../../../common/middleware/auth.middleware.js";
import { roleGuard } from "../../../common/middleware/role.middleware.js";
import { asyncHandler } from "../../../common/utils/asyncHandler.js";
import { validateRequest } from "../../../middlewares/validateRequest.js";
import {
  adminListClientsSchema,
  adminUpdateUserSchema,
  adminDeleteUserSchema,
} from "../admin.validation.js";

const adminRoutes = express.Router();

adminRoutes.use(authGuard, roleGuard("superadmin"));

adminRoutes.get(
  "/clients",
  validateRequest(adminListClientsSchema),
  asyncHandler(adminController.listClients),
);
adminRoutes.patch(
  "/users/:userId",
  validateRequest(adminUpdateUserSchema),
  asyncHandler(adminController.updateUser),
);
adminRoutes.delete(
  "/users/:userId",
  validateRequest(adminDeleteUserSchema),
  asyncHandler(adminController.deleteUser),
);
adminRoutes.get("/analytics", asyncHandler(adminController.analytics));

export { adminRoutes };
