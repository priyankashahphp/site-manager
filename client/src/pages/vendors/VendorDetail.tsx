import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { createBill, createContract, createPayment, createQuotation, getVendor } from "@/api/vendors";
import StatusBadge from "@/components/ui/StatusBadge";

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const vendorId = id!;
  const queryClient = useQueryClient();

  const { data: vendor, isLoading } = useQuery({
    queryKey: ["vendors", vendorId],
    queryFn: () => getVendor(vendorId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["vendors", vendorId] });

  if (isLoading) return <p className="text-sm text-concrete-400">Loading…</p>;
  if (!vendor) return <p className="text-sm text-concrete-400">Vendor not found.</p>;

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-concrete-900">{vendor.name}</h1>
      <p className="mb-6 text-sm text-concrete-400">
        {vendor.category || "No category"}
        {vendor.contactName ? ` · ${vendor.contactName}` : ""}
        {vendor.contactPhone ? ` · ${vendor.contactPhone}` : ""}
        {vendor.contactEmail ? ` · ${vendor.contactEmail}` : ""}
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <QuotationsCard vendorId={vendorId} quotations={vendor.quotations ?? []} onChange={invalidate} />
        <ContractsCard vendorId={vendorId} contracts={vendor.contracts ?? []} onChange={invalidate} />
      </div>

      <div className="mt-6">
        <PurchaseOrdersCard orders={vendor.purchaseOrders ?? []} />
      </div>

      <div className="mt-6">
        <BillsCard vendorId={vendorId} bills={vendor.bills ?? []} onChange={invalidate} />
      </div>
    </div>
  );
}

function QuotationsCard({
  vendorId,
  quotations,
  onChange,
}: {
  vendorId: string;
  quotations: any[];
  onChange: () => void;
}) {
  const [form, setForm] = useState({ title: "", amount: "" });
  const add = useMutation({
    mutationFn: () => createQuotation(vendorId, { title: form.title, amount: Number(form.amount) }),
    onSuccess: () => {
      setForm({ title: "", amount: "" });
      onChange();
    },
  });

  return (
    <div className="rounded-md border border-concrete-200 bg-white">
      <div className="border-b border-concrete-200 px-5 py-3">
        <h2 className="text-sm font-semibold text-concrete-900">Quotations</h2>
      </div>
      <ul className="divide-y divide-concrete-100">
        {quotations.map((q) => (
          <li key={q.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-sm font-medium text-concrete-900">{q.title}</p>
              <p className="text-xs text-concrete-400">₹{Number(q.amount).toLocaleString("en-IN")}</p>
            </div>
            <StatusBadge status={q.status} />
          </li>
        ))}
        {quotations.length === 0 && (
          <li className="px-5 py-4 text-sm text-concrete-400">No quotations yet.</li>
        )}
      </ul>
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (form.title.trim() && form.amount) add.mutate();
        }}
        className="flex flex-wrap gap-2 border-t border-concrete-100 p-4"
      >
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Quotation title"
          className="w-40 rounded border border-concrete-200 px-2 py-1.5 text-sm"
        />
        <input
          type="number"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          placeholder="Amount (₹)"
          className="w-32 rounded border border-concrete-200 px-2 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={add.isPending}
          className="flex items-center gap-1 rounded border border-concrete-200 px-2.5 py-1.5 text-sm text-concrete-700 hover:bg-concrete-50"
        >
          <Plus size={14} />
          Add
        </button>
      </form>
    </div>
  );
}

