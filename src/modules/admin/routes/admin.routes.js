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
  adminCreatePlanSchema,
  adminCreateOrUpdateSmtpSchema,
  adminCreateEmailerSchema,
  adminCreateRepresentativeSchema,
  adminUpdateTransactionStatusSchema,
  adminListGenericSchema,
  adminChangeUserPasswordSchema,
} from "../admin.validation.js";

const adminRoutes = express.Router();

adminRoutes.use(authGuard, roleGuard("superadmin"));

adminRoutes.get(
  "/clients",
  validateRequest(adminListClientsSchema),
  asyncHandler(adminController.listClients),
);
adminRoutes.post(
  "/users",
  validateRequest(adminUpdateUserSchema), // Using same schema for creation for simplicity, or create a new one
  asyncHandler(adminController.updateUser), // I'll update the controller to handle creation if needed or add a new method
);
adminRoutes.patch(
  "/users/:userId",
  validateRequest(adminUpdateUserSchema),
  asyncHandler(adminController.updateUser),
);
adminRoutes.put(
  "/users/:userId/password",
  validateRequest(adminChangeUserPasswordSchema),
  asyncHandler(adminController.changeUserPassword),
);
adminRoutes.delete(
  "/users/:userId",
  validateRequest(adminDeleteUserSchema),
  asyncHandler(adminController.deleteUser),
);
adminRoutes.get("/analytics", asyncHandler(adminController.analytics));
adminRoutes.get("/analytics/charts", asyncHandler(adminController.dashboardCharts));
adminRoutes.get("/logs", asyncHandler(adminController.listAuditLogs));

// Plans
adminRoutes.post(
  "/plans",
  validateRequest(adminCreatePlanSchema),
  asyncHandler(adminController.createPlan),
);
adminRoutes.get(
  "/plans",
  validateRequest(adminListGenericSchema),
  asyncHandler(adminController.listPlans),
);
adminRoutes.patch(
  "/plans/:planId",
  validateRequest(adminCreatePlanSchema),
  asyncHandler(adminController.updatePlan),
);
adminRoutes.delete(
  "/plans/:planId",
  asyncHandler(adminController.deletePlan),
);

// SMTP
adminRoutes.put(
  "/smtp",
  validateRequest(adminCreateOrUpdateSmtpSchema),
  asyncHandler(adminController.upsertSmtp),
);
adminRoutes.get("/smtp", asyncHandler(adminController.getSmtp));

// Emailers
adminRoutes.post(
  "/emailers",
  validateRequest(adminCreateEmailerSchema),
  asyncHandler(adminController.createEmailer),
);
adminRoutes.get(
  "/emailers",
  validateRequest(adminListGenericSchema),
  asyncHandler(adminController.listEmailers),
);
adminRoutes.patch(
  "/emailers/:emailerId",
  validateRequest(adminCreateEmailerSchema),
  asyncHandler(adminController.updateEmailer),
);
adminRoutes.delete(
  "/emailers/:emailerId",
  asyncHandler(adminController.deleteEmailer),
);

// Representatives
adminRoutes.post(
  "/representatives",
  validateRequest(adminCreateRepresentativeSchema),
  asyncHandler(adminController.createRepresentative),
);
adminRoutes.get(
  "/representatives",
  validateRequest(adminListGenericSchema),
  asyncHandler(adminController.listRepresentatives),
);

// MT5 Accounts
adminRoutes.get(
  "/mt5-accounts",
  validateRequest(adminListGenericSchema),
  asyncHandler(adminController.listMt5Accounts),
);

// Transactions
adminRoutes.get(
  "/transactions",
  validateRequest(adminListGenericSchema),
  asyncHandler(adminController.listTransactions),
);
adminRoutes.patch(
  "/transactions/:transactionId/status",
  validateRequest(adminUpdateTransactionStatusSchema),
  asyncHandler(adminController.updateTransactionStatus),
);

export { adminRoutes };
