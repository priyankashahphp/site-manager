import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/db";
import { asyncHandler, ApiError } from "@/middleware/errorHandler";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();
router.use(requireAuth);

const EQUIPMENT_MANAGERS = ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "SITE_SUPERVISOR"] as const;

// ============================================================================
// Equipment master
// ============================================================================

router.get(
  "/equipment",
  asyncHandler(async (req, res) => {
    const equipment = await prisma.equipment.findMany({
      where: { companyId: req.user!.companyId },
      include: { _count: { select: { usage: true, maintenance: true } } },
      orderBy: { name: "asc" },
    });
    res.json(equipment);
  })
);

router.get(
  "/equipment/:id",
  asyncHandler(async (req, res) => {
    const equipment = await prisma.equipment.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include: {
        usage: { include: { site: { select: { id: true, name: true } } }, orderBy: { date: "desc" }, take: 50 },
        maintenance: { orderBy: { date: "desc" } },
      },
    });
    if (!equipment) throw new ApiError(404, "Equipment not found");
    res.json(equipment);
  })
);

const equipmentSchema = z.object({
  name: z.string().min(2),
  type: z.string().optional(),
  ownership: z.enum(["OWNED", "RENTED"]).optional(),
});

router.post(
  "/equipment",
  requireRole(...EQUIPMENT_MANAGERS),
  asyncHandler(async (req, res) => {
    const data = equipmentSchema.parse(req.body);
    const equipment = await prisma.equipment.create({
      data: { ...data, companyId: req.user!.companyId },
    });
    res.status(201).json(equipment);
  })
);

router.patch(
  "/equipment/:id",
  requireRole(...EQUIPMENT_MANAGERS),
  asyncHandler(async (req, res) => {
    const data = equipmentSchema.partial().parse(req.body);
    const existing = await prisma.equipment.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    });
    if (!existing) throw new ApiError(404, "Equipment not found");
    const equipment = await prisma.equipment.update({ where: { id: existing.id }, data });
    res.json(equipment);
  })
);

// ============================================================================
// Equipment usage — logged per site, per date
// ============================================================================

router.get(
  "/sites/:siteId/equipment-usage",
  asyncHandler(async (req, res) => {
    const site = await prisma.site.findFirst({
      where: { id: req.params.siteId, project: { companyId: req.user!.companyId } },
    });
    if (!site) throw new ApiError(404, "Site not found");

    const usage = await prisma.equipmentUsage.findMany({
      where: { siteId: site.id },
      include: { equipment: { select: { id: true, name: true, ownership: true } } },
      orderBy: { date: "desc" },
      take: 100,
    });
    res.json(usage);
  })
);

const usageSchema = z.object({
  equipmentId: z.string(),
  date: z.string().datetime(),
  hoursUsed: z.number().positive(),
  fuelUsed: z.number().nonnegative().optional(),
  rentalCost: z.number().nonnegative().optional(),
});

router.post(
  "/sites/:siteId/equipment-usage",
  requireRole(...EQUIPMENT_MANAGERS),
  asyncHandler(async (req, res) => {
    const site = await prisma.site.findFirst({
      where: { id: req.params.siteId, project: { companyId: req.user!.companyId } },
    });
    if (!site) throw new ApiError(404, "Site not found");

    const data = usageSchema.parse(req.body);
    const equipment = await prisma.equipment.findFirst({
      where: { id: data.equipmentId, companyId: req.user!.companyId },
    });
    if (!equipment) throw new ApiError(404, "Equipment not found");

    const usage = await prisma.equipmentUsage.create({
      data: {
        ...data,
        date: new Date(data.date),
        siteId: site.id,
      },
    });
    res.status(201).json(usage);
  })
);

// ============================================================================
// Maintenance
// ============================================================================

const maintenanceSchema = z.object({
  date: z.string().datetime(),
  description: z.string().min(2),
  cost: z.number().nonnegative().optional(),
});

router.post(
  "/equipment/:equipmentId/maintenance",
  requireRole(...EQUIPMENT_MANAGERS),
  asyncHandler(async (req, res) => {
    const equipment = await prisma.equipment.findFirst({
      where: { id: req.params.equipmentId, companyId: req.user!.companyId },
    });
    if (!equipment) throw new ApiError(404, "Equipment not found");

    const data = maintenanceSchema.parse(req.body);
    const record = await prisma.equipmentMaintenance.create({
      data: { ...data, date: new Date(data.date), equipmentId: equipment.id },
    });
    res.status(201).json(record);
  })
);

export default router;
