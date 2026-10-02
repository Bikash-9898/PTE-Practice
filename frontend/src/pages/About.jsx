import { useNavigate } from "react-router-dom";
import { FiTarget, FiShield, FiBookOpen, FiUsers } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/common/Button";

export default function About() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleStartPractice = () => {
    navigate(isAuthenticated ? "/practice" : "/register");
  };

  return (
    <div>
      <section className="bg-navy text-white section-padding">
        <div className="container-main max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About PTE Master</h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            PTE Master is a free, unofficial practice platform designed to help learners prepare for
            PTE Academic-style tasks. Practice Smart. Score Better.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-main max-w-4xl space-y-10">
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-navy dark:text-white mb-4">Our mission</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              We believe quality English practice tools should be accessible. PTE Master provides
              timed questions, skill-based drills, mock tests, and progress tracking so you can build
              confidence before exam day. All content on this demo is unofficial educational
              material and is not affiliated with Pearson or official PTE Academic.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: FiTarget,
                title: "Focused practice",
                text: "Task types mapped to Speaking, Writing, Reading, and Listening skills.",
              },
              {
                icon: FiBookOpen,
                title: "Realistic format",
                text: "Timers, prompts, and interfaces inspired by real exam workflows.",
              },
              {
                icon: FiUsers,
                title: "Learner dashboard",
                text: "Track streaks, history, and skill breakdowns as you practice.",
              },
              {
                icon: FiShield,
                title: "Privacy-first demo",
                text: "Mock authentication and local storage only — no backend required.",
              },
            ].map((item) => (
              <div key={item.title} className="card p-6">
                <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-3">
                  <item.icon size={20} />
                </div>
                <h3 className="font-semibold text-navy dark:text-white mb-1">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" onClick={handleStartPractice}>
              Start Free Practice
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
