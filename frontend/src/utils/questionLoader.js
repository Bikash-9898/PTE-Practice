// ---------------------------------------------------------------------------
// Bridge between the backend Question document and the render shape the
// practice pages expect. The backend stores the answer key in
// `correctAnswer` (and optionals in `metadata`), while the practice UI
// reads fields such as `q.answer`, `q.blanks`, `q.wordBank` directly.
// ---------------------------------------------------------------------------

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

// Backend task-type names -> the task types the practice renderers know.
const TYPE_ALIASES = {
  "Reading Fill in the Blanks": "Reading & Writing Fill in the Blanks",
  "Listening Fill in the Blanks": "Fill in the Blanks",
};

/**
 * Convert a backend question (admin/student JSON) into the shape the
 * Speaking / Writing / Reading / Listening pages render. Everything
 * missing is defaulted so an admin-created question can never crash a
 * practice view.
 */
export function normaliseBackendQuestion(q = {}) {
  const meta = q.metadata || {};
  const type = TYPE_ALIASES[q.type] || q.type;

  const correctAnswer = q.correctAnswer ?? null;
  const isObject = typeof correctAnswer === "object" && correctAnswer !== null && !Array.isArray(correctAnswer);
  const fibAnswers =
    meta.answers || (isObject ? correctAnswer : undefined);

  let blanks;
  if (Array.isArray(meta.blanks)) {
    blanks = meta.blanks;
  } else if (fibAnswers) {
    blanks = Object.entries(fibAnswers).map(([id, answer]) => ({
      id: Number(id),
      options: [],
      answer,
    }));
  }

  let wordBank;
  if (Array.isArray(meta.wordBank)) {
    wordBank = meta.wordBank;
  } else if (fibAnswers) {
    wordBank = [...new Set(Object.values(fibAnswers).filter((v) => typeof v === "string"))];
  }

  const incorrectWords = Array.isArray(meta.incorrectWords)
    ? meta.incorrectWords
    : Array.isArray(correctAnswer)
    ? correctAnswer
    : [];
  const correctWords = Array.isArray(meta.correctWords) ? meta.correctWords : [];
  const displayText = meta.displayText || q.passage || q.prompt || "";

  return {
    id: q._id || q.id,
    title: q.title || "",
    type,
    skill: q.skill,
    difficulty: q.difficulty || "Medium",
    prompt: q.prompt || "",
    passage: q.passage || "",
    options: Array.isArray(q.options) ? q.options : [],
    answer: correctAnswer,
    multiSelect: Array.isArray(correctAnswer),
    explanation: q.explanation || "",
    timeLimit: q.timeLimit || 60,
    prepTime: q.prepTime || 0,
    wordMin: q.wordMin || 0,
    wordMax: q.wordMax || 0,
    points: q.points ?? 1,
    tips: meta.tips,
    sampleAnswer: meta.sampleAnswer || (typeof correctAnswer === "string" ? correctAnswer : undefined),
    sampleSummary: meta.sampleSummary,
    sampleOutline: meta.sampleOutline,
    audioText: meta.audioText || q.prompt || "",
    lectureText: meta.lectureText,
    chartData: meta.chartData,
    imageDescription: meta.imageDescription,
    chartUnit: meta.chartUnit,
    question: meta.question || q.prompt || "",
    blanks,
    wordBank,
    answers: fibAnswers,
    paragraphs: Array.isArray(meta.paragraphs) ? meta.paragraphs : [],
    correctOrder: Array.isArray(meta.correctOrder) ? meta.correctOrder : [],
    incorrectWords,
    correctWords,
    displayText,
    isPublished: q.isPublished,
    isDemo: q.isDemo,
    _isBackend: true,
  };
}

/**
 * Parse the plain-text "correct answer" field from the admin form into the
 * value the backend stores. For Multiple Choice the answer is the option
 * index (e.g. "1") or a comma-separated set for multi-answer questions
 * (e.g. "0,3"). For everything else it is free text.
 */
export function parseCorrectAnswer(type, raw) {
  const value = typeof raw === "string" ? raw.trim() : raw;
  if (value === undefined || value === null || value === "") return null;

  if (type === "Multiple Choice") {
    const parts = String(value)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return null;
    const nums = parts.map((p) => Number(p));
    if (nums.every((n) => Number.isFinite(n))) {
      return nums.length === 1 ? nums[0] : nums;
    }
    return value;
  }
  return value;
}

/**
 * Turn a stored correctAnswer back into the plain-text form value used by
 * the admin edit dialog.
 */
export function serialiseCorrectAnswer(correctAnswer) {
  if (Array.isArray(correctAnswer)) return correctAnswer.join(", ");
  if (correctAnswer === undefined || correctAnswer === null) return "";
  return String(correctAnswer);
}