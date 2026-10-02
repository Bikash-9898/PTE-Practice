import { useEffect, useState, useRef } from "react";
import { FiClock } from "react-icons/fi";
import { formatTime } from "../../utils/helpers";

export default function QuestionTimer({
  seconds,
  onTimeUp,
  running = true,
  warningAt = 30,
  className = "",
}) {
  const [remaining, setRemaining] = useState(seconds);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          onTimeUpRef.current?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, remaining > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const isWarning = remaining <= warningAt && remaining > 0;
  const isUp = remaining === 0;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 font-mono text-sm font-semibold ${
        isUp
          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
          : isWarning
          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
      } ${className}`}
      role="timer"
      aria-live="polite"
    >
      <FiClock size={14} />
      {formatTime(remaining)}
    </div>
  );
}
