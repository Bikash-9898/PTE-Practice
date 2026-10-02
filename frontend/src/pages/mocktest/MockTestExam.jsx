import { useState, useMemo, useCallback } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiFlag } from "react-icons/fi";
import { toast } from "react-toastify";
import { getMockTestById, getMockTestQuestions } from "../../data/mockTests";
import QuestionCard from "../../components/practice/QuestionCard";
import QuestionTimer from "../../components/practice/QuestionTimer";
import AudioPlayer from "../../components/practice/AudioPlayer";
import WordCounter from "../../components/practice/WordCounter";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import {
  scoreMultipleChoice,
  scoreFillBlanks,
  scoreDictation,
  scoreWritingByLength,
  addTestHistory,
} from "../../utils/helpers";

export default function MockTestExam() {
  const { id } = useParams();
  const test = useMemo(() => getMockTestById(id), [id]);
  const questions = useMemo(() => getMockTestQuestions(id), [id]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [flagged, setFlagged] = useState({});
  const navigate = useNavigate();

  const question = questions[index] || questions[0];
  const sections = useMemo(() => [...new Set(questions.map((q) => q.section))], [questions]);
  const totalSeconds = (test?.duration || 60) * 60;

  const setAnswer = (value) => {
    if (!question) return;
    setAnswers((a) => ({ ...a, [question.id]: value }));
  };

  const handleSubmit = useCallback(() => {
    if (!test) return;
    const details = questions.map((q) => {
      const ans = answers[q.id];
      let score = null;
      let correct = null;

      if (q.type === "Multiple Choice") {
        score = ans === undefined ? 0 : scoreMultipleChoice(ans, q.answer, q.multiSelect);
        correct = score === 100;
      } else if (q.type === "Fill in the Blanks") {
        score = scoreFillBlanks(ans || {}, q.answers || {});
        correct = score === 100;
      } else if (q.type === "Write from Dictation") {
        score = ans ? scoreDictation(ans, q.sampleAnswer) : 0;
        correct = score >= 80;
      } else if (q.type === "Write Essay" || q.type === "Summarize Written Text") {
        score = ans ? scoreWritingByLength(ans, q.wordMin || 5, q.wordMax || 300) : 0;
        correct = score >= 60;
      } else if (
        q.type === "Read Aloud" ||
        q.type === "Answer Short Question" ||
        q.type === "Repeat Sentence"
      ) {
        score = ans ? 50 : 0;
        correct = null;
      } else {
        score = ans ? 40 : 0;
        correct = null;
      }

      return {
        id: q.id,
        section: q.section,
        type: q.type,
        score,
        correct,
        userAnswer: ans,
        prompt: q.prompt || q.question,
      };
    });

    const scored = details.filter((d) => d.score !== null);
    const avg =
      scored.length > 0
        ? Math.round(scored.reduce((s, d) => s + d.score, 0) / scored.length)
        : 0;

    addTestHistory({
      name: test.title,
      skill: "mock",
      score: avg,
      total: 100,
      testId: id,
      completed: Object.keys(answers).length,
    });
    sessionStorage.setItem(
      `pte_mock_result_${id}`,
      JSON.stringify({
        avg,
        details,
        testTitle: test.title,
        answered: Object.keys(answers).length,
      })
    );
    toast.success("Test submitted — unofficial practice results ready.");
    navigate(`/mock-tests/${id}/result`);
  }, [answers, id, navigate, questions, test]);

  if (!test) return <Navigate to="/mock-tests" replace />;
  if (!question) return <Navigate to={`/mock-tests/${id}`} replace />;

  const renderQuestion = () => {
    if (question.type === "Multiple Choice") {
      return (
        <div>
          {question.passage && (
            <p className="mb-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm leading-relaxed">
              {question.passage}
            </p>
          )}
          {question.audioText && (
            <div className="mb-4">
              <AudioPlayer text={question.audioText} />
            </div>
          )}
          <p className="font-medium mb-3 text-navy dark:text-white">
            {question.question || question.prompt}
          </p>
          <div className="space-y-2">
            {question.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setAnswer(i)}
                className={`w-full text-left rounded-xl border px-4 py-3 text-sm ${
                  answers[question.id] === i
                    ? "border-brand bg-blue-50 dark:bg-blue-900/20"
                    : "border-slate-200 dark:border-slate-600"
                }`}
              >
                {String.fromCharCode(65 + i)}. {opt}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (question.type === "Fill in the Blanks") {
      const userAns = answers[question.id] || {};
      const parts = (question.passage || "").split(/(__\d__)/);
      return (
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            {(question.wordBank || []).map((w) => (
              <span key={w} className="badge bg-blue-50 text-brand">
                {w}
              </span>
            ))}
          </div>
          <p className="leading-relaxed flex flex-wrap items-center gap-1">
            {parts.map((part, i) => {
              const m = part.match(/__(\d)__/);
              if (!m) return <span key={i}>{part}</span>;
              const bid = Number(m[1]);
              return (
                <select
                  key={i}
                  className="input w-auto py-1 px-2 text-sm mx-1"
                  value={userAns[bid] || ""}
                  onChange={(e) => setAnswer({ ...userAns, [bid]: e.target.value })}
                >
                  <option value="">___</option>
                  {(question.wordBank || []).map((w) => (
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

    if (question.type === "Write from Dictation") {
      return (
        <div>
          <AudioPlayer text={question.audioText} />
          <input
            className="input mt-4"
            value={answers[question.id] || ""}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type the sentence..."
          />
        </div>
      );
    }

    if (question.type === "Write Essay" || question.type === "Summarize Written Text") {
      const text = answers[question.id] || "";
      return (
        <div>
          <p className="mb-4 leading-relaxed text-navy dark:text-white whitespace-pre-wrap">
            {question.prompt}
          </p>
          <textarea
            className="input min-h-[160px] resize-y"
            value={text}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <div className="mt-2">
            <WordCounter text={text} min={question.wordMin} max={question.wordMax} />
          </div>
        </div>
      );
    }

    return (
      <div>
        <p className="text-lg leading-relaxed text-navy dark:text-white mb-4">{question.prompt}</p>
        {question.sampleAnswer && (
          <p className="text-xs text-slate-400 mb-3">Sample (review later): {question.sampleAnswer}</p>
        )}
        <textarea
          className="input min-h-[80px]"
          placeholder="Optional notes or typed response for this demo..."
          value={answers[question.id] || ""}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <p className="text-xs text-slate-400 mt-2">
          Speaking items in this mock test accept notes only — no automated speech scoring.
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-navy">
      <div className="sticky top-0 z-20 bg-white dark:bg-navy-light border-b border-slate-100 dark:border-slate-700 px-4 py-3">
        <div className="container-main flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-navy dark:text-white text-sm">{test.title}</p>
            <p className="text-xs text-slate-400">
              Q{index + 1}/{questions.length} · {question.section}
            </p>
          </div>
          <QuestionTimer
            seconds={totalSeconds}
            onTimeUp={() => {
              toast.warning("Time is up — submitting your test.");
              handleSubmit();
            }}
            warningAt={120}
          />
          <Button size="sm" variant="danger" onClick={() => setConfirmOpen(true)}>
            <FiFlag size={14} /> Submit
          </Button>
        </div>
        <div className="container-main mt-2">
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-brand transition-all"
              style={{ width: `${((index + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="container-main max-w-4xl px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-4">
          {sections.map((sec) => {
            const firstIdx = questions.findIndex((q) => q.section === sec);
            return (
              <button
                key={sec}
                type="button"
                onClick={() => setIndex(firstIdx)}
                className={`badge px-3 py-1 ${
                  question.section === sec
                    ? "bg-brand text-white"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {sec}
              </button>
            );
          })}
        </div>

        <QuestionCard type={question.type} difficulty={null}>
          {renderQuestion()}
        </QuestionCard>

        <div className="flex flex-wrap gap-2 mt-4">
          {questions.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`w-9 h-9 rounded-lg text-xs font-semibold ${
                i === index
                  ? "bg-brand text-white"
                  : answers[q.id] !== undefined
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40"
                  : flagged[q.id]
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="flex justify-between mt-6">
          <Button variant="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>
            <FiChevronLeft /> Previous
          </Button>
          <Button
            variant="ghost"
            onClick={() => setFlagged((f) => ({ ...f, [question.id]: !f[question.id] }))}
          >
            {flagged[question.id] ? "Unflag" : "Flag"}
          </Button>
          <Button disabled={index === questions.length - 1} onClick={() => setIndex(index + 1)}>
            Next <FiChevronRight />
          </Button>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Submit test?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Continue
            </Button>
            <Button onClick={handleSubmit}>Submit Now</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          You have answered {Object.keys(answers).length} of {questions.length} questions. Submit to
          see your unofficial practice results?
        </p>
      </Modal>
    </div>
  );
}
