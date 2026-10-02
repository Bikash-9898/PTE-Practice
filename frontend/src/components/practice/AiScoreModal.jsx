import { useEffect, useMemo, useRef } from "react";
import {
  FiRotateCcw,
  FiArrowRight,
  FiShare2,
  FiX,
  FiInfo,
  FiMonitor,
} from "react-icons/fi";
import Waveform from "./Waveform";

const REFERENCE_WINDOW_DAYS = 7;

const DEFAULT_SUB_SCORES = {
  // Defaults used when a page doesn't supply its own breakdown.
  overall: { label: "Overall", max: 90 },
  content: { label: "Content", max: 90 },
  fluency: { label: "Fluency", max: 90 },
  pronunciation: { label: "Pronunciation", max: 90 },
};

function getReferenceText(question) {
  if (!question) return "";
  if (question.type === "Read Aloud") return question.prompt;
  if (question.type === "Repeat Sentence") return question.audioText || question.prompt;
  if (question.type === "Answer Short Question") return question.sampleAnswer || "";
  if (question.type === "Retell Lecture") return question.lectureText || "";
  if (question.type === "Describe Image") {
    return [
      question.imageDescription || "",
      ...(question.chartData || []).map((d) => d.label),
    ].join(" ");
  }
  return question.prompt || question.question || question.passage || "";
}

function splitReference(text) {
  return (text || "")
    .replace(/([.,!?;:])/g, " $1")
    .split(/\s+/)
    .filter(Boolean);
}

