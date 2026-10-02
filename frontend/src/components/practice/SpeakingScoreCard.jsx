import { FiCheckCircle, FiAlertCircle, FiFileText } from "react-icons/fi";
import { scoreBand } from "../../utils/speakingScore";
import { formatTime } from "../../utils/helpers";

function Bar({ label, value, hint }) {
  const band = scoreBand(value);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
        <span className={`text-sm font-bold ${band.color}`}>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full ${band.bar} transition-all duration-700`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function SpeakingScoreCard({ result }) {
  if (!result) return null;

  const band = scoreBand(result.overall);

  return (
    <div className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in">
      <div className="bg-slate-50 dark:bg-slate-800/60 px-5 py-4 flex items-center gap-4">
        <div className="text-center">
          <p className={`text-4xl font-bold ${band.color}`}>{result.overall}</p>
          <p className="text-[11px] text-slate-400 -mt-0.5">/ 100</p>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-navy dark:text-white">
            Unofficial practice score — {band.label}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Response length {formatTime(result.duration)}
            {result.assessed ? " · content compared with reference text" : ""}
          </p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {result.assessed ? (
          <>
            <Bar label="Content accuracy" value={result.content} hint={result.contentLabel} />
            <Bar
              label="Delivery length"
              value={result.durationScore}
              hint={result.durationLabel}
            />
          </>
        ) : (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 flex gap-2">
            <FiAlertCircle className="text-amber-600 shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {result.contentLabel}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">{result.note}</p>
            </div>
          </div>
        )}

        {result.transcript && (
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
              <FiFileText size={12} /> What we heard
            </p>
            <p className="text-sm rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-navy dark:text-slate-200 leading-relaxed">
              {result.transcript}
            </p>
          </div>
        )}

        {result.assessed && result.missed.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1.5">
              {result.mode === "keywords" ? "Key ideas not mentioned" : "Words not recognised"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {result.missed.map((w, i) => (
                <span
                  key={`${w}-${i}`}
                  className="badge bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}

        {result.assessed && result.missed.length === 0 && (
          <p className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
            <FiCheckCircle size={16} /> Everything in the reference text was recognised.
          </p>
        )}

        {result.assessed && (
          <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-700 pt-3">
            {result.note}
          </p>
        )}
      </div>
    </div>
  );
}
