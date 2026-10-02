export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "bg-brand",
  trend,
}) {
  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-navy dark:text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-xs mt-2 font-medium ${trend.up ? "text-green-600" : "text-slate-500"}`}>
              {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl ${color} text-white flex items-center justify-center shrink-0`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
