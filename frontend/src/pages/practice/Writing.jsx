import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiSave, FiTrash2, FiSend } from "react-icons/fi";
import { toast } from "react-toastify";
import QuestionCard from "../../components/practice/QuestionCard";
import QuestionTimer from "../../components/practice/QuestionTimer";
import WordCounter from "../../components/practice/WordCounter";
import TypeFilter from "../../components/practice/TypeFilter";
import Button from "../../components/common/Button";
import useQuestionSet from "../../hooks/useQuestionSet";
import useSkillQuestions from "../../hooks/useSkillQuestions";
import {
  countWords,
  saveToStorage,
  loadFromStorage,
  incrementPractice,
  scoreWritingByLength,
  addTestHistory,
  addSkillHistory,
  getSkillHistory,
} from "../../utils/helpers";
import RecentScorePanel from "../../components/practice/RecentScorePanel";
import AiScoreModal from "../../components/practice/AiScoreModal";
import { buildWritingResult } from "../../utils/resultBuilders";
import {
  mergeAiResult,
  requestAiScore,
  syncPracticeAttempt,
  updatePracticeAttempt,
} from "../../utils/aiScoring";

export default function Writing() {
  const { questions: writingQuestions, loading, online } = useSkillQuestions("writing");
  const {
    question, index, total, types, counts, typeFilter, changeFilter,
    next, prev, isFirst, isLast, progress, totalAll,
  } = useQuestionSet(writingQuestions);

  const [answers, setAnswers] = useState(() => loadFromStorage("pte_writing_drafts", {}));
  const [results, setResults] = useState({});
  const [recentHistory, setRecentHistory] = useState(() => getSkillHistory("writing"));
  const startedAt = useRef(Date.now());
  const [scoreModal, setScoreModal] = useState(null);
  const navigate = useNavigate();

  const text = question ? answers[question.id] || "" : "";

  useEffect(() => {
    startedAt.current = Date.now();
  }, [question?.id]);

  useEffect(() => {
    saveToStorage("pte_writing_drafts", answers);
  }, [answers]);

  const setText = (value) => {
    setAnswers((a) => ({ ...a, [question.id]: value }));
  };

  const handleSaveDraft = () => {
    saveToStorage("pte_writing_drafts", answers);
    toast.success("Draft saved to localStorage");
  };

  const handleClear = () => {
    setText("");
    toast.info("Answer cleared");
  };

  const handleSubmit = () => {
    const words = countWords(text);
    if (words === 0) {
      toast.error("Please write a response before submitting");
      return;
    }
    const score = scoreWritingByLength(text, question.wordMin, question.wordMax);
    const result = {
      score,
      words,
      feedback:
        words < question.wordMin
          ? `Under the target word count (${question.wordMin}–${question.wordMax}).`
          : words > question.wordMax
          ? `Over the target word count (${question.wordMin}–${question.wordMax}).`
          : "Word count is within the target range. Unofficial practice score based on length only — not content quality.",
      sample: question.sampleSummary || question.sampleOutline,
    };
    setResults((r) => ({ ...r, [question.id]: result }));

    const built = buildWritingResult(question, text);
    const nextHistory = addSkillHistory("writing", {
      id: `wr-${question.id}-${Date.now()}`,
      questionId: question.id,
      type: question.type,
      score,
      duration: 0,
      transcript: text.slice(0, 240),
      takenAt: new Date().toISOString(),
    });
    setRecentHistory(nextHistory);
    setScoreModal({ built: { ...built, aiScored: false }, question });
    const attemptPromise = syncPracticeAttempt({
      skill: "writing",
      score: built.overall,
      durationSec: Math.max(60, Math.round((Date.now() - startedAt.current) / 1000)),
    }).catch(() => null);
    requestAiScore({
      skill: "writing",
      question,
      answer: text,
      localResult: built,
    })
      .then((aiResult) => {
        attemptPromise.then((attemptId) => updatePracticeAttempt(attemptId, aiResult.overall));
        setScoreModal((current) =>
          current?.question?.id === question.id
            ? { ...current, built: mergeAiResult(current.built, aiResult) }
            : current
        );
      })
      .catch(() => {
        setScoreModal((current) =>
          current?.question?.id === question.id
            ? { ...current, built: { ...current.built, aiUnavailable: true } }
            : current
        );
      });

    incrementPractice("writing");
    toast.success("Submitted — unofficial practice score based on word count guidelines.");
  };

  const redoModal = () => {
    setScoreModal(null);
    setResults((r) => {
      const next = { ...r };
      delete next[question.id];
      return next;
    });
  };

  const nextFromModal = () => {
    setScoreModal(null);
    if (isLast) finish();
    else next();
  };

  const finish = () => {
    const scored = Object.values(results);
    const avg =
      scored.length > 0
        ? Math.round(scored.reduce((s, r) => s + r.score, 0) / scored.length)
        : 0;
    addTestHistory({
      name: `Writing Practice${typeFilter !== "All" ? ` — ${typeFilter}` : ""}`,
      skill: "writing",
      score: avg,
      total: 100,
      completed: scored.length,
    });
    navigate("/practice/result", {
      state: {
        skill: "writing",
        score: avg,
        total: 100,
        answered: scored.length,
        message:
          "Writing practice complete. Scores are unofficial and based mainly on word-count targets, not AI content grading.",
      },
    });
  };

  const goNext = () => {
    if (isLast) finish();
    else next();
  };

  if (!question) return null;

  return (
    <div className="section-padding py-10">
      <div className="container-main max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="page-title">Writing Practice</h1>
            <p className="page-subtitle">
              Question {index + 1} of {total}
              {typeFilter !== "All" && ` · ${typeFilter}`}
            </p>
            {loading && (
              <p className="text-xs text-slate-400">Syncing admin questions…</p>
            )}
            {!loading && online && (
              <p className="text-xs text-slate-400">
                Includes admin-published questions
              </p>
            )}
          </div>
          <QuestionTimer
            key={question.id}
            seconds={question.timeLimit}
            onTimeUp={() => toast.warning("Time is up!")}
          />
        </div>

        <TypeFilter
          types={types}
          counts={counts}
          value={typeFilter}
          onChange={changeFilter}
          total={totalAll}
        />

        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 mb-6 overflow-hidden">
          <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
        </div>

        <QuestionCard type={question.type} difficulty={question.difficulty}>
          <div className="prose dark:prose-invert max-w-none mb-6">
            <p className="text-navy dark:text-white leading-relaxed whitespace-pre-wrap">
              {question.prompt}
            </p>
          </div>

          <label className="label" htmlFor="writing-answer">
            Your response
          </label>
          <textarea
            id="writing-answer"
            rows={question.type === "Write Essay" ? 14 : 6}
            className="input font-normal leading-relaxed resize-y min-h-[140px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your answer here..."
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <WordCounter text={text} min={question.wordMin} max={question.wordMax} />
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={handleClear}>
                <FiTrash2 size={14} /> Clear
              </Button>
              <Button size="sm" variant="secondary" onClick={handleSaveDraft}>
                <FiSave size={14} /> Save Draft
              </Button>
            </div>
          </div>

          {results[question.id] && (
            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-4 space-y-2">
              <p className="font-semibold text-green-800 dark:text-green-200">
                Unofficial practice score: {results[question.id].score}/100
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {results[question.id].feedback}
              </p>
              {results[question.id].sample && (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <strong>Sample guidance:</strong> {results[question.id].sample}
                </p>
              )}
            </div>
          )}
        </QuestionCard>

        <div className="flex flex-wrap justify-between gap-3 mt-6">
          <Button variant="secondary" onClick={prev} disabled={isFirst}>
            <FiChevronLeft /> Previous
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSubmit}>
              <FiSend size={14} /> Submit Answer
            </Button>
            <Button onClick={goNext}>
              {isLast ? "Finish" : "Next"} <FiChevronRight />
            </Button>
          </div>
        </div>
      </div>

      <RecentScorePanel
        recent={recentHistory}
        historyKey="pte_writing_panel"
        skill="writing"
      />

      <AiScoreModal
        open={!!scoreModal}
        result={scoreModal?.built}
        question={scoreModal?.question}
        skill="writing"
        extraText={scoreModal?.built?.feedback || scoreModal?.built?.detail}
        showWaveform={false}
        onClose={() => setScoreModal(null)}
        onRedo={redoModal}
        onNext={nextFromModal}
      />
    </div>
  );
}
