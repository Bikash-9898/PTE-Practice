import { Link } from "react-router-dom";
import { FiPlay, FiClipboard, FiAward, FiBookOpen, FiClock } from "react-icons/fi";
import Button from "../common/Button";

function HeroIllustration() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 blur-2xl" />
      <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-emerald-100 dark:bg-emerald-900/20 blur-2xl" />
      <svg viewBox="0 0 480 400" className="w-full h-auto drop-shadow-lg" aria-hidden="true">
        <rect x="40" y="40" width="400" height="300" rx="24" fill="#1E293B" />
        <rect x="56" y="56" width="368" height="40" rx="8" fill="#0F172A" />
        <circle cx="76" cy="76" r="6" fill="#EF4444" />
        <circle cx="96" cy="76" r="6" fill="#F59E0B" />
        <circle cx="116" cy="76" r="6" fill="#16A34A" />
        <rect x="56" y="112" width="220" height="200" rx="12" fill="#0F172A" />
        <rect x="72" y="128" width="120" height="12" rx="4" fill="#2563EB" />
        <rect x="72" y="152" width="180" height="8" rx="3" fill="#334155" />
        <rect x="72" y="168" width="160" height="8" rx="3" fill="#334155" />
        <rect x="72" y="184" width="170" height="8" rx="3" fill="#334155" />
        <rect x="72" y="212" width="80" height="28" rx="8" fill="#2563EB" />
        <rect x="160" y="212" width="80" height="28" rx="8" fill="#1E293B" stroke="#334155" strokeWidth="2" />
        <rect x="292" y="112" width="132" height="90" rx="12" fill="#2563EB" />
        <text x="358" y="155" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" fontFamily="system-ui">79</text>
        <text x="358" y="178" textAnchor="middle" fill="#BFDBFE" fontSize="11" fontFamily="system-ui">Practice Score</text>
        <rect x="292" y="218" width="132" height="94" rx="12" fill="#0F172A" />
        <rect x="308" y="238" width="40" height="8" rx="2" fill="#16A34A" />
        <rect x="308" y="254" width="60" height="8" rx="2" fill="#2563EB" />
        <rect x="308" y="270" width="50" height="8" rx="2" fill="#F59E0B" />
        <rect x="308" y="286" width="70" height="8" rx="2" fill="#8B5CF6" />
        <circle cx="400" cy="80" r="36" fill="#2563EB" opacity="0.9" />
        <path d="M388 80 l8 8 16 -16" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-navy">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-transparent to-transparent dark:from-blue-950/40" />
      <div className="container-main section-padding relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-brand px-3 py-1 text-xs font-semibold mb-6">
              <FiAward size={14} /> Free unofficial PTE practice
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy dark:text-white leading-tight tracking-tight">
              Master PTE with{" "}
              <span className="text-brand">Free Practice</span>
            </h1>
            <p className="mt-5 text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              Improve your English skills with realistic practice questions, mock tests, and
              detailed progress tracking.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/practice">
                <Button size="lg">
                  <FiPlay size={18} /> Start Practicing
                </Button>
              </Link>
              <Link to="/mock-tests">
                <Button size="lg" variant="secondary">
                  <FiClipboard size={18} /> Take Mock Test
                </Button>
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              {[
                { icon: FiBookOpen, label: "4 Skills", sub: "Full coverage" },
                { icon: FiAward, label: "Free Practice", sub: "No paywall" },
                { icon: FiClock, label: "Anytime", sub: "Self-paced" },
              ].map((s) => (
                <div key={s.label} className="text-center sm:text-left">
                  <div className="inline-flex w-10 h-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-brand mb-2">
                    <s.icon size={18} />
                  </div>
                  <p className="text-sm font-bold text-navy dark:text-white">{s.label}</p>
                  <p className="text-xs text-slate-400">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <HeroIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}
