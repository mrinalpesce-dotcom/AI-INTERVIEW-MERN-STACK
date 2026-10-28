import Activity from "../models/activity.model.js";
import AuditLog from "../models/auditLog.model.js";
import User from "../models/user.model.js";

/**
 * Safely record a customer activity into MongoDB and update the customer's activity stats.
 * Runs non-blocking to prevent any disruption to user operations.
 */
export const recordActivity = async ({
  userId,
  activityType,
  description,
  resourceId = null,
  metadata = {},
  userEmail = "",
  userName = "",
  req = null,
}) => {
  try {
    if (!userId || !activityType || !description) return;

    let ipAddress = null;
    let userAgent = null;

    if (req) {
      ipAddress =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip ||
        null;
      userAgent = req.headers["user-agent"]?.substring(0, 200) || null;
    }

    // If userEmail or userName not provided, fetch user briefly or leave for populate
    let resolvedEmail = userEmail;
    let resolvedName = userName;
    if (!resolvedEmail && userId) {
      const u = await User.findById(userId).select("email name");
      if (u) {
        resolvedEmail = u.email;
        resolvedName = u.name;
      }
    }

    // Create activity record
    await Activity.create({
      userId,
      userEmail: resolvedEmail,
      userName: resolvedName,
      activityType,
      description,
      resourceId: resourceId ? String(resourceId) : null,
      metadata,
      ipAddress,
      userAgent,
    });

    // Update customer's lastActivity and activityCount
    await User.findByIdAndUpdate(userId, {
      lastActivity: new Date(),
      $inc: { activityCount: 1 },
    });
  } catch (error) {
    // Non-blocking log
    console.error("[Activity Logger Error]:", error.message);
  }
};

/**
 * Safely record an administrative action into MongoDB AuditLog.
 */
export const recordAuditLog = async ({
  adminId,
  adminEmail,
  action,
  targetId = null,
  targetType = "User",
  details = {},
  req = null,
}) => {
  try {
    let ipAddress = null;
    if (req) {
      ipAddress =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip ||
        null;
    }

    await AuditLog.create({
      adminId,
      adminEmail,
      action,
      targetId: targetId ? String(targetId) : null,
      targetType,
      details,
      ipAddress,
    });
  } catch (error) {
    console.error("[AuditLog Error]:", error.message);
  }
};
