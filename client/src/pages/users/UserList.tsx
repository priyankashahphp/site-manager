import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { createUser, listUsers } from "@/api/users";
import { UserRole } from "@/types";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";

const ROLES: UserRole[] = [
  "ADMIN",
  "PROJECT_MANAGER",
  "SITE_ENGINEER",
  "SITE_SUPERVISOR",
  "STORE_MANAGER",
  "ACCOUNTANT",
  "PURCHASE_MANAGER",
  "VENDOR",
  "CONTRACTOR",
  "LABOR",
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  PROJECT_MANAGER: "Project Manager",
  SITE_ENGINEER: "Site Engineer",
  SITE_SUPERVISOR: "Site Supervisor",
  STORE_MANAGER: "Store Manager",
  ACCOUNTANT: "Accountant",
  PURCHASE_MANAGER: "Purchase Manager",
  VENDOR: "Vendor",
  CONTRACTOR: "Contractor",
  LABOR: "Labor",
};

export default function UserList() {
  const { user: me } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const { data: users, isLoading } = useQuery({ queryKey: ["users"], queryFn: listUsers });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-concrete-900">Company & Users</h1>
          <p className="text-sm text-concrete-400">Manage who has access and their role.</p>
        </div>
        {me?.role === "ADMIN" && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded bg-blueprint-900 px-3 py-2 text-sm font-medium text-white hover:bg-blueprint-800"
          >
            <Plus size={15} />
            Invite user
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-md border border-concrete-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-concrete-200 bg-concrete-50 text-left text-xs uppercase tracking-wide text-concrete-400">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-concrete-100">
            {users?.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-3 font-medium text-concrete-900">{u.name}</td>
                <td className="px-5 py-3 text-concrete-500">{u.email}</td>
                <td className="px-5 py-3 text-concrete-500">{ROLE_LABELS[u.role]}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      u.isActive
                        ? "bg-signal-green/10 text-signal-green"
                        : "bg-signal-red/10 text-signal-red"
                    }`}
                  >
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <p className="px-5 py-6 text-sm text-concrete-400">Loading…</p>}
      </div>

      {showCreate && <InviteUserModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function InviteUserModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "SITE_ENGINEER" as UserRole,
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => createUser(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
    onError: (err: any) => setError(err?.response?.data?.error || "Failed to invite user"),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <Modal title="Invite user" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-concrete-700">Full name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-concrete-700">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-concrete-700">
            Temporary password
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-concrete-700">Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
            className="w-full rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-signal-red">{error}</p>}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded bg-blueprint-900 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
        >
          {mutation.isPending ? "Inviting…" : "Invite user"}
        </button>
      </form>
    </Modal>
  );
}
