import { useEffect, useMemo, useState } from "react";
import { FiMessageSquare, FiThumbsUp, FiShare2, FiTrash2, FiDownload } from "react-icons/fi";
import EmptyState from "../common/EmptyState";
import { formatDate } from "../../utils/helpers";

/**
 * "My Score" + "Forum" + "Community Score" tabbed panel that lives below
 * the practice content. Tab content is rendered by the caller so each
 * skill page can supply its own data sources.
 *
 * Props:
 *   recent: array of recent submissions (this user, this session)
 *   historyKey: localStorage key used to back the Recent list
 *   skill: skill name shown in the empty state
 */
export default function RecentScorePanel({ recent, historyKey, skill }) {
  const [tab, setTab] = useState("my");
  const [items, setItems] = useState(recent || []);
  const [comments, setComments] = useState(() =>
    initialComments(historyKey, items)
  );
  const [draft, setDraft] = useState("");
  const [thumbs, setThumbs] = useState(() => initialThumbs(historyKey));

  // Sync the displayed list whenever the parent passes in a new submission.
  useEffect(() => {
    if (Array.isArray(recent) && recent.length) {
      setItems((curr) => mergeNewer(curr, recent));
      setComments((curr) => ({ ...curr, ...initialComments(historyKey, recent) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recent]);

  const persist = (next) => {
    try {
      localStorage.setItem(historyKey, JSON.stringify(next));
    } catch {
      /* quota */
    }
  };

  const activeItem = items[0];

  const postComment = () => {
    const trimmed = draft.trim();
    if (!trimmed || !activeItem) return;
    const next = {
      ...comments,
      [activeItem.id]: [
        ...(comments[activeItem.id] || []),
        {
          id: `c-${Date.now()}`,
          text: trimmed,
          author: "You",
          at: new Date().toISOString(),
        },
      ],
    };
    setComments(next);
    persist(next);
    setDraft("");
  };

  const toggleThumb = () => {
    if (!activeItem) return;
    const next = { ...thumbs, [activeItem.id]: !thumbs[activeItem.id] };
    setThumbs(next);
    try {
      localStorage.setItem(`${historyKey}_thumbs`, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const removeItem = (id) => {
    const next = items.filter((x) => x.id !== id);
    setItems(next);
    persist(next);
  };

  const exportItem = () => {
    if (!activeItem) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            questionId: activeItem.id,
            questionType: activeItem.type,
            score: activeItem.score,
            duration: activeItem.duration,
            transcript: activeItem.transcript,
            takenAt: activeItem.takenAt || activeItem.date,
          },
          null,
          2
        ),
      ],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pte-master-${activeItem.id || "submission"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareItem = async () => {
    if (!activeItem) return;
    const text = `Scored ${activeItem.score}/100 on PTE Master · ${activeItem.type}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "AI Score", text });
      } catch {
        /* user cancelled */
      }
    } else {
      navigator.clipboard?.writeText(text);
    }
  };

  return (
    <div className="container-main mt-12 mb-6 px-4 sm:px-6 lg:px-8">
      <div className="card overflow-hidden">
        <div className="flex border-b border-slate-100 dark:border-slate-700">
          <TabButton active={tab === "forum"} onClick={() => setTab("forum")}>
            Forum
          </TabButton>
          <TabButton active={tab === "my"} onClick={() => setTab("my")}>
            My Score
          </TabButton>
          <TabButton active={tab === "community"} onClick={() => setTab("community")}>
            Community Score
          </TabButton>
        </div>

        <div className="p-4 sm:p-5">
          {tab === "my" && (
            <MyScoreView
              items={items}
              activeId={activeItem?.id}
              comments={comments[activeItem?.id] || []}
              liked={!!(activeItem && thumbs[activeItem.id])}
              draft={draft}
              setDraft={setDraft}
              onPost={postComment}
              onThumb={toggleThumb}
              onShare={shareItem}
              onDownload={exportItem}
              onRemove={(id) => removeItem(id)}
              skill={skill}
            />
          )}

          {tab === "forum" && (
            <ForumView
              comments={comments[activeItem?.id] || []}
              draft={draft}
              setDraft={setDraft}
              onPost={postComment}
            />
          )}

          {tab === "community" && (
            <CommunityView items={items} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- tabs ---------- */

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-3 text-sm font-semibold transition-colors relative ${
        active
          ? "text-orange-600"
          : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      }`}
    >
      {children}
      {active && (
        <span className="absolute left-4 right-4 -bottom-px h-0.5 bg-orange-500 rounded-full" />
      )}
    </button>
  );
}

/* ---------- My Score ---------- */

function ScoreBadge({ score }) {
  const max = 90;
  const color =
    score >= max * 0.7
      ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800"
      : score >= max * 0.4
      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
      : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-bold ${color}`}>
      <span className="w-5 h-5 rounded-full bg-white/60 text-current flex items-center justify-center text-[10px] font-bold">
        S
      </span>
      {score}/{max}
    </span>
  );
}

function MyScoreView({
  items,
  activeId,
  comments,
  liked,
  draft,
  setDraft,
  onPost,
  onThumb,
  onShare,
  onDownload,
  onRemove,
  skill,
}) {
  if (!items.length) {
    return (
      <EmptyState
        icon={FiThumbsUp}
        title="No submissions yet"
        description={`Submit a response on the ${skill} practice page above to see it scored here.`}
      />
    );
  }

  const active = items.find((x) => x.id === activeId) || items[0];

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Avatar name="You" tone="purple" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {formatDate(active.takenAt || active.date)}{" "}
              <span className="text-slate-400">·</span>{" "}
              <span className="text-slate-500">{active.type || skill}</span>
            </p>
            {active.transcript && (
              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                "{active.transcript}"
              </p>
            )}
          </div>
          <ScoreBadge score={active.score} />
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200 text-sm font-semibold"
          >
            <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center">
              🏆
            </span>
            AI Score
          </button>

          <div className="flex items-center gap-2 ml-auto text-slate-400">
            <IconBtn title="Download" onClick={onDownload}><FiDownload /></IconBtn>
            <IconBtn title="Share" onClick={onShare}><FiShare2 /></IconBtn>
            <IconBtn title="Remove" onClick={() => onRemove(active.id)}>
              <FiTrash2 />
            </IconBtn>
            <IconBtn title="Comments"><FiMessageSquare /></IconBtn>
            <IconBtn title="Like" active={liked} onClick={onThumb}>
              <FiThumbsUp />
            </IconBtn>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-2">{comments.length} comment(s) on this submission</p>
      </div>

      {items.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Previous</p>
          {items.slice(1, 6).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onPost} // placeholder; the active row is the latest only
              className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800 p-3 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
            >
              <Avatar name="You" tone="purple" small />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                  {formatDate(item.takenAt || item.date)} · {item.type || skill}
                </p>
              </div>
              <ScoreBadge score={item.score} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Forum ---------- */

function ForumView({ comments, draft, setDraft, onPost }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Discussion thread for your latest response. Comments are stored only in this browser.
      </p>

      <div className="flex items-start gap-3">
        <Avatar name="You" tone="purple" />
        <div className="flex-1">
          <textarea
            rows={2}
            className="input"
            placeholder="Add a comment..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={onPost}
              disabled={!draft.trim()}
              className="px-4 py-1.5 rounded-lg bg-brand text-white text-sm font-semibold disabled:opacity-50"
            >
              Post
            </button>
          </div>
        </div>
      </div>

      {comments.length === 0 ? (
        <p className="text-sm text-slate-400">No comments yet. Be the first to start the discussion.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-3">
              <Avatar name={c.author} tone="teal" />
              <div className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                <p className="text-xs text-slate-400">
                  <strong className="text-slate-700 dark:text-slate-200">{c.author}</strong>
                  {" · "}
                  {formatDate(c.at)}
                </p>
                <p className="text-sm mt-1 text-slate-700 dark:text-slate-200">{c.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Community ---------- */

function CommunityView({ items }) {
  const top = useMemo(() => [...items].sort((a, b) => b.score - a.score).slice(0, 8), [items]);
  if (top.length === 0) {
    return (
      <EmptyState
        icon={FiThumbsUp}
        title="No community scores yet"
        description="Be the first to submit a response — your best score will appear here."
      />
    );
  }
  return (
    <ul className="space-y-2">
      {top.map((item, i) => (
        <li
          key={item.id || i}
          className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800 p-3"
        >
          <span className="w-6 text-center text-xs font-bold text-slate-400">#{i + 1}</span>
          <Avatar name={item.author || "Anonymous"} tone={i % 2 ? "purple" : "teal"} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
              {item.author || "Anonymous learner"}
            </p>
            <p className="text-xs text-slate-400">{formatDate(item.takenAt || item.date)}</p>
          </div>
          <ScoreBadge score={item.score} />
        </li>
      ))}
    </ul>
  );
}

/* ---------- helpers ---------- */

function Avatar({ name = "?", tone = "purple", small = false }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const colours = {
    purple: "bg-purple-500 text-white",
    teal: "bg-teal-500 text-white",
    orange: "bg-orange-500 text-white",
  };
  const sz = small ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return (
    <span
      className={`${sz} ${colours[tone] || colours.purple} rounded-full inline-flex items-center justify-center font-bold shrink-0`}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

function IconBtn({ children, title, active, onClick }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
        active ? "bg-brand/10 text-brand" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      }`}
      aria-label={title}
    >
      {children}
    </button>
  );
}

function initialComments(historyKey, recent) {
  try {
    const raw = localStorage.getItem(`${historyKey}_comments`);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  if (!recent?.length) return {};
  // Seed with an empty array per submission so we have something to render.
  return Object.fromEntries(recent.map((r) => [r.id, []]));
}

function initialThumbs(historyKey) {
  try {
    const raw = localStorage.getItem(`${historyKey}_thumbs`);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {};
}

function mergeNewer(current, incoming) {
  const map = new Map();
  current.forEach((x) => map.set(x.id, x));
  incoming.forEach((x) => map.set(x.id, { ...map.get(x.id), ...x }));
  return [...map.values()].sort(
    (a, b) => new Date(b.takenAt || b.date || 0) - new Date(a.takenAt || a.date || 0)
  );
}
