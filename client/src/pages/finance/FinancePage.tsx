import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getPortfolioFinanceSummary } from "@/api/finance";
import StatusBadge from "@/components/ui/StatusBadge";

export default function FinancePage() {
  const { data: rows, isLoading } = useQuery({
    queryKey: ["finance-summary"],
    queryFn: getPortfolioFinanceSummary,
  });

  const totalBudget = rows?.reduce((sum, r) => sum + (r.budget ?? 0), 0) ?? 0;
  const totalSpent = rows?.reduce((sum, r) => sum + r.totalSpent, 0) ?? 0;

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-concrete-900">Finance</h1>
      <p className="mb-6 text-sm text-concrete-400">Budget vs actual across all projects.</p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Combined budget" value={`₹${totalBudget.toLocaleString("en-IN")}`} />
        <SummaryCard label="Combined spend" value={`₹${totalSpent.toLocaleString("en-IN")}`} />
        <SummaryCard
          label="Combined variance"
          value={`₹${(totalBudget - totalSpent).toLocaleString("en-IN")}`}
          negative={totalBudget - totalSpent < 0}
        />
      </div>

      <div className="overflow-hidden rounded-md border border-concrete-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-concrete-200 bg-concrete-50 text-left text-xs uppercase tracking-wide text-concrete-400">
            <tr>
              <th className="px-4 py-2 font-medium">Project</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Budget</th>
              <th className="px-4 py-2 font-medium">Spent</th>
              <th className="px-4 py-2 font-medium">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-concrete-100">
            {rows?.map((r) => (
              <tr key={r.projectId}>
                <td className="px-4 py-2">
                  <Link to={`/projects/${r.projectId}/finance`} className="font-medium text-blueprint-700 hover:underline">
                    {r.projectName}
                  </Link>
                  <span className="ml-2 font-mono text-xs text-concrete-400">{r.projectCode}</span>
                </td>
                <td className="px-4 py-2">
                  <StatusBadge status={r.status} />
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

function SummaryCard({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="rounded-md border border-concrete-200 bg-white p-5">
      <p className="text-xs text-concrete-400">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${negative ? "text-signal-red" : "text-concrete-900"}`}>
        {value}
      </p>
    </div>
  );
}
