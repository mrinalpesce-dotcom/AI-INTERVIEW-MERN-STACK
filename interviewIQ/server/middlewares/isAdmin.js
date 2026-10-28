import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const isAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    // Prioritize admin-specific token cookie, fallback to standard token cookie or bearer
    const token =
      req.cookies?.admin_token ||
      bearerToken ||
      req.cookies?.token ||
      req.headers?.["x-admin-token"];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized: Admin authentication token required.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || process.env.JWTSECRET
    );

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        message: "Unauthorized: Invalid or expired admin token.",
      });
    }

    const user = await User.findById(decoded.userId).select(
      "name email role status createdAt lastLogin"
    );

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized: Admin account not found.",
      });
    }

    // Role-based access control check on the server
    if (user.role !== "admin") {
      return res.status(403).json({
        message:
          "Access denied: You do not have administrator permissions to access this resource.",
      });
    }

    if (user.status === "suspended") {
      return res.status(403).json({
        message: "Access denied: This administrator account is suspended.",
      });
    }

    req.admin = user;
    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Admin authentication failed: " + error.message,
    });
  }
};

export default isAdmin;
