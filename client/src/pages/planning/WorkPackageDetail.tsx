import { FormEvent, ReactNode, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import {
  createActivity,
  createBoqItem,
  createEquipmentRequirement,
  createLaborRequirement,
  createMaterialRequirement,
  deleteActivity,
  deleteBoqItem,
  deleteEquipmentRequirement,
  deleteLaborRequirement,
  deleteMaterialRequirement,
  getWorkPackage,
  updateActivity,
} from "@/api/planning";
import StatusBadge from "@/components/ui/StatusBadge";

type Tab = "activities" | "boq" | "material" | "labor" | "equipment";

const TABS: { key: Tab; label: string }[] = [
  { key: "activities", label: "Activities" },
  { key: "boq", label: "BOQ" },
  { key: "material", label: "Material Requirements" },
  { key: "labor", label: "Labor Requirements" },
  { key: "equipment", label: "Equipment Requirements" },
];

export default function WorkPackageDetail() {
  const { id } = useParams<{ id: string }>();
  const workPackageId = id!;
  const [tab, setTab] = useState<Tab>("activities");

  const { data: wp, isLoading } = useQuery({
    queryKey: ["work-packages", "detail", workPackageId],
    queryFn: () => getWorkPackage(workPackageId),
  });

  if (isLoading) return <p className="text-sm text-concrete-400">Loading…</p>;
  if (!wp) return <p className="text-sm text-concrete-400">Work package not found.</p>;

  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-xl font-semibold text-concrete-900">{wp.name}</h1>
        <StatusBadge status={wp.status} />
      </div>
      <p className="mb-6 text-sm text-concrete-400">
        {wp.startDate ? new Date(wp.startDate).toLocaleDateString() : "No start date"} –{" "}
        {wp.endDate ? new Date(wp.endDate).toLocaleDateString() : "No end date"}
      </p>

      <div className="mb-5 flex flex-wrap gap-1 border-b border-concrete-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium ${
              tab === t.key
                ? "border-b-2 border-blueprint-700 text-blueprint-700"
                : "text-concrete-400 hover:text-concrete-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "activities" && <ActivitiesTab workPackageId={workPackageId} activities={wp.activities ?? []} />}
      {tab === "boq" && <BoqTab workPackageId={workPackageId} items={wp.boqItems ?? []} />}
      {tab === "material" && (
        <MaterialTab workPackageId={workPackageId} items={wp.materialRequirements ?? []} />
      )}
      {tab === "labor" && <LaborTab workPackageId={workPackageId} items={wp.laborRequirements ?? []} />}
      {tab === "equipment" && (
        <EquipmentTab workPackageId={workPackageId} items={wp.equipmentRequirements ?? []} />
      )}
    </div>
  );
}

function useInvalidateWorkPackage(workPackageId: string) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: ["work-packages", "detail", workPackageId] });
}

// ---- Activities -----------------------------------------------------------

function ActivitiesTab({ workPackageId, activities }: { workPackageId: string; activities: any[] }) {
  const invalidate = useInvalidateWorkPackage(workPackageId);
  const [name, setName] = useState("");

  const add = useMutation({
    mutationFn: () => createActivity(workPackageId, { name }),
    onSuccess: () => {
      setName("");
      invalidate();
    },
  });
  const updateProgress = useMutation({
    mutationFn: ({ id, percentComplete }: { id: string; percentComplete: number }) =>
      updateActivity(id, {
        percentComplete,
        status: percentComplete >= 100 ? "COMPLETED" : percentComplete > 0 ? "IN_PROGRESS" : "NOT_STARTED",
      }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteActivity(id),
    onSuccess: invalidate,
  });

  return (
    <div>
      <div className="mb-4 overflow-hidden rounded-md border border-concrete-200 bg-white">
        <ul className="divide-y divide-concrete-100">
          {activities.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-concrete-900">{a.name}</p>
                  <StatusBadge status={a.status} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-40 overflow-hidden rounded-full bg-concrete-200">
                    <div
                      className="h-full bg-blueprint-700"
                      style={{ width: `${a.percentComplete}%` }}
                    />
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={a.percentComplete}
                    onBlur={(e) =>
                      updateProgress.mutate({ id: a.id, percentComplete: Number(e.target.value) })
                    }
                    className="w-16 rounded border border-concrete-200 px-2 py-0.5 text-xs"
                  />
                  <span className="text-xs text-concrete-400">%</span>
                </div>
              </div>
              <button
                onClick={() => remove.mutate(a.id)}
                className="text-concrete-400 hover:text-signal-red"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
        {activities.length === 0 && (
          <p className="px-5 py-4 text-sm text-concrete-400">No activities yet.</p>
        )}
      </div>

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (name.trim()) add.mutate();
        }}
        className="flex gap-2"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New activity (e.g. Excavation)"
          className="w-72 rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
        />
        <button
          type="submit"
          disabled={add.isPending}
          className="flex items-center gap-1.5 rounded bg-blueprint-900 px-3 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
        >
          <Plus size={15} />
          Add activity
        </button>
      </form>
    </div>
  );
}

