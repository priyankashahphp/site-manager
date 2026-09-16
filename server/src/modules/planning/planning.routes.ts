import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/db";
import { asyncHandler, ApiError } from "@/middleware/errorHandler";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();
router.use(requireAuth);

const PLANNERS = ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER"] as const;

async function assertProjectInCompany(projectId: string, companyId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, companyId } });
  if (!project) throw new ApiError(404, "Project not found");
}

async function getWorkPackageInCompany(workPackageId: string, companyId: string) {
  const wp = await prisma.workPackage.findFirst({
    where: { id: workPackageId, project: { companyId } },
  });
  if (!wp) throw new ApiError(404, "Work package not found");
  return wp;
}

// ============================================================================
// Project Requirements
// ============================================================================

router.get(
  "/projects/:projectId/requirements",
  asyncHandler(async (req, res) => {
    await assertProjectInCompany(req.params.projectId, req.user!.companyId);
    const requirements = await prisma.projectRequirement.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { createdAt: "desc" },
    });
    res.json(requirements);
  })
);

const requirementSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
});

router.post(
  "/projects/:projectId/requirements",
  requireRole(...PLANNERS),
  asyncHandler(async (req, res) => {
    await assertProjectInCompany(req.params.projectId, req.user!.companyId);
    const data = requirementSchema.parse(req.body);
    const requirement = await prisma.projectRequirement.create({
      data: { ...data, projectId: req.params.projectId },
    });
    res.status(201).json(requirement);
  })
);

