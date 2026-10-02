export default function AnswerOptions({
  options = [],
  selected,
  onSelect,
  multiSelect = false,
  disabled = false,
  showCorrect = false,
  correctAnswer,
}) {
  const isSelected = (i) =>
    multiSelect ? Array.isArray(selected) && selected.includes(i) : selected === i;

  const isCorrect = (i) =>
    multiSelect
      ? Array.isArray(correctAnswer) && correctAnswer.includes(i)
      : correctAnswer === i;

  return (
    <div className="space-y-2">
      {options.map((opt, i) => {
        const selectedNow = isSelected(i);
        const correct = showCorrect && isCorrect(i);
        const wrong = showCorrect && selectedNow && !isCorrect(i);
        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => onSelect?.(i)}
            className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-colors ${
              correct
                ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                : wrong
                ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                : selectedNow
                ? "border-brand bg-blue-50 dark:bg-blue-900/20"
                : "border-slate-200 dark:border-slate-600 hover:border-brand/50"
            }`}
          >
            <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
            {opt}
          </button>
        );
      })}
    </div>
  );
}
