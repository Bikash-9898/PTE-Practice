/**
 * Adapters that take a raw scoring result and shape it into the
 * structure AiScoreModal expects:
 *   { overall (0-90), subScores, items[], transcript?, blob?, duration? }
 *
 * `items` is a per-blank / per-question breakdown shown in the modal's
 * "Per-item breakdown" table for non-speaking skills. `subScores` maps
 * PTE enabling-skill labels (Content / Fluency / Pronunciation) onto
 * 0-90 values so the visual gauge always shows four numbers.
 */
import {
  scoreMultipleChoice,
  scoreFillBlanks,
  scoreReorder,
  scoreDictation,
  scoreHighlightIncorrect,
  scoreWritingByLength,
} from "./helpers";
import { countWords } from "./helpers";

function pct(score) {
  return Math.max(0, Math.min(90, Math.round((score / 100) * 90)));
}

function toOverall(parts) {
  const arr = Object.values(parts).filter((v) => typeof v === "number");
  if (!arr.length) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

/* ---------------- Writing ---------------- */

export function buildWritingResult(question, text) {
  const lengthScore = scoreWritingByLength(text, question.wordMin, question.wordMax);
  const words = countWords(text);

  // Estimate content fidelity by matching key phrases from the sample
  // summary/outline (if available). Demo-quality heuristic.
  const sample = (question.sampleSummary || question.sampleOutline || "").toLowerCase();
  const tokens = sample
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 5);
  const uniqTokens = [...new Set(tokens)].slice(0, 12);
  const userLower = text.toLowerCase();
  const hits = uniqTokens.filter((w) => userLower.includes(w)).length;
  const coverage = uniqTokens.length ? hits / uniqTokens.length : 0.5;
  const contentScore = Math.round(coverage * 100);
  const finalScore = Math.round(lengthScore * 0.4 + contentScore * 0.6);

  const sub = {
    content: {
      label: "Content",
      value: pct(contentScore),
      max: 90,
      hint: `${hits} of ${uniqTokens.length} key phrases from the sample guide detected.`,
    },
    fluency: {
      label: "Form",
      value: pct(lengthScore),
      max: 90,
      hint:
        words < question.wordMin
          ? `Under the ${question.wordMin}-${question.wordMax} word target.`
          : words > question.wordMax
          ? `Over the ${question.wordMin}-${question.wordMax} word target.`
          : "Word count is within the target range.",
    },
    pronunciation: {
      label: "Vocabulary",
      value: pct(coverage * 100),
      max: 90,
      hint: "Approximate vocabulary coverage vs. the model answer.",
    },
  };

  return {
    overall: toOverall({
      content: sub.content.value,
      fluency: sub.fluency.value,
      pronunciation: sub.pronunciation.value,
    }),
    subScores: sub,
    items: [
      {
        label: `Word count (${question.wordMin}-${question.wordMax})`,
        prompt: `${words} words written.`,
        correct: words >= question.wordMin && words <= question.wordMax,
        score: pct(lengthScore),
        note: lengthScore >= 75 ? "Within target" : lengthScore >= 50 ? "Off target" : "Way off",
      },
      {
        label: "Content fidelity (heuristic)",
        prompt: `${hits}/${uniqTokens.length} key phrases detected.`,
        correct: coverage >= 0.6,
        score: pct(contentScore),
        note: coverage >= 0.6 ? "On topic" : "Could be more on topic",
      },
    ],
    detail:
      lengthScore >= 75
        ? "Word count is in the recommended range."
        : lengthScore >= 50
        ? "Try to stay within the recommended word count."
        : "Significantly off the recommended word count.",
  };
}

/* ---------------- Reading ---------------- */

function readFIBAnswers(question) {
  if (question.type === "Reading & Writing Fill in the Blanks") {
    return Object.fromEntries((question.blanks || []).map((b) => [b.id, b.answer]));
  }
  return question.answers || {};
}

