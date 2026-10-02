export default function ProgressCard({ skill, score, color = "bg-brand" }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-navy dark:text-white">{skill}</span>
        <span className="text-sm font-bold text-navy dark:text-white">{score}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
    </div>
  );
}
