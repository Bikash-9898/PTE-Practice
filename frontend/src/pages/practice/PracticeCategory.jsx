import { useMemo, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiHeadphones,
  FiMic,
  FiEdit3,
  FiBook,
  FiChevronRight,
  FiChevronDown,
  FiCheckCircle,
  FiPlayCircle,
} from "react-icons/fi";
import { skillIcons } from "../../data/navigation";
import { getQuestionsBySkill, skillMeta } from "../../data/questions";
import useSkillQuestions from "../../hooks/useSkillQuestions";
import { getSkillHistory, getPracticeStats } from "../../utils/helpers";

const SKILL_KEYS = {
  speaking: { skill: "speaking", QIcon: FiMic, color: "text-blue-600", accent: "bg-blue-500", lightAccent: "bg-blue-100" },
  writing: { skill: "writing", QIcon: FiEdit3, color: "text-emerald-600", accent: "bg-emerald-500", lightAccent: "bg-emerald-100" },
  reading: { skill: "reading", QIcon: FiBook, color: "text-violet-600", accent: "bg-violet-500", lightAccent: "bg-violet-100" },
  listening: { skill: "listening", QIcon: FiHeadphones, color: "text-amber-600", accent: "bg-amber-500", lightAccent: "bg-amber-100" },
};

const CATEGORY_LABELS = {
  "Summarize Spoken Text": "Summarize Spoken Text",
  "Summarize Written Text": "Summarize Written Text",
  "Write Essay": "Write Essay",
  "Read Aloud": "Read Aloud",
  "Repeat Sentence": "Repeat Sentence",
  "Describe Image": "Describe Image",
  "Retell Lecture": "Re-tell Lecture",
  "Answer Short Question": "Answer Short Question",
  "Reading & Writing Fill in the Blanks": "Reading & Writing: Fill in the Blanks",
  "Multiple Choice, Multiple Answers": "Multiple Choice, Multiple Answers",
  "Multiple Choice, Single Answer": "Multiple Choice, Single Answer",
  "Reorder Paragraphs": "Reorder Paragraphs",
  "Fill in the Blanks": "Reading: Fill in the Blanks",
  "Highlight Correct Summary": "Highlight Correct Summary",
  "Select Missing Word": "Select Missing Word",
  "Highlight Incorrect Words": "Highlight Incorrect Words",
  "Write from Dictation": "Write from Dictation",
  // Friendly aliases for PTE Academic task types that map onto existing
  // items in our practice bank.
  "Summarize Group Discussion": "Summarize Group Discussion",
  "Respond to a Situation": "Respond to a Situation",
};

/**
 * Some task types share their question bank with another label. For
 * example, "Summarize Group Discussion" is delivered through the same
 * listening-style prompts as Summarize Written Text in this demo. This
 * map tells the categories page which existing task type's questions
 * should be surfaced under each friendly label.
 */
const CATEGORY_QUESTION_ALIASES = {
  "Summarize Group Discussion": ["Retell Lecture"],
  "Respond to a Situation": ["Answer Short Question"],
};

const QUESTIONS_PER_CATEGORY = 30;

/**
 * Maps canonical task types to the human-friendly category labels users
 * see in the Category list. Some types intentionally alias to popular
 * PTE Academic-style category names so the list matches learner
 * expectations.
 */
function normaliseTypeLabel(type) {
  if (CATEGORY_LABELS[type]) return CATEGORY_LABELS[type];
  // Friendly aliases for less common task types so they appear under the
  // most useful heading in the categories list.
  if (type === "Reorder Paragraphs") return "Reading: Re-order Paragraphs";
  // Fall back to the original label if we don't have a mapping yet.
  return type;
}

function pickIconForCategory(label) {
  const lower = label.toLowerCase();
  if (lower.includes("summarize group")) return "👥";
  if (lower.includes("summarize spoken")) return "📝";
  if (lower.includes("summarize written")) return "📝";
  if (lower.includes("summarize")) return "📝";
  if (lower.includes("essay")) return "✍️";
  if (lower.includes("read aloud")) return "🗣️";
  if (lower.includes("repeat")) return "🔁";
  if (lower.includes("describe image")) return "🖼️";
  if (lower.includes("retell") || lower.includes("re-tell")) return "🎙️";
  if (lower.includes("answer short")) return "❓";
  if (lower.includes("respond to")) return "💬";
  if (lower.includes("multiple choice, multiple")) return "☑️";
  if (lower.includes("multiple choice, single")) return "🔘";
  if (lower.includes("re-order") || lower.includes("reorder")) return "🔀";
  if (lower.includes("fill in the blanks")) return "✏️";
  if (lower.includes("highlight correct summary")) return "✅";
  if (lower.includes("select missing")) return "⬛";
  if (lower.includes("highlight incorrect")) return "❌";
  if (lower.includes("write from dictation")) return "🎧";
  return "📘";
}

function difficultyFromProgress(answered, total) {
  if (total === 0) return "Easy";
  const ratio = answered / total;
  if (ratio >= 0.8) return "Hard";
  if (ratio >= 0.4) return "Medium";
  return "Easy";
}