router.delete(
  "/requirements/:id",
  requireRole(...PLANNERS),
  asyncHandler(async (req, res) => {
    const existing = await prisma.projectRequirement.findFirst({
      where: { id: req.params.id, project: { companyId: req.user!.companyId } },
    });
    if (!existing) throw new ApiError(404, "Requirement not found");
    await prisma.projectRequirement.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

// ============================================================================
// Work Packages
// ============================================================================

router.get(
  "/projects/:projectId/work-packages",
  asyncHandler(async (req, res) => {
    await assertProjectInCompany(req.params.projectId, req.user!.companyId);
    const workPackages = await prisma.workPackage.findMany({
      where: { projectId: req.params.projectId },
      include: {
        _count: {
          select: {
            activities: true,
            boqItems: true,
            materialRequirements: true,
            laborRequirements: true,
            equipmentRequirements: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(workPackages);
  })
);

router.get(
  "/work-packages/:id",
  asyncHandler(async (req, res) => {
    const wp = await prisma.workPackage.findFirst({
      where: { id: req.params.id, project: { companyId: req.user!.companyId } },
      include: {
        activities: true,
        boqItems: true,
        materialRequirements: { include: { material: { select: { id: true, name: true } } } },
        laborRequirements: true,
        equipmentRequirements: true,
      },
    });
    if (!wp) throw new ApiError(404, "Work package not found");
    res.json(wp);
  })
);

const workPackageSchema = z.object({
  name: z.string().min(2),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ON_HOLD"]).optional(),
});

router.post(
  "/projects/:projectId/work-packages",
  requireRole(...PLANNERS),
  asyncHandler(async (req, res) => {
    await assertProjectInCompany(req.params.projectId, req.user!.companyId);
    const data = workPackageSchema.parse(req.body);
    const wp = await prisma.workPackage.create({
      data: {
        name: data.name,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        projectId: req.params.projectId,
      },
    });
    res.status(201).json(wp);
  })
);

router.patch(
  "/work-packages/:id",
  requireRole(...PLANNERS),
  asyncHandler(async (req, res) => {
    const data = workPackageSchema.partial().parse(req.body);
    await getWorkPackageInCompany(req.params.id, req.user!.companyId);
    const wp = await prisma.workPackage.update({
      where: { id: req.params.id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
    res.json(wp);
  })
);

router.delete(
  "/work-packages/:id",
  requireRole(...PLANNERS),
  asyncHandler(async (req, res) => {
    await getWorkPackageInCompany(req.params.id, req.user!.companyId);
    await prisma.workPackage.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

// ============================================================================
// Activities
// ============================================================================

const activitySchema = z.object({
  name: z.string().min(2),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ON_HOLD"]).optional(),
  percentComplete: z.number().min(0).max(100).optional(),
});

router.post(
  "/work-packages/:workPackageId/activities",
  requireRole(...PLANNERS),
  asyncHandler(async (req, res) => {
    await getWorkPackageInCompany(req.params.workPackageId, req.user!.companyId);
    const data = activitySchema.parse(req.body);
    const activity = await prisma.activity.create({
      data: {
        name: data.name,
        status: data.status,
        percentComplete: data.percentComplete,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        workPackageId: req.params.workPackageId,
      },
    });
    res.status(201).json(activity);
  })
);

router.patch(
  "/activities/:id",
  requireRole("ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "SITE_SUPERVISOR"),
  asyncHandler(async (req, res) => {
    const data = activitySchema.partial().parse(req.body);
    const existing = await prisma.activity.findFirst({
      where: { id: req.params.id, workPackage: { project: { companyId: req.user!.companyId } } },
    });
    if (!existing) throw new ApiError(404, "Activity not found");
    const activity = await prisma.activity.update({
      where: { id: existing.id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
    res.json(activity);
  })
);

router.delete(
  "/activities/:id",
  requireRole(...PLANNERS),
  asyncHandler(async (req, res) => {
    const existing = await prisma.activity.findFirst({
      where: { id: req.params.id, workPackage: { project: { companyId: req.user!.companyId } } },
    });
    if (!existing) throw new ApiError(404, "Activity not found");
    await prisma.activity.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

// ============================================================================
// BOQ Items
// ============================================================================

const boqSchema = z.object({
  itemCode: z.string().optional(),
  description: z.string().min(2),
  unit: z.string().min(1),
  quantity: z.number().positive(),
  rate: z.number().nonnegative(),
});

router.post(
  "/work-packages/:workPackageId/boq",
  requireRole(...PLANNERS),
  asyncHandler(async (req, res) => {
    await getWorkPackageInCompany(req.params.workPackageId, req.user!.companyId);
    const data = boqSchema.parse(req.body);
    const item = await prisma.boqItem.create({
      data: { ...data, workPackageId: req.params.workPackageId },
    });
    res.status(201).json(item);
  })
);

router.delete(
  "/boq/:id",
  requireRole(...PLANNERS),
  asyncHandler(async (req, res) => {
    const existing = await prisma.boqItem.findFirst({
      where: { id: req.params.id, workPackage: { project: { companyId: req.user!.companyId } } },
    });
    if (!existing) throw new ApiError(404, "BOQ item not found");
    await prisma.boqItem.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

// ============================================================================
// Material Requirements
// ============================================================================

const materialReqSchema = z.object({
  materialName: z.string().min(2),
  materialId: z.string().optional(),
  unit: z.string().min(1),
  quantity: z.number().positive(),
  neededBy: z.string().datetime().optional(),
  status: z.enum(["PLANNED", "ORDERED", "PARTIALLY_FULFILLED", "FULFILLED"]).optional(),
});

router.post(
  "/work-packages/:workPackageId/material-requirements",
  requireRole(...PLANNERS, "STORE_MANAGER"),
  asyncHandler(async (req, res) => {
    await getWorkPackageInCompany(req.params.workPackageId, req.user!.companyId);
    const data = materialReqSchema.parse(req.body);
    const item = await prisma.materialRequirement.create({
      data: {
        ...data,
        neededBy: data.neededBy ? new Date(data.neededBy) : undefined,
        workPackageId: req.params.workPackageId,
      },
    });
    res.status(201).json(item);
  })
);

router.patch(
  "/material-requirements/:id",
  requireRole(...PLANNERS, "STORE_MANAGER", "PURCHASE_MANAGER"),
  asyncHandler(async (req, res) => {
    const data = materialReqSchema.partial().parse(req.body);
    const existing = await prisma.materialRequirement.findFirst({
      where: { id: req.params.id, workPackage: { project: { companyId: req.user!.companyId } } },
    });
    if (!existing) throw new ApiError(404, "Material requirement not found");
    const item = await prisma.materialRequirement.update({
      where: { id: existing.id },
      data: { ...data, neededBy: data.neededBy ? new Date(data.neededBy) : undefined },
    });
    res.json(item);
  })
);

router.delete(
  "/material-requirements/:id",
  requireRole(...PLANNERS),
  asyncHandler(async (req, res) => {
    const existing = await prisma.materialRequirement.findFirst({
      where: { id: req.params.id, workPackage: { project: { companyId: req.user!.companyId } } },
    });
    if (!existing) throw new ApiError(404, "Material requirement not found");
    await prisma.materialRequirement.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

// ============================================================================
// Labor Requirements
// ============================================================================

const laborReqSchema = z.object({
  skill: z.string().min(2),
  headcount: z.number().int().positive(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  status: z.enum(["PLANNED", "ALLOCATED", "FULFILLED"]).optional(),
});

router.post(
  "/work-packages/:workPackageId/labor-requirements",
  requireRole(...PLANNERS),
  asyncHandler(async (req, res) => {
    await getWorkPackageInCompany(req.params.workPackageId, req.user!.companyId);
    const data = laborReqSchema.parse(req.body);
    const item = await prisma.laborRequirement.create({
      data: {
        ...data,
        fromDate: data.fromDate ? new Date(data.fromDate) : undefined,
        toDate: data.toDate ? new Date(data.toDate) : undefined,
        workPackageId: req.params.workPackageId,
      },
    });
    res.status(201).json(item);
  })
);

router.patch(
  "/labor-requirements/:id",
  requireRole(...PLANNERS),
  asyncHandler(async (req, res) => {
    const data = laborReqSchema.partial().parse(req.body);
    const existing = await prisma.laborRequirement.findFirst({
      where: { id: req.params.id, workPackage: { project: { companyId: req.user!.companyId } } },
    });
    if (!existing) throw new ApiError(404, "Labor requirement not found");
    const item = await prisma.laborRequirement.update({
      where: { id: existing.id },
      data: {
        ...data,
        fromDate: data.fromDate ? new Date(data.fromDate) : undefined,
        toDate: data.toDate ? new Date(data.toDate) : undefined,
      },
    });
    res.json(item);
  })
);

router.delete(
  "/labor-requirements/:id",
  requireRole(...PLANNERS),
  asyncHandler(async (req, res) => {
    const existing = await prisma.laborRequirement.findFirst({
      where: { id: req.params.id, workPackage: { project: { companyId: req.user!.companyId } } },
    });
    if (!existing) throw new ApiError(404, "Labor requirement not found");
    await prisma.laborRequirement.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

// ============================================================================
// Equipment Requirements
// ============================================================================

const equipmentReqSchema = z.object({
  equipmentType: z.string().min(2),
  count: z.number().int().positive(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  status: z.enum(["PLANNED", "ALLOCATED", "FULFILLED"]).optional(),
});

router.post(
  "/work-packages/:workPackageId/equipment-requirements",
  requireRole(...PLANNERS),
  asyncHandler(async (req, res) => {
    await getWorkPackageInCompany(req.params.workPackageId, req.user!.companyId);
    const data = equipmentReqSchema.parse(req.body);
    const item = await prisma.equipmentRequirement.create({
      data: {
        ...data,
        fromDate: data.fromDate ? new Date(data.fromDate) : undefined,
        toDate: data.toDate ? new Date(data.toDate) : undefined,
        workPackageId: req.params.workPackageId,
      },
    });
    res.status(201).json(item);
  })
);

router.patch(
  "/equipment-requirements/:id",
  requireRole(...PLANNERS),
  asyncHandler(async (req, res) => {
    const data = equipmentReqSchema.partial().parse(req.body);
    const existing = await prisma.equipmentRequirement.findFirst({
      where: { id: req.params.id, workPackage: { project: { companyId: req.user!.companyId } } },
    });
    if (!existing) throw new ApiError(404, "Equipment requirement not found");
    const item = await prisma.equipmentRequirement.update({
      where: { id: existing.id },
      data: {
        ...data,
        fromDate: data.fromDate ? new Date(data.fromDate) : undefined,
        toDate: data.toDate ? new Date(data.toDate) : undefined,
      },
    });
    res.json(item);
  })
);

router.delete(
  "/equipment-requirements/:id",
  requireRole(...PLANNERS),
  asyncHandler(async (req, res) => {
    const existing = await prisma.equipmentRequirement.findFirst({
      where: { id: req.params.id, workPackage: { project: { companyId: req.user!.companyId } } },
    });
    if (!existing) throw new ApiError(404, "Equipment requirement not found");
    await prisma.equipmentRequirement.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

export default router;
