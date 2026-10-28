import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";
import {
  analyzeResume,
  generateQuestions,
  submitAnswer,
  finishInterview,
  getInterviews,
  getInterviewById,
  deleteInterview
} from "../controllers/interview.controller.js";

const interviewRouter = express.Router();

interviewRouter.post("/analyze-resume", isAuth, upload.single("resume"), analyzeResume);
interviewRouter.post("/generate-questions", isAuth, generateQuestions);
interviewRouter.post("/submit-answer", isAuth, submitAnswer);
interviewRouter.post("/finish", isAuth, finishInterview);
interviewRouter.get("/", isAuth, getInterviews);
interviewRouter.get("/:id", isAuth, getInterviewById);
interviewRouter.delete("/:id", isAuth, deleteInterview);

export default interviewRouter;