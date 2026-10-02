import mongoose from "mongoose";

const savedQuestionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

// Prevent the same user from bookmarking the same question twice.
savedQuestionSchema.index({ user: 1, question: 1 }, { unique: true });

const SavedQuestion = mongoose.model("SavedQuestion", savedQuestionSchema);
export default SavedQuestion;
