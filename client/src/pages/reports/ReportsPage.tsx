import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getPortfolioReport } from "@/api/reports";
import StatusBadge from "@/components/ui/StatusBadge";

export default function ReportsPage() {
  const { data: rows, isLoading } = useQuery({
    queryKey: ["reports", "portfolio"],
    queryFn: getPortfolioReport,
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-concrete-900">Reports</h1>
      <p className="mb-6 text-sm text-concrete-400">
        Progress and budget across every project. Open a project for the full picture.
      </p>

      <div className="overflow-hidden rounded-md border border-concrete-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-concrete-200 bg-concrete-50 text-left text-xs uppercase tracking-wide text-concrete-400">
            <tr>
              <th className="px-4 py-2 font-medium">Project</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Sites</th>
              <th className="px-4 py-2 font-medium">Progress</th>
              <th className="px-4 py-2 font-medium">Budget</th>
              <th className="px-4 py-2 font-medium">Spent</th>
              <th className="px-4 py-2 font-medium">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-concrete-100">
            {rows?.map((r) => (
              <tr key={r.projectId}>
                <td className="px-4 py-2">
                  <Link to={`/projects/${r.projectId}/reports`} className="font-medium text-blueprint-700 hover:underline">
                    {r.projectName}
                  </Link>
                  <span className="ml-2 font-mono text-xs text-concrete-400">{r.projectCode}</span>
                </td>
                <td className="px-4 py-2">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-2 text-concrete-500">{r.siteCount}</td>
                <td className="px-4 py-2">
                  {r.overallPercent !== null ? (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-concrete-200">
                        <div className="h-full bg-blueprint-700" style={{ width: `${r.overallPercent}%` }} />
                      </div>
                      <span className="text-xs text-concrete-500">{r.overallPercent}%</span>
                    </div>
                  ) : (
                    <span className="text-concrete-400">—</span>
                  )}
                </td>
                <td className="px-4 py-2 text-concrete-500">
                  {r.budget !== null ? `₹${r.budget.toLocaleString("en-IN")}` : "—"}
                </td>
                <td className="px-4 py-2 text-concrete-500">₹{r.totalSpent.toLocaleString("en-IN")}</td>
                <td
                  className={`px-4 py-2 font-medium ${
                    r.variance !== null && r.variance < 0 ? "text-signal-red" : "text-signal-green"
                  }`}
                >
                  {r.variance !== null ? `₹${r.variance.toLocaleString("en-IN")}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <p className="px-4 py-4 text-sm text-concrete-400">Loading…</p>}
        {!isLoading && rows?.length === 0 && (
          <p className="px-4 py-4 text-sm text-concrete-400">No projects yet.</p>
        )}
      </div>
    </div>
  );
}
