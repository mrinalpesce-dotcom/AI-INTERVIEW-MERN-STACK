import mongoose from "mongoose";

export const ACTIVITY_TYPES = {
  USER_REGISTER: "USER_REGISTER",
  USER_LOGIN: "USER_LOGIN",
  USER_LOGOUT: "USER_LOGOUT",
  PROFILE_UPDATED: "PROFILE_UPDATED",
  RESUME_UPLOADED: "RESUME_UPLOADED",
  INTERVIEW_CREATED: "INTERVIEW_CREATED",
  INTERVIEW_ANSWERED: "INTERVIEW_ANSWERED",
  INTERVIEW_COMPLETED: "INTERVIEW_COMPLETED",
  PAYMENT_ORDER_CREATED: "PAYMENT_ORDER_CREATED",
  PAYMENT_COMPLETED: "PAYMENT_COMPLETED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  TIMER_STARTED: "TIMER_STARTED",
  ACCOUNT_STATUS_CHANGED: "ACCOUNT_STATUS_CHANGED",
  CREDITS_ADJUSTED: "CREDITS_ADJUSTED",
};

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      default: "",
    },
    userName: {
      type: String,
      default: "",
    },
    activityType: {
      type: String,
      required: true,
      enum: Object.values(ACTIVITY_TYPES),
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    resourceId: {
      type: String,
      default: null,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// High performance compound indexes for filtering & timelines
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ activityType: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

const Activity = mongoose.model("Activity", activitySchema);
export default Activity;
