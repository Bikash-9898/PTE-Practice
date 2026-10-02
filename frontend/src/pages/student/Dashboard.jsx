import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiBookOpen,
  FiMic,
  FiEdit3,
  FiBook,
  FiHeadphones,
  FiZap,
  FiArrowRight,
  FiClipboard,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import StatCard from "../../components/dashboard/StatCard";
import ProgressCard from "../../components/dashboard/ProgressCard";
import { WeeklyChart, SkillRadar, ScoreLineChart } from "../../components/dashboard/SkillChart";
import Button from "../../components/common/Button";
import { formatDate } from "../../utils/helpers";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({
    speaking: 0,
    writing: 0,
    reading: 0,
    listening: 0,
    total: 0,
    streak: 0,
    lastPractice: null,
    skillScores: { speaking: 0, writing: 0, reading: 0, listening: 0 },
    weekly: [],
    recentTests: [],
    continuePracticing: [],
    recommended: [],
  });
  const [bankCounts, setBankCounts] = useState(null);
  useEffect(() => {
    if (!user) return undefined;

    let active = true;
    const loadStats = () => {
      fetch("/api/auth/dashboard/stats", { credentials: "include" })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch dashboard stats");
          return res.json();
        })
        .then((data) => {
          const dashboard = data?.data;
          if (active && dashboard?.stats) {
            setStats({
              ...dashboard.stats,
              skillScores: dashboard.stats.skillScores || {},
              weekly: dashboard.stats.weekly || [],
              recentTests: dashboard.stats.recentTests || [],
              continuePracticing: dashboard.stats.continuePracticing || [],
              recommended: dashboard.stats.recommended || [],
            });
          }
        })
        .catch((err) => console.error("Dashboard stats error:", err));
    };

    loadStats();
    window.addEventListener("pte:dashboard-updated", loadStats);
    window.addEventListener("focus", loadStats);
    return () => {
      active = false;
      window.removeEventListener("pte:dashboard-updated", loadStats);
      window.removeEventListener("focus", loadStats);
    };
  }, [user]);

  // Live per-section question counts coming from the admin-built question
  // bank, so students can see what is available under each section.
  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    const skills = ["speaking", "writing", "reading", "listening"];
    Promise.all(
      skills.map((s) =>
        fetch(`/api/questions/skill/${s}`, { credentials: "include" })
          .then((res) => (res.ok ? res.json() : { data: {} }))
          .then((j) => [s, j?.data?.items?.length || 0])
          .catch(() => [s, 0])
      )
    ).then((rows) => {
      if (active) setBankCounts(Object.fromEntries(rows));
    });
    return () => {
      active = false;
    };
  }, [user]);

  const skillColors = {
    Speaking: "bg-blue-500",
    Writing: "bg-emerald-500",
    Reading: "bg-violet-500",
    Listening: "bg-amber-500",
  };

  if (loading) {
    return <div className="h-96 flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <p className="text-center text-slate-500">Please log in to view your dashboard.</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">
            Welcome back, {user?.name?.split(" ")[0] || "Student"}
          </h1>
          <p className="page-subtitle">Here's your practice overview</p>
        </div>
        <div className="flex gap-2">
          <Link to="/practice">
            <Button size="sm">
              <FiBookOpen size={14} /> Practice
            </Button>
          </Link>
          <Link to="/mock-tests">
            <Button size="sm" variant="secondary">
              <FiClipboard size={14} /> Mock Test
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Practice"
          value={stats.total}
          subtitle="All sessions"
          icon={FiBookOpen}
          color="bg-brand"
        />
        <StatCard
          title="Speaking"
          value={stats.speaking}
          subtitle="Sessions"
          icon={FiMic}
          color="bg-blue-500"
        />
        <StatCard
          title="Writing"
          value={stats.writing}
          subtitle="Sessions"
          icon={FiEdit3}
          color="bg-emerald-500"
        />
        <StatCard
          title="Reading"
          value={stats.reading}
          subtitle="Sessions"
          icon={FiBook}
          color="bg-violet-500"
        />
        <StatCard
          title="Listening"
          value={stats.listening}
          subtitle="Sessions"
          icon={FiHeadphones}
          color="bg-amber-500"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeeklyChart data={stats.weekly} />
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <FiZap size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Practice streak</p>
              <p className="text-2xl font-bold text-navy dark:text-white">
                {stats.streak} days
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Keep practicing daily to maintain your streak. Last practice:{" "}
            {stats.lastPractice ? formatDate(stats.lastPractice) : "—"}
          </p>
          <div className="space-y-3">
            {[
              { skill: "Speaking", score: stats.skillScores.speaking || 0 },
              { skill: "Writing", score: stats.skillScores.writing || 0 },
              { skill: "Reading", score: stats.skillScores.reading || 0 },
              { skill: "Listening", score: stats.skillScores.listening || 0 },
            ].map((s) => (
              <ProgressCard
                key={s.skill}
                skill={s.skill}
                score={s.score}
                color={skillColors[s.skill]}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <SkillRadar data={[
          { skill: "Speaking", score: stats.skillScores.speaking || 0 },
          { skill: "Writing", score: stats.skillScores.writing || 0 },
          { skill: "Reading", score: stats.skillScores.reading || 0 },
          { skill: "Listening", score: stats.skillScores.listening || 0 },
        ]} />
        <ScoreLineChart data={stats.recentTests} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-navy dark:text-white mb-4">Continue practicing</h3>
          <div className="space-y-3">
            {stats.continuePracticing.map((item) => {
              const Icon = { speaking: FiMic, writing: FiEdit3, reading: FiBook, listening: FiHeadphones }[item.skill];
              return (
                <Link
                  key={item.skill}
                  to={`/practice/${item.skill}/categories`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                    {Icon && <Icon size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy dark:text-white">{item.type}</p>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 mt-1">
                      <div
                        className="h-full bg-brand rounded-full"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                  <FiArrowRight className="text-slate-300" size={16} />
                </Link>
              );
            })}
            {stats.continuePracticing.length === 0 && (
              <p className="text-sm text-slate-500">No practice sessions yet — start practicing to see recommendations.</p>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-navy dark:text-white">Recent mock tests</h3>
            <Link to="/dashboard/history" className="text-xs text-brand hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentTests.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800"
              >
                <div>
                  <p className="text-sm font-medium text-navy dark:text-white">{t.name}</p>
                  <p className="text-xs text-slate-400">{formatDate(t.date)}</p>
                </div>
                <span className="text-sm font-bold text-brand">{t.score}/{t.total}</span>
              </div>
            ))}
            {stats.recentTests.length === 0 && (
              <p className="text-sm text-slate-500">Complete a test to see your results here.</p>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-navy dark:text-white mb-4">Recommended</h3>
          <div className="space-y-3">
            {[
              { id: "sp-ra-1", skill: "speaking", type: "Read Aloud", title: "Climate change passage" },
              { id: "wr-we-1", skill: "writing", type: "Write Essay", title: "Online education essay" },
              { id: "rd-mc-1", skill: "reading", type: "Multiple Choice", title: "Remote work passage" },
              { id: "ls-wfd-1", skill: "listening", type: "Write from Dictation", title: "Reception desk dictation" },
            ].map((r) => {
              const Icon = { speaking: FiMic, writing: FiEdit3, reading: FiBook, listening: FiHeadphones }[r.skill];
              return (
                <Link
                  key={r.id}
                  to={`/practice/${r.skill}`}
                  className="block p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-brand/40 transition-colors"
                >
                  <p className="text-xs text-brand font-semibold uppercase">{r.skill}</p>
                  <p className="text-sm font-medium text-navy dark:text-white">{r.title}</p>
                  <p className="text-xs text-slate-400">{r.type}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-navy dark:text-white">Question bank by section</h3>
          <Link to="/practice" className="text-xs text-brand hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { skill: "speaking", label: "Speaking", Icon: FiMic, bg: "bg-blue-100", color: "text-blue-600" },
            { skill: "writing", label: "Writing", Icon: FiEdit3, bg: "bg-emerald-100", color: "text-emerald-600" },
            { skill: "reading", label: "Reading", Icon: FiBook, bg: "bg-violet-100", color: "text-violet-600" },
            { skill: "listening", label: "Listening", Icon: FiHeadphones, bg: "bg-amber-100", color: "text-amber-600" },
          ].map((s) => (
            <Link
              key={s.skill}
              to={`/practice/${s.skill}/categories`}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-brand/40 transition-colors"
            >
              <span className={`w-9 h-9 rounded-lg ${s.bg} ${s.color} flex items-center justify-center shrink-0`}>
                <s.Icon size={16} />
              </span>
              <span>
                <span className="block text-sm font-medium text-navy dark:text-white">{s.label}</span>
                <span className="block text-xs text-slate-400">
                  {bankCounts ? `${bankCounts[s.skill] || 0} question${bankCounts[s.skill] === 1 ? "" : "s"}` : "Loading…"}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-navy dark:text-white mb-4">Quick actions</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { to: "/practice/speaking", label: "Speaking drills" },
            { to: "/practice/writing", label: "Writing tasks" },
            { to: "/practice/reading", label: "Reading sets" },
            { to: "/practice/listening", label: "Listening sets" },
          ].map((a) => (
            <Link key={a.to} to={a.to}>
              <Button variant="secondary" className="w-full">
                {a.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}