import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import {
  createRequirement,
  createWorkPackage,
  deleteRequirement,
  listRequirements,
  listWorkPackages,
} from "@/api/planning";
import { getProject } from "@/api/projects";
import StatusBadge from "@/components/ui/StatusBadge";

export default function PlanningPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = id!;

  const { data: project } = useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => getProject(projectId),
  });

  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-xl font-semibold text-concrete-900">Planning & Requirements</h1>
      </div>
      <p className="mb-6 text-sm text-concrete-400">
        {project ? `${project.name} (${project.code})` : "Loading…"}
      </p>

      <RequirementsSection projectId={projectId} />
      <WorkPackagesSection projectId={projectId} />
    </div>
  );
}

function RequirementsSection({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: "", description: "" });

  const { data: requirements, isLoading } = useQuery({
    queryKey: ["requirements", projectId],
    queryFn: () => listRequirements(projectId),
  });

  const addRequirement = useMutation({
    mutationFn: () =>
      createRequirement(projectId, {
        title: form.title,
        description: form.description || undefined,
      }),
    onSuccess: () => {
      setForm({ title: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["requirements", projectId] });
    },
  });

  const removeRequirement = useMutation({
    mutationFn: (reqId: string) => deleteRequirement(reqId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["requirements", projectId] }),
  });

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold text-concrete-900">Project Requirements</h2>

      <div className="mb-4 rounded-md border border-concrete-200 bg-white">
        {isLoading && <p className="px-5 py-4 text-sm text-concrete-400">Loading…</p>}
        <ul className="divide-y divide-concrete-100">
          {requirements?.map((r) => (
            <li key={r.id} className="flex items-start justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-concrete-900">{r.title}</p>
                {r.description && (
                  <p className="mt-0.5 text-sm text-concrete-500">{r.description}</p>
                )}
              </div>
              <button
                onClick={() => removeRequirement.mutate(r.id)}
                className="text-concrete-400 hover:text-signal-red"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
        {!isLoading && requirements?.length === 0 && (
          <p className="px-5 py-4 text-sm text-concrete-400">No requirements captured yet.</p>
        )}
      </div>

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (form.title.trim()) addRequirement.mutate();
        }}
        className="flex flex-wrap gap-2"
      >
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Requirement title"
          className="w-56 rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
        />
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description (optional)"
          className="w-72 rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
        />
        <button
          type="submit"
          disabled={addRequirement.isPending}
          className="flex items-center gap-1.5 rounded bg-blueprint-900 px-3 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
        >
          <Plus size={15} />
          Add requirement
        </button>
      </form>
    </section>
  );
}

function WorkPackagesSection({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  const { data: workPackages, isLoading } = useQuery({
    queryKey: ["work-packages", projectId],
    queryFn: () => listWorkPackages(projectId),
  });

  const addWorkPackage = useMutation({
    mutationFn: () => createWorkPackage(projectId, { name }),
    onSuccess: () => {
      setName("");
      queryClient.invalidateQueries({ queryKey: ["work-packages", projectId] });
    },
  });

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-concrete-900">Work Packages</h2>

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (name.trim()) addWorkPackage.mutate();
        }}
        className="mb-4 flex gap-2"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New work package (e.g. Foundation & Substructure)"
          className="w-80 rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
        />
        <button
          type="submit"
          disabled={addWorkPackage.isPending}
          className="flex items-center gap-1.5 rounded bg-blueprint-900 px-3 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
        >
          <Plus size={15} />
          Add work package
        </button>
      </form>

      {isLoading && <p className="text-sm text-concrete-400">Loading…</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workPackages?.map((wp) => (
          <Link
            key={wp.id}
            to={`/work-packages/${wp.id}`}
            className="rounded-md border border-concrete-200 bg-white p-5 hover:shadow-md"
          >
            <div className="mb-3 flex items-start justify-between">
              <p className="font-medium text-concrete-900">{wp.name}</p>
              <StatusBadge status={wp.status} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-concrete-400">
              <span>{wp._count?.activities ?? 0} activities</span>
              <span>{wp._count?.boqItems ?? 0} BOQ items</span>
              <span>{wp._count?.materialRequirements ?? 0} material reqs</span>
              <span>{wp._count?.laborRequirements ?? 0} labor reqs</span>
              <span>{wp._count?.equipmentRequirements ?? 0} equipment reqs</span>
            </div>
          </Link>
        ))}
      </div>

      {!isLoading && workPackages?.length === 0 && (
        <div className="rounded-md border border-dashed border-concrete-300 py-12 text-center">
          <p className="text-sm text-concrete-400">No work packages yet.</p>
        </div>
      )}
    </section>
  );
}
