import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { createPurchaseOrder, listPurchaseOrders, listVendors } from "@/api/vendors";
import { getProject } from "@/api/projects";
import StatusBadge from "@/components/ui/StatusBadge";

export default function ProjectPurchaseOrders() {
  const { id } = useParams<{ id: string }>();
  const projectId = id!;
  const queryClient = useQueryClient();

  const { data: project } = useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => getProject(projectId),
  });
  const { data: orders, isLoading } = useQuery({
    queryKey: ["purchase-orders", projectId],
    queryFn: () => listPurchaseOrders(projectId),
  });
  const { data: vendors } = useQuery({ queryKey: ["vendors"], queryFn: listVendors });

  const [form, setForm] = useState({ vendorId: "", poNumber: "", totalAmount: "" });
  const [error, setError] = useState<string | null>(null);

  const add = useMutation({
    mutationFn: () =>
      createPurchaseOrder(projectId, {
        vendorId: form.vendorId,
        poNumber: form.poNumber,
        totalAmount: Number(form.totalAmount),
      }),
    onSuccess: () => {
      setForm({ vendorId: "", poNumber: "", totalAmount: "" });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", projectId] });
    },
    onError: (err: any) => setError(err?.response?.data?.error || "Failed to create purchase order"),
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-concrete-900">Purchase Orders</h1>
      <p className="mb-6 text-sm text-concrete-400">
        {project ? `${project.name} (${project.code})` : "Loading…"}
      </p>

      <div className="mb-4 overflow-hidden rounded-md border border-concrete-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-concrete-200 bg-concrete-50 text-left text-xs uppercase tracking-wide text-concrete-400">
            <tr>
              <th className="px-4 py-2 font-medium">PO Number</th>
              <th className="px-4 py-2 font-medium">Vendor</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-concrete-100">
            {orders?.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-2 font-mono text-concrete-900">{o.poNumber}</td>
                <td className="px-4 py-2 text-concrete-500">{o.vendor?.name}</td>
                <td className="px-4 py-2 text-concrete-500">
                  ₹{Number(o.totalAmount).toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-2">
                  <StatusBadge status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <p className="px-4 py-4 text-sm text-concrete-400">Loading…</p>}
        {!isLoading && orders?.length === 0 && (
          <p className="px-4 py-4 text-sm text-concrete-400">No purchase orders yet.</p>
        )}
      </div>

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          setError(null);
          if (form.vendorId && form.poNumber.trim() && form.totalAmount) add.mutate();
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <select
          required
          value={form.vendorId}
          onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
          className="rounded border border-concrete-200 px-3 py-2 text-sm"
        >
          <option value="">Select vendor…</option>
          {vendors?.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <input
          value={form.poNumber}
          onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
          placeholder="PO number"
          className="w-40 rounded border border-concrete-200 px-3 py-2 text-sm font-mono"
        />
        <input
          type="number"
          value={form.totalAmount}
          onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
          placeholder="Total amount (₹)"
          className="w-40 rounded border border-concrete-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={add.isPending}
          className="flex items-center gap-1.5 rounded bg-blueprint-900 px-3 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
        >
          <Plus size={15} />
          Create PO
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-signal-red">{error}</p>}
      {vendors?.length === 0 && (
        <p className="mt-2 text-sm text-concrete-400">
          No vendors yet — add one on the Vendors page first.
        </p>
      )}
    </div>
  );
}
