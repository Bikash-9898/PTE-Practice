import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiSend, FiBookmark } from "react-icons/fi";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import QuestionCard from "../../components/practice/QuestionCard";
import QuestionTimer from "../../components/practice/QuestionTimer";
import AudioRecorder from "../../components/practice/AudioRecorder";
import AudioPlayer from "../../components/practice/AudioPlayer";
import TypeFilter from "../../components/practice/TypeFilter";
import SpeakingScoreCard from "../../components/practice/SpeakingScoreCard";
import AiScoreModal from "../../components/practice/AiScoreModal";
import Button from "../../components/common/Button";
import useQuestionSet from "../../hooks/useQuestionSet";
import useSkillQuestions from "../../hooks/useSkillQuestions";
import { scoreSpeakingResponse } from "../../utils/speakingScore";
import {
  incrementPractice,
  toggleSavedQuestion,
  isQuestionSaved,
  addTestHistory,
  addSkillHistory,
  getSkillHistory,
} from "../../utils/helpers";
import RecentScorePanel from "../../components/practice/RecentScorePanel";
import {
  mergeAiResult,
  requestAiScore,
  syncPracticeAttempt,
  updatePracticeAttempt,
} from "../../utils/aiScoring";

const FRIENDLY_TYPE_LABELS = {
  "Retell Lecture": "Re-tell Lecture",
};

function friendlyTypeLabel(type) {
  return FRIENDLY_TYPE_LABELS[type] || type;
}

function ChartIllustration({ data, unit }) {
  const max = Math.max(...data.map((d) => d.value)) || 1;
  return (
    <div className="flex items-end gap-3 h-44">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          <span className="text-xs font-semibold text-slate-500">{d.value}</span>
          <div
            className="w-full rounded-t-lg bg-brand min-h-[4px]"
            style={{ height: `${(d.value / max) * 100}%` }}
          />
          <span className="text-[11px] text-slate-500 text-center leading-tight">{d.label}</span>
        </div>
      ))}
      {unit && <span className="text-[10px] text-slate-400 self-start">{unit}</span>}
    </div>
  );
}

