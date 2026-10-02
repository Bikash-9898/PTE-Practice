/**
 * Populates the Mongo database with demo data:
 *   - Two users (one student, one admin)
 *   - 22 sample questions across the four skills
 *   - One sample published mock test
 *
 * Run with: npm run seed          (skips if data already exists)
 *           npm run seed -- --reset (drops existing demo data first)
 */

import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Question from "../models/Question.js";
import MockTest from "../models/MockTest.js";
import { sampleQuestions } from "./sampleQuestions.js";
import { ensureAdmin } from "./seed.js";

async function ensureUsers() {
  // Admin credentials come from ADMIN_* env vars (or a generated strong
  // password) via the shared secure seeder — never hard-coded here.
  const admin = await ensureAdmin();

  const studentEmail = "student@ptemaster.com";

  let student = await User.findOne({ email: studentEmail });
  if (!student) {
    student = await User.create({
      name: "Alex Johnson",
      email: studentEmail,
      password: "student123",
      role: "student",
      streak: 7,
      targetScore: 79,
    });
    console.log("✓ Created student user (student@ptemaster.com / student123)");
  }

  return { admin, student };
}

async function seedQuestions(reset = false) {
  if (reset) {
    await Question.deleteMany({});
    console.log("• Cleared existing questions");
  }

  const existing = await Question.countDocuments({ isDemo: true });
  if (existing >= sampleQuestions.length && !reset) {
    console.log(`• ${existing} demo questions already present, skipping`);
    return;
  }

  await Question.insertMany(
    sampleQuestions.map((q) => ({ ...q, isDemo: true, createdBy: null }))
  );
  console.log(`✓ Inserted ${sampleQuestions.length} demo questions`);
}

async function seedMockTest(reset = false) {
  if (reset) {
    await MockTest.deleteMany({ isDemo: true });
  }
  const existing = await MockTest.countDocuments({ isDemo: true });
  if (existing > 0 && !reset) {
    console.log(`• ${existing} demo mock tests already present, skipping`);
    return;
  }

  const allQuestions = await Question.find({ isDemo: true }).limit(8);
  if (allQuestions.length === 0) return;

  await MockTest.create({
    title: "Full Practice Test A",
    description:
      "An unofficial full-length PTE-style practice test. Covers all four skills.",
    duration: 60,
    sections: ["speaking", "writing", "reading", "listening"],
    difficulty: "Medium",
    questions: allQuestions.map((q) => q._id),
    isPublished: true,
    featured: true,
    isDemo: true,
  });
  console.log("✓ Created demo mock test 'Full Practice Test A'");
}

async function main() {
  const reset = process.argv.includes("--reset");
  await connectDB();

  try {
    await ensureUsers();
    await seedQuestions(reset);
    await seedMockTest(reset);
    console.log("\n✅ Seed complete.\n");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    // Give Mongoose a tick to drain in-flight ops before exiting.
    setTimeout(() => process.exit(process.exitCode || 0), 200);
  }
}

main();