function classifyWords(transcript, referenceWords) {
  const spoken = (transcript || "").toLowerCase().match(/[a-z']+/g) || [];
  const ref = referenceWords.map((w) => w.toLowerCase().replace(/[^a-z']/g, ""));

  const usedSpoken = new Set();
  const refMatches = ref.map(() => null);
  spoken.forEach((sw, idx) => {
    const slot = ref.indexOf(sw);
    if (slot >= 0 && refMatches[slot] === null && !usedSpoken.has(idx)) {
      refMatches[slot] = idx;
      usedSpoken.add(idx);
    }
  });

  const spokenSet = new Set(spoken);
  return referenceWords.map((raw, i) => {
    const lower = ref[i];
    const matched = refMatches[i] !== null;
    const sameWordButWrongSlot = !matched && spokenSet.has(lower);
    return {
      word: raw,
      state: matched ? "good" : sameWordButWrongSlot ? "average" : "bad",
    };
  });
}

function scoreColour(score, max = 90) {
  if (score >= max * 0.7) return "stroke-teal-500";
  if (score >= max * 0.4) return "stroke-amber-500";
  return "stroke-red-500";
}

function scoreTextColour(score, max = 90) {
  if (score >= max * 0.7) return "text-teal-600";
  if (score >= max * 0.4) return "text-amber-600";
  return "text-red-600";
}

function RadialGauge({ value, max = 90, label }) {
  const radius = 56;
  const stroke = 12;
  const norm = Math.min(1, value / max);
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - norm);

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-orange-100"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={scoreColour(value, max)}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 800ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${scoreTextColour(value, max)}`}>{value}</span>
        <span className="text-[10px] text-slate-400">Out of {max}</span>
      </div>
    </div>
  );
}

function SubScore({ label, value, max = 90, hint }) {
  const ratio = max ? value / max : 0;
  const bar =
    ratio >= 0.7 ? "bg-teal-500" : ratio >= 0.4 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
          {value}/{max}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full ${bar} transition-all duration-700`}
          style={{ width: `${Math.min(100, ratio * 100)}%` }}
        />
      </div>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function wordColourClass(state) {
  if (state === "good") return "text-teal-600";
  if (state === "average") return "text-amber-600";
  return "text-red-500";
}

function wordBgClass(state) {
  if (state === "good") return "bg-teal-50 dark:bg-teal-900/30";
  if (state === "average") return "bg-amber-50 dark:bg-amber-900/30";
  return "bg-red-50 dark:bg-red-900/30";
}

/**
 * Generic AI Score modal for all four skills.
 *
 * Props:
 *   open       — controls visibility
 *   onClose    — close handler
 *   onRedo     — re-attempt the question
 *   onNext     — next question
 *   result     — the result object the page already produced
 *   question   — the question object (used for type label + transcript reference)
 *   skill      — "speaking" | "writing" | "reading" | "listening"
 *   extraText  — optional custom message shown above the waveform
 *   showWaveform — defaults to true only when a blob is present (speaking)
 */
export default function AiScoreModal({
  open,
  onClose,
  onRedo,
  onNext,
  result,
  question,
  skill = "speaking",
  extraText,
  showWaveform = true,
}) {
  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const expiresAt = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + REFERENCE_WINDOW_DAYS);
    return d;
  }, [REFERENCE_WINDOW_DAYS]);
  const expiryLabel = expiresAt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const classifiedWords = useMemo(() => {
    if (skill !== "speaking" || !result?.transcript || !question) return [];
    return classifyWords(result.transcript, splitReference(getReferenceText(question)));
  }, [skill, result?.transcript, question]);

  if (!open || !result || !question) return null;

  const overall = Math.max(0, Math.min(90, Math.round(result.overall ?? 0)));
  const subScores = { ...DEFAULT_SUB_SCORES, ...(result.subScores || {}) };

  const goodCount = classifiedWords.filter((w) => w.state === "good").length;
  const averageCount = classifiedWords.filter((w) => w.state === "average").length;
  const badCount = classifiedWords.filter((w) => w.state === "bad").length;

  const skillLabels = {
    speaking: "Speaking",
    writing: "Writing",
    reading: "Reading",
    listening: "Listening",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:py-8 overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-score-title"
        className="relative w-full max-w-3xl card shadow-2xl overflow-hidden animate-fade-in"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-400 px-5 py-4 flex items-center gap-3 text-white">
          <FiMonitor size={20} />
          <div className="flex-1">
            <h2 id="ai-score-title" className="font-semibold leading-tight">
              AI Score
            </h2>
            <p className="text-[11px] text-teal-50/80">
              {result?.aiScored
                ? "Live AI evaluation"
                : result?.aiUnavailable
                ? "Local practice score"
                : "AI scoring..."}
            </p>
          </div>
          <div className="hidden sm:block text-[10px] text-teal-50/70 text-right">
            <p>Question ID</p>
            <p className="font-mono">#{question.id}</p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {onRedo && (
              <button
                type="button"
                onClick={onRedo}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-medium"
              >
                <FiRotateCcw size={14} /> Re-do
              </button>
            )}
            {onNext && (
              <button
                type="button"
                onClick={onNext}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-teal-700 hover:bg-white/90 text-sm font-bold"
              >
                Next <FiArrowRight size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const text = `Scored ${overall}/90 on PTE Master practice`;
                if (navigator.share) {
                  navigator.share({ title: "AI Score", text }).catch(() => {});
                } else {
                  navigator.clipboard?.writeText(text);
                }
              }}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30"
              aria-label="Share"
            >
              <FiShare2 size={14} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30"
              aria-label="Close"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>

        {/* Score row */}
        <div className="px-5 py-5 grid sm:grid-cols-3 gap-5">
          <div className="flex flex-col items-center justify-center border border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800 rounded-xl py-4">
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">
              {skillLabels[skill] || skill}
            </p>
            <RadialGauge value={overall} max={90} />
            <p className="text-xs text-slate-500 mt-1">Overall score</p>
          </div>

          <div className="sm:col-span-2 border border-teal-200 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-800 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">
              Enabling Skills
            </p>
            <SubScore label={subScores.content.label} value={subScores.content.value} max={subScores.content.max} hint={subScores.content.hint} />
            <SubScore label={subScores.fluency.label} value={subScores.fluency.value} max={subScores.fluency.max} hint={subScores.fluency.hint} />
            <SubScore label={subScores.pronunciation.label} value={subScores.pronunciation.value} max={subScores.pronunciation.max} hint={subScores.pronunciation.hint} />
          </div>
        </div>

        {/* Optional waveform (only if a recording is present) */}
        {showWaveform && result.blob && (
          <div className="px-5 pb-4">
            <div className="rounded-xl border border-slate-100 dark:border-slate-700 p-3 bg-white dark:bg-slate-800/50">
              <Waveform
                blob={result.blob}
                fallbackDuration={Math.max(5, Math.round(result.duration || 0))}
              />
            </div>
          </div>
        )}

        {extraText && (
          <div className="px-5 pb-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {extraText}
          </div>
        )}

        {/* Speaking transcript panel (only for speaking) */}
        {skill === "speaking" && classifiedWords.length > 0 && (
          <div className="px-5 pb-4">
            <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/50">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  AI Speech to Text
                </p>
                <FiInfo className="text-slate-400" size={14} />
              </div>
              <div
                role="region"
                aria-label="AI speech transcript scored word by word"
                tabIndex={0}
                className="max-h-32 overflow-y-auto overscroll-contain p-4"
              >
                <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1 leading-relaxed text-base">
                  {classifiedWords.map((w, i) => (
                    <span
                      key={i}
                      className={`${wordColourClass(w.state)} px-0.5 rounded ${wordBgClass(w.state)}`}
                    >
                      {w.word}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 text-xs px-4 py-3 border-t border-slate-100 dark:border-slate-700 text-center">
                <span className="text-teal-600 font-semibold">
                  Good: {goodCount} word{goodCount === 1 ? "" : "s"}
                </span>
                <span className="text-amber-600 font-semibold">
                  Average: {averageCount} word{averageCount === 1 ? "" : "s"}
                </span>
                <span className="text-red-500 font-semibold">
                  Bad/Missed: {badCount} word{badCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Per-question item feedback for non-speaking skills */}
        {skill !== "speaking" && Array.isArray(result.items) && result.items.length > 0 && (
          <ItemBreakdown items={result.items} />
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
          <p className="text-xs text-slate-400">
            This score will disappear on <strong>{expiryLabel}</strong> — local demo only.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- item breakdown ---------------- */

function ItemBreakdown({ items }) {
  const correct = items.filter((i) => i.correct === true).length;
  const wrong = items.filter((i) => i.correct === false).length;
  const skipped = items.length - correct - wrong;

  return (
    <div className="px-5 pb-4">
      <div className="rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Per-item breakdown
          </p>
          <div className="text-xs flex gap-3">
            <span className="text-teal-600 font-semibold">{correct} correct</span>
            <span className="text-red-500 font-semibold">{wrong} wrong</span>
            {skipped > 0 && (
              <span className="text-slate-400 font-semibold">{skipped} skipped</span>
            )}
          </div>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-700 max-h-72 overflow-y-auto">
          {items.map((it, i) => (
            <li
              key={i}
              className={`px-4 py-3 text-sm flex items-start gap-3 ${
                it.correct === true
                  ? "bg-green-50/40 dark:bg-green-900/10"
                  : it.correct === false
                  ? "bg-red-50/40 dark:bg-red-900/10"
                  : ""
              }`}
            >
              <span
                className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                  it.correct === true
                    ? "bg-green-500 text-white"
                    : it.correct === false
                    ? "bg-red-500 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 font-medium mb-0.5">
                  {it.label}
                </p>
                <p className="text-navy dark:text-slate-200 truncate">{it.prompt}</p>
              </div>
              <div className="text-xs text-right shrink-0">
                <p
                  className={`font-bold ${
                    it.correct === true
                      ? "text-teal-600"
                      : it.correct === false
                      ? "text-red-500"
                      : "text-slate-400"
                  }`}
                >
                  {it.score}/90
                </p>
                <p className="text-slate-400">{it.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
