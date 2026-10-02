import { FiInbox } from "react-icons/fi";
import Button from "./Button";

export default function EmptyState({
  icon: Icon = FiInbox,
  title = "Nothing here yet",
  description = "There's no data to display at the moment.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Icon className="text-slate-400" size={28} />
      </div>
      <h3 className="text-lg font-semibold text-navy dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
