import asyncHandler from "express-async-handler";
import TestAttempt from "../models/TestAttempt.js";
import Question from "../models/Question.js";
import { ok, created, badRequest, notFound, forbidden } from "../utils/responses.js";
import {
  scoreObjective,
} from "../utils/scoring.js";

/**
 * POST /api/results
 * Body: { skill, answers: [{ questionId, answer }], mockTestId?, durationSec? }
 */
export const submitAttempt = asyncHandler(async (req, res) => {
  const { skill, answers = [], mockTestId = null, durationSec = 0 } = req.body || {};
  if (!skill || !Array.isArray(answers) || answers.length === 0) {
    return badRequest(res, "skill and a non-empty answers array are required");
  }

  // Fetch the questions in one round-trip and compute objective scores.
  const ids = answers.map((a) => a.questionId).filter(Boolean);
  const questions = await Question.find({ _id: { $in: ids } }).lean();
  const byId = new Map(questions.map((q) => [String(q._id), q]));

  const evaluatedAnswers = [];
  let correct = 0;
  let incorrect = 0;
  let totalScore = 0;

  for (const a of answers) {
    const q = byId.get(String(a.questionId));
    if (!q) continue;
    const result = scoreObjective(q, a.answer);
    if (result.correct) correct += 1;
    else if (result.attempted) incorrect += 1;
    totalScore += result.score;
    evaluatedAnswers.push({
      questionId: q._id,
      answer: a.answer ?? null,
      correct: result.correct,
      score: result.score,
      durationSec: Number(a.durationSec) || 0,
    });
  }

  const totalQuestions = evaluatedAnswers.length;
  const avgScore = totalQuestions
    ? Math.round((totalScore / totalQuestions) * 90) // scale 0..1 → 0..90
    : 0;

  const attempt = await TestAttempt.create({
    user: req.user._id,
    mockTest: mockTestId,
    skill,
    questionIds: evaluatedAnswers.map((a) => a.questionId),
    answers: evaluatedAnswers,
    score: avgScore,
    totalScore,
    totalQuestions,
    correctAnswers: correct,
    incorrectAnswers: incorrect,
    durationSec: Number(durationSec) || 0,
    isMockTest: Boolean(mockTestId),
    status: "completed",
    note: "Unofficial practice scoring. Not an official PTE Academic result.",
  });

  return created(res, attempt, "Attempt saved");
});

/**
 * POST /api/results/practice
 * Records a locally scored practice response so dashboard statistics stay current.
 */
export const recordPracticeAttempt = asyncHandler(async (req, res) => {
  const { skill, score, durationSec = 0, totalQuestions = 1 } = req.body || {};
  const numericScore = Number(score);
  const questionCount = Number(totalQuestions);

  if (!skill || !["speaking", "writing", "reading", "listening"].includes(skill)) {
    return badRequest(res, "A valid practice skill is required");
  }
  if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 90) {
    return badRequest(res, "Score must be between 0 and 90");
  }
  if (!Number.isInteger(questionCount) || questionCount < 1) {
    return badRequest(res, "totalQuestions must be at least 1");
  }

  const attempt = await TestAttempt.create({
    user: req.user._id,
    skill,
    score: Math.round(numericScore),
    totalScore: numericScore / 90,
    totalQuestions: questionCount,
    durationSec: Math.max(0, Number(durationSec) || 0),
    isMockTest: false,
    status: "completed",
    note: "Unofficial practice scoring. Not an official PTE Academic result.",
  });

  return created(res, { id: attempt._id }, "Practice attempt saved");
});

/** PATCH /api/results/:id/score */
export const updateAttemptScore = asyncHandler(async (req, res) => {
  const numericScore = Number(req.body?.score);
  if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 90) {
    return badRequest(res, "Score must be between 0 and 90");
  }

  const attempt = await TestAttempt.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { score: Math.round(numericScore), totalScore: numericScore / 90 },
    { new: true }
  );
  if (!attempt) return notFound(res, "Practice attempt not found");
  return ok(res, { id: attempt._id, score: attempt.score }, "Practice score updated");
});

/**
 * GET /api/results/my-results
 */
export const myResults = asyncHandler(async (req, res) => {
  const skill = req.query.skill;
  const filter = { user: req.user._id };
  if (skill) filter.skill = skill;

  const items = await TestAttempt.find(filter)
    .sort({ completedAt: -1 })
    .limit(100);

  return ok(res, { count: items.length, items });
});

/**
 * GET /api/results/:id
 */
export const getResult = asyncHandler(async (req, res) => {
  const r = await TestAttempt.findById(req.params.id).populate(
    "answers.questionId",
    "title type skill difficulty prompt"
  );
  if (!r) return notFound(res, "Result not found");
  if (String(r.user) !== String(req.user._id) && req.user.role !== "admin") {
    return forbidden(res, "Not allowed");
  }
  return ok(res, r);
});

/**
 * GET /api/results/progress
 * Skill-wise aggregates for the current user.
 */
export const myProgress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const skill = req.query.skill;

  const match = { user: userId };
  if (skill) match.skill = skill;

  const stats = await TestAttempt.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$skill",
        attempts: { $sum: 1 },
        avgScore: { $avg: "$score" },
        bestScore: { $max: "$score" },
        totalQuestions: { $sum: "$totalQuestions" },
        correctAnswers: { $sum: "$correctAnswers" },
        lastAttemptAt: { $max: "$completedAt" },
      },
    },
    { $sort: { lastAttemptAt: -1 } },
  ]);

  return ok(res, { skills: stats });
});
