import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "../../components/common/Button";
import { validatePassword } from "../../utils/helpers";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = {};
    const pw = validatePassword(form.password);
    if (pw) err.password = pw;
    if (form.password !== form.confirm) err.confirm = "Passwords do not match";
    setErrors(err);
    if (Object.keys(err).length) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    // Update local demo user password if present
    try {
      const raw = localStorage.getItem("pte_master_users");
      if (raw && email) {
        const users = JSON.parse(raw);
        const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
        if (idx >= 0) {
          users[idx].password = form.password;
          localStorage.setItem("pte_master_users", JSON.stringify(users));
        }
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
    toast.success("Password updated in local demo storage.");
    navigate("/login");
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-navy dark:text-white">Reset password</h1>
          <p className="text-sm text-slate-500 mt-1">
            {email ? `For ${email}` : "Choose a new password"}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-4">
          <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
            Demo only — password is updated in browser localStorage, not a real auth server.
          </div>
          <div>
            <label className="label" htmlFor="password">New password</label>
            <div className="relative">
              <input
                id="password"
                type={showPass ? "text" : "password"}
                className="input pr-10"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="label" htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              className="input"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            />
            {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm}</p>}
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            Update Password
          </Button>
          <Link to="/login" className="block text-center text-sm text-brand hover:underline">
            Back to login
          </Link>
        </form>
      </div>
    </div>
  );
}
