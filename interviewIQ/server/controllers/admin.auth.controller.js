import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import genToken from "../config/token.js";
import { recordActivity, recordAuditLog } from "../services/activity.service.js";

// Rate-limiting / brute-force tracker in memory
const loginAttempts = new Map();

/**
 * Admin Login
 * POST /api/admin/auth/login
 */
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    // Basic brute-force protection
    const attemptKey = `${cleanEmail}_${req.ip || "unknown"}`;
    const attempt = loginAttempts.get(attemptKey) || { count: 0, lockUntil: 0 };

    if (attempt.lockUntil > Date.now()) {
      const waitSeconds = Math.ceil((attempt.lockUntil - Date.now()) / 1000);
      return res.status(429).json({
        message: `Too many failed login attempts. Please wait ${waitSeconds} seconds before trying again.`,
      });
    }

    // Find user by email with password included
    const user = await User.findOne({ email: cleanEmail }).select("+password");

    // Generic error message to prevent user enumeration
    const invalidCredentialsMsg = "Invalid administrator credentials.";

    if (!user) {
      attempt.count += 1;
      if (attempt.count >= 5) {
        attempt.lockUntil = Date.now() + 15 * 60 * 1000; // 15 min lockout
      }
      loginAttempts.set(attemptKey, attempt);
      return res.status(401).json({ message: invalidCredentialsMsg });
    }

    // Verify role is admin
    if (user.role !== "admin") {
      attempt.count += 1;
      loginAttempts.set(attemptKey, attempt);
      return res.status(403).json({
        message: "Access denied: This account does not possess administrator privileges.",
      });
    }

    // Verify account status
    if (user.status === "suspended") {
      return res.status(403).json({
        message: "Access denied: This administrator account has been suspended.",
      });
    }

    // Compare bcrypt password
    if (!user.password) {
      return res.status(401).json({
        message:
          "Administrator password has not been configured. Run the admin setup script.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      attempt.count += 1;
      if (attempt.count >= 5) {
        attempt.lockUntil = Date.now() + 15 * 60 * 1000;
      }
      loginAttempts.set(attemptKey, attempt);
      return res.status(401).json({ message: invalidCredentialsMsg });
    }

    // Reset failed login attempts on success
    loginAttempts.delete(attemptKey);

    // Update login metrics
    user.lastLogin = new Date();
    user.lastActivity = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    // Generate JWT token
    const token = await genToken(user._id);

    // Record audit log and activity
    await recordAuditLog({
      adminId: user._id,
      adminEmail: user.email,
      action: "ADMIN_LOGIN",
      targetId: user._id,
      details: { email: user.email, timestamp: new Date() },
      req,
    });

    await recordActivity({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      activityType: "USER_LOGIN",
      description: "Admin logged into the administration console",
      metadata: { role: "admin" },
      req,
    });

    // Set secure cookie
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Admin authentication successful",
      token,
      admin: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("[Admin Login Error]:", error);
    return res.status(500).json({ message: "Internal server error during admin login" });
  }
};

/**
 * Admin Logout
 * POST /api/admin/auth/logout
 */
export const logoutAdmin = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("admin_token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    if (req.admin) {
      await recordAuditLog({
        adminId: req.admin._id,
        adminEmail: req.admin.email,
        action: "ADMIN_LOGOUT",
        targetId: req.admin._id,
        req,
      });
    }

    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error during logout: " + error.message });
  }
};

/**
 * Get Current Admin Profile
 * GET /api/admin/auth/me
 */
export const getAdminMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      admin: {
        id: req.admin._id,
        name: req.admin.name,
        email: req.admin.email,
        role: req.admin.role,
        status: req.admin.status,
        lastLogin: req.admin.lastLogin,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch admin profile" });
  }
};
