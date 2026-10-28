import express from "express";
import {
  loginAdmin,
  logoutAdmin,
  getAdminMe,
} from "../controllers/admin.auth.controller.js";
import isAdmin from "../middlewares/isAdmin.js";

const adminAuthRouter = express.Router();

adminAuthRouter.post("/login", loginAdmin);
adminAuthRouter.post("/logout", isAdmin, logoutAdmin);
adminAuthRouter.get("/me", isAdmin, getAdminMe);

export default adminAuthRouter;
