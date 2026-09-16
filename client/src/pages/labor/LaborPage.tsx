import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import {
  createContractor,
  createLabor,
  createLaborGroup,
  createLaborPayment,
  listContractors,
  listLabor,
  listLaborGroups,
} from "@/api/labor";

export default function LaborPage() {
  const queryClient = useQueryClient();
  const { data: contractors } = useQuery({ queryKey: ["contractors"], queryFn: listContractors });
  const { data: groups } = useQuery({ queryKey: ["labor-groups"], queryFn: listLaborGroups });
  const { data: labor, isLoading } = useQuery({ queryKey: ["labor"], queryFn: listLabor });

  const [contractorName, setContractorName] = useState("");
  const addContractor = useMutation({
    mutationFn: () => createContractor({ name: contractorName }),
    onSuccess: () => {
      setContractorName("");
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
    },
  });

  const [groupForm, setGroupForm] = useState({ name: "", contractorId: "" });
  const addGroup = useMutation({
    mutationFn: () =>
      createLaborGroup({ name: groupForm.name, contractorId: groupForm.contractorId || undefined }),
    onSuccess: () => {
      setGroupForm({ name: "", contractorId: "" });
      queryClient.invalidateQueries({ queryKey: ["labor-groups"] });
    },
  });

  const [laborForm, setLaborForm] = useState({
    name: "",
    skill: "",
    dailyWage: "",
    laborGroupId: "",
  });
  const addLabor = useMutation({
    mutationFn: () =>
      createLabor({
        name: laborForm.name,
        skill: laborForm.skill || undefined,
        dailyWage: Number(laborForm.dailyWage),
        laborGroupId: laborForm.laborGroupId || undefined,
      }),
    onSuccess: () => {
      setLaborForm({ name: "", skill: "", dailyWage: "", laborGroupId: "" });
      queryClient.invalidateQueries({ queryKey: ["labor"] });
    },
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-concrete-900">Labor</h1>
      <p className="mb-6 text-sm text-concrete-400">
        Contractors, labor groups, and the roster. Attendance is marked per site on the site's Diary page.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-md border border-concrete-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-concrete-900">Contractors</h2>
          <ul className="mb-3 flex flex-wrap gap-1.5">
            {contractors?.map((c) => (
              <li key={c.id} className="rounded bg-concrete-100 px-2 py-1 text-xs text-concrete-600">
                {c.name} ({c._count?.laborGroups ?? 0} groups)
              </li>
            ))}
          </ul>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (contractorName.trim()) addContractor.mutate();
            }}
            className="flex gap-2"
          >
            <input
              value={contractorName}
              onChange={(e) => setContractorName(e.target.value)}
              placeholder="Contractor name"
              className="flex-1 rounded border border-concrete-200 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={addContractor.isPending}
              className="flex items-center gap-1.5 rounded bg-blueprint-900 px-3 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
            >
              <Plus size={15} />
              Add
            </button>
          </form>
        </div>

        <div className="rounded-md border border-concrete-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-concrete-900">Labor Groups</h2>
          <ul className="mb-3 flex flex-wrap gap-1.5">
            {groups?.map((g) => (
              <li key={g.id} className="rounded bg-concrete-100 px-2 py-1 text-xs text-concrete-600">
                {g.name}
                {g.contractor ? ` · ${g.contractor.name}` : ""} ({g._count?.laborers ?? 0})
              </li>
            ))}
          </ul>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (groupForm.name.trim()) addGroup.mutate();
            }}
            className="flex flex-wrap gap-2"
          >
            <input
              value={groupForm.name}
              onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
              placeholder="Group name"
              className="flex-1 rounded border border-concrete-200 px-3 py-2 text-sm"
            />
            <select
              value={groupForm.contractorId}
              onChange={(e) => setGroupForm({ ...groupForm, contractorId: e.target.value })}
              className="rounded border border-concrete-200 px-3 py-2 text-sm"
            >
              <option value="">In-house (no contractor)</option>
              {contractors?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={addGroup.isPending}
              className="flex items-center gap-1.5 rounded bg-blueprint-900 px-3 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
            >
              <Plus size={15} />
              Add
            </button>
          </form>
        </div>
      </div>

      <div className="mb-4 overflow-hidden rounded-md border border-concrete-200 bg-white">
        <div className="border-b border-concrete-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-concrete-900">Roster</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-concrete-200 bg-concrete-50 text-left text-xs uppercase tracking-wide text-concrete-400">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Skill</th>
              <th className="px-4 py-2 font-medium">Group</th>
              <th className="px-4 py-2 font-medium">Daily wage</th>
              <th className="px-4 py-2 font-medium">Pay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-concrete-100">
            {labor?.map((l) => (
              <LaborRow key={l.id} labor={l} />
            ))}
          </tbody>
        </table>
        {isLoading && <p className="px-4 py-4 text-sm text-concrete-400">Loading…</p>}
        {!isLoading && labor?.length === 0 && (
          <p className="px-4 py-4 text-sm text-concrete-400">No labor added yet.</p>
        )}
      </div>

      <div className="rounded-md border border-concrete-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-concrete-900">Add labor</h2>
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (laborForm.name.trim() && laborForm.dailyWage) addLabor.mutate();
          }}
          className="flex flex-wrap gap-2"
        >
          <input
            value={laborForm.name}
            onChange={(e) => setLaborForm({ ...laborForm, name: e.target.value })}
            placeholder="Full name"
            className="w-48 rounded border border-concrete-200 px-3 py-2 text-sm"
          />
          <input
            value={laborForm.skill}
            onChange={(e) => setLaborForm({ ...laborForm, skill: e.target.value })}
            placeholder="Skill (e.g. Mason)"
            className="w-40 rounded border border-concrete-200 px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={laborForm.dailyWage}
            onChange={(e) => setLaborForm({ ...laborForm, dailyWage: e.target.value })}
            placeholder="Daily wage (₹)"
            className="w-32 rounded border border-concrete-200 px-3 py-2 text-sm"
          />
          <select
            value={laborForm.laborGroupId}
            onChange={(e) => setLaborForm({ ...laborForm, laborGroupId: e.target.value })}
            className="rounded border border-concrete-200 px-3 py-2 text-sm"
          >
            <option value="">No group</option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={addLabor.isPending}
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

function LaborRow({ labor }: { labor: any }) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("WAGE");
  const pay = useMutation({
    mutationFn: () => createLaborPayment(labor.id, { amount: Number(amount), type }),
    onSuccess: () => setAmount(""),
  });

  return (
    <tr>
      <td className="px-4 py-2 font-medium text-concrete-900">{labor.name}</td>
      <td className="px-4 py-2 text-concrete-500">{labor.skill || "—"}</td>
      <td className="px-4 py-2 text-concrete-500">{labor.laborGroup?.name || "—"}</td>
      <td className="px-4 py-2 text-concrete-500">₹{Number(labor.dailyWage).toLocaleString("en-IN")}</td>
      <td className="px-4 py-2">
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (amount) pay.mutate();
          }}
          className="flex items-center gap-1"
        >
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded border border-concrete-200 px-1.5 py-1 text-xs"
          >
            <option value="WAGE">Wage</option>
            <option value="ADVANCE">Advance</option>
            <option value="OVERTIME">Overtime</option>
          </select>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="₹"
            className="w-20 rounded border border-concrete-200 px-1.5 py-1 text-xs"
          />
          <button
            type="submit"
            disabled={pay.isPending}
            className="rounded border border-concrete-200 px-2 py-1 text-xs text-concrete-700 hover:bg-concrete-50"
          >
            Pay
          </button>
        </form>
      </td>
    </tr>
  );
}
