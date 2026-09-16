import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { MapPin, Plus } from "lucide-react";
import { createSite, getProject } from "@/api/projects";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [showCreateSite, setShowCreateSite] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ["projects", id],
    queryFn: () => getProject(id!),
    enabled: !!id,
  });

  if (isLoading) return <p className="text-sm text-concrete-400">Loading…</p>;
  if (!project) return <p className="text-sm text-concrete-400">Project not found.</p>;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-xl font-semibold text-concrete-900">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="font-mono text-sm text-concrete-400">{project.code}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/projects/${project.id}/planning`}
            className="rounded border border-concrete-200 px-3 py-2 text-sm font-medium text-concrete-700 hover:bg-concrete-50"
          >
            Planning & BOQ
          </Link>
          <Link
            to={`/projects/${project.id}/purchase-orders`}
            className="rounded border border-concrete-200 px-3 py-2 text-sm font-medium text-concrete-700 hover:bg-concrete-50"
          >
            Purchase Orders
          </Link>
          <Link
            to={`/projects/${project.id}/finance`}
            className="rounded border border-concrete-200 px-3 py-2 text-sm font-medium text-concrete-700 hover:bg-concrete-50"
          >
            Finance
          </Link>
          <button
            onClick={() => setShowCreateSite(true)}
            className="flex items-center gap-1.5 rounded bg-blueprint-900 px-3 py-2 text-sm font-medium text-white hover:bg-blueprint-800"
          >
            <Plus size={15} />
            Add site
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InfoCard label="Project manager" value={project.projectManager?.name || "Unassigned"} />
        <InfoCard
          label="Budget"
          value={project.budget ? `₹${Number(project.budget).toLocaleString("en-IN")}` : "—"}
        />
        <InfoCard label="Sites" value={String(project.sites?.length ?? 0)} />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-concrete-900">Sites</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {project.sites?.map((site) => (
          <Link
            key={site.id}
            to={`/sites/${site.id}`}
            className="rounded-md border border-concrete-200 bg-white p-5 hover:shadow-md"
          >
            <p className="mb-2 font-medium text-concrete-900">{site.name}</p>
            {site.address && (
              <p className="flex items-center gap-1 text-sm text-concrete-500">
                <MapPin size={13} />
                {site.address}
              </p>
            )}
          </Link>
        ))}
      </div>

      {project.sites?.length === 0 && (
        <div className="rounded-md border border-dashed border-concrete-300 py-12 text-center">
          <p className="text-sm text-concrete-400">No sites added to this project yet.</p>
        </div>
      )}

      {showCreateSite && (
        <CreateSiteModal projectId={project.id} onClose={() => setShowCreateSite(false)} />
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-concrete-200 bg-white p-4">
      <p className="text-xs text-concrete-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-concrete-900">{value}</p>
    </div>
  );
}

function CreateSiteModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", address: "" });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => createSite(projectId, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      onClose();
    },
    onError: (err: any) => setError(err?.response?.data?.error || "Failed to create site"),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <Modal title="Add site" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-concrete-700">Site name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
            placeholder="Main site"
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

        {error && <p className="text-sm text-signal-red">{error}</p>}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded bg-blueprint-900 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
        >
          {mutation.isPending ? "Adding…" : "Add site"}
        </button>
      </form>
    </Modal>
  );
}
