import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { addPhoto, addProgress, createIssue, getDiaryDay, saveDiary, updateIssue } from "@/api/sitework";
import { listLabor, markAttendance } from "@/api/labor";
import { listEquipment, logEquipmentUsage } from "@/api/equipment";
import { getSite } from "@/api/projects";
import StatusBadge from "@/components/ui/StatusBadge";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function SiteDiaryPage() {
  const { id } = useParams<{ id: string }>();
  const siteId = id!;
  const queryClient = useQueryClient();
  const [date, setDate] = useState(todayStr());

  const { data: site } = useQuery({ queryKey: ["sites", siteId], queryFn: () => getSite(siteId) });
  const { data: day, isLoading } = useQuery({
    queryKey: ["site-day", siteId, date],
    queryFn: () => getDiaryDay(siteId, date),
  });
  const { data: labor } = useQuery({ queryKey: ["labor"], queryFn: listLabor });
  const { data: equipmentList } = useQuery({ queryKey: ["equipment"], queryFn: listEquipment });

  const invalidateDay = () => queryClient.invalidateQueries({ queryKey: ["site-day", siteId, date] });

  const [diaryForm, setDiaryForm] = useState({ weather: "", notes: "" });
  const saveDiaryMutation = useMutation({
    mutationFn: () =>
      saveDiary(siteId, {
        date: new Date(date).toISOString(),
        weather: diaryForm.weather || undefined,
        notes: diaryForm.notes || undefined,
      }),
    onSuccess: invalidateDay,
  });

  const [progressText, setProgressText] = useState("");
  const [progressPercent, setProgressPercent] = useState("");
  const addProgressMutation = useMutation({
    mutationFn: () =>
      addProgress(day!.diary!.id, {
        description: progressText,
        percentComplete: progressPercent ? Number(progressPercent) : undefined,
      }),
    onSuccess: () => {
      setProgressText("");
      setProgressPercent("");
      invalidateDay();
    },
  });

  const [attendanceForm, setAttendanceForm] = useState({ laborId: "", overtimeHours: "" });
  const markAttendanceMutation = useMutation({
    mutationFn: () =>
      markAttendance(siteId, {
        laborId: attendanceForm.laborId,
        date: new Date(date).toISOString(),
        present: true,
        overtimeHours: attendanceForm.overtimeHours ? Number(attendanceForm.overtimeHours) : undefined,
      }),
    onSuccess: () => {
      setAttendanceForm({ laborId: "", overtimeHours: "" });
      invalidateDay();
    },
  });

  const [equipmentForm, setEquipmentForm] = useState({ equipmentId: "", hoursUsed: "", fuelUsed: "" });
  const logEquipmentMutation = useMutation({
    mutationFn: () =>
      logEquipmentUsage(siteId, {
        equipmentId: equipmentForm.equipmentId,
        date: new Date(date).toISOString(),
        hoursUsed: Number(equipmentForm.hoursUsed),
        fuelUsed: equipmentForm.fuelUsed ? Number(equipmentForm.fuelUsed) : undefined,
      }),
    onSuccess: () => {
      setEquipmentForm({ equipmentId: "", hoursUsed: "", fuelUsed: "" });
      invalidateDay();
    },
  });

  const [photoForm, setPhotoForm] = useState({ url: "", caption: "" });
  const addPhotoMutation = useMutation({
    mutationFn: () =>
      addPhoto(siteId, { url: photoForm.url, caption: photoForm.caption || undefined }),
    onSuccess: () => {
      setPhotoForm({ url: "", caption: "" });
      invalidateDay();
    },
  });

  const [issueForm, setIssueForm] = useState({ title: "", severity: "MEDIUM" });
  const addIssueMutation = useMutation({
    mutationFn: () => createIssue(siteId, { title: issueForm.title, severity: issueForm.severity }),
    onSuccess: () => {
      setIssueForm({ title: "", severity: "MEDIUM" });
      invalidateDay();
    },
  });
  const resolveIssue = useMutation({
    mutationFn: (issueId: string) => updateIssue(issueId, { status: "RESOLVED" }),
    onSuccess: invalidateDay,
  });

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-concrete-900">Site Diary — {site?.name}</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded border border-concrete-200 px-3 py-1.5 text-sm"
        />
      </div>
      <p className="mb-6 text-sm text-concrete-400">Daily record of progress, labor, material, and issues.</p>

      {isLoading && <p className="text-sm text-concrete-400">Loading…</p>}

      {day && (
        <div className="space-y-6">
          {/* Diary notes */}
          <section className="rounded-md border border-concrete-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-concrete-900">Diary</h2>
            {day.diary?.createdBy && (
              <p className="mb-2 text-xs text-concrete-400">Logged by {day.diary.createdBy.name}</p>
            )}
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                saveDiaryMutation.mutate();
              }}
              className="space-y-2"
            >
              <input
                defaultValue={day.diary?.weather ?? diaryForm.weather}
                onChange={(e) => setDiaryForm({ ...diaryForm, weather: e.target.value })}
                placeholder="Weather (e.g. Clear, 32°C)"
                className="w-64 rounded border border-concrete-200 px-3 py-2 text-sm"
              />
              <textarea
                defaultValue={day.diary?.notes ?? diaryForm.notes}
                onChange={(e) => setDiaryForm({ ...diaryForm, notes: e.target.value })}
                placeholder="Site notes for the day…"
                rows={3}
                className="w-full rounded border border-concrete-200 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={saveDiaryMutation.isPending}
                className="rounded bg-blueprint-900 px-3 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
              >
                {day.diary ? "Update diary" : "Save diary"}
              </button>
            </form>
          </section>

          {/* Progress */}
          <section className="rounded-md border border-concrete-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-concrete-900">Progress logged today</h2>
            <ul className="mb-3 divide-y divide-concrete-100">
              {day.diary?.progress?.map((p) => (
                <li key={p.id} className="py-2 text-sm">
                  <span className="text-concrete-900">{p.description}</span>{" "}
                  <span className="text-concrete-400">
                    ({p.percentComplete}%{p.activity ? ` · ${p.activity.name}` : ""})
                  </span>
                </li>
              ))}
              {(!day.diary || day.diary.progress?.length === 0) && (
                <li className="py-2 text-sm text-concrete-400">No progress logged yet.</li>
              )}
            </ul>
            {day.diary ? (
              <form
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  if (progressText.trim()) addProgressMutation.mutate();
                }}
                className="flex flex-wrap gap-2"
              >
                <input
                  value={progressText}
                  onChange={(e) => setProgressText(e.target.value)}
                  placeholder="What was done…"
                  className="w-64 rounded border border-concrete-200 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={progressPercent}
                  onChange={(e) => setProgressPercent(e.target.value)}
                  placeholder="% complete"
                  className="w-28 rounded border border-concrete-200 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={addProgressMutation.isPending}
                  className="flex items-center gap-1.5 rounded border border-concrete-200 px-3 py-2 text-sm text-concrete-700 hover:bg-concrete-50"
                >
                  <Plus size={15} />
                  Add
                </button>
              </form>
            ) : (
              <p className="text-xs text-concrete-400">Save the diary first to log progress.</p>
            )}
          </section>

          {/* Attendance */}
          <section className="rounded-md border border-concrete-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-concrete-900">Labor on site</h2>
            <ul className="mb-3 divide-y divide-concrete-100">
              {day.attendance.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-concrete-900">
                    {a.labor?.name} {a.labor?.skill ? `(${a.labor.skill})` : ""}
                  </span>
                  <span className="text-concrete-400">
                    {a.present ? "Present" : "Absent"}
                    {a.overtimeHours > 0 ? ` · ${a.overtimeHours}h OT` : ""}
                  </span>
                </li>
              ))}
              {day.attendance.length === 0 && (
                <li className="py-2 text-sm text-concrete-400">No attendance marked yet.</li>
              )}
            </ul>
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (attendanceForm.laborId) markAttendanceMutation.mutate();
              }}
              className="flex flex-wrap gap-2"
            >
              <select
                value={attendanceForm.laborId}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, laborId: e.target.value })}
                className="rounded border border-concrete-200 px-3 py-2 text-sm"
              >
                <option value="">Mark present…</option>
                {labor?.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={attendanceForm.overtimeHours}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, overtimeHours: e.target.value })}
                placeholder="OT hours (optional)"
                className="w-40 rounded border border-concrete-200 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={markAttendanceMutation.isPending}
                className="flex items-center gap-1.5 rounded border border-concrete-200 px-3 py-2 text-sm text-concrete-700 hover:bg-concrete-50"
              >
                <Plus size={15} />
                Mark
              </button>
            </form>
          </section>

          {/* Material consumed (read-only, sourced from Stock movements) */}
          <section className="rounded-md border border-concrete-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-concrete-900">Material consumed</h2>
            <ul className="divide-y divide-concrete-100">
              {day.materialConsumed.map((m) => (
                <li key={m.id} className="py-2 text-sm text-concrete-900">
                  {m.material?.name} — {m.quantity} {m.material?.unit}
                </li>
              ))}
              {day.materialConsumed.length === 0 && (
                <li className="py-2 text-sm text-concrete-400">
                  None recorded. Log consumption from the site's Stock page.
                </li>
              )}
            </ul>
          </section>

          {/* Equipment used */}
          <section className="rounded-md border border-concrete-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-concrete-900">Equipment used</h2>
            <ul className="mb-3 divide-y divide-concrete-100">
              {day.equipmentUsage.map((u) => (
                <li key={u.id} className="py-2 text-sm text-concrete-900">
                  {u.equipment?.name} — {u.hoursUsed}h{u.fuelUsed ? ` · ${u.fuelUsed}L fuel` : ""}
                </li>
              ))}
              {day.equipmentUsage.length === 0 && (
                <li className="py-2 text-sm text-concrete-400">No equipment logged for this day yet.</li>
              )}
            </ul>
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (equipmentForm.equipmentId && equipmentForm.hoursUsed) logEquipmentMutation.mutate();
              }}
              className="flex flex-wrap gap-2"
            >
              <select
                value={equipmentForm.equipmentId}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, equipmentId: e.target.value })}
                className="rounded border border-concrete-200 px-3 py-2 text-sm"
              >
                <option value="">Select equipment…</option>
                {equipmentList?.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={equipmentForm.hoursUsed}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, hoursUsed: e.target.value })}
                placeholder="Hours used"
                className="w-28 rounded border border-concrete-200 px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={equipmentForm.fuelUsed}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, fuelUsed: e.target.value })}
                placeholder="Fuel (L, optional)"
                className="w-36 rounded border border-concrete-200 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={logEquipmentMutation.isPending}
                className="flex items-center gap-1.5 rounded border border-concrete-200 px-3 py-2 text-sm text-concrete-700 hover:bg-concrete-50"
              >
                <Plus size={15} />
                Log
              </button>
            </form>
          </section>

          {/* Photos */}
          <section className="rounded-md border border-concrete-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-concrete-900">Site photos</h2>
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {day.photos.map((p) => (
                <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="block">
                  <img src={p.url} alt={p.caption ?? ""} className="h-24 w-full rounded object-cover" />
                  {p.caption && <p className="mt-1 truncate text-xs text-concrete-400">{p.caption}</p>}
                </a>
              ))}
              {day.photos.length === 0 && (
                <p className="col-span-full text-sm text-concrete-400">No photos for this day yet.</p>
              )}
            </div>
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (photoForm.url.trim()) addPhotoMutation.mutate();
              }}
              className="flex flex-wrap gap-2"
            >
              <input
                value={photoForm.url}
                onChange={(e) => setPhotoForm({ ...photoForm, url: e.target.value })}
                placeholder="Photo URL"
                className="w-64 rounded border border-concrete-200 px-3 py-2 text-sm"
              />
              <input
                value={photoForm.caption}
                onChange={(e) => setPhotoForm({ ...photoForm, caption: e.target.value })}
                placeholder="Caption (optional)"
                className="w-48 rounded border border-concrete-200 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={addPhotoMutation.isPending}
                className="flex items-center gap-1.5 rounded border border-concrete-200 px-3 py-2 text-sm text-concrete-700 hover:bg-concrete-50"
              >
                <Plus size={15} />
                Add
              </button>
            </form>
          </section>

          {/* Open issues */}
          <section className="rounded-md border border-concrete-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-concrete-900">Open issues (site-wide)</h2>
            <ul className="mb-3 divide-y divide-concrete-100">
              {day.openIssues.map((issue) => (
                <li key={issue.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-concrete-900">{issue.title}</span>
                    <StatusBadge status={issue.severity} />
                  </div>
                  <button
                    onClick={() => resolveIssue.mutate(issue.id)}
                    className="text-xs text-blueprint-700 hover:underline"
                  >
                    Mark resolved
                  </button>
                </li>
              ))}
              {day.openIssues.length === 0 && (
                <li className="py-2 text-sm text-concrete-400">No open issues.</li>
              )}
            </ul>
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (issueForm.title.trim()) addIssueMutation.mutate();
              }}
              className="flex flex-wrap gap-2"
            >
              <input
                value={issueForm.title}
                onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                placeholder="Issue / delay description"
                className="w-64 rounded border border-concrete-200 px-3 py-2 text-sm"
              />
              <select
                value={issueForm.severity}
                onChange={(e) => setIssueForm({ ...issueForm, severity: e.target.value })}
                className="rounded border border-concrete-200 px-3 py-2 text-sm"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
              <button
                type="submit"
                disabled={addIssueMutation.isPending}
                className="flex items-center gap-1.5 rounded border border-concrete-200 px-3 py-2 text-sm text-concrete-700 hover:bg-concrete-50"
              >
                <Plus size={15} />
                Log issue
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
