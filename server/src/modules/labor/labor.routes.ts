import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/db";
import { asyncHandler, ApiError } from "@/middleware/errorHandler";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();
router.use(requireAuth);

const LABOR_MANAGERS = ["ADMIN", "PROJECT_MANAGER", "SITE_SUPERVISOR", "SITE_ENGINEER"] as const;

// ============================================================================
// Contractors
// ============================================================================

router.get(
  "/contractors",
  asyncHandler(async (req, res) => {
    const contractors = await prisma.contractor.findMany({
      where: { companyId: req.user!.companyId },
      include: { _count: { select: { laborGroups: true } } },
      orderBy: { name: "asc" },
    });
    res.json(contractors);
  })
);

const contractorSchema = z.object({ name: z.string().min(2), phone: z.string().optional() });

router.post(
  "/contractors",
  requireRole(...LABOR_MANAGERS),
  asyncHandler(async (req, res) => {
    const data = contractorSchema.parse(req.body);
    const contractor = await prisma.contractor.create({
      data: { ...data, companyId: req.user!.companyId },
    });
    res.status(201).json(contractor);
  })
);

// ============================================================================
// Labor Groups
// ============================================================================

router.get(
  "/labor-groups",
  asyncHandler(async (req, res) => {
    const groups = await prisma.laborGroup.findMany({
      where: { companyId: req.user!.companyId },
      include: { contractor: { select: { id: true, name: true } }, _count: { select: { laborers: true } } },
      orderBy: { name: "asc" },
    });
    res.json(groups);
  })
);

const groupSchema = z.object({ name: z.string().min(2), contractorId: z.string().optional() });

router.post(
  "/labor-groups",
  requireRole(...LABOR_MANAGERS),
  asyncHandler(async (req, res) => {
    const data = groupSchema.parse(req.body);
    if (data.contractorId) {
      const contractor = await prisma.contractor.findFirst({
        where: { id: data.contractorId, companyId: req.user!.companyId },
      });
      if (!contractor) throw new ApiError(404, "Contractor not found");
    }
    const group = await prisma.laborGroup.create({
      data: { ...data, companyId: req.user!.companyId },
    });
    res.status(201).json(group);
  })
);

// ============================================================================
// Labor Roster
// ============================================================================

router.get(
  "/labor",
  asyncHandler(async (req, res) => {
    const labor = await prisma.labor.findMany({
      where: { companyId: req.user!.companyId },
      include: { laborGroup: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });
    res.json(labor);
  })
);

router.get(
  "/labor/:id",
  asyncHandler(async (req, res) => {
    const labor = await prisma.labor.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include: {
        laborGroup: { select: { id: true, name: true } },
        payments: { orderBy: { paidAt: "desc" } },
        attendance: { orderBy: { date: "desc" }, take: 30 },
      },
    });
    if (!labor) throw new ApiError(404, "Labor not found");
    res.json(labor);
  })
);

const laborSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  dailyWage: z.number().nonnegative(),
  skill: z.string().optional(),
  laborGroupId: z.string().optional(),
});

router.post(
  "/labor",
  requireRole(...LABOR_MANAGERS),
  asyncHandler(async (req, res) => {
    const data = laborSchema.parse(req.body);
    if (data.laborGroupId) {
      const group = await prisma.laborGroup.findFirst({
        where: { id: data.laborGroupId, companyId: req.user!.companyId },
      });
      if (!group) throw new ApiError(404, "Labor group not found");
    }
    const labor = await prisma.labor.create({
      data: { ...data, companyId: req.user!.companyId },
    });
    res.status(201).json(labor);
  })
);

// ============================================================================
// Attendance — recorded per site, per labor, per date
// ============================================================================

router.get(
  "/sites/:siteId/attendance",
  asyncHandler(async (req, res) => {
    const site = await prisma.site.findFirst({
      where: { id: req.params.siteId, project: { companyId: req.user!.companyId } },
    });
    if (!site) throw new ApiError(404, "Site not found");

    const dateParam = req.query.date as string | undefined;
    const records = await prisma.attendance.findMany({
      where: {
        siteId: site.id,
        date: dateParam ? new Date(dateParam) : undefined,
      },
      include: { labor: { select: { id: true, name: true, dailyWage: true, skill: true } } },
      orderBy: { date: "desc" },
    });
    res.json(records);
  })
);

const attendanceSchema = z.object({
  laborId: z.string(),
  date: z.string().datetime(),
  present: z.boolean().optional(),
  overtimeHours: z.number().nonnegative().optional(),
});

router.post(
  "/sites/:siteId/attendance",
  requireRole(...LABOR_MANAGERS),
  asyncHandler(async (req, res) => {
    const site = await prisma.site.findFirst({
      where: { id: req.params.siteId, project: { companyId: req.user!.companyId } },
    });
    if (!site) throw new ApiError(404, "Site not found");

    const data = attendanceSchema.parse(req.body);
    const labor = await prisma.labor.findFirst({
      where: { id: data.laborId, companyId: req.user!.companyId },
    });
    if (!labor) throw new ApiError(404, "Labor not found");

    // One attendance record per labor per date — upsert so re-marking a day updates it.
    const record = await prisma.attendance.upsert({
      where: { laborId_date: { laborId: data.laborId, date: new Date(data.date) } },
      create: {
        laborId: data.laborId,
        siteId: site.id,
        date: new Date(data.date),
        present: data.present ?? true,
        overtimeHours: data.overtimeHours ?? 0,
      },
      update: {
        siteId: site.id,
        present: data.present ?? true,
        overtimeHours: data.overtimeHours ?? 0,
      },
    });
    res.status(201).json(record);
  })
);

// ============================================================================
// Labor Payments (wages, advances, overtime)
// ============================================================================

const paymentSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["WAGE", "ADVANCE", "OVERTIME"]).optional(),
});

router.post(
  "/labor/:laborId/payments",
  requireRole("ADMIN", "ACCOUNTANT", "SITE_SUPERVISOR"),
  asyncHandler(async (req, res) => {
    const labor = await prisma.labor.findFirst({
      where: { id: req.params.laborId, companyId: req.user!.companyId },
    });
    if (!labor) throw new ApiError(404, "Labor not found");
    const data = paymentSchema.parse(req.body);
    const payment = await prisma.laborPayment.create({
      data: { ...data, laborId: labor.id },
    });
    res.status(201).json(payment);
  })
);

export default router;
