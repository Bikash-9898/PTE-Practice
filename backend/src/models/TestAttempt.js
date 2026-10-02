import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    answer: { type: mongoose.Schema.Types.Mixed, default: null },
    correct: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    durationSec: { type: Number, default: 0 },
  },
  { _id: false }
);

const testAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mockTest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MockTest",
      default: null,
    },
    skill: {
      type: String,
      enum: ["speaking", "writing", "reading", "listening", "mock"],
      required: true,
      index: true,
    },
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    answers: [answerSchema],
    score: { type: Number, default: 0, min: 0 },
    totalScore: { type: Number, default: 0 },
    totalQuestions: { type: Number, required: true, min: 1 },
    correctAnswers: { type: Number, default: 0 },
    incorrectAnswers: { type: Number, default: 0 },
    durationSec: { type: Number, default: 0 },
    isMockTest: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned"],
      default: "completed",
    },
    note: { type: String, default: "" },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

testAttemptSchema.index({ user: 1, skill: 1, completedAt: -1 });

const TestAttempt = mongoose.model("TestAttempt", testAttemptSchema);
export default TestAttempt;
