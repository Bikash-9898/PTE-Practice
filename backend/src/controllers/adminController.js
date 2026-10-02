import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import User from "../models/User.js";
import Question from "../models/Question.js";
import MockTest from "../models/MockTest.js";
import TestAttempt from "../models/TestAttempt.js";
import { ok, badRequest, notFound } from "../utils/responses.js";

/**
 * GET /api/admin/dashboard
 * High-level counts and recent activity.
 */
export const getDashboard = asyncHandler(async (req, res) => {
  const [
    totalStudents,
    totalAdmins,
    totalQuestions,
    publishedQuestions,
    totalMockTests,
    publishedMockTests,
    totalAttempts,
    recentAttempts,
    skillBreakdown,
    activeLearners,
    scoreTrend,
  ] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "admin" }),
    Question.countDocuments({}),
    Question.countDocuments({ isPublished: true }),
    MockTest.countDocuments({}),
    MockTest.countDocuments({ isPublished: true }),
    TestAttempt.countDocuments({ status: "completed" }),
    TestAttempt.find({ status: "completed" })
      .sort({ completedAt: -1 })
      .limit(10)
      .populate("user", "name email")
      .populate("mockTest", "title"),
    TestAttempt.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: "$skill", count: { $sum: 1 }, avgScore: { $avg: "$score" } } },
      { $sort: { _id: 1 } },
    ]),
    TestAttempt.aggregate([
      {
        $match: {
          status: "completed",
          completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
          users: { $addToSet: "$user" },
        },
      },
      { $project: { _id: 1, users: { $size: "$users" } } },
      { $sort: { _id: 1 } },
    ]),
    TestAttempt.aggregate([
      {
        $match: {
          status: "completed",
          completedAt: { $gte: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            week: {
              $floor: {
                $divide: [
                  { $subtract: ["$completedAt", new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)] },
                  1000 * 60 * 60 * 24 * 7,
                ],
              },
            },
          },
          avg: { $avg: "$score" },
        },
      },
      { $sort: { "_id.week": 1 } },
    ]),
  ]);

  return ok(res, {
    counts: {
      students: totalStudents,
      admins: totalAdmins,
      questions: totalQuestions,
      publishedQuestions,
      mockTests: totalMockTests,
      publishedMockTests,
      attempts: totalAttempts,
    },
    skillBreakdown,
    activeLearners,
    scoreTrend,
    recentAttempts,
  });
});

/**
 * GET /api/admin/students
 * Search + paginate students.
 */
export const listStudents = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = { role: "student" };
  if (req.query.status && ["active", "inactive", "suspended"].includes(req.query.status)) {
    filter.status = req.query.status;
  }
  if (req.query.search) {
    const re = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: re }, { email: re }];
  }

  const [items, total, attemptStats] = await Promise.all([
    User.find(filter).select("-password -__v").sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
    TestAttempt.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$user",
          practices: { $sum: 1 },
          avgScore: { $avg: "$score" },
        },
      },
    ]),
  ]);

  const statsByUser = new Map(
    attemptStats.map((item) => [String(item._id), item])
  );
  const students = items.map((student) => {
    const stats = statsByUser.get(String(student._id));
    return {
      ...student.toSafeJSON(),
      practices: stats?.practices || 0,
      avgScore: stats ? Math.round(stats.avgScore) : 0,
    };
  });

  return res.status(200).json({
    success: true,
    message: "Students fetched",
    data: students,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

/**
 * GET /api/admin/students/:id
 */
export const getStudent = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return badRequest(res, "Invalid id");
  }
  const u = await User.findById(req.params.id).select("-password -__v");
  if (!u) return notFound(res, "Student not found");

  const attempts = await TestAttempt.countDocuments({ user: u._id });
  return ok(res, { student: u, attempts });
});

/**
 * PATCH /api/admin/students/:id/status
 * Body: { status: "active" | "inactive" | "suspended" }
 */
export const setStudentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!["active", "inactive", "suspended"].includes(status)) {
    return badRequest(res, "Invalid status value");
  }
  const u = await User.findById(req.params.id);
  if (!u) return notFound(res, "Student not found");
  u.status = status;
  await u.save();
  return ok(res, { user: u.toSafeJSON() }, `Status set to ${status}`);
});

/**
 * DELETE /api/admin/students/:id
 * Hard-deletes the student. Their test attempts and saved questions
 * are cascade-deleted by the model middleware below.
 */
export const deleteStudent = asyncHandler(async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) return notFound(res, "Student not found");
  await User.findByIdAndDelete(u._id);
  await TestAttempt.deleteMany({ user: u._id });
  await mongoose
    .model("SavedQuestion")
    .deleteMany({ user: u._id });
  return ok(res, {}, "Student removed");
});

/**
 * GET /api/admin/results
 */
export const listResults = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.skill) filter.skill = req.query.skill;
  if (req.query.mockTest) filter.mockTest = req.query.mockTest;

  const [items, total] = await Promise.all([
    TestAttempt.find(filter)
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name email")
      .populate("mockTest", "title"),
    TestAttempt.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    message: "Results fetched",
    data: items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

/**
 * GET /api/admin/statistics
 */
export const getStatistics = asyncHandler(async (req, res) => {
  const [bySkill, byDifficulty, last7Days, topMockTests] = await Promise.all([
    TestAttempt.aggregate([
      { $group: { _id: "$skill", count: { $sum: 1 }, avgScore: { $avg: "$score" } } },
    ]),
    TestAttempt.aggregate([
      {
        $lookup: {
          from: "questions",
          localField: "answers.questionId",
          foreignField: "_id",
          as: "qs",
        },
      },
      { $unwind: "$qs" },
      { $group: { _id: "$qs.difficulty", attempts: { $sum: 1 } } },
    ]),
    TestAttempt.aggregate([
      {
        $match: {
          completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
          attempts: { $sum: 1 },
          avgScore: { $avg: "$score" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    MockTest.find({ isPublished: true })
      .sort({ avgScore: -1, attempts: -1 })
      .limit(5),
  ]);

  return ok(res, { bySkill, byDifficulty, last7Days, topMockTests });
});
