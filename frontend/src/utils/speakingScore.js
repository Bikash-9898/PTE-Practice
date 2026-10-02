import { normalizeAnswer } from "./helpers";

/**
 * Unofficial speaking scoring for the PTE Master demo.
 *
 * Content is scored by comparing a real browser speech-recognition
 * transcript against the reference text. When no transcript is available
 * (unsupported browser / denied permission / silence), content is reported
 * as "not assessed" rather than guessed at.
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

/** Words expected per second of natural speech. */
const WORDS_PER_SECOND = 2.5;

function words(text) {
  return normalizeAnswer(text).split(" ").filter(Boolean);
}

/** Order-insensitive word matching that never counts a word twice. */
function matchWords(spokenWords, referenceWords) {
  const used = new Set();
  const matched = [];
  const missed = [];

  referenceWords.forEach((ref) => {
    const idx = spokenWords.findIndex((w, i) => w === ref && !used.has(i));
    if (idx >= 0) {
      used.add(idx);
      matched.push(ref);
    } else {
      missed.push(ref);
    }
  });

  return { matched, missed };
}

function keywordsOf(text, limit = 18) {
  const seen = new Set();
  const out = [];
  words(text).forEach((w) => {
    if (w.length < 4 || STOPWORDS.has(w) || seen.has(w)) return;
    seen.add(w);
    out.push(w);
  });
  return out.slice(0, limit);
}

/** Reference text and comparison mode for each speaking task type. */
export function getReference(question) {
  switch (question.type) {
    case "Read Aloud":
      return { text: question.prompt, mode: "exact" };
    case "Repeat Sentence":
      return { text: question.audioText || question.prompt, mode: "exact" };
    case "Answer Short Question":
      return { text: question.sampleAnswer || "", mode: "short" };
    case "Retell Lecture":
      return { text: question.lectureText || "", mode: "keywords" };
    case "Describe Image":
      return {
        text: [
          question.imageDescription || "",
          ...(question.chartData || []).map((d) => d.label),
        ].join(" "),
        mode: "keywords",
      };
    default:
      return { text: question.prompt || "", mode: "keywords" };
  }
}

/** Scores how close the recording length is to a natural delivery length. */
function scoreDuration(duration, referenceWordCount, timeLimit) {
  if (!duration) return { score: 0, label: "No speech recorded" };

  const expected = Math.max(
    2,
    Math.min(timeLimit || 40, referenceWordCount / WORDS_PER_SECOND)
  );
  const ratio = duration / expected;

  if (ratio >= 0.75 && ratio <= 1.4) {
    return { score: 100, label: "Good pacing and length" };
  }
  if (ratio < 0.75) {
    return {
      score: Math.max(20, Math.round(ratio * 100)),
      label: "Response was shorter than expected",
    };
  }
  return {
    score: Math.max(45, Math.round(100 - (ratio - 1.4) * 40)),
    label: "Response was longer than expected",
  };
}

export function scoreSpeakingResponse(question, recording) {
  const duration = recording?.duration || 0;
  const transcript = (recording?.transcript || "").trim();
  const { text: referenceText, mode } = getReference(question);

  const refWords = words(referenceText);
  const durationResult = scoreDuration(duration, refWords.length, question.timeLimit);

  // No recording at all.
  if (!recording) {
    return {
      assessed: false,
      overall: 0,
      content: null,
      contentLabel: "No recording submitted",
      duration,
      durationScore: 0,
      durationLabel: "No audio captured",
      transcript: "",
      matched: [],
      missed: [],
      mode,
      note: "Record a response to receive a practice score.",
    };
  }

  // Recording exists but speech recognition produced nothing usable.
  if (!transcript) {
    return {
      assessed: false,
      overall: durationResult.score,
      content: null,
      contentLabel: "Content not assessed — no transcript available",
      duration,
      durationScore: durationResult.score,
      durationLabel: durationResult.label,
      transcript: "",
      matched: [],
      missed: [],
      mode,
      note:
        "Your audio was recorded, but speech recognition was unavailable or detected no speech. Only response length could be measured — this is not a content score.",
    };
  }

  const spokenWords = words(transcript);
  let content = 0;
  let matched = [];
  let missed = [];
  let contentLabel = "";

  if (mode === "exact") {
    const res = matchWords(spokenWords, refWords);
    matched = res.matched;
    missed = res.missed;
    content = refWords.length
      ? Math.round((matched.length / refWords.length) * 100)
      : 0;
    contentLabel = `${matched.length} of ${refWords.length} reference words recognised`;
  } else if (mode === "short") {
    const accepted = refWords.filter((w) => !STOPWORDS.has(w));
    const res = matchWords(spokenWords, accepted.length ? accepted : refWords);
    matched = res.matched;
    missed = res.missed;
    content = matched.length > 0 ? 100 : 0;
    contentLabel =
      content === 100
        ? "Expected answer detected"
        : "Expected answer not detected in your response";
  } else {
    const keys = keywordsOf(referenceText);
    const res = matchWords(spokenWords, keys);
    matched = res.matched;
    missed = res.missed;
    content = keys.length ? Math.round((matched.length / keys.length) * 100) : 0;
    contentLabel = `${matched.length} of ${keys.length} key ideas mentioned`;
  }

  // Content carries most of the weight; delivery length is a supporting signal.
  const overall = Math.round(content * 0.7 + durationResult.score * 0.3);

  return {
    assessed: true,
    overall,
    content,
    contentLabel,
    duration,
    durationScore: durationResult.score,
    durationLabel: durationResult.label,
    transcript,
    matched,
    missed: missed.slice(0, 12),
    mode,
    note:
      "Scored by comparing a browser speech-recognition transcript with the reference text. Recognition accuracy varies by accent and microphone, so treat this as rough practice feedback, not an official PTE score.",
  };
}

export function scoreBand(score) {
  if (score >= 80) return { label: "Strong", color: "text-green-600", bar: "bg-green-500" };
  if (score >= 60) return { label: "Developing", color: "text-amber-600", bar: "bg-amber-500" };
  return { label: "Needs work", color: "text-red-600", bar: "bg-red-500" };
}
