import React, { useState } from "react"
import { motion } from "framer-motion"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { setUserData } from "../../redux/user.Slice"
import { serverUrl } from "../../App"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import AuthModel from "../components/AuthModel"
import {
  BsCheckCircleFill,
  BsRocket,
  BsLightningChargeFill,
  BsCoin,
  BsShieldFillCheck,
  BsStarFill,
  BsGem,
} from "react-icons/bs"
import { HiSparkles } from "react-icons/hi"

const PLANS = [
  {
    id: "basic",
    icon: <BsCoin size={28} />,
    label: "Basic",
    price: 99,
    credits: 100,
    gradient: "from-slate-700 to-slate-900",
    accent: "#94a3b8",
    border: "border-slate-200",
    btnClass: "bg-gray-900 hover:bg-gray-700 text-white",
    shadow: "",
    badge: null,
    tagline: "Just getting started",
    features: [
      "100 AI Interview Credits",
      "10 Full Mock Interviews",
      "PDF Report Download",
      "Voice Feedback Analysis",
      "Standard Support",
    ],
  },
  {
    id: "pro",
    icon: <BsLightningChargeFill size={28} />,
    label: "Pro",
    price: 249,
    credits: 300,
    gradient: "from-green-500 to-emerald-700",
    accent: "#22c55e",
    border: "border-green-400",
    btnClass: "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200",
    shadow: "shadow-green-100",
    badge: "Most Popular",
    tagline: "For serious candidates",
    features: [
      "300 AI Interview Credits",
      "30 Full Mock Interviews",
      "PDF Report Download",
      "Voice & Speech Analytics",
      "Resume-Tailored Questions",
      "Priority Support",
      "History & Progress Tracking",
    ],
  },
  {
    id: "elite",
    icon: <BsGem size={28} />,
    label: "Elite",
    price: 499,
    credits: 700,
    gradient: "from-violet-600 to-purple-900",
    accent: "#a78bfa",
    border: "border-violet-400",
    btnClass: "bg-gradient-to-r from-violet-600 to-purple-700 hover:opacity-90 text-white shadow-lg shadow-violet-200",
    shadow: "shadow-violet-100",
    badge: "Best Value",
    tagline: "For interview champions",
    features: [
      "700 AI Interview Credits",
      "70 Full Mock Interviews",
      "PDF Report Download",
      "Advanced Voice Analytics",
      "Resume-Tailored Questions",
      "All Interview Types",
      "Priority Support",
      "History & Progress Tracking",
      "Unlimited Practice Timer",
    ],
  },
]

const FAQ = [
  {
    q: "What is a credit?",
    a: "One credit = one AI question-answer exchange. A full mock interview (10 questions) uses roughly 10 credits.",
  },
  {
    q: "Do credits expire?",
    a: "No! Your purchased credits never expire and roll over indefinitely.",
  },
  {
    q: "Is this a real payment?",
    a: "Payments use Razorpay test mode. Use test card 4111 1111 1111 1111, any future expiry, CVV 123, OTP 1234.",
  },
  {
    q: "Can I upgrade later?",
    a: "Yes. Buy any plan anytime and credits are added on top of your existing balance.",
  },
]

