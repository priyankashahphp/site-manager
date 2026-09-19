import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import {
  addSafetyChecklistItem,
  createInspection,
  createSafetyIncident,
  listInspections,
  listSafetyChecklist,
  listSafetyIncidents,
  toggleSafetyChecklistItem,
  updateSafetyIncident,
} from "@/api/quality";
import { getSite } from "@/api/projects";
import StatusBadge from "@/components/ui/StatusBadge";

export default function SiteQualitySafety() {
  const { id } = useParams<{ id: string }>();
  const siteId = id!;

  const { data: site } = useQuery({ queryKey: ["sites", siteId], queryFn: () => getSite(siteId) });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-concrete-900">Quality & Safety — {site?.name}</h1>
      <p className="mb-6 text-sm text-concrete-400">Inspections, safety incidents, and the site safety checklist.</p>

      <div className="space-y-6">
        <InspectionsSection siteId={siteId} />
        <SafetyIncidentsSection siteId={siteId} />
        <SafetyChecklistSection siteId={siteId} />
      </div>
    </div>
  );
}

function InspectionsSection({ siteId }: { siteId: string }) {
  const queryClient = useQueryClient();
  const { data: inspections, isLoading } = useQuery({
    queryKey: ["inspections", siteId],
    queryFn: () => listInspections(siteId),
  });

  const [form, setForm] = useState({ title: "", checklist: "" });
  const add = useMutation({
    mutationFn: () =>
      createInspection(siteId, {
        title: form.title,
        checklistLabels: form.checklist
          ? form.checklist.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
      }),
    onSuccess: () => {
      setForm({ title: "", checklist: "" });
      queryClient.invalidateQueries({ queryKey: ["inspections", siteId] });
    },
  });

  return (
    <section className="overflow-hidden rounded-md border border-concrete-200 bg-white">
      <div className="border-b border-concrete-200 px-5 py-3">
        <h2 className="text-sm font-semibold text-concrete-900">Inspections</h2>
      </div>
      <ul className="divide-y divide-concrete-100">
        {inspections?.map((i) => (
          <li key={i.id}>
            <Link to={`/inspections/${i.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-concrete-50">
              <div>
                <p className="text-sm font-medium text-concrete-900">{i.title}</p>
                <p className="text-xs text-concrete-400">
                  {i._count?.checklistItems ?? 0} checklist items · {i._count?.defects ?? 0} defects
                </p>
              </div>
              <StatusBadge status={i.result} />
            </Link>
          </li>
        ))}
        {isLoading && <li className="px-5 py-4 text-sm text-concrete-400">Loading…</li>}
        {!isLoading && inspections?.length === 0 && (
          <li className="px-5 py-4 text-sm text-concrete-400">No inspections yet.</li>
        )}
      </ul>
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (form.title.trim()) add.mutate();
        }}
        className="flex flex-wrap gap-2 border-t border-concrete-100 p-4"
      >
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Inspection title (e.g. Slab pour QC — Floor 3)"
          className="w-72 rounded border border-concrete-200 px-3 py-2 text-sm"
        />
        <input
          value={form.checklist}
          onChange={(e) => setForm({ ...form, checklist: e.target.value })}
          placeholder="Checklist items, comma-separated (optional)"
          className="w-80 rounded border border-concrete-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={add.isPending}
          className="flex items-center gap-1.5 rounded bg-blueprint-900 px-3 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
        >
          <Plus size={15} />
          New inspection
        </button>
      </form>
    </section>
  );
}

function SafetyIncidentsSection({ siteId }: { siteId: string }) {
  const queryClient = useQueryClient();
  const { data: incidents, isLoading } = useQuery({
    queryKey: ["safety-incidents", siteId],
    queryFn: () => listSafetyIncidents(siteId),
  });

  const [form, setForm] = useState({ title: "", severity: "MEDIUM" });
  const add = useMutation({
    mutationFn: () => createSafetyIncident(siteId, { title: form.title, severity: form.severity }),
    onSuccess: () => {
      setForm({ title: "", severity: "MEDIUM" });
      queryClient.invalidateQueries({ queryKey: ["safety-incidents", siteId] });
    },
  });
  const close = useMutation({
    mutationFn: (id: string) => updateSafetyIncident(id, "CLOSED"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["safety-incidents", siteId] }),
  });

  return (
    <section className="overflow-hidden rounded-md border border-concrete-200 bg-white">
      <div className="border-b border-concrete-200 px-5 py-3">
        <h2 className="text-sm font-semibold text-concrete-900">Safety Incidents</h2>
      </div>
      <ul className="divide-y divide-concrete-100">
        {incidents?.map((inc) => (
          <li key={inc.id} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-concrete-900">{inc.title}</span>
              <StatusBadge status={inc.severity} />
              <StatusBadge status={inc.status} />
            </div>
            {inc.status !== "CLOSED" && (
              <button onClick={() => close.mutate(inc.id)} className="text-xs text-blueprint-700 hover:underline">
                Mark closed
              </button>
            )}
          </li>
        ))}
        {isLoading && <li className="px-5 py-4 text-sm text-concrete-400">Loading…</li>}
        {!isLoading && incidents?.length === 0 && (
          <li className="px-5 py-4 text-sm text-concrete-400">No incidents reported.</li>
        )}
      </ul>
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (form.title.trim()) add.mutate();
        }}
        className="flex flex-wrap gap-2 border-t border-concrete-100 p-4"
      >
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Incident description"
          className="w-72 rounded border border-concrete-200 px-3 py-2 text-sm"
        />
        <select
          value={form.severity}
          onChange={(e) => setForm({ ...form, severity: e.target.value })}
          className="rounded border border-concrete-200 px-3 py-2 text-sm"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <button
          type="submit"
          disabled={add.isPending}
          className="flex items-center gap-1.5 rounded bg-blueprint-900 px-3 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
        >
          <Plus size={15} />
          Report incident
        </button>
      </form>
    </section>
  );
}

function SafetyChecklistSection({ siteId }: { siteId: string }) {
  const queryClient = useQueryClient();
  const { data: items, isLoading } = useQuery({
    queryKey: ["safety-checklist", siteId],
    queryFn: () => listSafetyChecklist(siteId),
  });

  const [label, setLabel] = useState("");
  const add = useMutation({
    mutationFn: () => addSafetyChecklistItem(siteId, label),
    onSuccess: () => {
      setLabel("");
      queryClient.invalidateQueries({ queryKey: ["safety-checklist", siteId] });
    },
  });
  const toggle = useMutation({
    mutationFn: ({ id, checked }: { id: string; checked: boolean }) =>
      toggleSafetyChecklistItem(id, checked),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["safety-checklist", siteId] }),
  });

  return (
    <section className="overflow-hidden rounded-md border border-concrete-200 bg-white">
      <div className="border-b border-concrete-200 px-5 py-3">
        <h2 className="text-sm font-semibold text-concrete-900">Safety Checklist</h2>
      </div>
      <ul className="divide-y divide-concrete-100">
        {items?.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={(e) => toggle.mutate({ id: item.id, checked: e.target.checked })}
            />
            <span className={item.checked ? "text-concrete-400 line-through" : "text-concrete-900"}>
              {item.label}
            </span>
          </li>
        ))}
        {isLoading && <li className="px-5 py-4 text-sm text-concrete-400">Loading…</li>}
        {!isLoading && items?.length === 0 && (
          <li className="px-5 py-4 text-sm text-concrete-400">No checklist items yet.</li>
        )}
      </ul>
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (label.trim()) add.mutate();
        }}
        className="flex gap-2 border-t border-concrete-100 p-4"
      >
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. All workers wearing PPE"
          className="w-72 rounded border border-concrete-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={add.isPending}
          className="flex items-center gap-1.5 rounded border border-concrete-200 px-3 py-2 text-sm text-concrete-700 hover:bg-concrete-50"
        >
          <Plus size={15} />
          Add item
        </button>
      </form>
    </section>
  );
}
