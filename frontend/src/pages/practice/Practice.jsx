import { Link, useSearchParams } from "react-router-dom";
import { FiLock } from "react-icons/fi";
import { skillMeta } from "../../data/questions";
import { skillIcons } from "../../data/navigation";
import { difficultyColor } from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/common/Button";

export default function Practice() {
  const [params] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const q = params.get("q")?.toLowerCase() || "";

  const skills = Object.entries(skillMeta).filter(
    ([key, s]) =>
      !q ||
      key.includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.types.some((t) => t.toLowerCase().includes(q))
  );

  return (
    <div>
      <section className="bg-navy text-white py-14 px-4">
        <div className="container-main">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Practice</h1>
          <p className="text-slate-300 max-w-2xl">
            Choose a skill to start unofficial PTE-style practice. Each section includes sample
            questions, timers, and interactive tools.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-main">
          {q && (
            <p className="text-sm text-slate-500 mb-6">
              Showing results for &quot;{q}&quot; · {skills.length} skill(s)
            </p>
          )}

          {!isAuthenticated && (
            <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-5 flex flex-wrap items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                <FiLock size={18} />
              </div>
              <div className="flex-1 min-w-[220px]">
                <p className="font-semibold text-navy dark:text-white">
                  A free account is required to practice
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Sign in so we can save your progress, drafts, and results.
                </p>
              </div>
              <div className="flex gap-2">
                <Link to="/login" state={{ from: "/practice" }}>
                  <Button size="sm" variant="secondary">
                    Login
                  </Button>
                </Link>
                <Link to="/register" state={{ from: "/practice" }}>
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            </div>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {skills.map(([key, skill]) => {
              const Icon = skillIcons[key];
              return (
                <div key={key} className="card p-6 flex flex-col hover:shadow-md transition-shadow">
                  <div
                    className={`w-14 h-14 rounded-2xl ${skill.lightColor} flex items-center justify-center mb-4`}
                  >
                    {Icon && <Icon size={26} />}
                  </div>
                  <h2 className="text-xl font-bold text-navy dark:text-white mb-2">{skill.name}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex-1 mb-4">
                    {skill.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {skill.questionCount} questions
                    </span>
                    <span className={`badge ${difficultyColor(skill.difficulty)}`}>
                      {skill.difficulty}
                    </span>
                  </div>
                  <ul className="text-xs text-slate-400 mb-5 space-y-1">
                    {skill.types.map((t) => (
                      <li key={t}>• {t}</li>
                    ))}
                  </ul>
                  <div className="flex flex-col gap-2">
                    <Link to={`/practice/${key}/categories`}>
                      <Button className="w-full">
                        {isAuthenticated ? (
                          "Start Practice"
                        ) : (
                          <>
                            <FiLock size={14} /> Login to Practice
                          </>
                        )}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
