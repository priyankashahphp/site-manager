import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { createVendor, listVendors } from "@/api/vendors";
import Modal from "@/components/ui/Modal";

export default function VendorList() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: vendors, isLoading } = useQuery({ queryKey: ["vendors"], queryFn: listVendors });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-concrete-900">Vendors</h1>
          <p className="text-sm text-concrete-400">Suppliers and contractors your company works with.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded bg-blueprint-900 px-3 py-2 text-sm font-medium text-white hover:bg-blueprint-800"
        >
          <Plus size={15} />
          New vendor
        </button>
      </div>

      {isLoading && <p className="text-sm text-concrete-400">Loading…</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vendors?.map((v) => (
          <Link
            key={v.id}
            to={`/vendors/${v.id}`}
            className="rounded-md border border-concrete-200 bg-white p-5 hover:shadow-md"
          >
            <p className="mb-1 font-medium text-concrete-900">{v.name}</p>
            {v.category && <p className="mb-3 text-xs text-concrete-400">{v.category}</p>}
            {v.contactName && <p className="text-sm text-concrete-500">{v.contactName}</p>}
            <div className="mt-3 flex gap-4 border-t border-concrete-100 pt-3 text-xs text-concrete-400">
              <span>{v._count?.purchaseOrders ?? 0} PO(s)</span>
              <span>{v._count?.bills ?? 0} bill(s)</span>
            </div>
          </Link>
        ))}
      </div>

      {!isLoading && vendors?.length === 0 && (
        <div className="rounded-md border border-dashed border-concrete-300 py-16 text-center">
          <p className="text-sm text-concrete-400">No vendors yet.</p>
        </div>
      )}

      {showCreate && <CreateVendorModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateVendorModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    category: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createVendor({
        name: form.name,
        category: form.category || undefined,
        contactName: form.contactName || undefined,
        contactPhone: form.contactPhone || undefined,
        contactEmail: form.contactEmail || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      onClose();
    },
    onError: (err: any) => setError(err?.response?.data?.error || "Failed to create vendor"),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <Modal title="New vendor" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-concrete-700">Vendor name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-concrete-700">Category</label>
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="Steel, Cement, Electrical…"
            className="w-full rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-concrete-700">Contact name</label>
          <input
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            className="w-full rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-concrete-700">Contact phone</label>
          <input
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            className="w-full rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-concrete-700">Contact email</label>
          <input
            type="email"
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            className="w-full rounded border border-concrete-200 px-3 py-2 text-sm focus:border-blueprint-500 focus:outline-none focus:ring-1 focus:ring-blueprint-500"
          />
        </div>

        {error && <p className="text-sm text-signal-red">{error}</p>}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded bg-blueprint-900 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
        >
          {mutation.isPending ? "Creating…" : "Create vendor"}
        </button>
      </form>
    </Modal>
  );
}
