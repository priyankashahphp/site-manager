import { Router } from "express";
import { prisma } from "@/config/db";
import { asyncHandler, ApiError } from "@/middleware/errorHandler";
import { requireAuth } from "@/middleware/auth";

const router = Router();
router.use(requireAuth);

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Same signed-balance convention used in the Material & Stock module. */
function signedQuantity(type: string, quantity: number) {
  if (type === "INWARD") return quantity;
  if (type === "ADJUSTMENT") return quantity;
  return -Math.abs(quantity);
}

// ============================================================================
// Project overview — one deep rollup across every module for this project
// ============================================================================

router.get(
  "/projects/:projectId/reports/overview",
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, companyId: req.user!.companyId },
    });
    if (!project) throw new ApiError(404, "Project not found");

    const sites = await prisma.site.findMany({ where: { projectId: project.id }, select: { id: true } });
    const siteIds = sites.map((s) => s.id);

    const [
      activities,
      expenses,
      purchaseOrders,
      stockMovements,
      todayAttendance,
      openIssues,
      openSafetyIncidents,
      pendingInspections,
    ] = await Promise.all([
      prisma.activity.findMany({
        where: { workPackage: { projectId: project.id } },
        select: { percentComplete: true },
      }),
      prisma.expense.findMany({ where: { projectId: project.id }, select: { amount: true } }),
      prisma.purchaseOrder.findMany({
        where: { projectId: project.id },
        include: { bills: { include: { payments: true } } },
      }),
      siteIds.length
        ? prisma.stockMovement.findMany({
            where: { siteId: { in: siteIds } },
            include: { material: { select: { id: true, name: true, unit: true, reorderLevel: true } } },
          })
        : Promise.resolve([]),
      siteIds.length
        ? prisma.attendance.count({
            where: { siteId: { in: siteIds }, date: { gte: startOfToday(), lte: endOfToday() }, present: true },
          })
        : Promise.resolve(0),
      siteIds.length
        ? prisma.siteIssue.count({ where: { siteId: { in: siteIds }, status: "OPEN" } })
        : Promise.resolve(0),
      siteIds.length
        ? prisma.safetyIncident.count({ where: { siteId: { in: siteIds }, status: { not: "CLOSED" } } })
        : Promise.resolve(0),
      siteIds.length
        ? prisma.inspection.count({ where: { siteId: { in: siteIds }, result: "PENDING" } })
        : Promise.resolve(0),
    ]);

    // Progress: simple average of activity completion across the whole project.
    const overallProgress = activities.length
      ? Math.round(activities.reduce((sum, a) => sum + a.percentComplete, 0) / activities.length)
      : null;

    // Finance
    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const budget = project.budget ? Number(project.budget) : null;

    // Vendor outstanding — only bills attributable to this project via a PO.
    let vendorOutstanding = 0;
    for (const po of purchaseOrders) {
      for (const bill of po.bills) {
        const paid = bill.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        vendorOutstanding += Math.max(0, Number(bill.amount) - paid);
      }
    }

    // Material stock — balance per material across this project's sites.
    const byMaterial = new Map<string, { name: string; unit: string; reorderLevel: number; balance: number }>();
    for (const mv of stockMovements) {
      const entry =
        byMaterial.get(mv.materialId) ??
        {
          name: mv.material.name,
          unit: mv.material.unit,
          reorderLevel: mv.material.reorderLevel,
          balance: 0,
        };
      entry.balance += signedQuantity(mv.type, mv.quantity);
      byMaterial.set(mv.materialId, entry);
    }
    const lowStockMaterials = Array.from(byMaterial.values()).filter((m) => m.balance <= m.reorderLevel);

    res.json({
      project: { id: project.id, name: project.name, code: project.code, status: project.status },
      progress: { overallPercent: overallProgress, activityCount: activities.length },
      finance: {
        budget,
        totalSpent,
        variance: budget !== null ? budget - totalSpent : null,
        percentUsed: budget ? Math.round((totalSpent / budget) * 100) : null,
      },
      vendorOutstanding,
      purchaseOrderCount: purchaseOrders.length,
      material: {
        lowStockCount: lowStockMaterials.length,
        lowStockMaterials: lowStockMaterials.slice(0, 10),
      },
      labor: { presentToday: todayAttendance },
      quality: { openSiteIssues: openIssues, openSafetyIncidents, pendingInspections },
    });
  })
);

// ============================================================================
// Portfolio report — every project, one row each, for the company dashboard
// ============================================================================

router.get(
  "/reports/portfolio",
  asyncHandler(async (req, res) => {
    const companyId = req.user!.companyId;
    const projects = await prisma.project.findMany({
      where: { companyId },
      select: { id: true, name: true, code: true, status: true, budget: true },
    });

    const [expenseTotals, activityRows, siteRows] = await Promise.all([
      prisma.expense.groupBy({
        by: ["projectId"],
        where: { project: { companyId } },
        _sum: { amount: true },
      }),
      prisma.activity.findMany({
        where: { workPackage: { project: { companyId } } },
        select: { percentComplete: true, workPackage: { select: { projectId: true } } },
      }),
      prisma.site.findMany({ where: { project: { companyId } }, select: { id: true, projectId: true } }),
    ]);

    const spentByProject = new Map(expenseTotals.map((e) => [e.projectId, Number(e._sum.amount ?? 0)]));

    const progressByProject = new Map<string, { sum: number; count: number }>();
    for (const a of activityRows) {
      const pid = a.workPackage.projectId;
      const entry = progressByProject.get(pid) ?? { sum: 0, count: 0 };
      entry.sum += a.percentComplete;
      entry.count += 1;
      progressByProject.set(pid, entry);
    }

    const siteCountByProject = new Map<string, number>();
    for (const s of siteRows) {
      siteCountByProject.set(s.projectId, (siteCountByProject.get(s.projectId) ?? 0) + 1);
    }

    const result = projects.map((p) => {
      const totalSpent = spentByProject.get(p.id) ?? 0;
      const budget = p.budget ? Number(p.budget) : null;
      const progress = progressByProject.get(p.id);
      return {
        projectId: p.id,
        projectName: p.name,
        projectCode: p.code,
        status: p.status,
        siteCount: siteCountByProject.get(p.id) ?? 0,
        overallPercent: progress ? Math.round(progress.sum / progress.count) : null,
        budget,
        totalSpent,
        variance: budget !== null ? budget - totalSpent : null,
      };
    });

    res.json(result);
  })
);

export default router;
