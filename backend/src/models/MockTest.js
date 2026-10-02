import mongoose from "mongoose";

const mockTestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: "", maxlength: 2000 },
    duration: { type: Number, required: true, min: 5 }, // minutes
    sections: {
      type: [String],
      enum: ["speaking", "writing", "reading", "listening"],
      default: ["speaking", "writing", "reading", "listening"],
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true,
      },
    ],
    isPublished: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    avgScore: { type: Number, default: 0 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const MockTest = mongoose.model("MockTest", mockTestSchema);
export default MockTest;