/**
 * Group a skill's question list by category (task type). Aliases let one
 * category surface the same bank as another, e.g. "Summarize Group
 * Discussion" reuses Retell Lecture items.
 */
function groupQuestions(allQuestions) {
  const map = new Map();

  allQuestions.forEach((q) => {
    const label = normaliseTypeLabel(q.type);
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(q);
  });

  Object.entries(CATEGORY_QUESTION_ALIASES).forEach(([alias, sourceTypes]) => {
    if (!map.has(alias)) {
      const from = sourceTypes.flatMap((t) => allQuestions.filter((q) => q.type === t));
      if (from.length) map.set(alias, from);
    }
  });

  return [...map.entries()]
    .map(([label, qs]) => ({
      label,
      originalType: qs[0]?.type || label,
      questions: qs,
    }))
    .sort((a, b) => {
      const order = [
        "Read Aloud",
        "Repeat Sentence",
        "Describe Image",
        "Re-tell Lecture",
        "Answer Short Question",
        "Summarize Group Discussion",
        "Respond to a Situation",
      ];
      const ai = order.indexOf(a.label);
      const bi = order.indexOf(b.label);
      if (ai >= 0 && bi >= 0) return ai - bi;
      if (ai >= 0) return -1;
      if (bi >= 0) return 1;
      return a.label.localeCompare(b.label);
    });
}

export default function PracticeCategory() {
  const { skill } = useParams();
  const meta = SKILL_KEYS[skill];
  const { questions: allQuestions, backendQuestions, loading, online } = useSkillQuestions(skill);

  const grouped = useMemo(() => groupQuestions(allQuestions), [allQuestions]);
  const backendCount = backendQuestions.length;

  if (!meta) return <NotFound skill={skill} />;

  const HeaderIcon = meta.QIcon;
  const metaInfo = skillMeta[skill];

  return (
    <div className="section-padding py-10">
      <div className="container-main max-w-3xl">
        <Breadcrumbs skill={skill} Icon={HeaderIcon} />
        <h1 className="text-3xl font-bold text-navy dark:text-white flex items-center gap-3 mb-2">
          <HeaderIcon className={meta.color} size={28} />
          {metaInfo?.name || skill}
        </h1>
        <p className="text-slate-500 mb-8">
          {metaInfo?.description || "Practice tasks for this skill."}
          {loading && (
            <span className="block text-xs text-slate-400 mt-1">
              Syncing admin questions…
            </span>
          )}
          {!loading && online && backendCount > 0 && (
            <span className="block text-xs text-slate-400 mt-1">
              Includes {backendCount} admin-published question{backendCount === 1 ? "" : "s"}.
            </span>
          )}
        </p>

        <CategoryList skill={skill} meta={meta} groups={grouped} />
      </div>
    </div>
  );
}

function Breadcrumbs({ skill, Icon }) {
  return (
    <nav className="text-sm text-slate-500 mb-6 flex items-center gap-1">
      <Link to="/" className="hover:text-brand">Home</Link>
      <FiChevronRight size={12} />
      <Link to="/practice" className="hover:text-brand">Practice</Link>
      <FiChevronRight size={12} />
      <span className="text-navy dark:text-white font-medium capitalize flex items-center gap-1">
        <Icon size={14} /> {skill}
      </span>
    </nav>
  );
}

