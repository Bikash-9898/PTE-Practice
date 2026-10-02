import { FiFilter } from "react-icons/fi";

/**
 * Lets learners narrow a 30-question skill bank down to one task type.
 */
export default function TypeFilter({ types, value, onChange, counts = {}, total = 0 }) {
  return (
    <div className="card p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <FiFilter className="text-brand" size={16} />
        <p className="text-sm font-medium text-navy dark:text-white">Filter by task type</p>
        <span className="text-xs text-slate-400 ml-auto">{total} questions available</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange("All")}
          className={`badge px-3 py-1.5 transition-colors ${
            value === "All"
              ? "bg-brand text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          All ({total})
        </button>
        {types.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            className={`badge px-3 py-1.5 transition-colors ${
              value === t
                ? "bg-brand text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {t} ({counts[t] || 0})
          </button>
        ))}
      </div>
    </div>
  );
}
