import { useMemo, useState, useCallback, useEffect } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { difficultyColor } from "../../utils/helpers";
import {
  QUESTION_TYPES,
  parseCorrectAnswer,
  serialiseCorrectAnswer,
} from "../../utils/questionLoader";

const PAGE_SIZE = 8;

const DEFAULT_TYPE_BY_SKILL = {
  speaking: "Read Aloud",
  writing: "Write Essay",
  reading: "Multiple Choice",
  listening: "Write from Dictation",
};

const EMPTY_FORM = {
  title: "",
  type: "Read Aloud",
  skill: "speaking",
  difficulty: "Medium",
  prompt: "",
  passage: "",
  options: "",
  correctAnswer: "",
  explanation: "",
  tips: "",
  timeLimit: 60,
  prepTime: 0,
  wordMin: 0,
  wordMax: 0,
  points: 1,
  isPublished: true,
};

function buildPayload(form) {
  return {
    title: form.title.trim(),
    type: form.type,
    skill: form.skill,
    difficulty: form.difficulty,
    prompt: form.prompt.trim(),
    passage: form.passage.trim(),
    options: form.options
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    correctAnswer: parseCorrectAnswer(form.type, form.correctAnswer),
    explanation: form.explanation.trim(),
    timeLimit: Number(form.timeLimit) || 60,
    prepTime: Number(form.prepTime) || 0,
    wordMin: Number(form.wordMin) || 0,
    wordMax: Number(form.wordMax) || 0,
    points: Number(form.points) || 1,
    isPublished: Boolean(form.isPublished),
    metadata: {
      ...(form.tips.trim() ? { tips: form.tips.trim() } : {}),
    },
  };
}

function formFromQuestion(q) {
  return {
    title: q.title || "",
    type: q.type || "",
    skill: q.skill || "speaking",
    difficulty: q.difficulty || "Medium",
    prompt: q.prompt || "",
    passage: q.passage || "",
    options: Array.isArray(q.options) ? q.options.join("\n") : "",
    correctAnswer: serialiseCorrectAnswer(q.correctAnswer),
    explanation: q.explanation || "",
    tips: q.metadata?.tips || "",
    timeLimit: q.timeLimit || 60,
    prepTime: q.prepTime || 0,
    wordMin: q.wordMin || 0,
    wordMax: q.wordMax || 0,
    points: q.points || 1,
    isPublished: q.isPublished !== false,
  };
}

