import { formatDate } from "../../utils/helpers";

export default function RecentTests({ tests = [] }) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold text-navy dark:text-white mb-4">Recent tests</h3>
      <div className="space-y-3">
        {tests.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800"
          >
            <div>
              <p className="text-sm font-medium text-navy dark:text-white">{t.name}</p>
              <p className="text-xs text-slate-400">{formatDate(t.date)}</p>
            </div>
            <span className="text-sm font-bold text-brand">{t.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
