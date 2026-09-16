import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { createProject, listProjects } from "@/api/projects";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";

export default function ProjectList() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-concrete-900">Projects</h1>
          <p className="text-sm text-concrete-400">All construction projects for your company.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded bg-blueprint-900 px-3 py-2 text-sm font-medium text-white hover:bg-blueprint-800"
        >
          <Plus size={15} />
          New project
        </button>
      </div>

      {isLoading && <p className="text-sm text-concrete-400">Loading…</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects?.map((p) => (
          <Link
            key={p.id}
            to={`/projects/${p.id}`}
            className="rounded-md border border-concrete-200 bg-white p-5 transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="font-medium text-concrete-900">{p.name}</p>
                <p className="font-mono text-xs text-concrete-400">{p.code}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
            {p.address && <p className="mb-3 text-sm text-concrete-500">{p.address}</p>}
            <div className="flex items-center justify-between border-t border-concrete-100 pt-3 text-xs text-concrete-400">
              <span>{p._count?.sites ?? 0} site(s)</span>
              {p.budget ? <span>₹{Number(p.budget).toLocaleString("en-IN")}</span> : null}
            </div>
          </Link>
        ))}
      </div>

      {!isLoading && projects?.length === 0 && (
        <div className="rounded-md border border-dashed border-concrete-300 py-16 text-center">
          <p className="text-sm text-concrete-400">No projects yet.</p>
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", code: "", address: "", budget: "" });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createProject({
        name: form.name,
        code: form.code,
        address: form.address || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onClose();
    },
    onError: (err: any) => setError(err?.response?.data?.error || "Failed to create project"),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <Modal title="New project" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-concrete-700">Project name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
            placeholder="Skyline Residences"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-concrete-700">Project code</label>
          <input
            required
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            className="w-full rounded border border-concrete-200 px-3 py-2 text-sm font-mono focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
            placeholder="SKY-001"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-concrete-700">Address</label>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-concrete-700">Budget (₹)</label>
          <input
            type="number"
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
            className="w-full rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
          />
        </div>

        {error && <p className="text-sm text-signal-red">{error}</p>}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded bg-blueprint-900 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
        >
          {mutation.isPending ? "Creating…" : "Create project"}
        </button>
      </form>
    </Modal>
  );
}
