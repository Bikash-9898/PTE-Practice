import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiEye, FiEyeOff, FiMail, FiLock } from "react-icons/fi";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/common/Button";
import { validateEmail, validatePassword } from "../../utils/helpers";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const validate = () => {
    const e = {};
    if (!validateEmail(form.email)) e.email = "Enter a valid email";
    const pw = validatePassword(form.password);
    if (pw) e.password = pw;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const session = await login(form.email, form.password, form.remember);
      toast.success(`Welcome back, ${session.name.split(" ")[0]}!`);
      // Return the user to wherever they were headed, otherwise role home.
      const target = from || (session.role === "admin" ? "/admin" : "/dashboard");
      navigate(target, { replace: true });
    } catch (err) {
      setErrors({ form: err.message });
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setForm({ email: "student@ptemaster.com", password: "student123", remember: true });
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12 bg-surface dark:bg-navy">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand text-white font-bold flex items-center justify-center text-lg">
              P
            </div>
            <span className="text-xl font-bold text-navy dark:text-white">PTE Master</span>
          </Link>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to continue practicing</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-4">
          <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3 text-xs text-blue-800 dark:text-blue-200">
            <strong>Student demo account</strong> — Try student@ptemaster.com / student123
          </div>

          {errors.form && (
            <div className="rounded-xl bg-red-50 text-red-700 text-sm p-3" role="alert">
              {errors.form}
            </div>
          )}

          <div>
            <label className="label" htmlFor="email">Email</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input pl-10"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                id="password"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                className="input pl-10 pr-10"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                className="rounded border-slate-300 text-brand focus:ring-brand"
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-sm text-brand hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Sign In
          </Button>

          <Button type="button" variant="secondary" size="sm" className="w-full" onClick={fillDemo}>
            Fill Student
          </Button>

          <p className="text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-brand font-medium hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
