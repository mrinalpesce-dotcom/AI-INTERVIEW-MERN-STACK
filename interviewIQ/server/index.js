// IMPORTANT: dotenv must be the very first import in ESM so env vars are
// available before any other module (like payment.controller) is evaluated.
import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDb from "./config/connectDb.js";
import authrouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import interviewRouter from "./routes/interview.route.js";
import paymentRouter from "./routes/payment.route.js";
import adminAuthRouter from "./routes/admin.auth.route.js";
import adminRouter from "./routes/admin.route.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = [
        "https://ai-interview-mern-stack-client.onrender.com",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        process.env.CLIENT_URL,
      ].filter(Boolean);

      if (allowed.includes(origin)) return callback(null, true);
      if (
        origin.endsWith(".onrender.com") ||
        origin.endsWith(".vercel.app") ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);


app.use(express.json());
app.use(cookieParser());

// Application routes
app.use("/api/auth", authrouter);
app.use("/api/user", userRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/payment", paymentRouter);

// Secure Admin routes
app.use("/api/admin/auth", adminAuthRouter);
app.use("/api/admin", adminRouter);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
  connectDb();
});