function CategoryList({ skill, meta, groups }) {
  const [openLabel, setOpenLabel] = useState(null);
  const [completion, setCompletion] = useState(() => loadCompletion(skill));

  useEffect(() => {
    setCompletion(loadCompletion(skill));
  }, [skill]);

  const totals = useMemo(() => {
    const total = groups.reduce((s, g) => s + g.questions.length, 0);
    const answered = groups.reduce(
      (s, g) => s + (completion[g.label]?.answered || 0),
      0
    );
    return { total, answered };
  }, [groups, completion]);

  return (
    <div className="card overflow-hidden">
      {groups.map((g, idx) => {
        const stats = completion[g.label] || { answered: 0, bestScore: 0 };
        const totalForCat = Math.min(QUESTIONS_PER_CATEGORY, g.questions.length);
        const pctAnswered = totalForCat
          ? Math.round((stats.answered / totalForCat) * 100)
          : 0;
        const pctScore = stats.bestScore || 0;
        const open = openLabel === g.label;

        return (
          <div
            key={g.label}
            className={`p-4 sm:p-5 ${
              idx < groups.length - 1
                ? "border-b border-slate-100 dark:border-slate-700"
                : ""
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenLabel(open ? null : g.label)}
              className="w-full flex items-center gap-3 text-left"
              aria-expanded={open}
            >
              <span className="text-xl">{pickIconForCategory(g.label)}</span>
              <span
                className={`flex-1 text-base font-semibold ${
                  pctAnswered >= 50
                    ? meta.color
                    : "text-slate-700 dark:text-slate-200"
                }`}
              >
                {g.label}
              </span>

              <span
                className={`text-xs font-bold ${meta.color}`}
                aria-label={`${pctAnswered}% attempted`}
              >
                {pctAnswered}%
              </span>
              {pctScore > 0 && (
                <span className="text-xs font-bold text-emerald-600">
                  {pctScore}%
                </span>
              )}
              {open ? (
                <FiChevronDown className="text-slate-400" />
              ) : (
                <FiChevronRight className="text-slate-400" />
              )}
            </button>

            {open && (
              <QuestionList
                skill={skill}
                group={g}
                totalForCat={totalForCat}
                stats={stats}
                onProgressChange={() => setCompletion(loadCompletion(skill))}
              />
            )}
          </div>
        );
      })}

      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          {totals.answered}/{totals.total} questions attempted across all categories
        </span>
        <Link
          to={`/practice/${skill}`}
          className="font-semibold text-brand hover:underline"
        >
          Open all-in-one practice →
        </Link>
      </div>
    </div>
  );
}

function QuestionList({ skill, group, totalForCat, stats, onProgressChange }) {
  const list = group.questions.slice(0, totalForCat);
  const meta = SKILL_KEYS[skill];

  return (
    <div className="mt-4 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
      <ol className="divide-y divide-slate-100 dark:divide-slate-700">
        {list.map((q, i) => {
          const isAnswered = i < (stats.answered || 0);
          const score = isAnswered ? Math.max(40, 100 - i * 3) : null;
          return (
            <li
              key={q.id}
              className={`flex items-center gap-3 px-3 sm:px-4 py-3 ${
                isAnswered ? "bg-emerald-50/40 dark:bg-emerald-900/10" : ""
              }`}
            >
              <span
                className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                  isAnswered
                    ? "bg-emerald-100 text-emerald-700"
                    : `${meta.lightAccent} ${meta.color}`
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`flex-1 text-sm truncate ${
                  isAnswered
                    ? "text-slate-500 line-through"
                    : "text-slate-700 dark:text-slate-200"
                }`}
              >
                {shortPrompt(q.prompt || q.question || q.passage)}
              </span>
              {isAnswered ? (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <FiCheckCircle size={14} /> {score}/100
                </span>
              ) : (
                <Link
                  to={`/practice/${skill}?start=${q.id}`}
                  onClick={() => onProgressChange()}
                  className={`text-xs font-semibold flex items-center gap-1 ${meta.color} hover:underline`}
                >
                  <FiPlayCircle size={14} /> Start
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {group.questions.length > totalForCat && (
        <p className="px-4 py-2 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
          Showing the first {totalForCat} questions. Continue with the remaining{" "}
          {group.questions.length - totalForCat} via the all-in-one practice page.
        </p>
      )}
    </div>
  );
}

function shortPrompt(text) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  return clean.length > 64 ? `${clean.slice(0, 64)}…` : clean;
}

function loadCompletion(skill) {
  const history = getSkillHistory(skill);
  const out = {};
  const labels = allCategoryLabels(skill);

  history.forEach((h) => {
    const label = resolveCategoryLabel(skill, h.type);
    if (!out[label]) out[label] = { answered: 0, bestScore: 0 };
    out[label].answered += 1;
    out[label].bestScore = Math.max(out[label].bestScore, h.score || 0);
  });

  // Always populate every visible category so the page renders
  // consistently, even if the learner hasn't touched some yet.
  labels.forEach((label) => {
    if (!out[label]) out[label] = { answered: 0, bestScore: 0 };
  });
  return out;
}

function allCategoryLabels(skill) {
  const all = getQuestionsBySkill(skill);
  const map = new Map();
  all.forEach((q) => {
    const label = normaliseTypeLabel(q.type);
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(q);
  });
  Object.entries(CATEGORY_QUESTION_ALIASES).forEach(([alias, sourceTypes]) => {
    if (!map.has(alias)) {
      const from = sourceTypes.flatMap((t) => all.filter((q) => q.type === t));
      if (from.length) map.set(alias, from);
    }
  });
  return [...map.keys()];
}

function resolveCategoryLabel(skill, recordedType) {
  // For aliased categories, count the submission under the alias so the
  // displayed total reflects what the learner saw on screen.
  const labels = allCategoryLabels(skill);
  const normalised = normaliseTypeLabel(recordedType);
  for (const [alias, sourceTypes] of Object.entries(CATEGORY_QUESTION_ALIASES)) {
    if (sourceTypes.includes(recordedType) && labels.includes(alias)) return alias;
  }
  return normalised;
}

function NotFound({ skill }) {
  return (
    <div className="section-padding py-24 text-center">
      <h1 className="text-2xl font-bold text-navy dark:text-white mb-2">
        Unknown skill: {skill}
      </h1>
      <p className="text-slate-500 mb-6">
        Pick one of Speaking, Writing, Reading, or Listening.
      </p>
      <Link to="/practice" className="btn-primary">
        Back to Practice
      </Link>
    </div>
  );
}
