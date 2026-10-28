import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const isAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
    const token =
      req.cookies?.token || bearerToken || req.headers?.["x-access-token"];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided. Please log in." });
    }

    const verifytoken = jwt.verify(
      token,
      process.env.JWT_SECRET || process.env.JWTSECRET
    );
    if (!verifytoken) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    // Verify user exists and is active
    const user = await User.findById(verifytoken.userId).select(
      "name email role status credits"
    );
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    if (user.status === "suspended") {
      return res.status(403).json({
        message: "Your account has been suspended. Please contact support.",
      });
    }

    req.userId = user._id;
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Auth error: " + err.message });
  }
};

export default isAuth;
