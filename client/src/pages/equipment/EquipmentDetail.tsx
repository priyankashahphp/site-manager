import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { getEquipment, logMaintenance } from "@/api/equipment";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function EquipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const equipmentId = id!;
  const queryClient = useQueryClient();

  const { data: equipment, isLoading } = useQuery({
    queryKey: ["equipment", equipmentId],
    queryFn: () => getEquipment(equipmentId),
  });

  const [form, setForm] = useState({ date: todayStr(), description: "", cost: "" });
  const addMaintenance = useMutation({
    mutationFn: () =>
      logMaintenance(equipmentId, {
        date: new Date(form.date).toISOString(),
        description: form.description,
        cost: form.cost ? Number(form.cost) : undefined,
      }),
    onSuccess: () => {
      setForm({ date: todayStr(), description: "", cost: "" });
      queryClient.invalidateQueries({ queryKey: ["equipment", equipmentId] });
    },
  });

  if (isLoading) return <p className="text-sm text-concrete-400">Loading…</p>;
  if (!equipment) return <p className="text-sm text-concrete-400">Equipment not found.</p>;

  const totalFuel = equipment.usage?.reduce((sum, u) => sum + (u.fuelUsed ?? 0), 0) ?? 0;
  const totalHours = equipment.usage?.reduce((sum, u) => sum + u.hoursUsed, 0) ?? 0;

  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-xl font-semibold text-concrete-900">{equipment.name}</h1>
        <span
          className={`rounded px-2 py-0.5 text-xs ${
            equipment.ownership === "OWNED"
              ? "bg-blueprint-100 text-blueprint-700"
              : "bg-safety/15 text-safety-dark"
          }`}
        >
          {equipment.ownership === "OWNED" ? "Owned" : "Rented"}
        </span>
      </div>
      <p className="mb-6 text-sm text-concrete-400">{equipment.type || "No type specified"}</p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoCard label="Total hours logged" value={`${totalHours}h`} />
        <InfoCard label="Total fuel used" value={`${totalFuel}L`} />
      </div>

      <div className="mb-6 overflow-hidden rounded-md border border-concrete-200 bg-white">
        <div className="border-b border-concrete-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-concrete-900">Usage history</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-concrete-200 bg-concrete-50 text-left text-xs uppercase tracking-wide text-concrete-400">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Site</th>
              <th className="px-4 py-2 font-medium">Hours</th>
              <th className="px-4 py-2 font-medium">Fuel</th>
              <th className="px-4 py-2 font-medium">Rental cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-concrete-100">
            {equipment.usage?.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2 text-concrete-500">{new Date(u.date).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-concrete-900">{u.site?.name}</td>
                <td className="px-4 py-2 text-concrete-500">{u.hoursUsed}h</td>
                <td className="px-4 py-2 text-concrete-500">{u.fuelUsed ?? "—"}</td>
                <td className="px-4 py-2 text-concrete-500">
                  {u.rentalCost ? `₹${Number(u.rentalCost).toLocaleString("en-IN")}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {equipment.usage?.length === 0 && (
          <p className="px-4 py-4 text-sm text-concrete-400">
            No usage logged yet. Log usage from a site's Diary page.
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-md border border-concrete-200 bg-white">
        <div className="border-b border-concrete-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-concrete-900">Maintenance log</h2>
        </div>
        <ul className="divide-y divide-concrete-100">
          {equipment.maintenance?.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
              <div>
                <span className="text-concrete-900">{m.description}</span>{" "}
                <span className="text-concrete-400">
                  · {new Date(m.date).toLocaleDateString()}
                </span>
              </div>
              {m.cost && (
                <span className="text-concrete-500">₹{Number(m.cost).toLocaleString("en-IN")}</span>
              )}
            </li>
          ))}
          {equipment.maintenance?.length === 0 && (
            <li className="px-5 py-4 text-sm text-concrete-400">No maintenance logged yet.</li>
          )}
        </ul>
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (form.description.trim()) addMaintenance.mutate();
          }}
          className="flex flex-wrap gap-2 border-t border-concrete-100 p-4"
        >
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="rounded border border-concrete-200 px-2 py-1.5 text-sm"
          />
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What was serviced…"
            className="w-56 rounded border border-concrete-200 px-2 py-1.5 text-sm"
          />
          <input
            type="number"
            value={form.cost}
            onChange={(e) => setForm({ ...form, cost: e.target.value })}
            placeholder="Cost (₹, optional)"
            className="w-32 rounded border border-concrete-200 px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={addMaintenance.isPending}
            className="flex items-center gap-1 rounded border border-concrete-200 px-2.5 py-1.5 text-sm text-concrete-700 hover:bg-concrete-50"
          >
            <Plus size={14} />
            Log maintenance
          </button>
        </form>
      </div>
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
