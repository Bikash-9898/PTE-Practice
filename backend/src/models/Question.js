import mongoose from "mongoose";

export const QUESTION_TYPES = [
  "Read Aloud",
  "Repeat Sentence",
  "Describe Image",
  "Retell Lecture",
  "Answer Short Question",
  "Summarize Written Text",
  "Write Essay",
  "Reading Fill in the Blanks",
  "Multiple Choice",
  "Reorder Paragraphs",
  "Summarize Spoken Text",
  "Listening Fill in the Blanks",
  "Highlight Incorrect Words",
  "Write from Dictation",
];

export const QUESTION_SKILLS = ["speaking", "writing", "reading", "listening"];
export const QUESTION_DIFFICULTIES = ["Easy", "Medium", "Hard"];

const questionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    type: {
      type: String,
      required: true,
      enum: QUESTION_TYPES,
    },
    skill: {
      type: String,
      required: true,
      enum: QUESTION_SKILLS,
    },
    difficulty: {
      type: String,
      enum: QUESTION_DIFFICULTIES,
      default: "Medium",
    },
    // The question body. `prompt` is shown to students before answering;
    // `passage` is used by some reading/listening types; `options` is the
    // multiple-choice array; `correctAnswer` is the answer key.
    prompt: { type: String, default: "" },
    passage: { type: String, default: "" },
    options: {
      type: [mongoose.Schema.Types.Mixed],
      default: undefined,
    },
    correctAnswer: { type: mongoose.Schema.Types.Mixed, default: null },
    explanation: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    audioUrl: { type: String, default: "" },
    points: { type: Number, default: 1, min: 0 },
    timeLimit: { type: Number, default: 60 }, // seconds
    prepTime: { type: Number, default: 0 }, // seconds (speaking prep)
    wordMin: { type: Number, default: 0 },
    wordMax: { type: Number, default: 0 },
    // Misc extras that some task types need (e.g. blank list, word bank,
    // paragraphs). Anything stored here is opaque to the API layer.
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    isPublished: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

questionSchema.index({ skill: 1, type: 1, isPublished: 1 });

/**
 * Strip the correct answer and explanation for student-facing listings.
 * Admins still see everything.
 */
questionSchema.methods.toStudentJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.correctAnswer;
  delete obj.metadata?.correctAnswers;
  delete obj.__v;
  return obj;
};

questionSchema.methods.toAdminJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  return obj;
};

const Question = mongoose.model("Question", questionSchema);
export default Question;
