import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../models/user.model.js";
import { recordActivity } from "../services/activity.service.js";

// Credit packages
const PLANS = {
  basic: { credits: 100, amount: 9900, label: "Basic" }, // ₹99
  pro: { credits: 300, amount: 24900, label: "Pro" }, // ₹249
  elite: { credits: 700, amount: 49900, label: "Elite" }, // ₹499
};

// Lazy getter — avoids ESM hoisting issue where env vars aren't set yet at import time
let _razorpayInstance = null;
const getRazorpay = () => {
  if (!_razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env");
    }
    _razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return _razorpayInstance;
};

// POST /api/payment/create-order
export const createOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ message: "Invalid plan" });

    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount: plan.amount, // paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { planId, credits: String(plan.credits) },
    });

    console.log(`[Payment] Order created: ${order.id} | Plan: ${plan.label} | ₹${plan.amount / 100}`);

    // Record activity in MongoDB
    await recordActivity({
      userId: req.user._id,
      activityType: "PAYMENT_ORDER_CREATED",
      description: `Initiated checkout for ${plan.label} plan (${plan.credits} credits at ₹${plan.amount / 100})`,
      resourceId: order.id,
      metadata: { planId, amount: plan.amount, credits: plan.credits },
      req,
    });

    res.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planLabel: plan.label,
      credits: plan.credits,
    });
  } catch (error) {
    console.error("[Payment] Create order error:", error.message);
    res.status(500).json({ message: "Failed to create payment order: " + error.message });
  }
};

// POST /api/payment/verify
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment fields" });
    }

    // Cryptographic HMAC-SHA256 signature verification
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      console.warn("[Payment] Signature mismatch — possible tamper attempt");
      return res.status(400).json({ message: "Payment verification failed: invalid signature" });
    }

    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ message: "Invalid planId in verify" });

    const userId = req.user._id;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { credits: plan.credits } },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    console.log(`[Payment] Verified OK — userId: ${userId} | +${plan.credits} credits | total: ${updatedUser.credits}`);

    // Record activity in MongoDB
    await recordActivity({
      userId,
      userEmail: updatedUser.email,
      userName: updatedUser.name,
      activityType: "PAYMENT_COMPLETED",
      description: `Completed payment of ₹${plan.amount / 100} for ${plan.credits} credits (${plan.label} plan)`,
      resourceId: razorpay_payment_id,
      metadata: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        planId,
        creditsAdded: plan.credits,
        newCreditBalance: updatedUser.credits,
      },
      req,
    });

    res.json({
      success: true,
      message: `Payment verified! ${plan.credits} credits added.`,
      credits: updatedUser.credits,
    });
  } catch (error) {
    console.error("[Payment] Verify error:", error.message);
    res.status(500).json({ message: "Payment verification failed" });
  }
};
