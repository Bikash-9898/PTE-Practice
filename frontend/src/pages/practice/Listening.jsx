import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiCheck } from "react-icons/fi";
import { toast } from "react-toastify";
import QuestionCard from "../../components/practice/QuestionCard";
import QuestionTimer from "../../components/practice/QuestionTimer";
import AudioPlayer from "../../components/practice/AudioPlayer";
import WordCounter from "../../components/practice/WordCounter";
import TypeFilter from "../../components/practice/TypeFilter";
import Button from "../../components/common/Button";
import useQuestionSet from "../../hooks/useQuestionSet";
import useSkillQuestions from "../../hooks/useSkillQuestions";
import {
  scoreDictation,
  scoreMultipleChoice,
  scoreFillBlanks,
  scoreHighlightIncorrect,
  scoreWritingByLength,
  incrementPractice,
  addTestHistory,
  countWords,
  addSkillHistory,
  getSkillHistory,
} from "../../utils/helpers";
import RecentScorePanel from "../../components/practice/RecentScorePanel";
import AnswerKey from "../../components/practice/AnswerKey";
import AiScoreModal from "../../components/practice/AiScoreModal";
import { buildListeningResult } from "../../utils/resultBuilders";
import {
  mergeAiResult,
  requestAiScore,
  syncPracticeAttempt,
  updatePracticeAttempt,
} from "../../utils/aiScoring";