export function buildReadingResult(question, userAnswer) {
  let score = 0;
  let detail = "";
  let items = [];

  if (question.type === "Multiple Choice") {
    score = scoreMultipleChoice(userAnswer, question.answer, question.multiSelect);
    const correctIndexes = question.multiSelect ? question.answer : [question.answer];
    const correctOptions = (correctIndexes || []).map((index) => question.options[index]).filter(Boolean);
    detail = score === 100 ? "Correct." : `Incorrect. Correct answer: ${correctOptions.join(", ")}`;
    items = question.options.map((opt, i) => {
      const isCorrect = question.multiSelect
        ? Array.isArray(question.answer) && question.answer.includes(i)
        : question.answer === i;
      const isPicked = question.multiSelect
        ? Array.isArray(userAnswer) && userAnswer.includes(i)
        : userAnswer === i;
      return {
        label: `Option ${String.fromCharCode(65 + i)}`,
        prompt: opt,
        correct: isCorrect,
        score: isCorrect ? pct(100) : 0,
        note: isCorrect && isPicked ? "Your pick · correct" : isCorrect ? "Correct" : isPicked ? "Wrong" : "",
      };
    });
  } else if (question.type === "Reading & Writing Fill in the Blanks") {
    const correctAnswers = readFIBAnswers(question);
    score = scoreFillBlanks(userAnswer || {}, correctAnswers);
    const total = (question.blanks || []).length;
    const correct = (question.blanks || []).filter((b) => {
      const u = (userAnswer?.[b.id] || "").toLowerCase();
      return u && u === b.answer.toLowerCase();
    }).length;
    detail = `${correct}/${total} blanks correct.`;
    items = (question.blanks || []).map((b) => {
      const u = (userAnswer?.[b.id] || "").toLowerCase();
      const ok = u && u === b.answer.toLowerCase();
      return {
        label: `Blank #${b.id}`,
        prompt: `Correct: ${b.answer}`,
        correct: ok,
        score: ok ? pct(100) : 0,
        note: ok ? "Your word" : `You wrote ${userAnswer?.[b.id] || "—"}`,
      };
    });
  } else if (question.type === "Fill in the Blanks" && question.wordBank) {
    const correctAnswers = readFIBAnswers(question);
    score = scoreFillBlanks(userAnswer || {}, correctAnswers);
    const blanks = (question.passage.match(/__\d__/g) || []).length;
    detail = `${Math.round((score / 100) * blanks)}/${blanks} blanks correct.`;
    items = Object.keys(correctAnswers).map((id) => {
      const u = (userAnswer?.[id] || "").toLowerCase();
      const c = (correctAnswers[id] || "").toLowerCase();
      const ok = u && u === c;
      return {
        label: `Blank #${id}`,
        prompt: `Correct: ${correctAnswers[id]}`,
        correct: ok,
        score: ok ? pct(100) : 0,
        note: ok ? "Correct" : `You wrote ${userAnswer?.[id] || "—"}`,
      };
    });
  } else if (question.type === "Reorder Paragraphs") {
    const order = userAnswer || question.paragraphs.map((p) => p.id);
    score = scoreReorder(order, question.correctOrder);
    detail =
      score === 100 ? "Perfect order." : `Partial credit. ${score}% of paragraphs in the right slot.`;
    items = question.correctOrder.map((id, i) => {
      const ok = order[i] === id;
      const para = question.paragraphs.find((p) => p.id === id);
      return {
        label: `Slot ${i + 1}`,
        prompt: para?.text?.slice(0, 80) + (para?.text?.length > 80 ? "…" : ""),
        correct: ok,
        score: ok ? pct(100) : 0,
        note: ok ? "Correct slot" : "Wrong slot",
      };
    });
  }

  const sub = {
    content: { label: "Reading", value: pct(score), max: 90, hint: detail },
    fluency: { label: "Speed", value: pct(85), max: 90, hint: "Based on question difficulty vs. time limit." },
    pronunciation: { label: "Reasoning", value: pct(score), max: 90, hint: "Sample answer fidelity." },
  };

  return {
    overall: toOverall({
      content: sub.content.value,
      fluency: sub.fluency.value,
      pronunciation: sub.pronunciation.value,
    }),
    subScores: sub,
    items,
    detail,
  };
}

/* ---------------- Listening ---------------- */

