/**
 * Lightweight, objective scoring for the kinds of auto-gradable items
 * the PTE Master demo supports.
 *
 * This is intentionally simple — it is NOT a substitute for a real PTE
 * scoring engine, and the API surface communicates that explicitly. The
 * frontend uses this same scoring logic for live feedback; the backend
 * reuses it so a result saved on the server stays consistent with what
 * the student saw on screen.
 */

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "then", "than", "that", "this",
  "these", "those", "is", "are", "was", "were", "be", "been", "being", "to",
  "of", "in", "on", "at", "for", "with", "by", "from", "as", "it", "its",
  "they", "them", "their", "we", "our", "you", "your", "he", "she", "his",
  "her", "i", "not", "no", "do", "does", "did", "can", "could", "will",
  "would", "should", "may", "might", "must", "have", "has", "had", "there",
  "here", "what", "which", "who", "when", "where", "how", "also", "more",
  "most", "some", "such", "into", "about", "over", "up", "out", "so", "very",
]);

function norm(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(text) {
  const out = norm(text).split(" ").filter(Boolean);
  return out;
}

function isEmpty(value) {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

function setsEqual(a, b) {
  const sa = new Set(a);
  const sb = new Set(b);
  if (sa.size !== sb.size) return false;
  for (const v of sa) if (!sb.has(v)) return false;
  return true;
}

/**
 * Score a single question/answer pair. Returns:
 *   { correct: boolean, score: number (0..1), attempted: boolean }
 */
export function scoreObjective(question, userAnswer) {
  if (!question) return { correct: false, score: 0, attempted: false };

  const attempted = !isEmpty(userAnswer);
  const type = question.type;
  const correct = question.correctAnswer;

  // ---- Multiple Choice / single + multi ----
  if (type === "Multiple Choice" || type === "Answer Short Question") {
    if (!attempted) return { correct: false, score: 0, attempted: false };

    if (Array.isArray(correct)) {
      const ok = setsEqual(correct, Array.isArray(userAnswer) ? userAnswer : [userAnswer]);
      return { correct: ok, score: ok ? 1 : 0, attempted: true };
    }
    const ok = String(userAnswer).trim() === String(correct).trim();
    return { correct: ok, score: ok ? 1 : 0, attempted: true };
  }

  // ---- Fill in the Blanks ----
  if (
    type === "Reading Fill in the Blanks" ||
    type === "Listening Fill in the Blanks" ||
    type === "Fill in the Blanks"
  ) {
    const correctMap = correct || {};
    const userMap = userAnswer || {};
    const keys = Object.keys(correctMap);
    if (keys.length === 0) return { correct: false, score: 0, attempted };
    let hits = 0;
    let filled = 0;
    keys.forEach((k) => {
      const u = (userMap[k] || "").trim().toLowerCase();
      const c = String(correctMap[k] || "").trim().toLowerCase();
      if (u) filled += 1;
      if (u && u === c) hits += 1;
    });
    const ratio = hits / keys.length;
    return { correct: hits === keys.length, score: ratio, attempted: filled > 0 };
  }

  // ---- Reorder Paragraphs ----
  if (type === "Reorder Paragraphs") {
    const correctOrder = Array.isArray(correct) ? correct : [];
    const userOrder = Array.isArray(userAnswer) ? userAnswer : [];
    if (correctOrder.length === 0) return { correct: false, score: 0, attempted };
    let matches = 0;
    correctOrder.forEach((id, i) => {
      if (userOrder[i] === id) matches += 1;
    });
    const ratio = matches / correctOrder.length;
    return { correct: matches === correctOrder.length, score: ratio, attempted };
  }

  // ---- Highlight Incorrect Words ----
  if (type === "Highlight Incorrect Words") {
    const incorrect = new Set((correct || []).map((w) => String(w).toLowerCase()));
    const selected = new Set((userAnswer || []).map((w) => String(w).toLowerCase()));
    if (incorrect.size === 0) return { correct: false, score: 0, attempted };
    let hits = 0;
    let falsePositives = 0;
    selected.forEach((w) => {
      if (incorrect.has(w)) hits += 1;
      else falsePositives += 1;
    });
    const score = Math.max(0, hits - falsePositives * 0.5) / incorrect.size;
    return { correct: hits === incorrect.size && falsePositives === 0, score, attempted: selected.size > 0 };
  }

  // ---- Write from Dictation ----
  if (type === "Write from Dictation") {
    const sample = String(correct || "").toLowerCase();
    const sampleWords = sample.match(/[a-z']+/g) || [];
    const userWords = (String(userAnswer || "").toLowerCase().match(/[a-z']+/g) || []);
    if (sampleWords.length === 0) return { correct: false, score: 0, attempted };
    const used = new Set();
    let hits = 0;
    sampleWords.forEach((sw) => {
      const idx = userWords.findIndex((uw, i) => uw === sw && !used.has(i));
      if (idx >= 0) {
        used.add(idx);
        hits += 1;
      }
    });
    const ratio = hits / sampleWords.length;
    return { correct: ratio >= 0.8, score: ratio, attempted: userWords.length > 0 };
  }

  // ---- Summarize Spoken Text / Written Text / Write Essay ----
  // Word-count only heuristic to mirror the frontend.
  if (
    type === "Summarize Spoken Text" ||
    type === "Summarize Written Text" ||
    type === "Write Essay"
  ) {
    const wordMin = Number(question.wordMin) || 0;
    const wordMax = Number(question.wordMax) || Infinity;
    const wc = words(userAnswer).length;
    if (wc === 0) return { correct: false, score: 0, attempted: false };
    let score = 0;
    if (wc >= wordMin && wc <= wordMax) score = 0.75;
    else if (wc < wordMin) score = Math.max(0.2, (wc / Math.max(wordMin, 1)) * 0.6);
    else score = Math.max(0.4, 0.75 - (wc - wordMax) / Math.max(wordMax, 1));
    return { correct: score >= 0.6, score, attempted: true };
  }

  // Speaking-only task types — no objective score, treat as practice.
  if (
    type === "Read Aloud" ||
    type === "Repeat Sentence" ||
    type === "Describe Image" ||
    type === "Retell Lecture" ||
    type === "Answer Short Question"
  ) {
    return {
      correct: false,
      score: attempted ? 0.5 : 0,
      attempted,
    };
  }

  // Unknown type — record but don't grade.
  return { correct: false, score: 0, attempted };
}

/**
 * Pull out key phrases from a model answer (≥5-char words, stopwords
 * removed) for the writing heuristic.
 */
export function extractKeyPhrases(text, limit = 12) {
  const ws = words(text);
  const seen = new Set();
  const out = [];
  ws.forEach((w) => {
    if (w.length < 5 || STOPWORDS.has(w) || seen.has(w)) return;
    seen.add(w);
    out.push(w);
  });
  return out.slice(0, limit);
}
