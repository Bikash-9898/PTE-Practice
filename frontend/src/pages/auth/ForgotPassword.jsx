import { useState } from "react";
import { Link } from "react-router-dom";
import { FiMail, FiArrowLeft } from "react-icons/fi";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/common/Button";
import { validateEmail } from "../../utils/helpers";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPasswordRequest } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError("Enter a valid email");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await resetPasswordRequest(email);
      setSent(true);
      toast.success("Reset instructions simulated for this demo.");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-navy dark:text-white">Forgot password</h1>
          <p className="text-sm text-slate-500 mt-1">
            We&apos;ll simulate a reset link for this frontend demo
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                <FiMail size={24} />
              </div>
              <h2 className="font-semibold text-navy dark:text-white">Check your inbox</h2>
              <p className="text-sm text-slate-500">
                If <strong>{email}</strong> exists in the demo user list, a reset flow would be
                emailed. For this demo, continue to the reset page.
              </p>
              <Link to={`/reset-password?email=${encodeURIComponent(email)}`}>
                <Button className="w-full">Continue to Reset</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
              </div>
              <Button type="submit" className="w-full" loading={loading}>
                Send Reset Link
              </Button>
            </form>
          )}

          <Link
            to="/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm text-brand hover:underline"
          >
            <FiArrowLeft size={14} /> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