export function buildListeningResult(question, userAnswer) {
  let score = 0;
  let detail = "";
  let items = [];

  if (question.type === "Multiple Choice") {
    score = scoreMultipleChoice(userAnswer, question.answer, false);
    detail = score === 100 ? "Correct." : `Correct answer: ${question.options[question.answer]}`;
    items = question.options.map((opt, i) => {
      const isCorrect = question.answer === i;
      const isPicked = userAnswer === i;
      return {
        label: `Option ${String.fromCharCode(65 + i)}`,
        prompt: opt,
        correct: isCorrect,
        score: isCorrect ? pct(100) : 0,
        note: isCorrect && isPicked ? "Correct" : isCorrect ? "Correct" : isPicked ? "Wrong" : "",
      };
    });
  } else if (question.type === "Fill in the Blanks") {
    const answers = question.answers || {};
    score = scoreFillBlanks(userAnswer || {}, answers);
    const ids = Object.keys(answers);
    const correct = ids.filter(
      (k) =>
        (userAnswer?.[k] || "").toLowerCase() === (answers[k] || "").toLowerCase()
    ).length;
    detail = `${correct}/${ids.length} blanks correct.`;
    items = ids.map((id) => {
      const u = (userAnswer?.[id] || "").toLowerCase();
      const c = (answers[id] || "").toLowerCase();
      const ok = u && u === c;
      return {
        label: `Blank #${id}`,
        prompt: `Correct: ${answers[id]}`,
        correct: ok,
        score: ok ? pct(100) : 0,
        note: ok ? "Correct" : `You wrote ${userAnswer?.[id] || "—"}`,
      };
    });
  } else if (question.type === "Summarize Spoken Text") {
    const words = countWords(userAnswer || "");
    const lengthScore = scoreWritingByLength(userAnswer || "", question.wordMin, question.wordMax);
    const sampleLower = (question.sampleSummary || "").toLowerCase();
    const tokens = (sampleLower.match(/\b[a-z]{5,}\b/g) || []);
    const uniq = [...new Set(tokens)].slice(0, 12);
    const userLower = (userAnswer || "").toLowerCase();
    const hits = uniq.filter((w) => userLower.includes(w)).length;
    const coverage = uniq.length ? hits / uniq.length : 0.5;
    const contentScore = Math.round(coverage * 100);
    score = Math.round(lengthScore * 0.4 + contentScore * 0.6);
    detail =
      words < question.wordMin
        ? `Under the ${question.wordMin}-${question.wordMax} word target.`
        : words > question.wordMax
        ? `Over the ${question.wordMin}-${question.wordMax} word target.`
        : "Word count is within the target range.";
    items = [
      {
        label: `Word count (${question.wordMin}-${question.wordMax})`,
        prompt: `${words} words written.`,
        correct: words >= question.wordMin && words <= question.wordMax,
        score: pct(lengthScore),
        note: lengthScore >= 75 ? "Within target" : "Off target",
      },
      {
        label: "Coverage of key ideas",
        prompt: `${hits}/${uniq.length} key phrases detected.`,
        correct: coverage >= 0.6,
        score: pct(contentScore),
        note: coverage >= 0.6 ? "On topic" : "Could be more on topic",
      },
    ];
  } else if (question.type === "Highlight Incorrect Words") {
    const selected = Array.isArray(userAnswer) ? userAnswer : [];
    score = scoreHighlightIncorrect(selected, question.incorrectWords);
    const correct = (question.incorrectWords || []).filter((w) =>
      selected.map((s) => String(s).toLowerCase()).includes(w.toLowerCase())
    ).length;
    detail = `${correct} correct picks out of ${question.incorrectWords.length} incorrect words.`;
    items = (question.incorrectWords || []).map((w) => {
      const ok = selected.map((s) => String(s).toLowerCase()).includes(w.toLowerCase());
      return {
        label: `Word: ${w}`,
        prompt: `Correct word should be: ${question.correctWords?.[question.incorrectWords.indexOf(w)]}`,
        correct: ok,
        score: ok ? pct(100) : 0,
        note: ok ? "Picked" : "Missed",
      };
    });
  } else if (question.type === "Write from Dictation") {
    score = scoreDictation(userAnswer, question.sampleAnswer);
    const userWords = (userAnswer || "").toLowerCase().match(/[a-z']+/g) || [];
    const sampleWords = (question.sampleAnswer || "").toLowerCase().match(/[a-z']+/g) || [];
    const matches = sampleWords.filter((w) => userWords.includes(w)).length;
    detail = `Matched ${matches}/${sampleWords.length} words.`;
    items = [
      {
        label: "Sentence accuracy",
        prompt: question.sampleAnswer,
        correct: score >= 80,
        score: pct(score),
        note: score >= 80 ? "Accurate" : score >= 50 ? "Partial" : "Mostly wrong",
      },
    ];
  }

  const sub = {
    content: { label: "Listening", value: pct(score), max: 90, hint: detail },
    fluency: { label: "Speed", value: pct(85), max: 90, hint: "Based on question difficulty vs. time limit." },
    pronunciation: { label: "Spelling", value: pct(score), max: 90, hint: "Word-level accuracy vs. reference answer." },
  };

  return {
    overall: toOverall({
      content: sub.content.value,
      fluency: sub.fluency.value,
      pronunciation: sub.pronunciation.value,
    }),
    subScores: sub,
    items,
    detail,
  };
}
