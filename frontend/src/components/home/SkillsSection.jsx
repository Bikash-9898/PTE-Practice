import { Link } from "react-router-dom";
import { skillMeta } from "../../data/questions";
import { skillIcons } from "../../data/navigation";
import Button from "../common/Button";

export default function SkillsSection() {
  return (
    <section className="section-padding bg-white dark:bg-navy">
      <div className="container-main">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy dark:text-white">Practice by skill</h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">
            Jump into any skill area and work through unofficial sample questions with interactive tools.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(skillMeta).map(([key, skill]) => {
            const Icon = skillIcons[key];
            return (
              <div key={key} className="card p-6 flex flex-col">
                <div
                  className={`w-12 h-12 rounded-2xl ${skill.lightColor} flex items-center justify-center mb-4`}
                >
                  {Icon && <Icon size={22} />}
                </div>
                <h3 className="text-xl font-bold text-navy dark:text-white mb-2">{skill.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex-1 mb-4 leading-relaxed">
                  {skill.description}
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  {skill.questionCount} sample questions · {skill.difficulty}
                </p>
                <Link to={`/practice/${key}`}>
                  <Button className="w-full" size="sm">
                    Practice Now
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
