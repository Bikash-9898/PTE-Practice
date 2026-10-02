import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import ProgressCard from "../../components/dashboard/ProgressCard";
import { WeeklyChart, SkillRadar, ScoreLineChart } from "../../components/dashboard/SkillChart";
import StatCard from "../../components/dashboard/StatCard";
import { FiTrendingUp, FiTarget, FiClock, FiAward } from "react-icons/fi";

export default function MyProgress() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    streak: 0,
    avgMockScore: 0,
    weekMinutes: 0,
    skillScores: { speaking: 0, writing: 0, reading: 0, listening: 0 },
    weekly: [],
    recentTests: [],
  });
  const [fetched, setFetched] = useState(false);

  // Fetch dashboard stats from backend when user changes or first mount
  useEffect(() => {
    if (!user) return;
    // Only fetch if not already fetched
    if (!fetched) {
      fetch("/api/auth/dashboard/stats", {
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch dashboard stats");
          return res.json();
        })
        .then((data) => {
          const dashboard = data?.data;
          if (dashboard?.stats) {
            setStats(dashboard.stats);
          }
          setFetched(true);
        })
        .catch((err) => {
          console.error("Dashboard stats error:", err);
          setFetched(true);
        });
    }
  }, [user, fetched]);

  const colors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500"];

  if (loading) {
    return <div className="h-96 flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <p className="text-center text-slate-500">Please log in to view your progress.</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">My Progress</h1>
        <p className="page-subtitle">Track skill growth and practice consistency</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total sessions" value={stats.total} icon={FiTarget} color="bg-brand" />
        <StatCard title="Current streak" value={`${stats.streak}d`} icon={FiTrendingUp} color="bg-orange-500" />
        <StatCard title="Avg mock score" value={stats.avgMockScore} icon={FiAward} color="bg-emerald-500" />
        <StatCard title="Week minutes" value={stats.weekMinutes} icon={FiClock} color="bg-violet-500" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { skill: "Speaking", score: stats.skillScores.speaking || 0 },
          { skill: "Writing", score: stats.skillScores.writing || 0 },
          { skill: "Reading", score: stats.skillScores.reading || 0 },
          { skill: "Listening", score: stats.skillScores.listening || 0 },
        ].map((s, i) => (
          <ProgressCard key={s.skill} skill={s.skill} score={s.score} color={colors[i]} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <WeeklyChart data={stats.weekly} />
        <SkillRadar data={[
          { skill: "Speaking", score: stats.skillScores.speaking || 0 },
          { skill: "Writing", score: stats.skillScores.writing || 0 },
          { skill: "Reading", score: stats.skillScores.reading || 0 },
          { skill: "Listening", score: stats.skillScores.listening || 0 },
        ]} />
      </div>

      <ScoreLineChart data={stats.recentTests} />

      <div className="card p-5">
        <h3 className="font-semibold text-navy dark:text-white mb-3">Skill notes</h3>
        {stats.total === 0 ? (
          <p className="text-sm text-slate-500">Complete a practice session to see personalized insights.</p>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Your strongest skill is {Object.entries(stats.skillScores).sort(([, a], [, b]) => b - a)[0][0]} at {Math.max(...Object.values(stats.skillScores))}.
          </p>
        )}
      </div>
    </div>
  );
}