export default function Listening() {
  const { questions: listeningQuestions, loading, online } = useSkillQuestions("listening");
  const {
    question, index, total, types, counts, typeFilter, changeFilter,
    next, prev, isFirst, isLast, progress, totalAll,
  } = useQuestionSet(listeningQuestions);

  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState({});
  const [recentHistory, setRecentHistory] = useState(() => getSkillHistory("listening"));
  const startedAt = useRef(Date.now());
  const [scoreModal, setScoreModal] = useState(null);
  const navigate = useNavigate();

  const result = question ? checked[question.id] : null;
  const answer = question ? answers[question.id] : undefined;

  useEffect(() => {
    startedAt.current = Date.now();
  }, [question?.id]);

  const handleCheck = () => {
    let score = 0;
    let detail = "";

    switch (question.type) {
      case "Summarize Spoken Text": {
        const text = answer || "";
        if (!countWords(text)) {
          toast.error("Write a summary first");
          return;
        }
        score = scoreWritingByLength(text, question.wordMin, question.wordMax);
        detail = `Word-count based practice score. Sample: ${question.sampleSummary}`;
        break;
      }
      case "Fill in the Blanks": {
        score = scoreFillBlanks(answer || {}, question.answers);
        detail = `Blanks score: ${score}%`;
        break;
      }
      case "Multiple Choice": {
        if (answer === undefined) {
          toast.error("Select an option");
          return;
        }
        score = scoreMultipleChoice(answer, question.answer, false);
        detail = score === 100 ? "Correct!" : `Incorrect. ${question.explanation || ""}`;
        break;
      }
      case "Highlight Incorrect Words": {
        const selected = answer || [];
        if (!selected.length) {
          toast.error("Click words you think are incorrect");
          return;
        }
        score = scoreHighlightIncorrect(selected, question.incorrectWords);
        detail = `Incorrect words were: ${question.incorrectWords.join(", ")}. Correct: ${question.correctWords.join(", ")}`;
        break;
      }
      case "Write from Dictation": {
        if (!(answer || "").trim()) {
          toast.error("Type what you heard");
          return;
        }
        score = scoreDictation(answer, question.sampleAnswer);
        detail = `Match to sample: "${question.sampleAnswer}"`;
        break;
      }
      default:
        break;
    }

    setChecked((c) => ({ ...c, [question.id]: { score, detail } }));

    const built = buildListeningResult(question, answer);

    const nextHistory = addSkillHistory("listening", {
      id: `ls-${question.id}-${Date.now()}`,
      questionId: question.id,
      type: question.type,
      score,
      duration: 0,
      transcript: typeof answer === "string" ? answer.slice(0, 240) : "",
      takenAt: new Date().toISOString(),
    });
    setRecentHistory(nextHistory);
    setScoreModal({ built: { ...built, aiScored: false }, question });
    const attemptPromise = syncPracticeAttempt({
      skill: "listening",
      score: built.overall,
      durationSec: Math.max(60, Math.round((Date.now() - startedAt.current) / 1000)),
    }).catch(() => null);
    requestAiScore({
      skill: "listening",
      question,
      answer,
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

    incrementPractice("listening");
    toast.success("Checked against sample answers (unofficial practice).");
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
      name: `Listening Practice${typeFilter !== "All" ? ` — ${typeFilter}` : ""}`,
      skill: "listening",
      score: avg,
      total: 100,
      completed: scores.length,
    });
    navigate("/practice/result", {
      state: {
        skill: "listening",
        score: avg,
        total: 100,
        answered: scores.length,
        message: "Listening practice complete. Audio used demo TTS or simulated playback.",
      },
    });
  };

  const toggleWord = (word, idx) => {
    if (result) return;
    const key = `${word}__${idx}`;
    const cur = answer || [];
    const next = cur.includes(key) ? cur.filter((w) => w !== key) : [...cur, key];
    // store display words for scoring
    const words = next.map((k) => k.split("__")[0]);
    setAnswers({ ...answers, [question.id]: words, [`${question.id}_keys`]: next });
  };

  if (!question) return null;

  const renderBody = () => {
    if (question.type === "Summarize Spoken Text") {
      return (
        <div>
          <AudioPlayer text={question.audioText} label="Spoken text (demo TTS)" showVoiceSelector />
          <p className="text-sm text-slate-500 my-4">{question.prompt}</p>
          <textarea
            className="input min-h-[120px] resize-y"
            value={answer || ""}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            disabled={!!result}
            placeholder="Write your summary..."
          />
          <div className="mt-2">
            <WordCounter text={answer || ""} min={question.wordMin} max={question.wordMax} />
          </div>
        </div>
      );
    }

    if (question.type === "Fill in the Blanks") {
      const userAns = answer || {};
      const parts = question.passage.split(/(___\d___)/);
      return (
        <div>
          <AudioPlayer text={question.audioText} label="Listen and fill the blanks" showVoiceSelector />
          <p className="mt-4 leading-relaxed flex flex-wrap items-center gap-1 text-navy dark:text-white">
            {parts.map((part, i) => {
              const m = part.match(/___(\d)___/);
              if (!m) return <span key={i}>{part}</span>;
              const id = Number(m[1]);
              return (
                <input
                  key={i}
                  className="input w-28 inline-block mx-1 py-1 px-2 text-sm"
                  value={userAns[id] || ""}
                  disabled={!!result}
                  onChange={(e) =>
                    setAnswers({
                      ...answers,
                      [question.id]: { ...userAns, [id]: e.target.value },
                    })
                  }
                />
              );
            })}
          </p>
        </div>
      );
    }

    if (question.type === "Multiple Choice") {
      return (
        <div>
          <AudioPlayer text={question.audioText} label="Listen to the audio" showVoiceSelector />
          <p className="font-medium text-navy dark:text-white my-4">{question.question}</p>
          <div className="space-y-2">
            {question.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                disabled={!!result}
                onClick={() => setAnswers({ ...answers, [question.id]: i })}
                className={`w-full text-left rounded-xl border px-4 py-3 text-sm ${
                  answer === i
                    ? "border-brand bg-blue-50 dark:bg-blue-900/20"
                    : "border-slate-200 dark:border-slate-600"
                }`}
              >
                <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (question.type === "Highlight Incorrect Words") {
      const words = question.displayText.split(/(\s+)/);
      const selectedKeys = answers[`${question.id}_keys`] || [];
      return (
        <div>
          <AudioPlayer text={question.audioText} label="Listen, then highlight incorrect words" showVoiceSelector />
          <p className="text-sm text-slate-500 my-3">
            Click words in the transcript that differ from what you heard.
          </p>
          <div className="leading-loose text-lg p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
            {words.map((w, i) => {
              if (/^\s+$/.test(w)) return <span key={i}>{w}</span>;
              const key = `${w.replace(/[.,]/g, "")}__${i}`;
              const clean = w.replace(/[.,]/g, "");
              const active = selectedKeys.includes(key);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleWord(clean, i)}
                  className={`mx-0.5 px-1 rounded ${
                    active ? "bg-red-200 text-red-800 dark:bg-red-900/50" : "hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {w}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (question.type === "Write from Dictation") {
      return (
        <div>
          <AudioPlayer text={question.audioText} label="Listen and type the sentence" showVoiceSelector />
          <input
            className="input mt-4"
            value={answer || ""}
            disabled={!!result}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            placeholder="Type exactly what you hear..."
          />
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
            <h1 className="page-title">Listening Practice</h1>
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
          {renderBody()}
          {result && (
            <div className="mt-5">
              <AnswerKey
                question={question}
                userAnswer={answer}
                mode="listening"
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
              <FiCheck size={14} /> Check
            </Button>
            <Button onClick={() => (isLast ? finish() : next())}>
              {isLast ? "Finish" : "Next"} <FiChevronRight />
            </Button>
          </div>
        </div>
      </div>

      <RecentScorePanel
        recent={recentHistory}
        historyKey="pte_listening_panel"
        skill="listening"
      />

      <AiScoreModal
        open={!!scoreModal}
        result={scoreModal?.built}
        question={scoreModal?.question}
        skill="listening"
        extraText={scoreModal?.built?.feedback || scoreModal?.built?.detail}
        showWaveform={false}
        onClose={() => setScoreModal(null)}
        onRedo={redoModal}
        onNext={nextFromModal}
      />
    </div>
  );
}
