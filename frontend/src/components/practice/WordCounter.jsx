import { countWords } from "../../utils/helpers";

export default function WordCounter({ text = "", min, max }) {
  const words = countWords(text);
  const chars = text.length;
  let status = "text-slate-500";
  if (min != null && max != null) {
    if (words > 0 && words < min) status = "text-amber-600";
    else if (words > max) status = "text-red-600";
    else if (words >= min && words <= max) status = "text-green-600";
  }

  return (
    <div className={`flex items-center gap-4 text-xs font-medium ${status}`}>
      <span>
        Words: <strong>{words}</strong>
        {min != null && max != null && (
          <span className="text-slate-400 font-normal">
            {" "}
            (target {min}–{max})
          </span>
        )}
      </span>
      <span className="text-slate-400">
        Characters: <strong className="text-slate-500">{chars}</strong>
      </span>
    </div>
  );
}
