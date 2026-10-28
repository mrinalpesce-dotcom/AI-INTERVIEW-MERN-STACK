import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi } from "../services/openRouter.service.js";
import Interview from "../models/interview.model.js";
import User from "../models/user.model.js";
import { recordActivity } from "../services/activity.service.js";

// Helper to safely parse JSON from AI outputs with or without markdown code blocks
const extractJson = (text) => {
  if (!text) return null;
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-z]*\s*/i, "").replace(/```$/, "").trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.substring(start, end + 1));
    }
    throw e;
  }
};

export const analyzeResume = async (req, res) => {
  let filepath = req.file?.path;
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a resume PDF." });
    }

    const fileBuffer = await fs.promises.readFile(filepath);
    const uint8Array = new Uint8Array(fileBuffer);

    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    let resumeText = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      resumeText += pageText + "\n";
    }

    resumeText = resumeText.replace(/\s+/g, " ").trim();

    const messages = [
      {
        role: "system",
        content: `You are an expert HR and Technical recruiter.
Extract structured professional details from this resume.
Return strictly valid JSON:
{
  "role": "Suggested job title / target role",
  "experience": "Estimated total experience (e.g. 1-3 years)",
  "projects": ["Project Name 1", "Project Name 2"],
  "skills": ["Skill 1", "Skill 2", "Skill 3"]
}`
      },
      {
        role: "user",
        content: resumeText.slice(0, 15000)
      }
    ];

    const aiResponse = await askAi(messages);
    const parsed = extractJson(aiResponse) || {};

    if (filepath && fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    return res.status(200).json({
      success: true,
      role: parsed.role || "",
      experience: parsed.experience || "",
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      resumeText: resumeText.slice(0, 8000)
    });
  } catch (error) {
    if (filepath && fs.existsSync(filepath)) {
      try {
        fs.unlinkSync(filepath);
      } catch (err) {
        // ignore unlink error
      }
    }
    console.error("Resume analysis error:", error);
    return res.status(500).json({ message: error.message || "Failed to analyze resume" });
  }
};

export const generateQuestions = async (req, res) => {
  try {
    let { role, experience, mode, resumeText, projects, skills } = req.body;
    role = role?.trim();
    experience = experience?.trim();
    mode = mode?.trim() || "Technical";

    if (!role || !experience || !mode) {
      return res.status(400).json({ message: "Role, experience, and mode are required." });
    }

    const userId = req.userId || req.user?.id || req.user?._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // if (user.credits < 50) {
    //   return res.status(400).json({
    //     message: "You don't have enough credits (need 50 credits) to start this interview."
    //   });
    // }

    const projectText = Array.isArray(projects) && projects.length ? projects.join(", ") : "None specified";
    const skillsText = Array.isArray(skills) && skills.length ? skills.join(", ") : (skills || "None specified");
    const safeResume = resumeText?.trim() || "None provided";

    const systemPrompt = `You are a Senior Technical Interviewer conducting a realistic mock interview.
Target Role: ${role}
Experience Level: ${experience}
Interview Mode: ${mode}
Projects: ${projectText}
Skills: ${skillsText}
Resume Context: ${safeResume.slice(0, 2000)}

Generate exactly 6-8 comprehensive, realistic interview questions.
For each question provide:
- id: "q1", "q2", etc.
- question: the question text
- difficulty: "Easy", "Medium", or "Hard"
- timeLimit: recommended time in seconds (e.g. 45 to 120)

Return strictly a valid JSON object with the key "questions":
{
  "questions": [
    {
      "id": "q1",
      "question": "question text",
      "difficulty": "Easy",
      "timeLimit": 60
    }
  ]
}`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Please generate the interview questions for ${role} with ${experience} experience.` }
    ];

    const aiResponse = await askAi(messages);
    const parsed = extractJson(aiResponse);

    if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error("Invalid AI response: questions array not found");
    }

    const validQuestions = parsed.questions.map((q, index) => {
      const difficulty = q.difficulty || q.diffiuclty || "Medium";
      let timeLimit = parseInt(q.timeLimit, 10);
      if (!timeLimit || isNaN(timeLimit) || timeLimit < 15 || timeLimit > 300) {
        const dLower = String(difficulty).toLowerCase();
        timeLimit = dLower === "easy" ? 45 : dLower === "hard" ? 90 : 60;
      }
      return {
        id: q.id || `q${index + 1}`,
        question: q.question,
        difficulty,
        timeLimit,
        score: 0,
        answer: "",
        feedback: ""
      };
    });

    // user.credits -= 50;
    // await user.save();

    const interview = await Interview.create({
      userId: user._id,
      role,
      experience,
      mode,
      resumeText: safeResume,
      questions: validQuestions,
      status: "Incomplete"
    });

    // Record interview creation activity in MongoDB
    await recordActivity({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      activityType: "INTERVIEW_CREATED",
      description: `Started new ${mode} interview session for ${role} (${experience})`,
      resourceId: interview._id,
      metadata: { role, mode, experience, totalQuestions: validQuestions.length },
      req,
    });

    return res.status(201).json({
      success: true,
      message: "Interview generated successfully",
      interviewId: interview._id,
      interview,
      creditsLeft: user.credits,
      userName: user.name,
      questions: interview.questions
    });
  } catch (error) {
    console.error("Error generating interview questions:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const { interviewId, questionIndex, questionId, answer, timeTaken } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    let question;
    if (questionIndex !== undefined && interview.questions[questionIndex]) {
      question = interview.questions[questionIndex];
    } else if (questionId) {
      question = interview.questions.find((q) => q._id?.toString() === questionId || q.id === questionId);
    }

    if (!question) {
      return res.status(404).json({ message: "Question not found in interview" });
    }

    if (!answer || !answer.trim()) {
      question.score = 0;
      question.feedback = "You did not submit an answer.";
      question.answer = "";
      await interview.save();
      return res.json({
        success: true,
        feedback: question.feedback,
        score: 0
      });
    }

    const messages = [
      {
        role: "system",
        content: `You are a professional human interviewer evaluating a candidate's response for the role of ${interview.role}.
Evaluate the candidate's answer based on:
1. Confidence: Does the answer sound clear, confident, and well-structured? (0 to 10)
2. Completeness: Did the user address all parts of the question? (0 to 10)
3. Correctness: Is the answer accurate, relevant, and technically sound? (0 to 10)
4. Communication: Is the language professional and easy to understand? (0 to 10)

Feedback Rules:
- Write constructive feedback in 30-50 words.
- Highlight strengths and areas to improve.
- No emojis.
- Calculate finalScore as an integer average of the 4 criteria (0 to 10).

Return strictly valid JSON:
{
  "confidence": 8,
  "completeness": 7,
  "correctness": 8,
  "communication": 8,
  "finalScore": 8,
  "feedback": "string"
}`
      },
      {
        role: "user",
        content: `Question: "${question.question}"\nAnswer: "${answer}"`
      }
    ];

    const aiResponse = await askAi(messages);
    const parsed = extractJson(aiResponse) || {};

    question.answer = answer;
    question.confidence = Number(parsed.confidence) || 0;
    question.correctness = Number(parsed.correctness) || 0;
    question.communication = Number(parsed.communication) || 0;
    question.relevance = Number(parsed.completeness) || 0;
    question.score = Number(parsed.finalScore) || 0;
    question.feedback = parsed.feedback || "Answer evaluated.";

    await interview.save();

    return res.status(200).json({
      success: true,
      feedback: question.feedback,
      score: question.score,
      question
    });
  } catch (error) {
    console.error("Error submitting answer:", error);
    return res.status(500).json({
      message: `Failed to submit answer: ${error.message}`
    });
  }
};

