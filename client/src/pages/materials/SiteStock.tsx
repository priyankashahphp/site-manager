import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { createStockMovement, getSiteStock, listMaterials, listStockMovements } from "@/api/materials";
import { getSite } from "@/api/projects";
import { StockMovementType } from "@/types";

const MOVEMENT_TYPES: StockMovementType[] = ["INWARD", "OUTWARD", "TRANSFER", "ADJUSTMENT", "CONSUMPTION"];

export default function SiteStock() {
  const { id } = useParams<{ id: string }>();
  const siteId = id!;
  const queryClient = useQueryClient();

  const { data: site } = useQuery({ queryKey: ["sites", siteId], queryFn: () => getSite(siteId) });
  const { data: stock, isLoading: loadingStock } = useQuery({
    queryKey: ["site-stock", siteId],
    queryFn: () => getSiteStock(siteId),
  });
  const { data: movements } = useQuery({
    queryKey: ["stock-movements", siteId],
    queryFn: () => listStockMovements(siteId),
  });
  const { data: materials } = useQuery({ queryKey: ["materials"], queryFn: listMaterials });

  const [form, setForm] = useState({
    materialId: "",
    type: "INWARD" as StockMovementType,
    quantity: "",
    rate: "",
    note: "",
  });
  const [error, setError] = useState<string | null>(null);

  const addMovement = useMutation({
    mutationFn: () =>
      createStockMovement(siteId, {
        materialId: form.materialId,
        type: form.type,
        quantity: Number(form.quantity),
        rate: form.rate ? Number(form.rate) : undefined,
        note: form.note || undefined,
      }),
    onSuccess: () => {
      setForm({ materialId: "", type: "INWARD", quantity: "", rate: "", note: "" });
      queryClient.invalidateQueries({ queryKey: ["site-stock", siteId] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements", siteId] });
    },
    onError: (err: any) => setError(err?.response?.data?.error || "Failed to record movement"),
  });

  const lowStockCount = stock?.filter((s) => s.lowStock).length ?? 0;

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-concrete-900">Stock — {site?.name}</h1>
      <p className="mb-6 text-sm text-concrete-400">Material balances and movement history for this site.</p>

      {lowStockCount > 0 && (
        <div className="mb-4 rounded-md border border-safety/40 bg-safety/10 px-4 py-2.5 text-sm text-safety-dark">
          {lowStockCount} material{lowStockCount === 1 ? "" : "s"} at or below reorder level at this site.
        </div>
      )}

      <div className="mb-6 overflow-hidden rounded-md border border-concrete-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-concrete-200 bg-concrete-50 text-left text-xs uppercase tracking-wide text-concrete-400">
            <tr>
              <th className="px-4 py-2 font-medium">Material</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Balance</th>
              <th className="px-4 py-2 font-medium">Reorder level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-concrete-100">
            {stock?.map((s) => (
              <tr key={s.materialId} className={s.lowStock ? "bg-safety/5" : undefined}>
                <td className="px-4 py-2 font-medium text-concrete-900">{s.name}</td>
                <td className="px-4 py-2 text-concrete-500">{s.category}</td>
                <td className={`px-4 py-2 font-medium ${s.lowStock ? "text-safety-dark" : "text-concrete-900"}`}>
                  {s.balance} {s.unit}
                </td>
                <td className="px-4 py-2 text-concrete-500">{s.reorderLevel}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loadingStock && <p className="px-4 py-4 text-sm text-concrete-400">Loading…</p>}
        {!loadingStock && stock?.length === 0 && (
          <p className="px-4 py-4 text-sm text-concrete-400">No stock movements recorded at this site yet.</p>
        )}
      </div>

      <div className="mb-6 rounded-md border border-concrete-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-concrete-900">Record movement</h2>
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            setError(null);
            if (form.materialId && form.quantity) addMovement.mutate();
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <select
            required
            value={form.materialId}
            onChange={(e) => setForm({ ...form, materialId: e.target.value })}
            className="rounded border border-concrete-200 px-3 py-2 text-sm"
          >
            <option value="">Select material…</option>
            {materials?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.unit})
              </option>
            ))}
          </select>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as StockMovementType })}
            className="rounded border border-concrete-200 px-3 py-2 text-sm"
          >
            {MOVEMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            placeholder="Quantity"
            className="w-28 rounded border border-concrete-200 px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={form.rate}
            onChange={(e) => setForm({ ...form, rate: e.target.value })}
            placeholder="Rate (optional)"
            className="w-32 rounded border border-concrete-200 px-3 py-2 text-sm"
          />
          <input
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Note (optional)"
            className="w-44 rounded border border-concrete-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={addMovement.isPending}
            className="flex items-center gap-1.5 rounded bg-blueprint-900 px-3 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
          >
            <Plus size={15} />
            Record
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-signal-red">{error}</p>}
        <p className="mt-2 text-xs text-concrete-400">
          Note: Adjustment quantities may be negative to record a correction. Transfers reduce this
          site's balance — record a matching Inward entry at the destination site.
        </p>
      </div>

      <div className="overflow-hidden rounded-md border border-concrete-200 bg-white">
        <div className="border-b border-concrete-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-concrete-900">Recent movements</h2>
        </div>
        <ul className="divide-y divide-concrete-100">
          {movements?.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
              <div>
                <span className="font-medium text-concrete-900">{m.material?.name}</span>{" "}
                <span className="text-concrete-400">
                  · {m.type} · {m.quantity} {m.material?.unit}
                </span>
                {m.note && <span className="text-concrete-400"> · {m.note}</span>}
              </div>
              <span className="text-xs text-concrete-400">
                {new Date(m.createdAt).toLocaleDateString()}
              </span>
            </li>
          ))}
          {movements?.length === 0 && (
            <li className="px-5 py-4 text-sm text-concrete-400">No movements yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
