import { useEffect, useState } from "react";
import { FiUsers, FiFileText, FiClipboard, FiAward, FiTrendingUp } from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import StatCard from "../../components/dashboard/StatCard";
import { useTheme } from "../../context/ThemeContext";
import { formatDate } from "../../utils/helpers";

export default function AdminDashboard() {
  const { darkMode } = useTheme();
  const stroke = darkMode ? "#94a3b8" : "#64748b";
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/dashboard", { credentials: "include" })
      .then((res) => {
        return res.json().then((payload) => {
          if (!res.ok) throw new Error(payload?.message || "Failed to load admin dashboard");
          return payload;
        });
      })
      .then((payload) => {
        if (active) setDashboard(payload?.data || null);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="font-semibold text-red-500">{error}</p>
        <p className="text-sm text-slate-500 mt-2">
          Please log out and sign in again with an admin account.
        </p>
      </div>
    );
  }
  if (!dashboard) return <div className="h-96 flex items-center justify-center">Loading...</div>;

  const counts = dashboard.counts || {};
  const activity = (dashboard.activeLearners || []).map((item) => ({
    day: new Date(`${item._id}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" }),
    users: item.users,
  }));
  const scoreTrend = (dashboard.scoreTrend || []).map((item, index) => ({
    week: `W${index + 1}`,
    avg: Math.round(item.avg || 0),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">
          Live platform overview from the database
        </p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Students" value={counts.students || 0} icon={FiUsers} color="bg-brand" />
        <StatCard title="Questions" value={counts.questions || 0} icon={FiFileText} color="bg-emerald-500" />
        <StatCard title="Mock Tests" value={counts.mockTests || 0} icon={FiClipboard} color="bg-violet-500" />
        <StatCard title="Results" value={counts.attempts || 0} icon={FiAward} color="bg-amber-500" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-navy dark:text-white mb-4 flex items-center gap-2">
            <FiTrendingUp /> Weekly active learners
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activity}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="day" tick={{ fill: stroke, fontSize: 12 }} />
                <YAxis tick={{ fill: stroke, fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="users" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-navy dark:text-white mb-4">Average practice score trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="week" tick={{ fill: stroke, fontSize: 12 }} />
                <YAxis domain={[60, 80]} tick={{ fill: stroke, fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="avg" stroke="#16A34A" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 font-semibold text-navy dark:text-white">
          Recent results
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100 dark:border-slate-700">
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Test</th>
                <th className="px-5 py-3">Score</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {(dashboard.recentAttempts || []).slice(0, 5).map((r) => (
                <tr key={r._id}>
                  <td className="px-5 py-3 font-medium text-navy dark:text-white">{r.user?.name || "Unknown student"}</td>
                  <td className="px-5 py-3 text-slate-500">{r.mockTest?.title || `${r.skill} practice`}</td>
                  <td className="px-5 py-3 font-semibold text-brand">{r.score}</td>
                  <td className="px-5 py-3 text-slate-400">{formatDate(r.completedAt)}</td>
                </tr>
              ))}
              {(dashboard.recentAttempts || []).length === 0 && (
                <tr><td colSpan="4" className="px-5 py-6 text-center text-slate-500">No results yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
