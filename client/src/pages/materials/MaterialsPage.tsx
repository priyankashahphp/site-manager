import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import {
  createMaterial,
  createMaterialCategory,
  listMaterialCategories,
  listMaterials,
} from "@/api/materials";

export default function MaterialsPage() {
  const queryClient = useQueryClient();
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ["material-categories"],
    queryFn: listMaterialCategories,
  });
  const { data: materials, isLoading: loadingMaterials } = useQuery({
    queryKey: ["materials"],
    queryFn: listMaterials,
  });

  const [categoryName, setCategoryName] = useState("");
  const addCategory = useMutation({
    mutationFn: () => createMaterialCategory(categoryName),
    onSuccess: () => {
      setCategoryName("");
      queryClient.invalidateQueries({ queryKey: ["material-categories"] });
    },
  });

  const [form, setForm] = useState({ categoryId: "", name: "", unit: "", reorderLevel: "" });
  const addMaterial = useMutation({
    mutationFn: () =>
      createMaterial({
        categoryId: form.categoryId,
        name: form.name,
        unit: form.unit,
        reorderLevel: form.reorderLevel ? Number(form.reorderLevel) : undefined,
      }),
    onSuccess: () => {
      setForm({ categoryId: "", name: "", unit: "", reorderLevel: "" });
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });

  const lowStockCount = materials?.filter((m) => m.lowStock).length ?? 0;

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-concrete-900">Material & Stock</h1>
      <p className="mb-6 text-sm text-concrete-400">
        Company-wide material catalog. Stock is tracked per site — open a site to record inward/outward movements.
      </p>

      {lowStockCount > 0 && (
        <div className="mb-4 rounded-md border border-safety/40 bg-safety/10 px-4 py-2.5 text-sm text-safety-dark">
          {lowStockCount} material{lowStockCount === 1 ? "" : "s"} at or below reorder level (across all sites combined).
        </div>
      )}

      <div className="mb-6 overflow-hidden rounded-md border border-concrete-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-concrete-200 bg-concrete-50 text-left text-xs uppercase tracking-wide text-concrete-400">
            <tr>
              <th className="px-4 py-2 font-medium">Material</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Unit</th>
              <th className="px-4 py-2 font-medium">Reorder level</th>
              <th className="px-4 py-2 font-medium">Total balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-concrete-100">
            {materials?.map((m) => (
              <tr key={m.id} className={m.lowStock ? "bg-safety/5" : undefined}>
                <td className="px-4 py-2 font-medium text-concrete-900">{m.name}</td>
                <td className="px-4 py-2 text-concrete-500">{m.category?.name}</td>
                <td className="px-4 py-2 text-concrete-500">{m.unit}</td>
                <td className="px-4 py-2 text-concrete-500">{m.reorderLevel}</td>
                <td className={`px-4 py-2 font-medium ${m.lowStock ? "text-safety-dark" : "text-concrete-900"}`}>
                  {m.balance}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loadingMaterials && <p className="px-4 py-4 text-sm text-concrete-400">Loading…</p>}
        {!loadingMaterials && materials?.length === 0 && (
          <p className="px-4 py-4 text-sm text-concrete-400">No materials in the catalog yet.</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-md border border-concrete-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-concrete-900">Add category</h2>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (categoryName.trim()) addCategory.mutate();
            }}
            className="flex gap-2"
          >
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Cement & Aggregates"
              className="flex-1 rounded border border-concrete-200 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={addCategory.isPending}
              className="flex items-center gap-1.5 rounded bg-blueprint-900 px-3 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
            >
              <Plus size={15} />
              Add
            </button>
          </form>
          {!loadingCategories && categories && categories.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <li key={c.id} className="rounded bg-concrete-100 px-2 py-1 text-xs text-concrete-600">
                  {c.name} ({c._count?.materials ?? 0})
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-md border border-concrete-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-concrete-900">Add material</h2>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (form.categoryId && form.name.trim() && form.unit.trim()) addMaterial.mutate();
            }}
            className="space-y-2"
          >
            <select
              required
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full rounded border border-concrete-200 px-3 py-2 text-sm"
            >
              <option value="">Select category…</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Material name"
                className="flex-1 rounded border border-concrete-200 px-3 py-2 text-sm"
              />
              <input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="Unit"
                className="w-24 rounded border border-concrete-200 px-3 py-2 text-sm"
              />
            </div>
            <input
              type="number"
              value={form.reorderLevel}
              onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
              placeholder="Reorder level (optional)"
              className="w-full rounded border border-concrete-200 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={addMaterial.isPending}
              className="flex items-center gap-1.5 rounded bg-blueprint-900 px-3 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
            >
              <Plus size={15} />
              Add material
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
