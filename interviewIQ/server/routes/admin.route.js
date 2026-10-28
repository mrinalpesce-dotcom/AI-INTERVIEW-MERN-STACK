import express from "express";
import isAdmin from "../middlewares/isAdmin.js";
import {
  getDashboardOverview,
  getCustomers,
  getCustomerById,
  updateCustomerStatus,
  adjustCustomerCredits,
  getCustomerActivities,
  getGlobalActivities,
  getAnalytics,
  getAuditLogs,
} from "../controllers/admin.controller.js";

const adminRouter = express.Router();

// Apply role-based authentication check to ALL admin management routes
adminRouter.use(isAdmin);

adminRouter.get("/dashboard", getDashboardOverview);
adminRouter.get("/customers", getCustomers);
adminRouter.get("/customers/:id", getCustomerById);
adminRouter.patch("/customers/:id/status", updateCustomerStatus);
adminRouter.patch("/customers/:id/credits", adjustCustomerCredits);
adminRouter.get("/customers/:id/activities", getCustomerActivities);
adminRouter.get("/activities", getGlobalActivities);
adminRouter.get("/analytics", getAnalytics);
adminRouter.get("/audit-logs", getAuditLogs);

export default adminRouter;
