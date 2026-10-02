import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import MockTest from "../models/MockTest.js";
import Question from "../models/Question.js";
import TestAttempt from "../models/TestAttempt.js";
import { ok, created, badRequest, notFound } from "../utils/responses.js";
import { scoreObjective } from "../utils/scoring.js";

/**
 * GET /api/mock-tests
 * Public listing — only published tests visible to students.
 */
export const listMockTests = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === "admin";
  const filter = isAdmin ? {} : { isPublished: true };

  const items = await MockTest.find(filter)
    .sort({ featured: -1, createdAt: -1 })
    .populate("questions", "title type skill difficulty points timeLimit");

  return ok(res, {
    count: items.length,
    items: items.map((m) => ({
      ...m.toObject(),
      // Students never see the correct answer on the mock-test shell.
      questions: (m.questions || []).map((q) => ({
        ...q.toObject(),
        correctAnswer: undefined,
      })),
    })),
  });
});

/**
 * GET /api/mock-tests/:id
 */
export const getMockTest = asyncHandler(async (req, res) => {
  const m = await MockTest.findById(req.params.id).populate("questions");
  if (!m) return notFound(res, "Mock test not found");
  if (!m.isPublished && req.user?.role !== "admin") {
    return notFound(res, "Mock test not found");
  }

  const isAdmin = req.user?.role === "admin";
  const obj = m.toObject();
  if (!isAdmin) {
    obj.questions = (obj.questions || []).map((q) => ({
      ...q,
      correctAnswer: undefined,
    }));
  }
  return ok(res, obj);
});

/**
 * POST /api/mock-tests (admin)
 * Body: { title, description, duration, sections, difficulty, questionIds, featured }
 */
export const createMockTest = asyncHandler(async (req, res) => {
  const b = req.body || {};
  if (!b.title || !b.duration) {
    return badRequest(res, "title and duration are required");
  }
  if (!Array.isArray(b.questionIds) || b.questionIds.length === 0) {
    return badRequest(res, "questionIds must be a non-empty array");
  }

  // Validate that the referenced question IDs all exist.
  const count = await Question.countDocuments({ _id: { $in: b.questionIds } });
  if (count !== b.questionIds.length) {
    return badRequest(res, "One or more questionIds are invalid");
  }

  const mockTest = await MockTest.create({
    title: b.title,
    description: b.description || "",
    duration: Number(b.duration),
    sections: Array.isArray(b.sections) ? b.sections : undefined,
    difficulty: b.difficulty || "Medium",
    questions: b.questionIds,
    isPublished: b.isPublished !== false,
    featured: Boolean(b.featured),
    createdBy: req.user._id,
  });

  return created(res, mockTest, "Mock test created");
});

/**
 * PUT /api/mock-tests/:id (admin)
 */
export const updateMockTest = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const updates = {};
  ["title", "description", "duration", "sections", "difficulty"].forEach((k) => {
    if (b[k] !== undefined) updates[k] = b[k];
  });
  if (b.questionIds !== undefined) updates.questions = b.questionIds;
  if (b.isPublished !== undefined) updates.isPublished = Boolean(b.isPublished);
  if (b.featured !== undefined) updates.featured = Boolean(b.featured);

  const m = await MockTest.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!m) return notFound(res, "Mock test not found");
  return ok(res, m, "Mock test updated");
});

/**
 * DELETE /api/mock-tests/:id (admin)
 */
export const deleteMockTest = asyncHandler(async (req, res) => {
  const m = await MockTest.findByIdAndDelete(req.params.id);
  if (!m) return notFound(res, "Mock test not found");
  return ok(res, {}, "Mock test deleted");
});

/**
 * POST /api/mock-tests/:id/submit
 * Body: { answers: [{ questionId, answer }], durationSec? }
 */
export const submitMockTest = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return badRequest(res, "Invalid mock test id");
  }
  const m = await MockTest.findById(id).populate("questions");
  if (!m || !m.isPublished) return notFound(res, "Mock test not found");

  const { answers = [], durationSec = 0 } = req.body || {};
  const byId = new Map((m.questions || []).map((q) => [String(q._id), q]));

  let totalScore = 0;
  let correct = 0;
  let incorrect = 0;
  const evaluated = [];

  for (const a of answers) {
    const q = byId.get(String(a.questionId));
    if (!q) continue;
    const r = scoreObjective(q, a.answer);
    if (r.correct) correct += 1;
    else if (r.attempted) incorrect += 1;
    totalScore += r.score;
    evaluated.push({
      questionId: q._id,
      answer: a.answer ?? null,
      correct: r.correct,
      score: r.score,
    });
  }

  const total = evaluated.length;
  const score = total ? Math.round((totalScore / total) * 90) : 0;

  const attempt = await TestAttempt.create({
    user: req.user._id,
    mockTest: m._id,
    skill: "mock",
    questionIds: evaluated.map((a) => a.questionId),
    answers: evaluated,
    score,
    totalScore,
    totalQuestions: total,
    correctAnswers: correct,
    incorrectAnswers: incorrect,
    durationSec: Number(durationSec) || 0,
    isMockTest: true,
    status: "completed",
    note: "Unofficial mock-test score. Not an official PTE Academic result.",
  });

  // Increment attempts counter (cheap averaging for the public listing).
  await MockTest.findByIdAndUpdate(m._id, {
    $inc: { attempts: 1 },
    $set: {
      avgScore: Math.round(
        (m.avgScore * (m.attempts || 0) + score) / (m.attempts + 1)
      ),
    },
  });

  return created(
    res,
    {
      attemptId: attempt._id,
      mockTestId: m._id,
      score,
      totalQuestions: total,
      correct,
      incorrect,
      perQuestion: evaluated,
    },
    "Mock test submitted"
  );
});
