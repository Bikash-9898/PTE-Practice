import { ClipLoader, BeatLoader } from "react-spinners";

export default function Loader({ fullPage = false, text = "Loading...", size = 36 }) {
  if (fullPage) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <ClipLoader color="#2563EB" size={size} />
        <p className="text-sm text-slate-500 dark:text-slate-400">{text}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <BeatLoader color="#2563EB" size={10} />
      {text && <span className="text-sm text-slate-500">{text}</span>}
    </div>
  );
}
