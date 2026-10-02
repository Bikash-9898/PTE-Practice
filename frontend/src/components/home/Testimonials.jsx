import { FiStar } from "react-icons/fi";
import { testimonials } from "../../data/navigation";

export default function Testimonials() {
  return (
    <section className="section-padding bg-white dark:bg-navy">
      <div className="container-main">
        <div className="text-center max-w-2xl mx-auto mb-4">
          <h2 className="text-3xl md:text-4xl font-bold text-navy dark:text-white">
            What learners say
          </h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">
            Illustrative testimonials for design demonstration — not real student reviews.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-10">
          {testimonials.map((t) => (
            <div key={t.id} className="card p-6">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FiStar
                    key={i}
                    size={16}
                    className={i < t.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                  />
                ))}
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
                “{t.text}”
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy dark:text-white">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.note}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