function ContractsCard({
  vendorId,
  contracts,
  onChange,
}: {
  vendorId: string;
  contracts: any[];
  onChange: () => void;
}) {
  const [form, setForm] = useState({ title: "", value: "" });
  const add = useMutation({
    mutationFn: () =>
      createContract(vendorId, { title: form.title, value: form.value ? Number(form.value) : undefined }),
    onSuccess: () => {
      setForm({ title: "", value: "" });
      onChange();
    },
  });

  return (
    <div className="rounded-md border border-concrete-200 bg-white">
      <div className="border-b border-concrete-200 px-5 py-3">
        <h2 className="text-sm font-semibold text-concrete-900">Contracts</h2>
      </div>
      <ul className="divide-y divide-concrete-100">
        {contracts.map((c) => (
          <li key={c.id} className="px-5 py-3">
            <p className="text-sm font-medium text-concrete-900">{c.title}</p>
            {c.value && (
              <p className="text-xs text-concrete-400">₹{Number(c.value).toLocaleString("en-IN")}</p>
            )}
          </li>
        ))}
        {contracts.length === 0 && (
          <li className="px-5 py-4 text-sm text-concrete-400">No contracts yet.</li>
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
          placeholder="Contract title"
          className="w-40 rounded border border-concrete-200 px-2 py-1.5 text-sm"
        />
        <input
          type="number"
          value={form.value}
          onChange={(e) => setForm({ ...form, value: e.target.value })}
          placeholder="Value (₹, optional)"
          className="w-36 rounded border border-concrete-200 px-2 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={add.isPending}
          className="flex items-center gap-1 rounded border border-concrete-200 px-2.5 py-1.5 text-sm text-concrete-700 hover:bg-concrete-50"
        >
          <Plus size={14} />
          Add
        </button>
      </form>
    </div>
  );
}

function PurchaseOrdersCard({ orders }: { orders: any[] }) {
  return (
    <div className="rounded-md border border-concrete-200 bg-white">
      <div className="border-b border-concrete-200 px-5 py-3">
        <h2 className="text-sm font-semibold text-concrete-900">Purchase Orders</h2>
      </div>
      <ul className="divide-y divide-concrete-100">
        {orders.map((o) => (
          <li key={o.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="font-mono text-sm font-medium text-concrete-900">{o.poNumber}</p>
              <p className="text-xs text-concrete-400">₹{Number(o.totalAmount).toLocaleString("en-IN")}</p>
            </div>
            <StatusBadge status={o.status} />
          </li>
        ))}
        {orders.length === 0 && (
          <li className="px-5 py-4 text-sm text-concrete-400">
            No purchase orders yet. Create one from a project's "Purchase Orders" page.
          </li>
        )}
      </ul>
    </div>
  );
}

function BillsCard({
  vendorId,
  bills,
  onChange,
}: {
  vendorId: string;
  bills: any[];
  onChange: () => void;
}) {
  const [form, setForm] = useState({ billNumber: "", amount: "" });
  const add = useMutation({
    mutationFn: () => createBill(vendorId, { billNumber: form.billNumber, amount: Number(form.amount) }),
    onSuccess: () => {
      setForm({ billNumber: "", amount: "" });
      onChange();
    },
  });

  return (
    <div className="rounded-md border border-concrete-200 bg-white">
      <div className="border-b border-concrete-200 px-5 py-3">
        <h2 className="text-sm font-semibold text-concrete-900">Bills & Payments</h2>
      </div>
      <ul className="divide-y divide-concrete-100">
        {bills.map((b) => (
          <BillRow key={b.id} bill={b} onChange={onChange} />
        ))}
        {bills.length === 0 && (
          <li className="px-5 py-4 text-sm text-concrete-400">No bills yet.</li>
        )}
      </ul>
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (form.billNumber.trim() && form.amount) add.mutate();
        }}
        className="flex flex-wrap gap-2 border-t border-concrete-100 p-4"
      >
        <input
          value={form.billNumber}
          onChange={(e) => setForm({ ...form, billNumber: e.target.value })}
          placeholder="Bill number"
          className="w-40 rounded border border-concrete-200 px-2 py-1.5 text-sm"
        />
        <input
          type="number"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          placeholder="Amount (₹)"
          className="w-32 rounded border border-concrete-200 px-2 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={add.isPending}
          className="flex items-center gap-1 rounded border border-concrete-200 px-2.5 py-1.5 text-sm text-concrete-700 hover:bg-concrete-50"
        >
          <Plus size={14} />
          Add bill
        </button>
      </form>
    </div>
  );
}

function BillRow({ bill, onChange }: { bill: any; onChange: () => void }) {
  const [amount, setAmount] = useState("");
  const paid = (bill.payments ?? []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const remaining = Number(bill.amount) - paid;

  const pay = useMutation({
    mutationFn: () => createPayment(bill.id, { amount: Number(amount) }),
    onSuccess: () => {
      setAmount("");
      onChange();
    },
  });

  return (
    <li className="px-5 py-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-concrete-900">{bill.billNumber}</p>
          <p className="text-xs text-concrete-400">
            ₹{Number(bill.amount).toLocaleString("en-IN")} total · ₹{paid.toLocaleString("en-IN")} paid
          </p>
        </div>
        <StatusBadge status={bill.status} />
      </div>
      {remaining > 0 && (
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (amount) pay.mutate();
          }}
          className="flex gap-2"
        >
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Pay (₹${remaining.toLocaleString("en-IN")} remaining)`}
            className="w-48 rounded border border-concrete-200 px-2 py-1 text-xs"
          />
          <button
            type="submit"
            disabled={pay.isPending}
            className="rounded border border-concrete-200 px-2 py-1 text-xs text-concrete-700 hover:bg-concrete-50"
          >
            Record payment
          </button>
        </form>
      )}
    </li>
  );
}
