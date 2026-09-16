import type { ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Building2, FolderKanban, IndianRupee } from "lucide-react";
import { listProjects } from "@/api/projects";
import StatusBadge from "@/components/ui/StatusBadge";

export default function Dashboard() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  });

  const activeCount = projects?.filter((p) => p.status === "ACTIVE").length ?? 0;
  const siteCount = projects?.reduce((sum, p) => sum + (p._count?.sites ?? 0), 0) ?? 0;
  const totalBudget =
    projects?.reduce((sum, p) => sum + (p.budget ? Number(p.budget) : 0), 0) ?? 0;

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-concrete-900">Dashboard</h1>
      <p className="mb-6 text-sm text-concrete-400">Overview across all your projects.</p>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={FolderKanban} label="Active projects" value={activeCount} />
        <StatCard icon={Building2} label="Total sites" value={siteCount} />
        <StatCard
          icon={IndianRupee}
          label="Combined budget"
          value={totalBudget ? `₹${totalBudget.toLocaleString("en-IN")}` : "—"}
        />
      </div>

      <div className="rounded-md border border-concrete-200 bg-white">
        <div className="flex items-center justify-between border-b border-concrete-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-concrete-900">Recent projects</h2>
          <Link to="/projects" className="text-sm text-blueprint-700 hover:underline">
            View all
          </Link>
        </div>

        {isLoading && <p className="px-5 py-6 text-sm text-concrete-400">Loading…</p>}

        {!isLoading && projects?.length === 0 && (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-concrete-400">No projects yet.</p>
            <Link
              to="/projects"
              className="mt-2 inline-block text-sm font-medium text-blueprint-700 hover:underline"
            >
              Create your first project →
            </Link>
          </div>
        )}

        <ul className="divide-y divide-concrete-200">
          {projects?.slice(0, 6).map((p) => (
            <li key={p.id}>
              <Link
                to={`/projects/${p.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-concrete-50"
              >
                <div>
                  <p className="text-sm font-medium text-concrete-900">{p.name}</p>
                  <p className="font-mono text-xs text-concrete-400">{p.code}</p>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-md border border-concrete-200 bg-white p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded bg-blueprint-100 text-blueprint-700">
        <Icon size={18} />
      </div>
      <p className="text-xl font-semibold text-concrete-900">{value}</p>
      <p className="text-xs text-concrete-400">{label}</p>
    </div>
  );
}
