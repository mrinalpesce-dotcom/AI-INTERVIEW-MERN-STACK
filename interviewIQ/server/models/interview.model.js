import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    id: { type: String },
    question: { type: String, required: true },
    difficulty: { type: String, default: "Medium" },
    timeLimit: { type: Number, default: 60 },
    answer: { type: String, default: "" },
    feedback: { type: String, default: "" },
    score: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    correctness: { type: Number, default: 0 },
    relevance: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: {
      type: String,
      required: true
    },
    experience: {
      type: String,
      required: true
    },
    mode: {
      type: String,
      enum: ["HR", "Technical"],
      required: true
    },
    resumeText: {
      type: String,
      default: ""
    },
    questions: [questionSchema],
    finalScore: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["Incomplete", "Completed"],
      default: "Incomplete"
    }
  },
  { timestamps: true }
);

const Interview = mongoose.model("Interview", interviewSchema);
export default Interview;