// ---- BOQ --------------------------------------------------------------------

function BoqTab({ workPackageId, items }: { workPackageId: string; items: any[] }) {
  const invalidate = useInvalidateWorkPackage(workPackageId);
  const [form, setForm] = useState({ description: "", unit: "", quantity: "", rate: "" });

  const add = useMutation({
    mutationFn: () =>
      createBoqItem(workPackageId, {
        description: form.description,
        unit: form.unit,
        quantity: Number(form.quantity),
        rate: Number(form.rate),
      }),
    onSuccess: () => {
      setForm({ description: "", unit: "", quantity: "", rate: "" });
      invalidate();
    },
  });
  const remove = useMutation({ mutationFn: (id: string) => deleteBoqItem(id), onSuccess: invalidate });

  const total = items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.rate), 0);

  return (
    <div>
      <div className="mb-4 overflow-hidden rounded-md border border-concrete-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-concrete-200 bg-concrete-50 text-left text-xs uppercase tracking-wide text-concrete-400">
            <tr>
              <th className="px-4 py-2 font-medium">Description</th>
              <th className="px-4 py-2 font-medium">Unit</th>
              <th className="px-4 py-2 font-medium">Qty</th>
              <th className="px-4 py-2 font-medium">Rate</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-concrete-100">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 text-concrete-900">
                  {item.itemCode ? <span className="mr-2 font-mono text-xs text-concrete-400">{item.itemCode}</span> : null}
                  {item.description}
                </td>
                <td className="px-4 py-2 text-concrete-500">{item.unit}</td>
                <td className="px-4 py-2 text-concrete-500">{item.quantity}</td>
                <td className="px-4 py-2 text-concrete-500">₹{Number(item.rate).toLocaleString("en-IN")}</td>
                <td className="px-4 py-2 font-medium text-concrete-900">
                  ₹{(Number(item.quantity) * Number(item.rate)).toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => remove.mutate(item.id)} className="text-concrete-400 hover:text-signal-red">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {items.length > 0 && (
            <tfoot>
              <tr className="border-t border-concrete-200 bg-concrete-50">
                <td colSpan={4} className="px-4 py-2 text-right text-xs font-medium text-concrete-500">
                  Total
                </td>
                <td colSpan={2} className="px-4 py-2 font-semibold text-concrete-900">
                  ₹{total.toLocaleString("en-IN")}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
        {items.length === 0 && <p className="px-4 py-4 text-sm text-concrete-400">No BOQ items yet.</p>}
      </div>

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (form.description.trim() && form.unit.trim() && form.quantity && form.rate) add.mutate();
        }}
        className="flex flex-wrap gap-2"
      >
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description"
          className="w-56 rounded border border-concrete-200 px-3 py-2 text-sm"
        />
        <input
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          placeholder="Unit (cum, sqm...)"
          className="w-32 rounded border border-concrete-200 px-3 py-2 text-sm"
        />
        <input
          type="number"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          placeholder="Qty"
          className="w-24 rounded border border-concrete-200 px-3 py-2 text-sm"
        />
        <input
          type="number"
          value={form.rate}
          onChange={(e) => setForm({ ...form, rate: e.target.value })}
          placeholder="Rate (₹)"
          className="w-28 rounded border border-concrete-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={add.isPending}
          className="flex items-center gap-1.5 rounded bg-blueprint-900 px-3 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
        >
          <Plus size={15} />
          Add item
        </button>
      </form>
    </div>
  );
}

// ---- Material Requirements ------------------------------------------------

function MaterialTab({ workPackageId, items }: { workPackageId: string; items: any[] }) {
  const invalidate = useInvalidateWorkPackage(workPackageId);
  const [form, setForm] = useState({ materialName: "", unit: "", quantity: "" });

  const add = useMutation({
    mutationFn: () =>
      createMaterialRequirement(workPackageId, {
        materialName: form.materialName,
        unit: form.unit,
        quantity: Number(form.quantity),
      }),
    onSuccess: () => {
      setForm({ materialName: "", unit: "", quantity: "" });
      invalidate();
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteMaterialRequirement(id),
    onSuccess: invalidate,
  });

  return (
    <RequirementList
      items={items}
      renderRow={(item) => (
        <>
          <span className="font-medium text-concrete-900">{item.materialName}</span>
          <span className="text-concrete-500">
            {item.quantity} {item.unit}
          </span>
          <StatusBadge status={item.status} />
        </>
      )}
      onDelete={(id) => remove.mutate(id)}
      emptyLabel="No material requirements yet."
      form={
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (form.materialName.trim() && form.unit.trim() && form.quantity) add.mutate();
          }}
          className="flex flex-wrap gap-2"
        >
          <input
            value={form.materialName}
            onChange={(e) => setForm({ ...form, materialName: e.target.value })}
            placeholder="Material (e.g. Cement OPC 53)"
            className="w-64 rounded border border-concrete-200 px-3 py-2 text-sm"
          />
          <input
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            placeholder="Unit (bags, cum...)"
            className="w-36 rounded border border-concrete-200 px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            placeholder="Quantity"
            className="w-28 rounded border border-concrete-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={add.isPending}
            className="flex items-center gap-1.5 rounded bg-blueprint-900 px-3 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
          >
            <Plus size={15} />
            Add
          </button>
        </form>
      }
    />
  );
}

