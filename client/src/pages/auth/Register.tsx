import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ companyName: "", name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(form);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="surveyor-grid flex h-screen items-center justify-center bg-blueprint-950">
      <div className="w-full max-w-sm rounded-md bg-white p-8 shadow-xl">
        <h1 className="mb-1 text-lg font-semibold text-concrete-900">Register your company</h1>
        <p className="mb-6 text-sm text-concrete-400">
          Creates your company workspace and an Admin account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-concrete-700">Company name</label>
            <input
              required
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
              placeholder="Demo Builders Pvt Ltd"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-concrete-700">Your name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-concrete-700">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-concrete-700">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
              placeholder="At least 8 characters"
            />
          </div>

          {error && <p className="text-sm text-signal-red">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-blueprint-900 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create workspace"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-concrete-400">
          Already registered?{" "}
          <Link to="/login" className="font-medium text-blueprint-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
