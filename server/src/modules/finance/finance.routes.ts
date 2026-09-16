import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/db";
import { asyncHandler, ApiError } from "@/middleware/errorHandler";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();
router.use(requireAuth);

const FINANCE_ROLES = ["ADMIN", "PROJECT_MANAGER", "ACCOUNTANT"] as const;

async function getProjectInCompany(projectId: string, companyId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, companyId } });
  if (!project) throw new ApiError(404, "Project not found");
  return project;
}

// ============================================================================
// Expenses
// ============================================================================

router.get(
  "/projects/:projectId/expenses",
  asyncHandler(async (req, res) => {
    const project = await getProjectInCompany(req.params.projectId, req.user!.companyId);
    const expenses = await prisma.expense.findMany({
      where: { projectId: project.id },
      orderBy: { incurredAt: "desc" },
      take: 200,
    });
    res.json(expenses);
  })
);

const expenseSchema = z.object({
  category: z.enum(["PURCHASE", "LABOR", "VENDOR_PAYMENT", "PETTY_CASH", "ADVANCE", "OTHER"]),
  amount: z.number().positive(),
  note: z.string().optional(),
  incurredAt: z.string().datetime().optional(),
});

router.post(
  "/projects/:projectId/expenses",
  requireRole(...FINANCE_ROLES, "SITE_SUPERVISOR"),
  asyncHandler(async (req, res) => {
    const project = await getProjectInCompany(req.params.projectId, req.user!.companyId);
    const data = expenseSchema.parse(req.body);
    const expense = await prisma.expense.create({
      data: {
        ...data,
        incurredAt: data.incurredAt ? new Date(data.incurredAt) : undefined,
        projectId: project.id,
      },
    });
    res.status(201).json(expense);
  })
);

router.delete(
  "/expenses/:id",
  requireRole(...FINANCE_ROLES),
  asyncHandler(async (req, res) => {
    const existing = await prisma.expense.findFirst({
      where: { id: req.params.id, project: { companyId: req.user!.companyId } },
    });
    if (!existing) throw new ApiError(404, "Expense not found");
    await prisma.expense.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

// ============================================================================
// Budget Lines — planned amount per category, with actual spend computed
// live from matching Expense entries (category match, case-insensitive).
// ============================================================================

router.get(
  "/projects/:projectId/budget-lines",
  asyncHandler(async (req, res) => {
    const project = await getProjectInCompany(req.params.projectId, req.user!.companyId);
    const [lines, expenses] = await Promise.all([
      prisma.budgetLine.findMany({ where: { projectId: project.id }, orderBy: { category: "asc" } }),
      prisma.expense.findMany({ where: { projectId: project.id }, select: { category: true, amount: true } }),
    ]);

    const result = lines.map((line) => {
      const actual = expenses
        .filter((e) => e.category.toLowerCase() === line.category.toLowerCase())
        .reduce((sum, e) => sum + Number(e.amount), 0);
      return {
        id: line.id,
        category: line.category,
        plannedAmount: line.plannedAmount,
        actualAmount: actual,
        variance: Number(line.plannedAmount) - actual,
      };
    });
    res.json(result);
  })
);

const budgetLineSchema = z.object({
  category: z.string().min(2),
  plannedAmount: z.number().nonnegative(),
});

router.post(
  "/projects/:projectId/budget-lines",
  requireRole(...FINANCE_ROLES),
  asyncHandler(async (req, res) => {
    const project = await getProjectInCompany(req.params.projectId, req.user!.companyId);
    const data = budgetLineSchema.parse(req.body);
    const line = await prisma.budgetLine.create({ data: { ...data, projectId: project.id } });
    res.status(201).json(line);
  })
);

router.delete(
  "/budget-lines/:id",
  requireRole(...FINANCE_ROLES),
  asyncHandler(async (req, res) => {
    const existing = await prisma.budgetLine.findFirst({
      where: { id: req.params.id, project: { companyId: req.user!.companyId } },
    });
    if (!existing) throw new ApiError(404, "Budget line not found");
    await prisma.budgetLine.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

// ============================================================================
// Finance summaries — budget vs actual
// ============================================================================

router.get(
  "/projects/:projectId/finance-summary",
  asyncHandler(async (req, res) => {
    const project = await getProjectInCompany(req.params.projectId, req.user!.companyId);
    const expenses = await prisma.expense.findMany({
      where: { projectId: project.id },
      select: { category: true, amount: true },
    });

    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const byCategory: Record<string, number> = {};
    for (const e of expenses) {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + Number(e.amount);
    }

    const budget = project.budget ? Number(project.budget) : null;
    res.json({
      projectId: project.id,
      projectName: project.name,
      budget,
      totalSpent,
      variance: budget !== null ? budget - totalSpent : null,
      percentUsed: budget ? Math.round((totalSpent / budget) * 100) : null,
      byCategory,
    });
  })
);

// Company-wide portfolio view: budget vs actual across every project.
router.get(
  "/finance-summary",
  asyncHandler(async (req, res) => {
    const projects = await prisma.project.findMany({
      where: { companyId: req.user!.companyId },
      select: { id: true, name: true, code: true, budget: true, status: true },
    });

    const expenseTotals = await prisma.expense.groupBy({
      by: ["projectId"],
      where: { project: { companyId: req.user!.companyId } },
      _sum: { amount: true },
    });
    const totalsByProject = new Map(expenseTotals.map((e) => [e.projectId, Number(e._sum.amount ?? 0)]));

    const result = projects.map((p) => {
      const totalSpent = totalsByProject.get(p.id) ?? 0;
      const budget = p.budget ? Number(p.budget) : null;
      return {
        projectId: p.id,
        projectName: p.name,
        projectCode: p.code,
        status: p.status,
        budget,
        totalSpent,
        variance: budget !== null ? budget - totalSpent : null,
      };
    });
    res.json(result);
  })
);

export default router;
