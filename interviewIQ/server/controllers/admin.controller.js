import User from "../models/user.model.js";
import Activity from "../models/activity.model.js";
import Interview from "../models/interview.model.js";
import AuditLog from "../models/auditLog.model.js";
import { recordAuditLog, recordActivity } from "../services/activity.service.js";

/**
 * GET /api/admin/dashboard
 * Summary KPIs, overview metrics, activity trends, and recent records.
 */
export const getDashboardOverview = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel aggregate count queries for maximum performance
    const [
      totalCustomers,
      newCustomersToday,
      newCustomersThisWeek,
      activeUsersToday,
      totalActivities,
      totalInterviews,
      completedInterviews,
      recentCustomers,
      recentActivities,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "user", createdAt: { $gte: startOfToday } }),
      User.countDocuments({ role: "user", createdAt: { $gte: startOfWeek } }),
      User.countDocuments({ role: "user", lastActivity: { $gte: startOfToday } }),
      Activity.countDocuments(),
      Interview.countDocuments(),
      Interview.countDocuments({ status: "Completed" }),
      User.find({ role: "user" })
        .select("name email credits status createdAt lastLogin lastActivity activityCount")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Activity.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

    // 14-day activity trend using aggregation
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const activityTrend = await Activity.aggregate([
      { $match: { createdAt: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 14-day registration trend
    const registrationTrend = await User.aggregate([
      { $match: { role: "user", createdAt: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Activity distribution by type
    const activityDistribution = await Activity.aggregate([
      {
        $group: {
          _id: "$activityType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    return res.status(200).json({
      success: true,
      metrics: {
        totalCustomers,
        newCustomersToday,
        newCustomersThisWeek,
        activeUsersToday,
        totalActivities,
        totalInterviews,
        completedInterviews,
        completionRate:
          totalInterviews > 0
            ? Math.round((completedInterviews / totalInterviews) * 100)
            : 0,
      },
      recentCustomers,
      recentActivities,
      charts: {
        activityTrend,
        registrationTrend,
        activityDistribution,
      },
    });
  } catch (error) {
    console.error("[Admin Dashboard Overview Error]:", error);
    return res.status(500).json({ message: "Failed to load dashboard overview: " + error.message });
  }
};

/**
 * GET /api/admin/customers
 * Searchable, filterable, paginated list of customers.
 */
export const getCustomers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = req.query.search ? String(req.query.search).trim() : "";
    const status = req.query.status ? String(req.query.status).trim() : "all";
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const query = { role: "user" };

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("[Get Customers Error]:", error);
    return res.status(500).json({ message: "Failed to retrieve customers: " + error.message });
  }
};

/**
 * GET /api/admin/customers/:id
 * Full customer details, stats, interviews summary, and activity overview.
 */
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await User.findById(id).select("-password").lean();
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    // Customer interview stats
    const [interviewsCount, completedCount, latestInterviews, recentActivities] =
      await Promise.all([
        Interview.countDocuments({ userId: id }),
        Interview.countDocuments({ userId: id, status: "Completed" }),
        Interview.find({ userId: id })
          .select("role experience mode finalScore status createdAt")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
        Activity.find({ userId: id })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
      ]);

    // Average interview score
    const avgScoreAgg = await Interview.aggregate([
      { $match: { userId: customer._id, status: "Completed" } },
      { $group: { _id: null, avgScore: { $avg: "$finalScore" } } },
    ]);
    const averageScore = avgScoreAgg.length > 0 ? Math.round(avgScoreAgg[0].avgScore) : 0;

    return res.status(200).json({
      success: true,
      customer: {
        ...customer,
        stats: {
          totalInterviews: interviewsCount,
          completedInterviews: completedCount,
          averageScore,
        },
      },
      latestInterviews,
      recentActivities,
    });
  } catch (error) {
    console.error("[Get Customer By Id Error]:", error);
    return res.status(500).json({ message: "Failed to fetch customer: " + error.message });
  }
};

/**
 * PATCH /api/admin/customers/:id/status
 * Toggle customer account status (active vs suspended).
 */
export const updateCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value. Must be 'active' or 'suspended'." });
    }

    const customer = await User.findById(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    const oldStatus = customer.status;
    customer.status = status;
    await customer.save();

    // Record admin audit log
    await recordAuditLog({
      adminId: req.admin._id,
      adminEmail: req.admin.email,
      action: "USER_STATUS_CHANGE",
      targetId: customer._id,
      targetType: "User",
      details: {
        customerEmail: customer.email,
        oldStatus,
        newStatus: status,
        reason: reason || "Administrative update",
      },
      req,
    });

    // Record in user's activity log
    await recordActivity({
      userId: customer._id,
      userEmail: customer.email,
      userName: customer.name,
      activityType: "ACCOUNT_STATUS_CHANGED",
      description: `Account status updated from ${oldStatus} to ${status} by administrator`,
      metadata: { oldStatus, newStatus: status, reason },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Customer account has been ${status === "suspended" ? "suspended" : "activated"}.`,
      customer: {
        id: customer._id,
        status: customer.status,
      },
    });
  } catch (error) {
    console.error("[Update Customer Status Error]:", error);
    return res.status(500).json({ message: "Failed to update customer status: " + error.message });
  }
};

/**
 * PATCH /api/admin/customers/:id/credits
 * Add or deduct customer credits with an audit trail.
 */
export const adjustCustomerCredits = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const delta = parseInt(amount, 10);
    if (isNaN(delta) || delta === 0) {
      return res.status(400).json({ message: "Valid non-zero integer credit amount is required." });
    }

    const customer = await User.findById(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    const oldCredits = customer.credits || 0;
    const newCredits = Math.max(0, oldCredits + delta);
    customer.credits = newCredits;
    await customer.save();

    // Record Audit Log
    await recordAuditLog({
      adminId: req.admin._id,
      adminEmail: req.admin.email,
      action: "CREDITS_ADJUSTED",
      targetId: customer._id,
      targetType: "User",
      details: {
        customerEmail: customer.email,
        previousCredits: oldCredits,
        adjustedBy: delta,
        newCredits,
        reason: reason || "Manual adjustment by administrator",
      },
      req,
    });

    // Record Customer Activity
    await recordActivity({
      userId: customer._id,
      userEmail: customer.email,
      userName: customer.name,
      activityType: "CREDITS_ADJUSTED",
      description: `Credits ${delta > 0 ? "added" : "deducted"}: ${delta > 0 ? "+" + delta : delta} credits (Balance: ${newCredits})`,
      metadata: { oldCredits, delta, newCredits, reason },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Credits successfully updated. New balance: ${newCredits}`,
      credits: newCredits,
    });
  } catch (error) {
    console.error("[Adjust Customer Credits Error]:", error);
    return res.status(500).json({ message: "Failed to adjust credits: " + error.message });
  }
};

/**
 * GET /api/admin/customers/:id/activities
 * Chronological activity timeline for a specific customer.
 */
export const getCustomerActivities = async (req, res) => {
  try {
    const { id } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const activityType = req.query.type ? String(req.query.type).trim() : "";
    const search = req.query.search ? String(req.query.search).trim() : "";
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    const query = { userId: id };

    if (activityType && activityType !== "all") {
      query.activityType = activityType;
    }

    if (search) {
      query.description = { $regex: search, $options: "i" };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      Activity.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Activity.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      activities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("[Get Customer Activities Error]:", error);
    return res.status(500).json({ message: "Failed to fetch activities: " + error.message });
  }
};

/**
 * GET /api/admin/activities
 * Global searchable, filterable activity stream across all customers.
 */
export const getGlobalActivities = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const activityType = req.query.type ? String(req.query.type).trim() : "";
    const search = req.query.search ? String(req.query.search).trim() : "";
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    const query = {};

    if (activityType && activityType !== "all") {
      query.activityType = activityType;
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      Activity.find(query)
        .populate("userId", "name email status credits")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Activity.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      activities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("[Get Global Activities Error]:", error);
    return res.status(500).json({ message: "Failed to retrieve activity stream: " + error.message });
  }
};

/**
 * GET /api/admin/analytics
 * Detailed analytics metrics, historical distributions, and engagement trends.
 */
export const getAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      registrationsOverTime,
      activitiesOverTime,
      activitiesByType,
      interviewsByRole,
      interviewsByMode,
      dailyActiveUsers,
    ] = await Promise.all([
      // New user registrations grouped by day
      User.aggregate([
        { $match: { role: "user", createdAt: { $gte: sinceDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            registrations: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Total activities grouped by day
      Activity.aggregate([
        { $match: { createdAt: { $gte: sinceDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            activities: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Activity distribution by type
      Activity.aggregate([
        { $match: { createdAt: { $gte: sinceDate } } },
        {
          $group: {
            _id: "$activityType",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // Interviews by role
      Interview.aggregate([
        { $match: { createdAt: { $gte: sinceDate } } },
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),

      // Interviews by mode (HR vs Technical)
      Interview.aggregate([
        { $match: { createdAt: { $gte: sinceDate } } },
        {
          $group: {
            _id: "$mode",
            count: { $sum: 1 },
          },
        },
      ]),

      // Unique active users per day
      Activity.aggregate([
        { $match: { createdAt: { $gte: sinceDate } } },
        {
          $group: {
            _id: {
              day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              userId: "$userId",
            },
          },
        },
        {
          $group: {
            _id: "$_id.day",
            dau: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      timeframeDays: days,
      registrationsOverTime,
      activitiesOverTime,
      activitiesByType,
      interviewsByRole,
      interviewsByMode,
      dailyActiveUsers,
    });
  } catch (error) {
    console.error("[Get Analytics Error]:", error);
    return res.status(500).json({ message: "Failed to load analytics: " + error.message });
  }
};

/**
 * GET /api/admin/audit-logs
 * Audit trail of all administrative actions.
 */
export const getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const search = req.query.search ? String(req.query.search).trim() : "";
    const action = req.query.action ? String(req.query.action).trim() : "";

    const query = {};
    if (action && action !== "all") {
      query.action = action;
    }
    if (search) {
      query.$or = [
        { adminEmail: { $regex: search, $options: "i" } },
        { action: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate("adminId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("[Get Audit Logs Error]:", error);
    return res.status(500).json({ message: "Failed to fetch audit logs: " + error.message });
  }
};