export default function ManageQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [skill, setSkill] = useState("all");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { mode: add|edit, data }
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/questions?limit=100", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load questions");
      setQuestions(json.data || []);
    } catch (e) {
      setError(e.message || "Could not reach the question API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      const s = search.toLowerCase();
      const matchS =
        !s ||
        (q.type || "").toLowerCase().includes(s) ||
        (q.prompt || "").toLowerCase().includes(s) ||
        (q.skill || "").toLowerCase().includes(s);
      const matchSkill = skill === "all" || q.skill === skill;
      return matchS && matchSkill;
    });
  }, [questions, search, skill]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, type: DEFAULT_TYPE_BY_SKILL[form.skill] || "Read Aloud" });
    setModal({ mode: "add" });
  };

  const openEdit = (q) => {
    setForm(formFromQuestion(q));
    setModal({ mode: "edit", data: q });
  };

  const saveForm = async () => {
    if (!form.title.trim() || !form.prompt.trim()) {
      toast.error("Title and prompt are required");
      return;
    }
    setSaving(true);
    try {
      const url =
        modal.mode === "edit" ? `/api/questions/${modal.data._id}` : "/api/questions";
      const method = modal.mode === "edit" ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(form)),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Save failed");
      toast.success(
        modal.mode === "edit"
          ? "Question updated. Published questions are visible to students immediately."
          : "Question added. Published questions are visible to students immediately."
      );
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`/api/questions/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Delete failed");
      toast.success("Question deleted");
      setDeleteId(null);
      load();
    } catch (e) {
      toast.error(e.message || "Delete failed");
    }
  };

  const togglePublish = async (q) => {
    try {
      const res = await fetch(`/api/questions/${q._id}/publish`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !q.isPublished }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Toggle failed");
      toast.success(json.message || "Publish state updated");
      load();
    } catch (e) {
      toast.error(e.message || "Toggle failed");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Manage Questions</h1>
          <p className="page-subtitle">
            Add speaking, writing, reading &amp; listening questions — published
            items appear instantly in the student practice sections.
          </p>
        </div>
        <Button onClick={openAdd}>
          <FiPlus size={16} /> Add Question
        </Button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="input pl-9"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="input w-auto"
          value={skill}
          onChange={(e) => {
            setSkill(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All skills</option>
          <option value="speaking">Speaking</option>
          <option value="writing">Writing</option>
          <option value="reading">Reading</option>
          <option value="listening">Listening</option>
        </select>
      </div>

      {error && (
        <div className="card p-4 border border-red-200 bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100 dark:border-slate-700">
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Skill</th>
                <th className="px-5 py-3">Difficulty</th>
                <th className="px-5 py-3">Prompt</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    Loading questions…
                  </td>
                </tr>
              )}
              {!loading && pageItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    No questions match. Add your first question above.
                  </td>
                </tr>
              )}
              {!loading &&
                pageItems.map((q) => (
                  <tr key={q._id}>
                    <td className="px-5 py-3 font-medium text-navy dark:text-white whitespace-nowrap">
                      {q.type}
                    </td>
                    <td className="px-5 py-3 capitalize">{q.skill}</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${difficultyColor(q.difficulty)}`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 max-w-xs truncate">
                      {q.prompt}
                    </td>
                    <td className="px-5 py-3">
                      {q.isDemo ? (
                        <span className="badge bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          Demo
                        </span>
                      ) : q.isPublished ? (
                        <button
                          onClick={() => togglePublish(q)}
                          className="badge bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 hover:opacity-80"
                          title="Click to unpublish"
                        >
                          <FiEye size={12} className="mr-1" /> Published
                        </button>
                      ) : (
                        <button
                          onClick={() => togglePublish(q)}
                          className="badge bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300 hover:opacity-80"
                          title="Click to publish"
                        >
                          <FiEyeOff size={12} className="mr-1" /> Draft
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(q)}
                          className="p-2 rounded-lg text-slate-400 hover:text-brand hover:bg-blue-50"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(q._id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-400">
            Page {page}/{totalPages} · {filtered.length} questions
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Prev
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "add" ? "Add question" : "Edit question"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveForm} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-200 rounded-lg p-2">
            Saved to the backend. Published questions are shown to students under
            the matching section (Speaking / Writing / Reading / Listening).
          </p>
          <div>
            <label className="label">Title</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Short title for the question"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Skill (section)</label>
              <select
                className="input"
                value={form.skill}
                onChange={(e) => setForm({ ...form, skill: e.target.value })}
              >
                <option value="speaking">Speaking</option>
                <option value="writing">Writing</option>
                <option value="reading">Reading</option>
                <option value="listening">Listening</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Difficulty</label>
              <select
                className="input"
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
            <div>
              <label className="label">Published</label>
              <select
                className="input"
                value={form.isPublished ? "yes" : "no"}
                onChange={(e) => setForm({ ...form, isPublished: e.target.value === "yes" })}
              >
                <option value="yes">Published (visible to students)</option>
                <option value="no">Draft (hidden)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Prompt (question text)</label>
            <textarea
              className="input min-h-[80px] resize-y"
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Passage (for Reading / Listening)</label>
            <textarea
              className="input min-h-[80px] resize-y"
              value={form.passage}
              onChange={(e) => setForm({ ...form, passage: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Options (one per line, for Multiple Choice)</label>
            <textarea
              className="input min-h-[80px] resize-y"
              value={form.options}
              onChange={(e) => setForm({ ...form, options: e.target.value })}
              placeholder={"Option A\nOption B\nOption C"}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Correct answer</label>
              <input
                className="input"
                value={form.correctAnswer}
                onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                placeholder={'For MC: option index, e.g. "2" or "0,3". Else: answer text.'}
              />
            </div>
            <div>
              <label className="label">Explanation</label>
              <input
                className="input"
                value={form.explanation}
                onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Word min</label>
              <input
                type="number"
                className="input"
                value={form.wordMin}
                onChange={(e) => setForm({ ...form, wordMin: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Word max</label>
              <input
                type="number"
                className="input"
                value={form.wordMax}
                onChange={(e) => setForm({ ...form, wordMax: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Time limit (sec)</label>
              <input
                type="number"
                className="input"
                value={form.timeLimit}
                onChange={(e) => setForm({ ...form, timeLimit: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Prep time (sec)</label>
              <input
                type="number"
                className="input"
                value={form.prepTime}
                onChange={(e) => setForm({ ...form, prepTime: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Points</label>
              <input
                type="number"
                className="input"
                value={form.points}
                onChange={(e) => setForm({ ...form, points: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Tips (shown to students)</label>
            <input
              className="input"
              value={form.tips}
              onChange={(e) => setForm({ ...form, tips: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete question?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This permanently removes the question from the backend. Students will
          no longer see it in any section.
        </p>
      </Modal>
    </div>
  );
}