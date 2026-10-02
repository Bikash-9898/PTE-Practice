import { difficultyColor } from "../../utils/helpers";

export default function QuestionCard({
  type,
  difficulty,
  children,
  badge,
  footer,
  className = "",
}) {
  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-700 px-5 py-3 bg-slate-50/80 dark:bg-slate-800/50">
        <span className="badge bg-brand/10 text-brand">{type || badge}</span>
        {difficulty && (
          <span className={`badge ${difficultyColor(difficulty)}`}>{difficulty}</span>
        )}
        <span className="text-xs text-slate-400 ml-auto">Unofficial practice content</span>
      </div>
      <div className="p-5">{children}</div>
      {footer && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-3 bg-slate-50/50 dark:bg-slate-800/30">
          {footer}
        </div>
      )}
    </div>
  );
}
