import { useState } from "react";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import { toast } from "react-toastify";
import { mockTests as initial } from "../../data/mockTests";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { difficultyColor } from "../../utils/helpers";

export default function ManageMockTests() {
  const [tests, setTests] = useState(initial);
  const [deleteId, setDeleteId] = useState(null);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    duration: 60,
    difficulty: "Medium",
    totalQuestions: 10,
  });

  const openAdd = () => {
    setForm({
      title: "",
      description: "",
      duration: 60,
      difficulty: "Medium",
      totalQuestions: 10,
    });
    setEdit({ mode: "add" });
  };

  const openEdit = (t) => {
    setForm({
      title: t.title,
      description: t.description,
      duration: t.duration,
      difficulty: t.difficulty,
      totalQuestions: t.totalQuestions,
    });
    setEdit({ mode: "edit", data: t });
  };

  const save = () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (edit.mode === "add") {
      setTests((t) => [
        {
          id: `mt-local-${Date.now()}`,
          ...form,
          sections: ["Speaking", "Writing", "Reading", "Listening"],
          attempts: 0,
          avgScore: 0,
          featured: false,
          status: "draft",
        },
        ...t,
      ]);
      toast.success("Mock test added to local list (not saved to a server).");
    } else {
      setTests((ts) => ts.map((t) => (t.id === edit.data.id ? { ...t, ...form } : t)));
      toast.success("Mock test updated locally.");
    }
    setEdit(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Manage Mock Tests</h1>
          <p className="page-subtitle">Local mock test catalog</p>
        </div>
        <Button onClick={openAdd}>
          <FiPlus /> Add Mock Test
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {tests.map((t) => (
          <div key={t.id} className="card p-5">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-navy dark:text-white">{t.title}</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(t)}
                  className="p-2 rounded-lg text-slate-400 hover:text-brand hover:bg-blue-50"
                >
                  <FiEdit2 size={15} />
                </button>
                <button
                  onClick={() => setDeleteId(t.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-3 line-clamp-2">{t.description}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className={`badge ${difficultyColor(t.difficulty)}`}>{t.difficulty}</span>
              <span className="badge bg-slate-100 text-slate-600">{t.duration} min</span>
              <span className="badge bg-slate-100 text-slate-600">{t.totalQuestions} Qs</span>
              <span className="badge bg-blue-50 text-brand">{t.status || "published"}</span>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.mode === "add" ? "Add mock test" : "Edit mock test"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2">
            Local UI only — not persisted to a backend.
          </p>
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[80px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label">Duration</label>
              <input
                type="number"
                className="input"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Questions</label>
              <input
                type="number"
                className="input"
                value={form.totalQuestions}
                onChange={(e) => setForm({ ...form, totalQuestions: Number(e.target.value) })}
              />
            </div>
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
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete mock test?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setTests((t) => t.filter((x) => x.id !== deleteId));
                setDeleteId(null);
                toast.info("Removed from local list only.");
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">This only updates the in-session mock catalog.</p>
      </Modal>
    </div>
  );
}
