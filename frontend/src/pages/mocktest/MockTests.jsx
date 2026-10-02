import { Link } from "react-router-dom";
import { FiClock, FiHelpCircle, FiUsers, FiStar } from "react-icons/fi";
import { mockTests } from "../../data/mockTests";
import { difficultyColor } from "../../utils/helpers";
import Button from "../../components/common/Button";

export default function MockTests() {
  return (
    <div>
      <section className="bg-navy text-white py-14 px-4">
        <div className="container-main">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Mock Tests</h1>
          <p className="text-slate-300 max-w-2xl">
            Timed unofficial practice tests to build exam stamina. Scores are for practice only.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-main">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockTests.map((test) => (
              <div key={test.id} className="card p-6 flex flex-col hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h2 className="text-lg font-bold text-navy dark:text-white">{test.title}</h2>
                  {test.featured && (
                    <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      <FiStar size={10} className="mr-1" /> Featured
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex-1 mb-4">
                  {test.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`badge ${difficultyColor(test.difficulty)}`}>
                    {test.difficulty}
                  </span>
                  {test.sections.map((s) => (
                    <span
                      key={s}
                      className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-500 mb-5">
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2">
                    <FiClock className="mx-auto mb-1" />
                    {test.duration} min
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2">
                    <FiHelpCircle className="mx-auto mb-1" />
                    {test.totalQuestions} Qs
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2">
                    <FiUsers className="mx-auto mb-1" />
                    {test.attempts}
                  </div>
                </div>
                <Link to={`/mock-tests/${test.id}`}>
                  <Button className="w-full">View Details</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
