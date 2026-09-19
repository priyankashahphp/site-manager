import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { getProjectOverview } from "@/api/reports";
import StatusBadge from "@/components/ui/StatusBadge";

export default function ProjectReportOverview() {
  const { id } = useParams<{ id: string }>();
  const projectId = id!;

  const { data: overview, isLoading } = useQuery({
    queryKey: ["reports", "overview", projectId],
    queryFn: () => getProjectOverview(projectId),
  });

  if (isLoading) return <p className="text-sm text-concrete-400">Loading…</p>;
  if (!overview) return <p className="text-sm text-concrete-400">Project not found.</p>;

  const { project, progress, finance, material, labor, quality } = overview;

  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-xl font-semibold text-concrete-900">{project.name}</h1>
        <StatusBadge status={project.status} />
      </div>
      <p className="mb-6 font-mono text-sm text-concrete-400">{project.code}</p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          label="Overall progress"
          value={progress.overallPercent !== null ? `${progress.overallPercent}%` : "No activities yet"}
          sub={`${progress.activityCount} activities tracked`}
        />
        <Card
          label="Budget used"
          value={finance.percentUsed !== null ? `${finance.percentUsed}%` : "No budget set"}
          sub={`₹${finance.totalSpent.toLocaleString("en-IN")} spent`}
          negative={finance.percentUsed !== null && finance.percentUsed > 100}
        />
        <Card
          label="Vendor outstanding"
          value={`₹${overview.vendorOutstanding.toLocaleString("en-IN")}`}
          sub={`${overview.purchaseOrderCount} purchase order(s)`}
        />
        <Card label="Labor present today" value={String(labor.presentToday)} sub="Across all sites" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-concrete-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-concrete-900">Budget vs Actual</h2>
          <div className="space-y-1 text-sm">
            <Row label="Budget" value={finance.budget !== null ? `₹${finance.budget.toLocaleString("en-IN")}` : "—"} />
            <Row label="Spent" value={`₹${finance.totalSpent.toLocaleString("en-IN")}`} />
            <Row
              label="Variance"
              value={finance.variance !== null ? `₹${finance.variance.toLocaleString("en-IN")}` : "—"}
              negative={finance.variance !== null && finance.variance < 0}
            />
          </div>
          <Link to={`/projects/${project.id}/finance`} className="mt-3 inline-block text-sm text-blueprint-700 hover:underline">
            Open full Finance page →
          </Link>
        </section>

        <section className="rounded-md border border-concrete-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-concrete-900">Open items</h2>
          <div className="space-y-1 text-sm">
            <Row label="Open site issues" value={String(quality.openSiteIssues)} />
            <Row label="Open safety incidents" value={String(quality.openSafetyIncidents)} />
            <Row label="Pending inspections" value={String(quality.pendingInspections)} />
          </div>
        </section>
      </div>

      <section className="rounded-md border border-concrete-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-concrete-900">Low stock materials</h2>
        {material.lowStockCount === 0 ? (
          <p className="text-sm text-concrete-400">Nothing at or below reorder level across this project's sites.</p>
        ) : (
          <ul className="divide-y divide-concrete-100">
            {material.lowStockMaterials.map((m, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="text-concrete-900">{m.name}</span>
                <span className="text-safety-dark">
                  {m.balance} / {m.reorderLevel} {m.unit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Card({
  label,
  value,
  sub,
  negative,
}: {
  label: string;
  value: string;
  sub?: string;
  negative?: boolean;
}) {
  return (
    <div className="rounded-md border border-concrete-200 bg-white p-4">
      <p className="text-xs text-concrete-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${negative ? "text-signal-red" : "text-concrete-900"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-concrete-400">{sub}</p>}
    </div>
  );
}

function Row({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-concrete-500">{label}</span>
      <span className={`font-medium ${negative ? "text-signal-red" : "text-concrete-900"}`}>{value}</span>
    </div>
  );
}
