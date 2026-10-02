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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { useTheme } from "../../context/ThemeContext";

export function WeeklyChart({ data }) {
  const { darkMode } = useTheme();
  const stroke = darkMode ? "#94a3b8" : "#64748b";

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-navy dark:text-white mb-4">Weekly Practice (minutes)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} />
            <XAxis dataKey="day" tick={{ fill: stroke, fontSize: 12 }} />
            <YAxis tick={{ fill: stroke, fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                background: darkMode ? "#1e293b" : "#fff",
                color: darkMode ? "#f1f5f9" : "#0f172a",
              }}
            />
            <Bar dataKey="minutes" fill="#2563EB" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SkillRadar({ data }) {
  const { darkMode } = useTheme();

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-navy dark:text-white mb-4">Skill Progress</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke={darkMode ? "#334155" : "#e2e8f0"} />
            <PolarAngleAxis dataKey="skill" tick={{ fill: darkMode ? "#94a3b8" : "#64748b", fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Radar name="Score" dataKey="score" stroke="#2563EB" fill="#2563EB" fillOpacity={0.35} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ScoreLineChart({ data }) {
  const { darkMode } = useTheme();
  const stroke = darkMode ? "#94a3b8" : "#64748b";

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-navy dark:text-white mb-4">Recent Test Scores</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={[...data].reverse()}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} />
            <XAxis dataKey="name" tick={{ fill: stroke, fontSize: 10 }} hide />
            <YAxis domain={[0, 100]} tick={{ fill: stroke, fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "none",
                background: darkMode ? "#1e293b" : "#fff",
                color: darkMode ? "#f1f5f9" : "#0f172a",
              }}
            />
            <Line type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
