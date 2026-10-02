import { Link, useParams, Navigate } from "react-router-dom";
import { FiClock, FiHelpCircle, FiBarChart2, FiCheckCircle, FiLock } from "react-icons/fi";
import { getMockTestById } from "../../data/mockTests";
import { difficultyColor } from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/common/Button";

export default function MockTestDetail() {
  const { id } = useParams();
  const test = getMockTestById(id);
  const { isAuthenticated } = useAuth();

  if (!test) return <Navigate to="/mock-tests" replace />;

  return (
    <div className="section-padding py-12">
      <div className="container-main max-w-3xl">
        <Link to="/mock-tests" className="text-sm text-brand hover:underline mb-4 inline-block">
          ← Back to mock tests
        </Link>
        <div className="card p-6 md:p-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`badge ${difficultyColor(test.difficulty)}`}>{test.difficulty}</span>
            {test.sections.map((s) => (
              <span key={s} className="badge bg-blue-50 text-brand dark:bg-blue-900/30">
                {s}
              </span>
            ))}
          </div>
          <h1 className="text-3xl font-bold text-navy dark:text-white mb-3">{test.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            {test.description}
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 text-center">
              <FiClock className="mx-auto text-brand mb-2" size={22} />
              <p className="font-bold text-navy dark:text-white">{test.duration} min</p>
              <p className="text-xs text-slate-400">Duration</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 text-center">
              <FiHelpCircle className="mx-auto text-brand mb-2" size={22} />
              <p className="font-bold text-navy dark:text-white">{test.totalQuestions}</p>
              <p className="text-xs text-slate-400">Questions</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 text-center">
              <FiBarChart2 className="mx-auto text-brand mb-2" size={22} />
              <p className="font-bold text-navy dark:text-white">{test.avgScore}</p>
              <p className="text-xs text-slate-400">Avg practice score</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 dark:border-slate-700 p-5 mb-8">
            <h2 className="font-semibold text-navy dark:text-white mb-3">Instructions</h2>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {[
                "This is an unofficial practice test for educational purposes only.",
                "A timer will run for the full test duration.",
                "You can navigate between questions and sections freely.",
                "Submit when finished to see an unofficial practice score summary.",
                "Some items use sample answer keys; speaking items are practice-only.",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <FiCheckCircle className="text-green-500 shrink-0 mt-0.5" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <Link to={`/mock-tests/${id}/start`}>
            <Button size="lg" className="w-full sm:w-auto">
              {isAuthenticated ? (
                "Start Test"
              ) : (
                <>
                  <FiLock size={16} /> Login to Start Test
                </>
              )}
            </Button>
          </Link>
          {!isAuthenticated && (
            <p className="text-xs text-slate-400 mt-3">
              A free demo account is required so your test results can be saved.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
