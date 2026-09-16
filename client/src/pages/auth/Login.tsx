import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="surveyor-grid flex h-screen items-center justify-center bg-blueprint-950">
      <div className="w-full max-w-sm rounded-md bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-safety font-mono text-sm font-bold text-blueprint-950">
            S
          </div>
          <div>
            <p className="text-sm font-semibold text-concrete-900">SiteOps</p>
            <p className="text-xs text-concrete-400">Construction Site Management</p>
          </div>
        </div>

        <h1 className="mb-1 text-lg font-semibold text-concrete-900">Sign in</h1>
        <p className="mb-6 text-sm text-concrete-400">Access your company's projects and sites.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-concrete-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-concrete-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-signal-red">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-blueprint-900 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-concrete-400">
          New company?{" "}
          <Link to="/register" className="font-medium text-blueprint-700 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