function Pricing() {
  const { userData } = useSelector((state) => state.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [showAuth, setShowAuth] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true)
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })

  const handleBuy = async (plan) => {
    if (!userData) { setShowAuth(true); return }
    setLoadingPlan(plan.id)
    try {
      const ok = await loadRazorpay()
      if (!ok) { alert("Razorpay SDK failed to load. Check your internet."); setLoadingPlan(null); return }

      const { data } = await axios.post(`${serverUrl}/api/payment/create-order`, { planId: plan.id })

      const options = {
        key: data.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "InterviewIQ.AI",
        description: `${plan.label} Plan - ${plan.credits} Credits`,
        order_id: data.orderId,
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(`${serverUrl}/api/payment/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan.id,
            })
            if (verifyRes.data.success) {
              dispatch(setUserData({
                ...userData,
                credits: verifyRes.data.credits,
                user: userData?.user ? { ...userData.user, credits: verifyRes.data.credits } : undefined,
              }))
              alert("Payment successful! " + plan.credits + " credits added.")
              navigate("/home")
            }
          } catch { alert("Verification failed. Contact support.") }
        },
        prefill: {
          name: userData?.name || userData?.user?.name || "",
          email: userData?.email || userData?.user?.email || "",
        },
        theme: { color: "#16a34a" },
        modal: { ondismiss: () => setLoadingPlan(null) },
      }

      const rzp = new window.Razorpay(options)
      rzp.on("payment.failed", () => { alert("Payment failed. Try again."); setLoadingPlan(null) })
      rzp.open()
    } catch (err) {
      console.error(err)
      alert("Something went wrong. Try again.")
      setLoadingPlan(null)
    }
  }

  const userCredits = (userData?.credits ?? userData?.user?.credits) || 0

  return (
    <div style={{ minHeight: "100vh", background: "#f3f3f3", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Hero Section */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "80px 16px 48px" }}>
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            background: "#dcfce7",
            color: "#16a34a",
            fontSize: "14px",
            padding: "8px 20px",
            borderRadius: "999px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "24px",
            fontWeight: 600,
          }}
        >
          <HiSparkles size={16} />
          Simple, transparent pricing
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 800,
            lineHeight: 1.15,
            maxWidth: "760px",
            color: "#111827",
            marginBottom: "16px",
            margin: "0 auto 16px",
          }}
        >
          Invest in your{" "}
          <span style={{ position: "relative", display: "inline-block", color: "#16a34a" }}>
            dream career
            <span style={{
              position: "absolute", inset: 0,
              background: "#dcfce7", borderRadius: "999px",
              transform: "translate(4px, 12px)", zIndex: -1,
            }} />
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{ color: "#6b7280", fontSize: "1.05rem", maxWidth: "520px", margin: "16px auto 0" }}
        >
          Buy credits once, use them anytime. No subscriptions. No hidden fees.
        </motion.p>

        {userData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              marginTop: "24px",
              background: "#fff",
              border: "1px solid #bbf7d0",
              borderRadius: "999px",
              padding: "8px 20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#15803d",
              boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
            }}
          >
            <BsCoin size={16} />
            You have <strong>{userCredits}</strong> credits remaining
          </motion.div>
        )}
      </div>

      {/* Plan Cards */}
      <div style={{ maxWidth: "1152px", margin: "0 auto", width: "100%", padding: "0 16px 80px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
          alignItems: "stretch",
        }}>
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              style={{
                position: "relative",
                background: "#fff",
                borderRadius: "24px",
                border: `2px solid ${plan.id === "pro" ? "#4ade80" : plan.id === "elite" ? "#a78bfa" : "#e2e8f0"}`,
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                transition: "box-shadow 0.3s",
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "4px 12px",
                  borderRadius: "999px",
                  color: "#fff",
                  background: plan.id === "pro" ? "#16a34a" : "#7c3aed",
                }}>
                  {plan.badge}
                </div>
              )}

              {/* Gradient Header */}
              <div style={{
                background: `linear-gradient(135deg, ${plan.id === "basic" ? "#334155, #0f172a" : plan.id === "pro" ? "#22c55e, #047857" : "#7c3aed, #4c1d95"})`,
                padding: "28px",
                color: "#fff",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div style={{
                    background: "rgba(255,255,255,0.2)",
                    padding: "10px",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                  }}>
                    {plan.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.75 }}>
                      {plan.tagline}
                    </p>
                    <h2 style={{ fontSize: "24px", fontWeight: 800 }}>{plan.label}</h2>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "52px", fontWeight: 900, lineHeight: 1 }}>&#8377;{plan.price}</span>
                  <span style={{ opacity: 0.65, fontSize: "14px", marginBottom: "8px" }}>one-time</span>
                </div>

                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: "999px",
                  padding: "6px 16px",
                  marginTop: "8px",
                }}>
                  <BsCoin size={14} />
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>{plan.credits} Credits</span>
                </div>
              </div>

              {/* Features */}
              <div style={{ flex: 1, padding: "28px" }}>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#374151" }}>
                      <BsCheckCircleFill size={16} style={{ color: plan.accent, flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <div style={{ padding: "0 28px 28px" }}>
                <motion.button
                  id={`buy-${plan.id}`}
                  onClick={() => handleBuy(plan)}
                  disabled={loadingPlan === plan.id}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "16px",
                    fontWeight: 700,
                    fontSize: "14px",
                    border: "none",
                    cursor: loadingPlan === plan.id ? "not-allowed" : "pointer",
                    opacity: loadingPlan === plan.id ? 0.7 : 1,
                    color: "#fff",
                    background: plan.id === "pro"
                      ? "#16a34a"
                      : plan.id === "elite"
                      ? "linear-gradient(135deg, #7c3aed, #6d28d9)"
                      : "#111827",
                    boxShadow: plan.id === "pro"
                      ? "0 4px 20px rgba(22,163,74,0.3)"
                      : plan.id === "elite"
                      ? "0 4px 20px rgba(124,58,237,0.3)"
                      : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {loadingPlan === plan.id ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <svg style={{ animation: "spin 1s linear infinite", height: "16px", width: "16px" }} viewBox="0 0 24 24" fill="none">
                        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    `Get ${plan.credits} Credits — \u20B9${plan.price}`
                  )}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "16px",
            marginTop: "56px",
          }}
        >
          {[
            { icon: <BsShieldFillCheck size={18} style={{ color: "#16a34a" }} />, text: "Secure Razorpay Payments" },
            { icon: <BsCoin size={18} style={{ color: "#eab308" }} />, text: "Credits Never Expire" },
            { icon: <BsRocket size={18} style={{ color: "#3b82f6" }} />, text: "Instant Credit Delivery" },
            { icon: <BsStarFill size={18} style={{ color: "#a855f7" }} />, text: "4.9 Star User Rating" },
          ].map((b) => (
            <div
              key={b.text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "999px",
                padding: "10px 20px",
                fontSize: "13px",
                color: "#374151",
                boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                fontWeight: 600,
              }}
            >
              {b.icon}
              {b.text}
            </div>
          ))}
        </motion.div>

        {/* FAQ */}
        <div style={{ marginTop: "80px", maxWidth: "680px", margin: "80px auto 0" }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ fontSize: "2rem", fontWeight: 800, textAlign: "center", marginBottom: "40px", color: "#111827" }}
          >
            Frequently Asked Questions
          </motion.h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {FAQ.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                }}
              >
                <button
                  id={`faq-${i}`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "20px 24px",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#1f2937",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {item.q}
                  <span style={{
                    color: "#16a34a",
                    fontSize: "20px",
                    fontWeight: 800,
                    transition: "transform 0.2s",
                    transform: openFaq === i ? "rotate(45deg)" : "none",
                    display: "inline-block",
                  }}>+</span>
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ padding: "0 24px 20px", fontSize: "14px", color: "#6b7280", lineHeight: 1.7 }}
                  >
                    {item.a}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Footer />
      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
    </div>
  )
}

export default Pricing