export const finishInterview = async (req, res) => {
  try {
    const { interviewId } = req.body;
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    const totalQuestions = interview.questions.length || 1;
    let totalScore = 0;
    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;

    interview.questions.forEach((q) => {
      totalScore += q.score || 0;
      totalConfidence += q.confidence || 0;
      totalCommunication += q.communication || 0;
      totalCorrectness += q.correctness || 0;
    });

    const finalScore = totalScore / totalQuestions;
    const avgConfidence = totalConfidence / totalQuestions;
    const avgCommunication = totalCommunication / totalQuestions;
    const avgCorrectness = totalCorrectness / totalQuestions;

    interview.finalScore = Number(finalScore.toFixed(1));
    interview.status = "Completed";
    await interview.save();

    // Record interview completion activity in MongoDB
    await recordActivity({
      userId: interview.userId,
      activityType: "INTERVIEW_COMPLETED",
      description: `Completed ${interview.mode} interview for ${interview.role} with score ${interview.finalScore}/10`,
      resourceId: interview._id,
      metadata: {
        role: interview.role,
        mode: interview.mode,
        finalScore: interview.finalScore,
        confidence: Number(avgConfidence.toFixed(1)),
        communication: Number(avgCommunication.toFixed(1)),
      },
      req,
    });

    return res.status(200).json({
      success: true,
      finalScore: Number(finalScore.toFixed(1)),
      confidence: Number(avgConfidence.toFixed(1)),
      communication: Number(avgCommunication.toFixed(1)),
      correctness: Number(avgCorrectness.toFixed(1)),
      questionwiseScore: interview.questions.map((q) => ({
        question: q.question,
        score: q.score || 0,
        feedback: q.feedback || "",
        confidence: q.confidence || 0,
        communication: q.communication || 0,
        correctness: q.correctness || 0,
        relevance: q.relevance || 0
      }))
    });
  } catch (error) {
    console.error("Error finishing interview:", error);
    return res.status(500).json({
      message: `Failed to finish interview: ${error.message}`
    });
  }
};

export const getInterviews = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id || req.user?._id;
    const interviews = await Interview.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, interviews });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getInterviewById = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id || req.user?._id;
    const interview = await Interview.findOne({ _id: req.params.id, userId });
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }
    return res.status(200).json({ success: true, interview });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteInterview = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id || req.user?._id;
    const deleted = await Interview.findOneAndDelete({ _id: req.params.id, userId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Interview not found or unauthorized" });
    }
    return res.status(200).json({ success: true, message: "Interview deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

