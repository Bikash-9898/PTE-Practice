import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiClipboard } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { getTestHistory, formatDate } from "../../utils/helpers";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";

export default function TestHistory() {
  const { user, loading } = useAuth();
  const [combined, setCombined] = useState(() => getTestHistory());

  useEffect(() => {
    if (!user) {
      setCombined([]);
      return undefined;
    }

    let active = true;
    const localHistory = getTestHistory();
    setCombined(localHistory);

    fetch("/api/results/my-results", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch test history");
        return res.json();
      })
      .then((payload) => {
        if (!active) return;
        const attempts = Array.isArray(payload?.data?.items) ? payload.data.items : [];
        const localDays = new Set(
          localHistory.map((item) => {
            const date = new Date(item.date);
            return `${item.skill}:${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          })
        );
        const serverHistory = attempts.map((attempt) => ({
          id: `api-${attempt._id}`,
          name: attempt.mockTest?.title || `${attempt.skill} practice`,
          date: attempt.completedAt,
          score: attempt.score,
          total: 90,
          skill: attempt.skill,
          note: attempt.note || "",
          completed: `${attempt.totalQuestions || 1} question${attempt.totalQuestions === 1 ? "" : "s"}`,
        }));
        const newServerHistory = serverHistory.filter((item) => {
          const date = new Date(item.date);
          const day = `${item.skill}:${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          return !localDays.has(day);
        });
        setCombined(
          [...localHistory, ...newServerHistory].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        );
      })
      .catch((err) => {
        console.error("Test history error:", err);
      });

    return () => {
      active = false;
    };
  }, [user]);

  if (loading) {
    return <div className="h-96 flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <p className="text-center text-slate-500">Please log in to view test history.</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Test History</h1>
          <p className="page-subtitle">Past practice sessions and mock results</p>
        </div>
        <Link to="/mock-tests">
          <Button size="sm">
            <FiClipboard size={14} /> Take Mock Test
          </Button>
        </Link>
      </div>

      {combined.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No history yet"
            description="Complete a practice set or mock test to see results here."
            actionLabel="Start Practice"
            onAction={() => (window.location.href = "/practice")}
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-left text-slate-500">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Skill</th>
                  <th className="px-5 py-3 font-medium">Score</th>
                  <th className="px-5 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {combined.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3 font-medium text-navy dark:text-white">{row.name}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(row.date)}</td>
                    <td className="px-5 py-3 capitalize text-slate-500">{row.skill || "—"}</td>
                    <td className="px-5 py-3">
                      {row.score != null ? (
                        <span className="font-semibold text-brand">
                          {row.score}
                          {row.total ? `/${row.total}` : ""}
                        </span>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs max-w-xs truncate">
                      {row.note || (row.completed ? `${row.completed} completed` : "—")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
