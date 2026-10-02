import { useState } from "react";
import { toast } from "react-toastify";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/common/Button";

export default function Settings() {
  const { darkMode, toggleTheme, setDarkMode } = useTheme();
  const { logout } = useAuth();
  const [prefs, setPrefs] = useState({
    emailReminders: true,
    soundEffects: false,
    showTips: true,
    compactMode: false,
  });

  const clearLocalData = () => {
    if (!confirm("Clear practice drafts, history, and saved questions from this browser?")) return;
    [
      "pte_writing_drafts",
      "pte_test_history",
      "pte_saved_questions",
      "pte_practice_stats",
    ].forEach((k) => localStorage.removeItem(k));
    toast.success("Local practice data cleared.");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Preferences stored in this browser</p>
      </div>

      <div className="card p-6 space-y-5">
        <h2 className="font-semibold text-navy dark:text-white">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-navy dark:text-white">Dark mode</p>
            <p className="text-xs text-slate-400">Reduce eye strain during long sessions</p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              darkMode ? "bg-brand" : "bg-slate-200"
            }`}
            aria-pressed={darkMode}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                darkMode ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={!darkMode ? "primary" : "secondary"} onClick={() => setDarkMode(false)}>
            Light
          </Button>
          <Button size="sm" variant={darkMode ? "primary" : "secondary"} onClick={() => setDarkMode(true)}>
            Dark
          </Button>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-navy dark:text-white">Practice preferences</h2>
        {Object.entries(prefs).map(([key, val]) => (
          <label key={key} className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-navy dark:text-white capitalize">
              {key.replace(/([A-Z])/g, " $1")}
            </span>
            <input
              type="checkbox"
              checked={val}
              onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
              className="rounded border-slate-300 text-brand focus:ring-brand w-4 h-4"
            />
          </label>
        ))}
        <Button
          size="sm"
          onClick={() => {
            localStorage.setItem("pte_prefs", JSON.stringify(prefs));
            toast.success("Preferences saved locally.");
          }}
        >
          Save Preferences
        </Button>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-navy dark:text-white">Data</h2>
        <p className="text-sm text-slate-500">
          This demo stores drafts and history in localStorage. Clearing data cannot be undone.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={clearLocalData}>
            Clear Practice Data
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
