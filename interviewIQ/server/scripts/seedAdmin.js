import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import AuditLog from "../models/auditLog.model.js";

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URL;
    if (!mongoUri) {
      console.error("❌ MONGODB_URL not found in .env");
      process.exit(1);
    }

    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Database connected successfully.");

    // Parse command line arguments or use environment variables / secure default
    const args = process.argv.slice(2);
    let email = process.env.ADMIN_EMAIL || "admin@interviewiq.ai";
    let password = process.env.ADMIN_PASSWORD || "Admin@2026IQ";
    let name = process.env.ADMIN_NAME || "System Administrator";

    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--email" && args[i + 1]) email = args[i + 1];
      if (args[i] === "--password" && args[i + 1]) password = args[i + 1];
      if (args[i] === "--name" && args[i + 1]) name = args[i + 1];
    }

    email = email.toLowerCase().trim();

    if (password.length < 8) {
      console.error("❌ Admin password must be at least 8 characters long.");
      process.exit(1);
    }

    console.log(`🔐 Securing admin credentials for: ${email}`);
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let adminUser = await User.findOne({ email }).select("+password");

    if (adminUser) {
      console.log(`ℹ️ Existing account found for ${email}. Promoting to administrator...`);
      adminUser.role = "admin";
      adminUser.name = name || adminUser.name;
      adminUser.password = hashedPassword;
      adminUser.status = "active";
      await adminUser.save();
      console.log("✅ Admin account updated successfully.");
    } else {
      console.log(`🆕 Creating brand new administrator account for ${email}...`);
      adminUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "admin",
        status: "active",
        credits: 9999,
        lastActivity: new Date(),
      });
      console.log("✅ Admin account created successfully.");
    }

    // Record audit log
    await AuditLog.create({
      adminId: adminUser._id,
      adminEmail: adminUser.email,
      action: "ADMIN_SEED_SETUP",
      targetId: String(adminUser._id),
      targetType: "User",
      details: { email: adminUser.email, seededAt: new Date() },
    });

    console.log("\n==================================================");
    console.log("🎉 Secure Administrator Account Configured!");
    console.log(`👤 Name:     ${adminUser.name}`);
    console.log(`📧 Email:    ${adminUser.email}`);
    console.log(`🔑 Password: ${password}`);
    console.log("🛡️ Role:     admin");
    console.log("==================================================\n");

    await mongoose.disconnect();
    console.log("👋 Done.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Admin seed failed:", error);
    process.exit(1);
  }
};

seedAdmin();
