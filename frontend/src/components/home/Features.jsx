import { FiGift, FiLayers, FiHelpCircle, FiTrendingUp } from "react-icons/fi";

const features = [
  {
    icon: FiGift,
    title: "Free Practice",
    description:
      "Access unofficial practice questions across all skills without paying for basic study tools.",
  },
  {
    icon: FiLayers,
    title: "Four English Skills",
    description:
      "Train Speaking, Writing, Reading, and Listening with task types modeled on PTE Academic format.",
  },
  {
    icon: FiHelpCircle,
    title: "Practice Questions",
    description:
      "Work through sample prompts, timers, and answer-checking tools designed for focused practice.",
  },
  {
    icon: FiTrendingUp,
    title: "Progress Tracking",
    description:
      "Monitor streaks, recent results, and skill breakdowns from your student dashboard.",
  },
];

export default function Features() {
  return (
    <section className="section-padding bg-surface dark:bg-navy-light/50">
      <div className="container-main">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy dark:text-white">Why choose us</h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">
            Built for learners who want structured, free PTE-style practice with a clean modern experience.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="card p-6 hover:shadow-md transition-shadow hover:-translate-y-0.5 duration-200"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-4">
                <f.icon size={22} />
              </div>
              <h3 className="text-lg font-semibold text-navy dark:text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