export default function Speaking() {
  const [params] = useSearchParams();
  const { questions: speakingQuestions, loading, online } = useSkillQuestions("speaking");
  const initialId = params.get("start");
  const initial = initialId ? speakingQuestions.find((q) => q.id === initialId) : null;
  const initialType = initial?.type ?? "All";

  const {
    question, index, total, types, counts, typeFilter, changeFilter,
    next, prev, isFirst, isLast, progress, totalAll,
  } = useQuestionSet(speakingQuestions, {
    initialType,
    initialId: initial?.id,
  });

  const [recording, setRecording] = useState(null);
  const [submitted, setSubmitted] = useState({});
  const [phase, setPhase] = useState("prep"); // prep | answer
  const [saved, setSaved] = useState(false);
  const [scoreModal, setScoreModal] = useState(null); // question whose result is being shown
  const [recentHistory, setRecentHistory] = useState(() => getSkillHistory("speaking"));
  const startedAt = useRef(Date.now());
  const navigate = useNavigate();

  // Reset per-question state whenever the active question changes.
  useEffect(() => {
    startedAt.current = Date.now();
    setRecording(null);
    setPhase("prep");
    setSaved(question ? isQuestionSaved(question.id) : false);
  }, [question?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const needsAudio =
    question?.type === "Read Aloud" ||
    question?.type === "Repeat Sentence" ||
    question?.type === "Retell Lecture";

  const timerSeconds = useMemo(() => {
    if (!question) return 0;
    return phase === "prep" ? question.prepTime || 10 : question.timeLimit || 40;
  }, [question, phase]);

  if (!question) return null;

  const handleTimeUp = () => {
    if (phase === "prep") {
      setPhase("answer");
      toast.info("Preparation time over — start your response.");
    } else {
      toast.warning("Time is up for this question.");
    }
  };

  // Starting a recording during preparation ends prep immediately.
  const handleRecordingStart = () => {
    setPhase((p) => (p === "prep" ? "answer" : p));
  };

  const handleSubmit = () => {
    if (!recording) {
      toast.error("Record a response before submitting.");
      return;
    }

    const result = scoreSpeakingResponse(question, recording);
    // Re-attach the blob so the modal can play back the audio.
    result.blob = recording.blob;

    // Build PTE-style sub-scores scaled to /90 so the AI Score modal
    // displays four consistent numbers for speaking too.
    result.overall = Math.round((result.overall / 100) * 90);
    result.subScores = {
      content: {
        label: "Content",
        value: Math.round((result.content / 100) * 90),
        max: 90,
        hint: result.contentLabel,
      },
      fluency: {
        label: "Fluency",
        value: Math.round((result.durationScore / 100) * 90),
        max: 90,
        hint: result.durationLabel,
      },
      pronunciation: {
        label: "Pronunciation",
        value: Math.round(((result.content * 0.5 + result.durationScore * 0.5) / 100) * 90),
        max: 90,
        hint: "Estimated from recognition accuracy and pacing (browser-based, not phoneme-level).",
      },
    };

    const submission = {
      id: `sp-${question.id}-${Date.now()}`,
      questionId: question.id,
      type: friendlyTypeLabel(question.type),
      score: result.overall,
      duration: result.duration,
      transcript: result.transcript,
      takenAt: new Date().toISOString(),
    };

    setSubmitted((s) => ({ ...s, [question.id]: result }));
    setScoreModal({ result: { ...result, aiScored: false }, question });
    const attemptPromise = syncPracticeAttempt({
      skill: "speaking",
      score: result.overall,
      durationSec: Math.max(result.duration || 0, Math.round((Date.now() - startedAt.current) / 1000)),
    }).catch(() => null);
    requestAiScore({
      skill: "speaking",
      question,
      answer: { transcript: result.transcript, duration: result.duration },
      localResult: result,
    })
      .then((aiResult) => {
        attemptPromise.then((attemptId) => updatePracticeAttempt(attemptId, aiResult.overall));
        setScoreModal((current) =>
          current?.question?.id === question.id
            ? { ...current, result: mergeAiResult(current.result, aiResult) }
            : current
        );
        setSubmitted((current) => ({
          ...current,
          [question.id]: mergeAiResult(current[question.id], aiResult),
        }));
      })
      .catch(() => {
        setScoreModal((current) =>
          current?.question?.id === question.id
            ? { ...current, result: { ...current.result, aiUnavailable: true } }
            : current
        );
      });
    const nextHistory = addSkillHistory("speaking", submission);
    setRecentHistory(nextHistory);
    incrementPractice("speaking");
  };

  const closeModal = () => setScoreModal(null);

  const redoFromModal = () => {
    setScoreModal(null);
    setRecording(null);
    setSubmitted((s) => {
      const next = { ...s };
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
    const results = Object.values(submitted);
    const scored = results.filter((r) => r.assessed);
    const avg = scored.length
      ? Math.round(scored.reduce((s, r) => s + r.overall, 0) / scored.length)
      : null;

    addTestHistory({
      name: `Speaking Practice${typeFilter !== "All" ? ` — ${friendlyTypeLabel(typeFilter)}` : ""}`,
      skill: "speaking",
      score: avg,
      total: 100,
      completed: results.length,
      note: avg === null ? "Submitted without transcript scoring" : undefined,
    });

    navigate("/practice/result", {
      state: {
        skill: "speaking",
        score: avg,
        total: 100,
        answered: results.length,
        message:
          avg === null
            ? "Speaking practice finished. No responses could be scored for content, so no average is shown."
            : `Average across ${scored.length} scored response${scored.length === 1 ? "" : "s"}. Scores come from browser speech recognition and are rough practice feedback, not official PTE results.`,
      },
    });
  };

  const handleSave = () => {
    toggleSavedQuestion(question);
    const nowSaved = isQuestionSaved(question.id);
    setSaved(nowSaved);
    toast.success(nowSaved ? "Question saved" : "Removed from saved");
  };

  return (
    <div className="section-padding py-10">
      <div className="container-main max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="page-title">Speaking Practice</h1>
            <p className="page-subtitle">
              Question {index + 1} of {total}
              {typeFilter !== "All" && ` · ${typeFilter}`}
            </p>
            {loading && (
              <p className="text-xs text-slate-400">Syncing admin questions…</p>
            )}
            {!loading && online && (
              <p className="text-xs text-slate-400">
                Includes {""}admin-published questions
              </p>
            )}
          </div>
          <QuestionTimer
            key={`${question.id}-${phase}`}
            seconds={timerSeconds}
            onTimeUp={handleTimeUp}
            warningAt={phase === "prep" ? 5 : 10}
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
          <div className="flex justify-between items-start gap-3 mb-4">
            <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {phase === "prep" ? "Preparation" : "Respond now"}
            </span>
            <button
              onClick={handleSave}
              className={`p-2 rounded-lg ${
                saved ? "text-brand bg-blue-50 dark:bg-blue-900/30" : "text-slate-400 hover:bg-slate-50"
              }`}
              aria-label="Save question"
            >
              <FiBookmark size={18} />
            </button>
          </div>

          {question.type === "Describe Image" && question.chartData ? (
            <div className="mb-4">
              <p className="text-navy dark:text-white font-medium mb-3">{question.prompt}</p>
              <div className="card p-4 bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs text-slate-400 mb-3">{question.imageDescription}</p>
                <ChartIllustration data={question.chartData} unit={question.chartUnit} />
              </div>
            </div>
          ) : (
            <p className="text-navy dark:text-white text-lg leading-relaxed mb-4 whitespace-pre-wrap">
              {question.prompt}
            </p>
          )}

          {needsAudio && (
            <div className="mb-4">
              <AudioPlayer
                text={question.lectureText || question.audioText || question.prompt}
                label={
                  question.type === "Read Aloud"
                    ? "Sample reading (demo text-to-speech)"
                    : question.type === "Retell Lecture"
                    ? "Lecture audio (demo text-to-speech)"
                    : "Listen carefully"
                }
                showVoiceSelector
              />
            </div>
          )}

          {question.tips && (
            <p className="text-sm text-slate-500 mb-4 rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
              <strong>Tip:</strong> {question.tips}
            </p>
          )}

          {question.sampleAnswer && (
            <p className="text-xs text-slate-400 mb-4">
              Sample answer (for review): {question.sampleAnswer}
            </p>
          )}

          {phase === "prep" && (
            <p className="text-sm text-slate-500 mb-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
              Preparation time is running. You can start recording early at any time — this skips
              the rest of preparation.
            </p>
          )}

          <AudioRecorder
            key={question.id}
            onRecordingChange={setRecording}
            onStart={handleRecordingStart}
            maxDuration={question.timeLimit}
          />

          {submitted[question.id] && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Submitted.</strong> Score {submitted[question.id].overall}/100 — click below
                to view the full AI Score report.
              </p>
              <Button size="sm" variant="outline" onClick={() => setScoreModal({ result: submitted[question.id], question })}>
                View Report
              </Button>
            </div>
          )}
        </QuestionCard>

        <div className="flex flex-wrap justify-between gap-3 mt-6">
          <Button variant="secondary" onClick={prev} disabled={isFirst}>
            <FiChevronLeft /> Previous
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSubmit}>
              <FiSend size={14} /> Submit Response
            </Button>
            <Button onClick={isLast ? finish : next}>
              {isLast ? "Finish" : "Next"} <FiChevronRight />
            </Button>
          </div>
        </div>
      </div>

      <AiScoreModal
        open={!!scoreModal}
        result={scoreModal?.result}
        question={scoreModal?.question}
        skill="speaking"
        extraText={scoreModal?.result?.feedback || scoreModal?.result?.note}
        onClose={closeModal}
        onRedo={redoFromModal}
        onNext={nextFromModal}
      />

      <RecentScorePanel
        recent={recentHistory}
        historyKey="pte_speaking_panel"
        skill="speaking"
      />
    </div>
  );
}
