import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import {
  createDefect,
  getInspection,
  toggleChecklistItem,
  updateDefect,
  updateInspection,
} from "@/api/quality";
import StatusBadge from "@/components/ui/StatusBadge";

export default function InspectionDetail() {
  const { id } = useParams<{ id: string }>();
  const inspectionId = id!;
  const queryClient = useQueryClient();

  const { data: inspection, isLoading } = useQuery({
    queryKey: ["inspections", "detail", inspectionId],
    queryFn: () => getInspection(inspectionId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["inspections", "detail", inspectionId] });

  const setResult = useMutation({
    mutationFn: (result: string) => updateInspection(inspectionId, { result }),
    onSuccess: invalidate,
  });
  const toggleItem = useMutation({
    mutationFn: ({ itemId, passed }: { itemId: string; passed: boolean }) =>
      toggleChecklistItem(itemId, passed),
    onSuccess: invalidate,
  });

  const [defectText, setDefectText] = useState("");
  const addDefect = useMutation({
    mutationFn: () => createDefect(inspectionId, defectText),
    onSuccess: () => {
      setDefectText("");
      invalidate();
    },
  });
  const updateDefectStatus = useMutation({
    mutationFn: ({ defectId, status }: { defectId: string; status: string }) =>
      updateDefect(defectId, status),
    onSuccess: invalidate,
  });

  if (isLoading) return <p className="text-sm text-concrete-400">Loading…</p>;
  if (!inspection) return <p className="text-sm text-concrete-400">Inspection not found.</p>;

  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-xl font-semibold text-concrete-900">{inspection.title}</h1>
        <StatusBadge status={inspection.result} />
      </div>
      {inspection.inspectedBy && (
        <p className="mb-6 text-sm text-concrete-400">Inspected by {inspection.inspectedBy.name}</p>
      )}

      <div className="mb-6 flex gap-2">
        {(["PENDING", "PASSED", "FAILED"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setResult.mutate(r)}
            disabled={inspection.result === r}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              inspection.result === r
                ? "bg-concrete-200 text-concrete-500"
                : "border border-concrete-200 text-concrete-700 hover:bg-concrete-50"
            }`}
          >
            Mark {r.charAt(0) + r.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <section className="mb-6 rounded-md border border-concrete-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-concrete-900">Checklist</h2>
        <ul className="divide-y divide-concrete-100">
          {inspection.checklistItems?.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={item.passed}
                onChange={(e) => toggleItem.mutate({ itemId: item.id, passed: e.target.checked })}
              />
              <span className={item.passed ? "text-concrete-900" : "text-concrete-500"}>{item.label}</span>
            </li>
          ))}
          {inspection.checklistItems?.length === 0 && (
            <li className="py-2 text-sm text-concrete-400">No checklist items for this inspection.</li>
          )}
        </ul>
      </section>

      <section className="rounded-md border border-concrete-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-concrete-900">Defects</h2>
        <ul className="mb-3 divide-y divide-concrete-100">
          {inspection.defects?.map((d) => (
            <li key={d.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-concrete-900">{d.description}</span>
              <select
                value={d.status}
                onChange={(e) => updateDefectStatus.mutate({ defectId: d.id, status: e.target.value })}
                className="rounded border border-concrete-200 px-2 py-1 text-xs"
              >
                <option value="OPEN">Open</option>
                <option value="IN_REWORK">In rework</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </li>
          ))}
          {inspection.defects?.length === 0 && (
            <li className="py-2 text-sm text-concrete-400">No defects logged.</li>
          )}
        </ul>
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (defectText.trim()) addDefect.mutate();
          }}
          className="flex gap-2"
        >
          <input
            value={defectText}
            onChange={(e) => setDefectText(e.target.value)}
            placeholder="Describe the defect"
            className="w-72 rounded border border-concrete-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={addDefect.isPending}
            className="flex items-center gap-1.5 rounded border border-concrete-200 px-3 py-2 text-sm text-concrete-700 hover:bg-concrete-50"
          >
            <Plus size={15} />
            Log defect
          </button>
        </form>
      </section>
    </div>
  );
}
