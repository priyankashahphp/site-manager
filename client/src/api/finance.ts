import { api } from "@/api/client";
import { BudgetLineRow, Expense, PortfolioFinanceRow, ProjectFinanceSummary } from "@/types";

export async function listExpenses(projectId: string) {
  const { data } = await api.get<Expense[]>(`/projects/${projectId}/expenses`);
  return data;
}

export async function createExpense(
  projectId: string,
  payload: { category: string; amount: number; note?: string; incurredAt?: string }
) {
  const { data } = await api.post<Expense>(`/projects/${projectId}/expenses`, payload);
  return data;
}

export async function deleteExpense(id: string) {
  await api.delete(`/expenses/${id}`);
}

export async function listBudgetLines(projectId: string) {
  const { data } = await api.get<BudgetLineRow[]>(`/projects/${projectId}/budget-lines`);
  return data;
}

export async function createBudgetLine(
  projectId: string,
  payload: { category: string; plannedAmount: number }
) {
  const { data } = await api.post<BudgetLineRow>(`/projects/${projectId}/budget-lines`, payload);
  return data;
}

export async function deleteBudgetLine(id: string) {
  await api.delete(`/budget-lines/${id}`);
}

export async function getProjectFinanceSummary(projectId: string) {
  const { data } = await api.get<ProjectFinanceSummary>(`/projects/${projectId}/finance-summary`);
  return data;
}

export async function getPortfolioFinanceSummary() {
  const { data } = await api.get<PortfolioFinanceRow[]>("/finance-summary");
  return data;
}
