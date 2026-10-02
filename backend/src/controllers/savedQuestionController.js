import asyncHandler from "express-async-handler";
import SavedQuestion from "../models/SavedQuestion.js";
import Question from "../models/Question.js";
import { ok, created, badRequest, notFound, serverError } from "../utils/responses.js";

/**
 * POST /api/saved-questions/:questionId
 * Adds the question to the current user's bookmark list (idempotent).
 */
export const saveQuestion = asyncHandler(async (req, res) => {
  const { questionId } = req.params;
  const exists = await Question.findById(questionId).select("_id");
  if (!exists) return notFound(res, "Question not found");

  try {
    const doc = await SavedQuestion.create({
      user: req.user._id,
      question: questionId,
    });
    return created(res, doc, "Question saved");
  } catch (err) {
    if (err.code === 11000) {
      return ok(res, {}, "Already saved");
    }
    return serverError(res, err.message);
  }
});

/**
 * GET /api/saved-questions
 */
export const listSaved = asyncHandler(async (req, res) => {
  const items = await SavedQuestion.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate("question", "title type skill difficulty prompt passage");

  const cleaned = items.map((s) => {
    const q = s.question?.toObject ? s.question.toObject() : s.question;
    if (q) delete q.correctAnswer;
    return { id: s._id, savedAt: s.createdAt, question: q };
  });

  return ok(res, { count: cleaned.length, items: cleaned });
});

/**
 * DELETE /api/saved-questions/:questionId
 */
export const removeSaved = asyncHandler(async (req, res) => {
  const { questionId } = req.params;
  const result = await SavedQuestion.findOneAndDelete({
    user: req.user._id,
    question: questionId,
  });
  if (!result) return notFound(res, "Saved question not found");
  return ok(res, {}, "Saved question removed");
});

/**
 * DELETE /api/saved-questions/id/:id
 * Removes by the SavedQuestion document id rather than the question id.
 */
export const removeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await SavedQuestion.findOneAndDelete({
    _id: id,
    user: req.user._id,
  });
  if (!result) return notFound(res, "Saved question not found");
  return ok(res, {}, "Saved question removed");
});
