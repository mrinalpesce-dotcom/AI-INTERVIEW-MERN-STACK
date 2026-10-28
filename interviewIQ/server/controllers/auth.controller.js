import genToken from "../config/token.js";
import User from "../models/user.model.js";
import { recordActivity } from "../services/activity.service.js";
import jwt from "jsonwebtoken";

export const googleAuth = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    let isNewUser = false;
    let existingUser = await User.findOne({ email: cleanEmail });

    if (!existingUser) {
      existingUser = await User.create({
        name,
        email: cleanEmail,
        role: "user", // Strict role enforcement: users cannot self-assign admin role
        status: "active",
        lastLogin: new Date(),
        lastActivity: new Date(),
        loginCount: 1,
      });
      isNewUser = true;

      // Record registration activity in MongoDB
      await recordActivity({
        userId: existingUser._id,
        userEmail: existingUser.email,
        userName: existingUser.name,
        activityType: "USER_REGISTER",
        description: `New customer registered via Google Authentication (${existingUser.email})`,
        metadata: { provider: "google" },
        req,
      });
    } else {
      // Check if suspended
      if (existingUser.status === "suspended") {
        return res.status(403).json({
          message: "Your account has been suspended. Please contact customer support.",
        });
      }

      existingUser.lastLogin = new Date();
      existingUser.lastActivity = new Date();
      existingUser.loginCount = (existingUser.loginCount || 0) + 1;
      await existingUser.save();
    }

    // Record login activity in MongoDB
    await recordActivity({
      userId: existingUser._id,
      userEmail: existingUser.email,
      userName: existingUser.name,
      activityType: "USER_LOGIN",
      description: `Customer logged in (${existingUser.email})`,
      metadata: { isNewUser, loginCount: existingUser.loginCount },
      req,
    });

    const token = await genToken(existingUser._id);

    // In local development, secure: false and sameSite: "lax" allow cookies across localhost ports
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ user: existingUser, token });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Google auth error ${error.message}` });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || process.env.JWTSECRET
        );
        if (decoded?.userId) {
          await recordActivity({
            userId: decoded.userId,
            activityType: "USER_LOGOUT",
            description: "Customer logged out of application",
            req,
          });
        }
      } catch (e) {
        // Ignore token verification errors during logout
      }
    }

    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    return res.status(500).json({ message: `Logout error ${error.message}` });
  }
};