// ---- Labor Requirements -----------------------------------------------------

function LaborTab({ workPackageId, items }: { workPackageId: string; items: any[] }) {
  const invalidate = useInvalidateWorkPackage(workPackageId);
  const [form, setForm] = useState({ skill: "", headcount: "" });

  const add = useMutation({
    mutationFn: () =>
      createLaborRequirement(workPackageId, { skill: form.skill, headcount: Number(form.headcount) }),
    onSuccess: () => {
      setForm({ skill: "", headcount: "" });
      invalidate();
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteLaborRequirement(id),
    onSuccess: invalidate,
  });

  return (
    <RequirementList
      items={items}
      renderRow={(item) => (
        <>
          <span className="font-medium text-concrete-900">{item.skill}</span>
          <span className="text-concrete-500">{item.headcount} worker(s)</span>
          <StatusBadge status={item.status} />
        </>
      )}
      onDelete={(id) => remove.mutate(id)}
      emptyLabel="No labor requirements yet."
      form={
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (form.skill.trim() && form.headcount) add.mutate();
          }}
          className="flex flex-wrap gap-2"
        >
          <input
            value={form.skill}
            onChange={(e) => setForm({ ...form, skill: e.target.value })}
            placeholder="Skill (e.g. Mason, Bar bender)"
            className="w-64 rounded border border-concrete-200 px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={form.headcount}
            onChange={(e) => setForm({ ...form, headcount: e.target.value })}
            placeholder="Headcount"
            className="w-32 rounded border border-concrete-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={add.isPending}
            className="flex items-center gap-1.5 rounded bg-blueprint-900 px-3 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
          >
            <Plus size={15} />
            Add
          </button>
        </form>
      }
    />
  );
}

// ---- Equipment Requirements ---------------------------------------------------

function EquipmentTab({ workPackageId, items }: { workPackageId: string; items: any[] }) {
  const invalidate = useInvalidateWorkPackage(workPackageId);
  const [form, setForm] = useState({ equipmentType: "", count: "" });

  const add = useMutation({
    mutationFn: () =>
      createEquipmentRequirement(workPackageId, {
        equipmentType: form.equipmentType,
        count: Number(form.count),
      }),
    onSuccess: () => {
      setForm({ equipmentType: "", count: "" });
      invalidate();
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteEquipmentRequirement(id),
    onSuccess: invalidate,
  });

  return (
    <RequirementList
      items={items}
      renderRow={(item) => (
        <>
          <span className="font-medium text-concrete-900">{item.equipmentType}</span>
          <span className="text-concrete-500">{item.count} unit(s)</span>
          <StatusBadge status={item.status} />
        </>
      )}
      onDelete={(id) => remove.mutate(id)}
      emptyLabel="No equipment requirements yet."
      form={
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (form.equipmentType.trim() && form.count) add.mutate();
          }}
          className="flex flex-wrap gap-2"
        >
          <input
            value={form.equipmentType}
            onChange={(e) => setForm({ ...form, equipmentType: e.target.value })}
            placeholder="Equipment (e.g. Tower crane)"
            className="w-64 rounded border border-concrete-200 px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={form.count}
            onChange={(e) => setForm({ ...form, count: e.target.value })}
            placeholder="Count"
            className="w-28 rounded border border-concrete-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={add.isPending}
            className="flex items-center gap-1.5 rounded bg-blueprint-900 px-3 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
          >
            <Plus size={15} />
            Add
          </button>
        </form>
      }
    />
  );
}

// ---- Shared list shell for the three requirement tabs -----------------------

function RequirementList({
  items,
  renderRow,
  onDelete,
  emptyLabel,
  form,
}: {
  items: any[];
  renderRow: (item: any) => ReactNode;
  onDelete: (id: string) => void;
  emptyLabel: string;
  form: ReactNode;
}) {
  return (
    <div>
      <div className="mb-4 overflow-hidden rounded-md border border-concrete-200 bg-white">
        <ul className="divide-y divide-concrete-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="flex flex-1 flex-wrap items-center gap-3">{renderRow(item)}</div>
              <button onClick={() => onDelete(item.id)} className="text-concrete-400 hover:text-signal-red">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
        {items.length === 0 && <p className="px-5 py-4 text-sm text-concrete-400">{emptyLabel}</p>}
      </div>
      {form}
    </div>
  );
}
