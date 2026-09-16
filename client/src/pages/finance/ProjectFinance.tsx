import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import {
  createBudgetLine,
  createExpense,
  deleteBudgetLine,
  deleteExpense,
  getProjectFinanceSummary,
  listBudgetLines,
  listExpenses,
} from "@/api/finance";
import { ExpenseCategory } from "@/types";

const CATEGORIES: ExpenseCategory[] = [
  "PURCHASE",
  "LABOR",
  "VENDOR_PAYMENT",
  "PETTY_CASH",
  "ADVANCE",
  "OTHER",
];

const CATEGORY_LABELS: Record<string, string> = {
  PURCHASE: "Purchase",
  LABOR: "Labor",
  VENDOR_PAYMENT: "Vendor payment",
  PETTY_CASH: "Petty cash",
  ADVANCE: "Advance",
  OTHER: "Other",
};

export default function ProjectFinance() {
  const { id } = useParams<{ id: string }>();
  const projectId = id!;
  const queryClient = useQueryClient();

  const { data: summary } = useQuery({
    queryKey: ["finance-summary", projectId],
    queryFn: () => getProjectFinanceSummary(projectId),
  });
  const { data: expenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ["expenses", projectId],
    queryFn: () => listExpenses(projectId),
  });
  const { data: budgetLines } = useQuery({
    queryKey: ["budget-lines", projectId],
    queryFn: () => listBudgetLines(projectId),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["finance-summary", projectId] });
    queryClient.invalidateQueries({ queryKey: ["expenses", projectId] });
    queryClient.invalidateQueries({ queryKey: ["budget-lines", projectId] });
  };

  const [expenseForm, setExpenseForm] = useState({ category: "OTHER", amount: "", note: "" });
  const addExpense = useMutation({
    mutationFn: () =>
      createExpense(projectId, {
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        note: expenseForm.note || undefined,
      }),
    onSuccess: () => {
      setExpenseForm({ category: "OTHER", amount: "", note: "" });
      invalidateAll();
    },
  });
  const removeExpense = useMutation({
    mutationFn: (expenseId: string) => deleteExpense(expenseId),
    onSuccess: invalidateAll,
  });

  const [lineForm, setLineForm] = useState({ category: "", plannedAmount: "" });
  const addLine = useMutation({
    mutationFn: () =>
      createBudgetLine(projectId, {
        category: lineForm.category,
        plannedAmount: Number(lineForm.plannedAmount),
      }),
    onSuccess: () => {
      setLineForm({ category: "", plannedAmount: "" });
      invalidateAll();
    },
  });
  const removeLine = useMutation({
    mutationFn: (lineId: string) => deleteBudgetLine(lineId),
    onSuccess: invalidateAll,
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-concrete-900">
        Finance — {summary?.projectName}
      </h1>
      <p className="mb-6 text-sm text-concrete-400">Budget, spend, and expense ledger for this project.</p>

      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <SummaryCard label="Budget" value={summary.budget !== null ? `₹${summary.budget.toLocaleString("en-IN")}` : "—"} />
          <SummaryCard label="Spent" value={`₹${summary.totalSpent.toLocaleString("en-IN")}`} />
          <SummaryCard
            label="Variance"
            value={summary.variance !== null ? `₹${summary.variance.toLocaleString("en-IN")}` : "—"}
            negative={summary.variance !== null && summary.variance < 0}
          />
          <SummaryCard
            label="% of budget used"
            value={summary.percentUsed !== null ? `${summary.percentUsed}%` : "—"}
            negative={summary.percentUsed !== null && summary.percentUsed > 100}
          />
        </div>
      )}

      {/* Budget lines */}
      <section className="mb-6 overflow-hidden rounded-md border border-concrete-200 bg-white">
        <div className="border-b border-concrete-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-concrete-900">Budget lines</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-concrete-200 bg-concrete-50 text-left text-xs uppercase tracking-wide text-concrete-400">
            <tr>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Planned</th>
              <th className="px-4 py-2 font-medium">Actual</th>
              <th className="px-4 py-2 font-medium">Variance</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-concrete-100">
            {budgetLines?.map((line) => (
              <tr key={line.id}>
                <td className="px-4 py-2 font-medium text-concrete-900">{line.category}</td>
                <td className="px-4 py-2 text-concrete-500">₹{Number(line.plannedAmount).toLocaleString("en-IN")}</td>
                <td className="px-4 py-2 text-concrete-500">₹{line.actualAmount.toLocaleString("en-IN")}</td>
                <td className={`px-4 py-2 font-medium ${line.variance < 0 ? "text-signal-red" : "text-signal-green"}`}>
                  ₹{line.variance.toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => removeLine.mutate(line.id)} className="text-concrete-400 hover:text-signal-red">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {budgetLines?.length === 0 && (
          <p className="px-4 py-4 text-sm text-concrete-400">No budget lines yet.</p>
        )}
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (lineForm.category.trim() && lineForm.plannedAmount) addLine.mutate();
          }}
          className="flex flex-wrap gap-2 border-t border-concrete-100 p-4"
        >
          <input
            value={lineForm.category}
            onChange={(e) => setLineForm({ ...lineForm, category: e.target.value })}
            placeholder="Category (e.g. Cement, Labor, Shuttering)"
            className="w-56 rounded border border-concrete-200 px-2 py-1.5 text-sm"
          />
          <input
            type="number"
            value={lineForm.plannedAmount}
            onChange={(e) => setLineForm({ ...lineForm, plannedAmount: e.target.value })}
            placeholder="Planned amount (₹)"
            className="w-40 rounded border border-concrete-200 px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={addLine.isPending}
            className="flex items-center gap-1 rounded border border-concrete-200 px-2.5 py-1.5 text-sm text-concrete-700 hover:bg-concrete-50"
          >
            <Plus size={14} />
            Add
          </button>
        </form>
        <p className="px-4 pb-3 text-xs text-concrete-400">
          "Actual" is computed automatically from expenses whose category text matches this budget
          line's category.
        </p>
      </section>

      {/* Expense ledger */}
      <section className="overflow-hidden rounded-md border border-concrete-200 bg-white">
        <div className="border-b border-concrete-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-concrete-900">Expenses</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-concrete-200 bg-concrete-50 text-left text-xs uppercase tracking-wide text-concrete-400">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Note</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-concrete-100">
            {expenses?.map((exp) => (
              <tr key={exp.id}>
                <td className="px-4 py-2 text-concrete-500">{new Date(exp.incurredAt).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-concrete-900">{CATEGORY_LABELS[exp.category]}</td>
                <td className="px-4 py-2 text-concrete-500">{exp.note || "—"}</td>
                <td className="px-4 py-2 font-medium text-concrete-900">
                  ₹{Number(exp.amount).toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => removeExpense.mutate(exp.id)} className="text-concrete-400 hover:text-signal-red">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loadingExpenses && <p className="px-4 py-4 text-sm text-concrete-400">Loading…</p>}
        {!loadingExpenses && expenses?.length === 0 && (
          <p className="px-4 py-4 text-sm text-concrete-400">No expenses logged yet.</p>
        )}
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (expenseForm.amount) addExpense.mutate();
          }}
          className="flex flex-wrap gap-2 border-t border-concrete-100 p-4"
        >
          <select
            value={expenseForm.category}
            onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
            className="rounded border border-concrete-200 px-2 py-1.5 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={expenseForm.amount}
            onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
            placeholder="Amount (₹)"
            className="w-32 rounded border border-concrete-200 px-2 py-1.5 text-sm"
          />
          <input
            value={expenseForm.note}
            onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
            placeholder="Note (optional)"
            className="w-56 rounded border border-concrete-200 px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={addExpense.isPending}
            className="flex items-center gap-1 rounded bg-blueprint-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
          >
            <Plus size={14} />
            Add expense
          </button>
        </form>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="rounded-md border border-concrete-200 bg-white p-4">
      <p className="text-xs text-concrete-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${negative ? "text-signal-red" : "text-concrete-900"}`}>
        {value}
      </p>
    </div>
  );
}
