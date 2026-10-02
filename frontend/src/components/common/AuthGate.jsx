import { Link, useLocation } from "react-router-dom";
import { FiLock, FiUserPlus, FiLogIn, FiCheckCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import Loader from "./Loader";
import Button from "./Button";

/**
 * Gates practice / mock-test content behind a demo account.
 * Unlike ProtectedRoute (hard redirect), this renders an explanatory
 * screen so users understand why they need to sign in, and returns
 * them to the page they wanted after logging in.
 */
export default function AuthGate({ children, title = "Sign in to start practicing" }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader fullPage text="Checking your session..." />;
  if (isAuthenticated) return children;

  const from = location.pathname + location.search;

  return (
    <div className="section-padding py-16">
      <div className="container-main max-w-lg">
        <div className="card p-8 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-5">
            <FiLock size={28} />
          </div>

          <h1 className="text-2xl font-bold text-navy dark:text-white mb-2">{title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            A free demo account lets us save your progress, drafts, and results in this browser.
          </p>

          <ul className="text-left space-y-2.5 mb-8 rounded-xl bg-slate-50 dark:bg-slate-800 p-5">
            {[
              "Track streaks and skill progress",
              "Save drafts and bookmark questions",
              "Review mock test history and results",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                <FiCheckCircle className="text-green-500 shrink-0 mt-0.5" size={16} />
                {item}
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/login" state={{ from }} className="flex-1">
              <Button className="w-full">
                <FiLogIn size={16} /> Login
              </Button>
            </Link>
            <Link to="/register" state={{ from }} className="flex-1">
              <Button variant="secondary" className="w-full">
                <FiUserPlus size={16} /> Create Free Account
              </Button>
            </Link>
          </div>

          <p className="text-xs text-slate-400 mt-6">
            Demo login: student@ptemaster.com / student123 — accounts are stored locally in your
            browser only.
          </p>

          <Link
            to="/practice"
            className="mt-4 inline-block text-sm text-brand hover:underline"
          >
            ← Browse practice categories
          </Link>
        </div>
      </div>
    </div>
  );
}
