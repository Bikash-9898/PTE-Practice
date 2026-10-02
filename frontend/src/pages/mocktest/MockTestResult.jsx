import { Link, useParams, Navigate } from "react-router-dom";
import { FiCheck, FiX, FiMinus, FiHome, FiRefreshCw } from "react-icons/fi";
import { getMockTestById } from "../../data/mockTests";
import Button from "../../components/common/Button";

export default function MockTestResult() {
  const { id } = useParams();
  const test = getMockTestById(id);

  let result = null;
  try {
    const raw = sessionStorage.getItem(`pte_mock_result_${id}`);
    if (raw) result = JSON.parse(raw);
  } catch {
    /* ignore */
  }

  if (!test) return <Navigate to="/mock-tests" replace />;
  if (!result) {
    return (
      <div className="section-padding text-center">
        <p className="text-slate-500 mb-4">No result found for this test session.</p>
        <Link to={`/mock-tests/${id}/start`}>
          <Button>Start Test</Button>
        </Link>
      </div>
    );
  }

  const { avg, details, testTitle, answered } = result;
  const correctCount = details.filter((d) => d.correct === true).length;
  const incorrectCount = details.filter((d) => d.correct === false).length;

  return (
    <div className="section-padding py-12">
      <div className="container-main max-w-3xl">
        <div className="card p-6 md:p-8 mb-6 text-center">
          <h1 className="text-2xl font-bold text-navy dark:text-white mb-1">Test Results</h1>
          <p className="text-slate-500 mb-6">{testTitle}</p>
          <p className="text-5xl font-bold text-brand mb-1">{avg}</p>
          <p className="text-sm text-slate-400 mb-6">Unofficial practice score / 100</p>
          <div className="flex justify-center gap-6 text-sm mb-6">
            <span className="text-green-600 font-medium">{correctCount} correct</span>
            <span className="text-red-500 font-medium">{incorrectCount} incorrect</span>
            <span className="text-slate-400">{answered} answered</span>
          </div>
          <p className="text-xs text-slate-400">
            Practice scoring only — not an official PTE Academic result.
          </p>
        </div>

        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 font-semibold text-navy dark:text-white">
            Review answers
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {details.map((d, i) => (
              <li key={d.id} className="px-5 py-4 flex gap-3">
                <div className="shrink-0 mt-0.5">
                  {d.correct === true && (
                    <span className="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                      <FiCheck size={14} />
                    </span>
                  )}
                  {d.correct === false && (
                    <span className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                      <FiX size={14} />
                    </span>
                  )}
                  {d.correct === null && (
                    <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                      <FiMinus size={14} />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-navy dark:text-white">
                    Q{i + 1}. {d.type}{" "}
                    <span className="text-slate-400 font-normal">· {d.section}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{d.prompt}</p>
                  <p className="text-xs mt-1">
                    Score: {d.score ?? "—"}
                    {d.userAnswer !== undefined && d.userAnswer !== null && (
                      <span className="text-slate-400">
                        {" "}
                        · Your answer:{" "}
                        {typeof d.userAnswer === "object"
                          ? JSON.stringify(d.userAnswer)
                          : String(d.userAnswer).slice(0, 80)}
                      </span>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link to={`/mock-tests/${id}/start`}>
            <Button variant="secondary">
              <FiRefreshCw size={16} /> Retake
            </Button>
          </Link>
          <Link to="/dashboard/history">
            <Button variant="outline">View History</Button>
          </Link>
          <Link to="/dashboard">
            <Button>
              <FiHome size={16} /> Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
