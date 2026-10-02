import { useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/common/Button";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: "",
    targetScore: "79",
    examDate: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    updateProfile({ name: form.name.trim() });
    setLoading(false);
    toast.success("Profile updated locally for this demo.");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your demo account details</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand text-white flex items-center justify-center text-2xl font-bold">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div>
            <p className="font-semibold text-navy dark:text-white text-lg">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="badge bg-blue-50 text-brand mt-1 capitalize">{user?.role}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="name">Display name</label>
            <input
              id="name"
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" className="input" value={form.email} disabled />
            <p className="text-xs text-slate-400 mt-1">Email changes are disabled in the demo.</p>
          </div>
          <div>
            <label className="label" htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              rows={3}
              className="input resize-y"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell us about your study goals..."
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="target">Target score</label>
              <input
                id="target"
                className="input"
                value={form.targetScore}
                onChange={(e) => setForm({ ...form, targetScore: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="exam">Exam date</label>
              <input
                id="exam"
                type="date"
                className="input"
                value={form.examDate}
                onChange={(e) => setForm({ ...form, examDate: e.target.value })}
              />
            </div>
          </div>
          <Button type="submit" loading={loading}>
            Save Profile
          </Button>
        </form>
      </div>
    </div>
  );
}
