import { Link, useLocation, Navigate } from "react-router-dom";
import { FiCheckCircle, FiHome, FiRefreshCw, FiBarChart2 } from "react-icons/fi";
import Button from "../../components/common/Button";

export default function PracticeResult() {
  const { state } = useLocation();

  if (!state) {
    return <Navigate to="/practice" replace />;
  }

  const { skill, score, total, answered, message } = state;
  const hasScore = score !== null && score !== undefined;

  return (
    <div className="section-padding py-16">
      <div className="container-main max-w-lg text-center">
        <div className="card p-8 md:p-10 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center mx-auto mb-5">
            <FiCheckCircle size={32} />
          </div>
          <h1 className="text-2xl font-bold text-navy dark:text-white mb-2">
            Practice Complete
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6 capitalize">
            {skill} session finished
          </p>

          {hasScore ? (
            <div className="mb-6">
              <p className="text-5xl font-bold text-brand mb-1">{score}</p>
              <p className="text-sm text-slate-400">unofficial practice score / {total}</p>
            </div>
          ) : (
            <div className="mb-6 rounded-xl bg-slate-50 dark:bg-slate-800 p-4 text-sm text-slate-600 dark:text-slate-300">
              No automated score for this skill in the demo.
            </div>
          )}

          <p className="text-sm text-slate-500 mb-2">
            Questions answered: <strong>{answered ?? "—"}</strong>
          </p>
          {message && (
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">{message}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={`/practice/${skill}`}>
              <Button variant="secondary" className="w-full sm:w-auto">
                <FiRefreshCw size={16} /> Practice Again
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button className="w-full sm:w-auto">
                <FiBarChart2 size={16} /> Dashboard
              </Button>
            </Link>
            <Link to="/practice">
              <Button variant="ghost" className="w-full sm:w-auto">
                <FiHome size={16} /> All Skills
              </Button>
            </Link>
          </div>

          <p className="text-xs text-slate-400 mt-8">
            Results are for unofficial educational practice only and are not PTE Academic scores.
          </p>
        </div>
      </div>
    </div>
  );
}
