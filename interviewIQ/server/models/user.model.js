import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      select: false, // Never return password in queries by default
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
      index: true,
    },
    credits: {
      type: Number,
      default: 50,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
    activityCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Helpful index for customer search & admin listings
userSchema.index({ name: "text", email: "text" });

const User = mongoose.model("User", userSchema);
export default User;