import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { createEquipment, listEquipment } from "@/api/equipment";

export default function EquipmentPage() {
  const queryClient = useQueryClient();
  const { data: equipment, isLoading } = useQuery({ queryKey: ["equipment"], queryFn: listEquipment });

  const [form, setForm] = useState({ name: "", type: "", ownership: "OWNED" });
  const add = useMutation({
    mutationFn: () =>
      createEquipment({ name: form.name, type: form.type || undefined, ownership: form.ownership }),
    onSuccess: () => {
      setForm({ name: "", type: "", ownership: "OWNED" });
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
    },
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-concrete-900">Equipment</h1>
      <p className="mb-6 text-sm text-concrete-400">
        Owned and rented equipment. Usage is logged per site — open a piece of equipment to see its history.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {equipment?.map((e) => (
          <Link
            key={e.id}
            to={`/equipment/${e.id}`}
            className="rounded-md border border-concrete-200 bg-white p-5 hover:shadow-md"
          >
            <div className="mb-1 flex items-center justify-between">
              <p className="font-medium text-concrete-900">{e.name}</p>
              <span
                className={`rounded px-2 py-0.5 text-xs ${
                  e.ownership === "OWNED"
                    ? "bg-blueprint-100 text-blueprint-700"
                    : "bg-safety/15 text-safety-dark"
                }`}
              >
                {e.ownership === "OWNED" ? "Owned" : "Rented"}
              </span>
            </div>
            {e.type && <p className="mb-3 text-xs text-concrete-400">{e.type}</p>}
            <div className="flex gap-4 border-t border-concrete-100 pt-3 text-xs text-concrete-400">
              <span>{e._count?.usage ?? 0} usage logs</span>
              <span>{e._count?.maintenance ?? 0} maintenance</span>
            </div>
          </Link>
        ))}
      </div>

      {isLoading && <p className="text-sm text-concrete-400">Loading…</p>}
      {!isLoading && equipment?.length === 0 && (
        <div className="mb-6 rounded-md border border-dashed border-concrete-300 py-12 text-center">
          <p className="text-sm text-concrete-400">No equipment added yet.</p>
        </div>
      )}

      <div className="rounded-md border border-concrete-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-concrete-900">Add equipment</h2>
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (form.name.trim()) add.mutate();
          }}
          className="flex flex-wrap gap-2"
        >
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Equipment name (e.g. Tower crane TC-1)"
            className="w-64 rounded border border-concrete-200 px-3 py-2 text-sm"
          />
          <input
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            placeholder="Type (optional)"
            className="w-48 rounded border border-concrete-200 px-3 py-2 text-sm"
          />
          <select
            value={form.ownership}
            onChange={(e) => setForm({ ...form, ownership: e.target.value })}
            className="rounded border border-concrete-200 px-3 py-2 text-sm"
          >
            <option value="OWNED">Owned</option>
            <option value="RENTED">Rented</option>
          </select>
          <button
            type="submit"
            disabled={add.isPending}
            className="flex items-center gap-1.5 rounded bg-blueprint-900 px-3 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
          >
            <Plus size={15} />
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
