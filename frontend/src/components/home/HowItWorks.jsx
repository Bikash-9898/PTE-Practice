import { FiUserPlus, FiTarget, FiEdit, FiBarChart2 } from "react-icons/fi";

const steps = [
  {
    icon: FiUserPlus,
    step: "01",
    title: "Register",
    description: "Create a free demo account to unlock dashboard tracking and saved progress.",
  },
  {
    icon: FiTarget,
    step: "02",
    title: "Choose skill",
    description: "Pick Speaking, Writing, Reading, or Listening based on what you need most.",
  },
  {
    icon: FiEdit,
    step: "03",
    title: "Practice",
    description: "Answer timed questions, record responses, and check sample explanations.",
  },
  {
    icon: FiBarChart2,
    step: "04",
    title: "Track progress",
    description: "Review history, streaks, and unofficial practice scores on your dashboard.",
  },
];

export default function HowItWorks() {
  return (
    <section className="section-padding bg-surface dark:bg-navy-light/50">
      <div className="container-main">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy dark:text-white">How it works</h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">
            Four simple steps from signup to measurable practice progress.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <div key={s.step} className="relative text-center sm:text-left">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-px bg-slate-200 dark:bg-slate-700" />
              )}
              <div className="inline-flex w-16 h-16 items-center justify-center rounded-2xl bg-white dark:bg-navy-light border border-slate-100 dark:border-slate-700 shadow-sm text-brand mb-4 relative z-10">
                <s.icon size={24} />
              </div>
              <p className="text-xs font-bold text-brand mb-1">STEP {s.step}</p>
              <h3 className="text-lg font-semibold text-navy dark:text-white mb-2">{s.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
