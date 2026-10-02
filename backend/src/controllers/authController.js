import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import TestAttempt from "../models/TestAttempt.js";
import SavedQuestion from "../models/SavedQuestion.js";
import { generateToken } from "../utils/generateToken.js";
import { ok, created, badRequest, unauthorized, notFound } from "../utils/responses.js";

const COOKIE_NAME = "token";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function localDateKey(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/",
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 * Always creates a student account. Admins cannot self-register.
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return badRequest(res, "name, email, and password are required");
  }
  if (String(password).length < 6) {
    return badRequest(res, "Password must be at least 6 characters");
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return badRequest(res, "An account with that email already exists");

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase(),
    password,
    role: "student", // hard-coded — never trust user-submitted roles
  });

  const token = generateToken(user);
  setAuthCookie(res, token);

  return created(res, { user: user.toSafeJSON(), token }, "Registration successful");
});

/**
 * POST /api/auth/login
 * Body: { email, password, remember? }
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return badRequest(res, "email and password are required");
  }

  // Select the password field because the schema hides it by default.
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) return unauthorized(res, "Invalid email or password");

  const match = await user.matchPassword(password);
  if (!match) return unauthorized(res, "Invalid email or password");

  if (user.status && user.status !== "active") {
    return unauthorized(res, "Account is suspended. Contact support.");
  }

  const token = generateToken(user);
  setAuthCookie(res, token);

  return ok(res, { user: user.toSafeJSON(), token }, "Signed in");
});

/**
 * POST /api/auth/logout
 * Clears the httpOnly cookie. Stateless for the header-based flow.
 */
export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  return ok(res, {}, "Signed out");
});

/**
 * GET /api/auth/me
 * Requires authentication. Returns the current user.
 */
export const me = asyncHandler(async (req, res) => {
  return ok(res, { user: req.user.toSafeJSON() });
});

/**
 * GET /api/dashboard/stats
 * Returns dashboard statistics for the authenticated student.
 */
export const dashboardStats = asyncHandler(async (req, res) => {
  const user = req.user;

  const attempts = await TestAttempt.find({ user: user._id, status: "completed" })
    .sort({ completedAt: -1 })
    .limit(100)
    .populate("mockTest", "title");
  const skillNames = ["speaking", "writing", "reading", "listening"];
  const skillAttempts = Object.fromEntries(skillNames.map((skill) => [skill, []]));

  attempts.forEach((attempt) => {
    if (skillAttempts[attempt.skill]) skillAttempts[attempt.skill].push(attempt);
  });

  const skillScores = Object.fromEntries(
    skillNames.map((skill) => {
      const values = skillAttempts[skill];
      return [
        skill,
        values.length
          ? Math.round(values.reduce((sum, attempt) => sum + attempt.score, 0) / values.length)
          : 0,
      ];
    })
  );

  const today = new Date();
  const weekly = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - (6 - index));
    const dateKey = localDateKey(date);
    const durationSec = attempts
      .filter((attempt) => localDateKey(attempt.completedAt) === dateKey)
      .reduce((sum, attempt) => sum + Math.max(0, Number(attempt.durationSec) || 0), 0);
    const minutes = Math.round(durationSec / 60);
    return { day: date.toLocaleDateString("en-US", { weekday: "short" }), minutes };
  });

  const practiceDays = new Set(
    attempts.map((attempt) => localDateKey(attempt.completedAt)).filter(Boolean)
  );
  let streak = 0;
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  while (practiceDays.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const latestAttempt = attempts[0];
  const mockAttempts = attempts.filter((attempt) => attempt.skill === "mock");

  // Recommended practice categories sorted by weakest skill (fewest attempts).
  const CATEGORY_REC = {
    speaking: { type: "Read Aloud", title: "Speaking Read Aloud practice" },
    writing: { type: "Write Essay", title: "Writing Essay practice" },
    reading: { type: "Reorder Paragraphs", title: "Reading Reorder Paragraphs" },
    listening: { type: "Write from Dictation", title: "Listening Write from Dictation" },
  };
  const rankedSkills = skillNames
    .map((skill) => ({
      skill,
      count: skillAttempts[skill].length,
      rec: CATEGORY_REC[skill],
    }))
    .sort((a, b) => a.count - b.count);

  const continuePracticing = rankedSkills.slice(0, 3).map(({ skill, count, rec }) => ({
    skill,
    type: rec.type,
    progress: count ? Math.min(100, Math.round((Math.min(count, 10) / 10) * 100)) : 0,
  }));

  const recommended = rankedSkills.slice(0, 2).map(({ skill, count, rec }) => ({
    id: `rec-${skill}`,
    skill,
    type: rec.type,
    title: rec.title,
    note: count ? `${count} session${count === 1 ? "" : "s"} completed` : "No practice yet",
  }));

  const stats = {
    speaking: skillAttempts.speaking.length,
    writing: skillAttempts.writing.length,
    reading: skillAttempts.reading.length,
    listening: skillAttempts.listening.length,
    total: attempts.length,
    streak,
    lastPractice: latestAttempt?.completedAt || null,
    avgMockScore: mockAttempts.length
      ? Math.round(mockAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / mockAttempts.length)
      : 0,
    weekMinutes: weekly.reduce((sum, day) => sum + day.minutes, 0),
    skillScores,
    weekly,
    continuePracticing,
    recommended,
    recentTests: attempts.slice(0, 4).map((attempt) => ({
      id: attempt._id,
      name: attempt.mockTest?.title || `${attempt.skill[0].toUpperCase()}${attempt.skill.slice(1)} practice`,
      date: attempt.completedAt,
      score: attempt.score,
      total: 90,
      note: attempt.note || "",
    })),
  };

  return ok(res, {
    user: user.toSafeJSON(),
    stats,
  });
});

/**
 * PUT /api/auth/profile
 * Body: { name?, targetScore?, profileImage? }
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, targetScore, profileImage } = req.body || {};
  const updates = {};
  if (typeof name === "string" && name.trim().length >= 2) {
    updates.name = name.trim();
  }
  if (targetScore !== undefined) {
    const n = Number(targetScore);
    if (Number.isFinite(n) && n >= 10 && n <= 90) updates.targetScore = n;
  }
  if (typeof profileImage === "string") updates.profileImage = profileImage;

  if (Object.keys(updates).length === 0) {
    return badRequest(res, "No valid fields supplied");
  }

  Object.assign(req.user, updates);
  await req.user.save();

  // If the user changed their name, also fix the denormalised "saved by"
  // field on saved questions to keep lists consistent.
  if (updates.name) {
    // Touch saved-question timestamps so the client can re-fetch if needed.
    await SavedQuestion.updateMany(
      { user: req.user._id },
      { $set: { updatedAt: new Date() } }
    );
  }

  return ok(res, { user: req.user.toSafeJSON() }, "Profile updated");
});

/**
 * POST /api/auth/change-password (helper for completeness)
 * Body: { currentPassword, newPassword }
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return badRequest(res, "currentPassword and newPassword are required");
  }
  if (String(newPassword).length < 6) {
    return badRequest(res, "New password must be at least 6 characters");
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!user) return notFound(res, "User not found");

  const okMatch = await user.matchPassword(currentPassword);
  if (!okMatch) return unauthorized(res, "Current password is incorrect");

  user.password = newPassword;
  await user.save();
  return ok(res, {}, "Password changed");
});
