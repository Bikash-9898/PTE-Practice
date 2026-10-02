import { useState } from "react";
import { Link } from "react-router-dom";
import { FiBookmark, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { getSavedQuestions, saveToStorage, formatDate } from "../../utils/helpers";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";

export default function SavedQuestions() {
  const [saved, setSaved] = useState(() => getSavedQuestions());

  const remove = (id) => {
    const next = saved.filter((q) => q.id !== id);
    setSaved(next);
    saveToStorage("pte_saved_questions", next);
    toast.info("Removed from saved questions");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Saved Questions</h1>
        <p className="page-subtitle">Bookmarked practice items stored in this browser</p>
      </div>

      {saved.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FiBookmark}
            title="No saved questions"
            description="Bookmark questions while practicing to review them later."
            actionLabel="Go to Practice"
            onAction={() => (window.location.href = "/practice")}
          />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {saved.map((q) => (
            <div key={q.id} className="card p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="badge bg-brand/10 text-brand capitalize">{q.skill}</span>
                <button
                  onClick={() => remove(q.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                  aria-label="Remove"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
              <p className="text-sm font-semibold text-navy dark:text-white mb-1">{q.type}</p>
              <p className="text-sm text-slate-500 flex-1 line-clamp-2 mb-3">{q.prompt}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Saved {q.savedAt ? formatDate(q.savedAt) : ""}
                </span>
                <Link to={`/practice/${q.skill}`}>
                  <Button size="sm" variant="secondary">
                    Practice
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
