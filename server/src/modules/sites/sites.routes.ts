import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/db";
import { asyncHandler, ApiError } from "@/middleware/errorHandler";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();
router.use(requireAuth);

async function assertProjectInCompany(projectId: string, companyId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, companyId } });
  if (!project) throw new ApiError(404, "Project not found");
}

// ---- Sites -----------------------------------------------------------

router.get(
  "/projects/:projectId/sites",
  asyncHandler(async (req, res) => {
    await assertProjectInCompany(req.params.projectId, req.user!.companyId);
    const sites = await prisma.site.findMany({
      where: { projectId: req.params.projectId },
      include: { _count: { select: { buildings: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(sites);
  })
);

router.get(
  "/sites/:id",
  asyncHandler(async (req, res) => {
    const site = await prisma.site.findFirst({
      where: { id: req.params.id, project: { companyId: req.user!.companyId } },
      include: { buildings: { include: { floors: { include: { units: true } } } } },
    });
    if (!site) throw new ApiError(404, "Site not found");
    res.json(site);
  })
);

const siteSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

router.post(
  "/projects/:projectId/sites",
  requireRole("ADMIN", "PROJECT_MANAGER"),
  asyncHandler(async (req, res) => {
    await assertProjectInCompany(req.params.projectId, req.user!.companyId);
    const data = siteSchema.parse(req.body);
    const site = await prisma.site.create({
      data: { ...data, projectId: req.params.projectId },
    });
    res.status(201).json(site);
  })
);

router.patch(
  "/sites/:id",
  requireRole("ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER"),
  asyncHandler(async (req, res) => {
    const data = siteSchema.partial().parse(req.body);
    const existing = await prisma.site.findFirst({
      where: { id: req.params.id, project: { companyId: req.user!.companyId } },
    });
    if (!existing) throw new ApiError(404, "Site not found");
    const site = await prisma.site.update({ where: { id: existing.id }, data });
    res.json(site);
  })
);

router.delete(
  "/sites/:id",
  requireRole("ADMIN", "PROJECT_MANAGER"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.site.findFirst({
      where: { id: req.params.id, project: { companyId: req.user!.companyId } },
    });
    if (!existing) throw new ApiError(404, "Site not found");
    await prisma.site.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

// ---- Buildings ---------------------------------------------------------

const buildingSchema = z.object({ name: z.string().min(1) });

router.post(
  "/sites/:siteId/buildings",
  requireRole("ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER"),
  asyncHandler(async (req, res) => {
    const site = await prisma.site.findFirst({
      where: { id: req.params.siteId, project: { companyId: req.user!.companyId } },
    });
    if (!site) throw new ApiError(404, "Site not found");
    const data = buildingSchema.parse(req.body);
    const building = await prisma.building.create({ data: { ...data, siteId: site.id } });
    res.status(201).json(building);
  })
);

// ---- Floors -----------------------------------------------------------

const floorSchema = z.object({ name: z.string().min(1), levelOrder: z.number().optional() });

router.post(
  "/buildings/:buildingId/floors",
  requireRole("ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER"),
  asyncHandler(async (req, res) => {
    const building = await prisma.building.findFirst({
      where: { id: req.params.buildingId, site: { project: { companyId: req.user!.companyId } } },
    });
    if (!building) throw new ApiError(404, "Building not found");
    const data = floorSchema.parse(req.body);
    const floor = await prisma.floor.create({ data: { ...data, buildingId: building.id } });
    res.status(201).json(floor);
  })
);

// ---- Units --------------------------------------------------------------

const unitSchema = z.object({
  name: z.string().min(1),
  areaSqft: z.number().optional(),
  unitType: z.string().optional(),
  status: z.string().optional(),
});

router.post(
  "/floors/:floorId/units",
  requireRole("ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER"),
  asyncHandler(async (req, res) => {
    const floor = await prisma.floor.findFirst({
      where: {
        id: req.params.floorId,
        building: { site: { project: { companyId: req.user!.companyId } } },
      },
    });
    if (!floor) throw new ApiError(404, "Floor not found");
    const data = unitSchema.parse(req.body);
    const unit = await prisma.unit.create({ data: { ...data, floorId: floor.id } });
    res.status(201).json(unit);
  })
);

export default router;
