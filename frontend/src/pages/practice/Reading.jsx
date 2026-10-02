import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiCheck } from "react-icons/fi";
import { toast } from "react-toastify";
import QuestionCard from "../../components/practice/QuestionCard";
import QuestionTimer from "../../components/practice/QuestionTimer";
import TypeFilter from "../../components/practice/TypeFilter";
import Button from "../../components/common/Button";
import useQuestionSet from "../../hooks/useQuestionSet";
import useSkillQuestions from "../../hooks/useSkillQuestions";
import {
  scoreMultipleChoice,
  scoreFillBlanks,
  scoreReorder,
  incrementPractice,
  addTestHistory,
  addSkillHistory,
  getSkillHistory,
} from "../../utils/helpers";
import RecentScorePanel from "../../components/practice/RecentScorePanel";
import AnswerKey from "../../components/practice/AnswerKey";
import AiScoreModal from "../../components/practice/AiScoreModal";
import { buildReadingResult } from "../../utils/resultBuilders";
import { parseCorrectAnswer } from "../../utils/questionLoader";
import {
  mergeAiResult,
  requestAiScore,
  syncPracticeAttempt,
  updatePracticeAttempt,
} from "../../utils/aiScoring";

export default function Reading() {
  const { questions: readingQuestions, loading, online } = useSkillQuestions("reading");
  const {
    question, index, total, types, counts, typeFilter, changeFilter,
    next, prev, isFirst, isLast, progress, totalAll,
  } = useQuestionSet(readingQuestions);

  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState({});
  const [recentHistory, setRecentHistory] = useState(() => getSkillHistory("reading"));
  const startedAt = useRef(Date.now());
  const [scoreModal, setScoreModal] = useState(null);
  const navigate = useNavigate();

  const result = question ? checked[question.id] : null;

  useEffect(() => {
    startedAt.current = Date.now();
  }, [question?.id]);

  const handleCheck = async () => {
    if (question.type === "Multiple Choice") {
      const selected = answers[question.id];
      if (selected === undefined || (Array.isArray(selected) && selected.length === 0)) {
        toast.error("Select an answer first");
        return;
      }
    }

    let resultQuestion = question;
    let score;
    if (question.type === "Multiple Choice" && question._isBackend) {
      try {
        const response = await fetch(`/api/questions/${question.id}/check`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer: answers[question.id] }),
        });
        const payload = await response.json();
        if (!response.ok || !payload?.data) throw new Error("Answer check failed");

        const answer = parseCorrectAnswer(question.type, payload.data.correctAnswer);
        resultQuestion = { ...question, answer, multiSelect: Array.isArray(answer) };
        score = payload.data.correct ? 100 : 0;
      } catch {
        toast.error("Could not check your answer. Please try again.");
        return;
      }
    } else {
      score = computeScore();
    }
    const detail = computeDetail(score);
    const built = buildReadingResult(resultQuestion, answers[question.id]);

    setChecked((c) => ({
      ...c,
      [question.id]: {
        score,
        detail,
        explanation: question.explanation,
        built,
        answer: resultQuestion.answer,
        multiSelect: resultQuestion.multiSelect,
      },
    }));

    const nextHistory = addSkillHistory("reading", {
      id: `rd-${question.id}-${Date.now()}`,
      questionId: question.id,
      type: question.type,
      score,
      duration: 0,
      transcript:
        typeof answers[question.id] === "object"
          ? JSON.stringify(answers[question.id]).slice(0, 240)
          : String(answers[question.id] ?? "").slice(0, 240),
      takenAt: new Date().toISOString(),
    });
    setRecentHistory(nextHistory);

    incrementPractice("reading");
    setScoreModal({ built: { ...built, aiScored: false }, question });
    const attemptPromise = syncPracticeAttempt({
      skill: "reading",
      score: built.overall,
      durationSec: Math.max(60, Math.round((Date.now() - startedAt.current) / 1000)),
    }).catch(() => null);
    requestAiScore({
      skill: "reading",
      question,
      answer: answers[question.id],
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
    toast.success("Answer checked against sample key (unofficial).");
  };

  const computeScore = () => {
    if (question.type === "Multiple Choice") {
      return scoreMultipleChoice(answers[question.id], question.answer, question.multiSelect);
    }
    if (question.type === "Reading & Writing Fill in the Blanks") {
      const correct = Object.fromEntries(question.blanks.map((b) => [b.id, b.answer]));
      return scoreFillBlanks(answers[question.id] || {}, correct);
    }
    if (question.type === "Fill in the Blanks" && question.wordBank) {
      return scoreFillBlanks(answers[question.id] || {}, question.answers || {});
    }
    if (question.type === "Reorder Paragraphs") {
      const order = answers[question.id] || question.paragraphs.map((p) => p.id);
      return scoreReorder(order, question.correctOrder);
    }
    return 0;
  };

  const computeDetail = (score) => {
    if (question.type === "Multiple Choice") {
      return score === 100 ? "Correct!" : "Incorrect. See explanation below.";
    }
    if (question.type === "Reorder Paragraphs") {
      return score === 100
        ? "Perfect order!"
        : `Partial credit: ${score}%. Correct order shown below.`;
    }
    return `Score: ${score}/100.`;
  };

  const redoModal = () => {
    setScoreModal(null);
    setChecked((c) => {
      const next = { ...c };
      delete next[question.id];
      return next;
    });
    setAnswers((a) => {
      const next = { ...a };
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
    const scores = Object.values(checked);
    const avg =
      scores.length > 0
        ? Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length)
        : 0;
    addTestHistory({
      name: `Reading Practice${typeFilter !== "All" ? ` — ${typeFilter}` : ""}`,
      skill: "reading",
      score: avg,
      total: 100,
      completed: scores.length,
    });
    navigate("/practice/result", {
      state: {
        skill: "reading",
        score: avg,
        total: 100,
        answered: scores.length,
        details: checked,
        message: "Reading practice complete. Scores checked against unofficial sample answers.",
      },
    });
  };

  const goNext = () => {
    if (isLast) finish();
    else next();
  };

  if (!question) return null;

  const renderQuestion = () => {
    if (question.type === "Multiple Choice") {
      const selected = answers[question.id];
      const isMulti = question.multiSelect;
      return (
        <div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
            {question.passage}
          </p>
          <p className="font-medium text-navy dark:text-white mb-3">{question.question}</p>
          <div className="space-y-2">
            {question.options.map((opt, i) => {
              const isSelected = isMulti
                ? Array.isArray(selected) && selected.includes(i)
                : selected === i;
              const show = !!result;
              const correctAnswer = result?.answer ?? question.answer;
              const correctIsMulti = result?.multiSelect ?? isMulti;
              const isCorrect = correctIsMulti
                ? Array.isArray(correctAnswer) && correctAnswer.includes(i)
                : correctAnswer === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (result) return;
                    if (isMulti) {
                      const cur = Array.isArray(selected) ? [...selected] : [];
                      const idx = cur.indexOf(i);
                      if (idx >= 0) cur.splice(idx, 1);
                      else cur.push(i);
                      setAnswers({ ...answers, [question.id]: cur });
                    } else {
                      setAnswers({ ...answers, [question.id]: i });
                    }
                  }}
                  className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-colors ${
                    show && isCorrect
                      ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                      : show && isSelected && !isCorrect
                      ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                      : isSelected
                      ? "border-brand bg-blue-50 dark:bg-blue-900/20"
                      : "border-slate-200 dark:border-slate-600 hover:border-brand/50"
                  }`}
                >
                  <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (question.type === "Reading & Writing Fill in the Blanks") {
      const userAns = answers[question.id] || {};
      const parts = question.passage.split(/(___\d___)/);
      return (
        <div className="leading-relaxed text-navy dark:text-white space-y-1">
          <p className="flex flex-wrap items-center gap-1">
            {parts.map((part, i) => {
              const m = part.match(/___(\d)___/);
              if (!m) return <span key={i}>{part}</span>;
              const blankId = Number(m[1]);
              const blank = question.blanks.find((b) => b.id === blankId);
              return (
                <select
                  key={i}
                  className="input w-auto inline-block mx-1 py-1 px-2 text-sm"
                  value={userAns[blankId] || ""}
                  disabled={!!result}
                  onChange={(e) =>
                    setAnswers({
                      ...answers,
                      [question.id]: { ...userAns, [blankId]: e.target.value },
                    })
                  }
                >
                  <option value="">Select...</option>
                  {blank.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              );
            })}
          </p>
        </div>
      );
    }

    if (question.type === "Fill in the Blanks") {
      const userAns = answers[question.id] || {};
      const used = new Set(Object.values(userAns));
      const parts = question.passage.split(/(__\d__)/);
      return (
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            {question.wordBank.map((w) => (
              <span
                key={w}
                className={`badge px-3 py-1.5 ${
                  used.has(w)
                    ? "bg-slate-100 text-slate-400 line-through"
                    : "bg-blue-50 text-brand dark:bg-blue-900/30"
                }`}
              >
                {w}
              </span>
            ))}
          </div>
          <p className="leading-relaxed text-navy dark:text-white flex flex-wrap items-center gap-1">
            {parts.map((part, i) => {
              const m = part.match(/__(\d)__/);
              if (!m) return <span key={i}>{part}</span>;
              const blankId = Number(m[1]);
              return (
                <select
                  key={i}
                  className="input w-auto inline-block mx-1 py-1 px-2 text-sm"
                  value={userAns[blankId] || ""}
                  disabled={!!result}
                  onChange={(e) =>
                    setAnswers({
                      ...answers,
                      [question.id]: { ...userAns, [blankId]: e.target.value },
                    })
                  }
                >
                  <option value="">___</option>
                  {question.wordBank.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              );
            })}
          </p>
        </div>
      );
    }

    if (question.type === "Reorder Paragraphs") {
      const order = answers[question.id] || question.paragraphs.map((p) => p.id);
      const byId = Object.fromEntries(question.paragraphs.map((p) => [p.id, p]));

      const move = (from, to) => {
        if (result) return;
        const next = [...order];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        setAnswers({ ...answers, [question.id]: next });
      };

      return (
        <div className="space-y-2">
          <p className="text-sm text-slate-500 mb-3">
            Drag order using the up/down buttons to restore the paragraph sequence.
          </p>
          {order.map((id, i) => (
            <div
              key={id}
              className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-600 p-4 bg-white dark:bg-slate-800"
            >
              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                {i + 1}
              </span>
              <p className="flex-1 text-sm text-navy dark:text-white">{byId[id]?.text}</p>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  disabled={i === 0 || !!result}
                  onClick={() => move(i, i - 1)}
                  className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={i === order.length - 1 || !!result}
                  onClick={() => move(i, i + 1)}
                  className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 disabled:opacity-40"
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
          {result && (
            <p className="text-sm text-slate-500 mt-2">
              Correct order:{" "}
              {question.correctOrder.map((id) => byId[id]?.text.slice(0, 40) + "…").join(" → ")}
            </p>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="section-padding py-10">
      <div className="container-main max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="page-title">Reading Practice</h1>
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
          {renderQuestion()}
          {result && (
            <div className="mt-5">
              <AnswerKey
                question={question}
                userAnswer={answers[question.id]}
                mode="reading"
              />
            </div>
          )}
        </QuestionCard>

        <div className="flex flex-wrap justify-between gap-3 mt-6">
          <Button variant="secondary" onClick={prev} disabled={isFirst}>
            <FiChevronLeft /> Previous
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCheck} disabled={!!result}>
              <FiCheck size={14} /> Check Answer
            </Button>
            <Button onClick={goNext}>
              {isLast ? "Submit Test" : "Next"} <FiChevronRight />
            </Button>
          </div>
        </div>
      </div>

      <RecentScorePanel
        recent={recentHistory}
        historyKey="pte_reading_panel"
        skill="reading"
      />

      <AiScoreModal
        open={!!scoreModal}
        result={scoreModal?.built}
        question={scoreModal?.question}
        skill="reading"
        extraText={scoreModal?.built?.feedback || scoreModal?.built?.detail}
        showWaveform={false}
        onClose={() => setScoreModal(null)}
        onRedo={redoModal}
        onNext={nextFromModal}
      />
    </div>
  );
}
