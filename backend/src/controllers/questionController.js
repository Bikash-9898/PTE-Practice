import asyncHandler from "express-async-handler";
import Question, {
  QUESTION_TYPES,
  QUESTION_SKILLS,
  QUESTION_DIFFICULTIES,
} from "../models/Question.js";
import {
  ok,
  created,
  badRequest,
  notFound,
} from "../utils/responses.js";
import { scoreObjective } from "../utils/scoring.js";

function parsePositiveInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Build the Mongoose filter object from the request query string.
 * Returns `{ filter }` on success or `{ error }` when an enum value is
 * invalid — controllers translate that into a 400 response without
 * having to throw across async boundaries.
 */
function buildFilter(query, options = {}) {
  const { isAdmin = false } = options;
  const filter = {};
  if (!isAdmin) filter.isPublished = true;

  if (query.skill) {
    if (!QUESTION_SKILLS.includes(query.skill)) {
      return { error: `Invalid skill: ${query.skill}` };
    }
    filter.skill = query.skill;
  }

  if (query.type) {
    if (!QUESTION_TYPES.includes(query.type)) {
      return { error: `Invalid type: ${query.type}` };
    }
    filter.type = query.type;
  }

  if (query.difficulty) {
    if (!QUESTION_DIFFICULTIES.includes(query.difficulty)) {
      return { error: `Invalid difficulty: ${query.difficulty}` };
    }
    filter.difficulty = query.difficulty;
  }

  if (query.search) {
    const re = new RegExp(String(query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ title: re }, { prompt: re }, { passage: re }];
  }

  return { filter };
}

/**
 * GET /api/questions
 * Public listing for students — never returns correctAnswer.
 */
export const listQuestions = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === "admin";
  const page = parsePositiveInt(req.query.page, 1);
  const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
  const skip = (page - 1) * limit;

  const built = buildFilter(req.query, { isAdmin });
  if (built.error) return badRequest(res, built.error);
  const filter = built.filter;

  const [items, total] = await Promise.all([
    Question.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Question.countDocuments(filter),
  ]);

  const data = isAdmin
    ? items.map((q) => q.toAdminJSON())
    : items.map((q) => q.toStudentJSON());

  return res.status(200).json({
    success: true,
    message: "Questions fetched",
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

/**
 * GET /api/questions/skill/:skill
 */
export const listBySkill = asyncHandler(async (req, res) => {
  const { skill } = req.params;
  if (!QUESTION_SKILLS.includes(skill)) {
    return badRequest(res, `Invalid skill: ${skill}`);
  }

  const items = await Question.find({
    skill,
    isPublished: true,
    isDemo: { $ne: true },
  }).sort({ type: 1, createdAt: 1 });

  return ok(
    res,
    { skill, count: items.length, items: items.map((q) => q.toStudentJSON()) },
    `Questions for skill=${skill}`
  );
});

/**
 * GET /api/questions/type/:type
 */
export const listByType = asyncHandler(async (req, res) => {
  const { type } = req.params;
  if (!QUESTION_TYPES.includes(type)) {
    return badRequest(res, `Invalid type: ${type}`);
  }

  const items = await Question.find({
    type,
    isPublished: true,
  }).sort({ skill: 1, createdAt: 1 });

  return ok(
    res,
    { type, count: items.length, items: items.map((q) => q.toStudentJSON()) }
  );
});

/**
 * GET /api/questions/:id
 * Public route, but only returns correctAnswer/explanation after the
 * caller has submitted an attempt (handled separately by results API).
 */
export const getQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const q = await Question.findById(id);
  if (!q) return notFound(res, "Question not found");

  const isAdmin = req.user?.role === "admin";
  if (!isAdmin && !q.isPublished) {
    return notFound(res, "Question not found");
  }

  return ok(res, isAdmin ? q.toAdminJSON() : q.toStudentJSON());
});

/**
 * POST /api/questions/:id/check
 * Grade a submitted multiple-choice answer and reveal the key for feedback.
 */
export const checkAnswer = asyncHandler(async (req, res) => {
  const q = await Question.findById(req.params.id);
  if (!q || !q.isPublished) return notFound(res, "Question not found");
  if (q.type !== "Multiple Choice") {
    return badRequest(res, "Answer checking is only supported for multiple-choice questions");
  }

  const answer = req.body?.answer;
  const selections = Array.isArray(answer) ? answer : [answer];
  if (
    selections.length === 0 ||
    selections.some((index) => !Number.isInteger(index) || index < 0 || index >= (q.options || []).length)
  ) {
    return badRequest(res, "A valid option selection is required");
  }

  const result = scoreObjective(q, answer);
  return ok(res, {
    correct: result.correct,
    correctAnswer: q.correctAnswer,
  }, "Answer checked");
});

/**
 * POST /api/questions (admin)
 */
export const createQuestion = asyncHandler(async (req, res) => {
  const payload = sanitizeQuestionInput(req.body || {});
  if (!payload.title || !payload.type || !payload.skill) {
    return badRequest(res, "title, type, and skill are required");
  }

  const createdQ = await Question.create({
    ...payload,
    createdBy: req.user._id,
  });
  return created(res, createdQ.toAdminJSON(), "Question created");
});

/**
 * PUT /api/questions/:id (admin)
 */
export const updateQuestion = asyncHandler(async (req, res) => {
  const payload = sanitizeQuestionInput(req.body || {});
  const q = await Question.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });
  if (!q) return notFound(res, "Question not found");
  return ok(res, q.toAdminJSON(), "Question updated");
});

/**
 * DELETE /api/questions/:id (admin)
 */
export const deleteQuestion = asyncHandler(async (req, res) => {
  const q = await Question.findByIdAndDelete(req.params.id);
  if (!q) return notFound(res, "Question not found");
  return ok(res, {}, "Question deleted");
});

/**
 * PATCH /api/questions/:id/publish (admin)
 */
export const togglePublish = asyncHandler(async (req, res) => {
  const q = await Question.findById(req.params.id);
  if (!q) return notFound(res, "Question not found");
  q.isPublished = Boolean(req.body?.isPublished ?? !q.isPublished);
  await q.save();
  return ok(res, q.toAdminJSON(), `Publish flag set to ${q.isPublished}`);
});

/**
 * Strip unknown fields and validate the rest against the schema's enum
 * lists so we don't accept junk or unexpected shape from clients.
 */
function sanitizeQuestionInput(input) {
  const out = {};
  const allowedStrings = ["title", "type", "skill", "difficulty", "prompt", "passage", "explanation", "imageUrl", "audioUrl"];
  allowedStrings.forEach((k) => {
    if (input[k] != null) out[k] = String(input[k]);
  });
  if (input.options !== undefined) out.options = input.options;
  if (input.correctAnswer !== undefined) out.correctAnswer = input.correctAnswer;
  if (input.metadata !== undefined) out.metadata = input.metadata;
  if (input.points !== undefined) out.points = Number(input.points) || 1;
  if (input.timeLimit !== undefined) out.timeLimit = Number(input.timeLimit) || 60;
  if (input.prepTime !== undefined) out.prepTime = Number(input.prepTime) || 0;
  if (input.wordMin !== undefined) out.wordMin = Number(input.wordMin) || 0;
  if (input.wordMax !== undefined) out.wordMax = Number(input.wordMax) || 0;
  if (input.isPublished !== undefined) out.isPublished = Boolean(input.isPublished);
  return out;
}
