import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/db";
import { asyncHandler, ApiError } from "@/middleware/errorHandler";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();
router.use(requireAuth);

const QA_ROLES = ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "SITE_SUPERVISOR"] as const;

async function getSiteInCompany(siteId: string, companyId: string) {
  const site = await prisma.site.findFirst({ where: { id: siteId, project: { companyId } } });
  if (!site) throw new ApiError(404, "Site not found");
  return site;
}

// ============================================================================
// Inspections
// ============================================================================

router.get(
  "/sites/:siteId/inspections",
  asyncHandler(async (req, res) => {
    const site = await getSiteInCompany(req.params.siteId, req.user!.companyId);
    const inspections = await prisma.inspection.findMany({
      where: { siteId: site.id },
      include: {
        inspectedBy: { select: { id: true, name: true } },
        _count: { select: { checklistItems: true, defects: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(inspections);
  })
);

router.get(
  "/inspections/:id",
  asyncHandler(async (req, res) => {
    const inspection = await prisma.inspection.findFirst({
      where: { id: req.params.id, site: { project: { companyId: req.user!.companyId } } },
      include: {
        inspectedBy: { select: { id: true, name: true } },
        checklistItems: true,
        defects: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!inspection) throw new ApiError(404, "Inspection not found");
    res.json(inspection);
  })
);

const inspectionSchema = z.object({
  title: z.string().min(2),
  checklistLabels: z.array(z.string().min(1)).optional(),
});

router.post(
  "/sites/:siteId/inspections",
  requireRole(...QA_ROLES),
  asyncHandler(async (req, res) => {
    const site = await getSiteInCompany(req.params.siteId, req.user!.companyId);
    const data = inspectionSchema.parse(req.body);

    const inspection = await prisma.inspection.create({
      data: {
        title: data.title,
        siteId: site.id,
        inspectedById: req.user!.userId,
        checklistItems: data.checklistLabels
          ? { create: data.checklistLabels.map((label) => ({ label })) }
          : undefined,
      },
      include: { checklistItems: true },
    });
    res.status(201).json(inspection);
  })
);

const inspectionUpdateSchema = z.object({
  result: z.enum(["PENDING", "PASSED", "FAILED"]).optional(),
  notes: z.string().optional(),
});

router.patch(
  "/inspections/:id",
  requireRole(...QA_ROLES),
  asyncHandler(async (req, res) => {
    const existing = await prisma.inspection.findFirst({
      where: { id: req.params.id, site: { project: { companyId: req.user!.companyId } } },
    });
    if (!existing) throw new ApiError(404, "Inspection not found");
    const data = inspectionUpdateSchema.parse(req.body);
    const inspection = await prisma.inspection.update({ where: { id: existing.id }, data });
    res.json(inspection);
  })
);

router.patch(
  "/checklist-items/:id",
  requireRole(...QA_ROLES),
  asyncHandler(async (req, res) => {
    const existing = await prisma.inspectionChecklistItem.findFirst({
      where: {
        id: req.params.id,
        inspection: { site: { project: { companyId: req.user!.companyId } } },
      },
    });
    if (!existing) throw new ApiError(404, "Checklist item not found");
    const data = z.object({ passed: z.boolean() }).parse(req.body);
    const item = await prisma.inspectionChecklistItem.update({
      where: { id: existing.id },
      data,
    });
    res.json(item);
  })
);

const defectSchema = z.object({ description: z.string().min(2) });

router.post(
  "/inspections/:inspectionId/defects",
  requireRole(...QA_ROLES),
  asyncHandler(async (req, res) => {
    const inspection = await prisma.inspection.findFirst({
      where: { id: req.params.inspectionId, site: { project: { companyId: req.user!.companyId } } },
    });
    if (!inspection) throw new ApiError(404, "Inspection not found");
    const data = defectSchema.parse(req.body);
    const defect = await prisma.defect.create({
      data: { ...data, inspectionId: inspection.id },
    });
    res.status(201).json(defect);
  })
);

router.patch(
  "/defects/:id",
  requireRole(...QA_ROLES),
  asyncHandler(async (req, res) => {
    const existing = await prisma.defect.findFirst({
      where: {
        id: req.params.id,
        inspection: { site: { project: { companyId: req.user!.companyId } } },
      },
    });
    if (!existing) throw new ApiError(404, "Defect not found");
    const data = z.object({ status: z.enum(["OPEN", "IN_REWORK", "RESOLVED"]) }).parse(req.body);
    const defect = await prisma.defect.update({ where: { id: existing.id }, data });
    res.json(defect);
  })
);

// ============================================================================
// Safety Incidents
// ============================================================================

router.get(
  "/sites/:siteId/safety-incidents",
  asyncHandler(async (req, res) => {
    const site = await getSiteInCompany(req.params.siteId, req.user!.companyId);
    const incidents = await prisma.safetyIncident.findMany({
      where: { siteId: site.id },
      include: { reportedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(incidents);
  })
);

const incidentSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
});

router.post(
  "/sites/:siteId/safety-incidents",
  requireRole(...QA_ROLES),
  asyncHandler(async (req, res) => {
    const site = await getSiteInCompany(req.params.siteId, req.user!.companyId);
    const data = incidentSchema.parse(req.body);
    const incident = await prisma.safetyIncident.create({
      data: { ...data, siteId: site.id, reportedById: req.user!.userId },
    });
    res.status(201).json(incident);
  })
);

router.patch(
  "/safety-incidents/:id",
  requireRole(...QA_ROLES),
  asyncHandler(async (req, res) => {
    const existing = await prisma.safetyIncident.findFirst({
      where: { id: req.params.id, site: { project: { companyId: req.user!.companyId } } },
    });
    if (!existing) throw new ApiError(404, "Safety incident not found");
    const data = z.object({ status: z.enum(["OPEN", "INVESTIGATING", "CLOSED"]) }).parse(req.body);
    const incident = await prisma.safetyIncident.update({ where: { id: existing.id }, data });
    res.json(incident);
  })
);

// ============================================================================
// Safety Checklist — a standing, reusable checklist per site
// ============================================================================

router.get(
  "/sites/:siteId/safety-checklist",
  asyncHandler(async (req, res) => {
    const site = await getSiteInCompany(req.params.siteId, req.user!.companyId);
    const items = await prisma.safetyChecklistItem.findMany({
      where: { siteId: site.id },
      orderBy: { label: "asc" },
    });
    res.json(items);
  })
);

const checklistItemSchema = z.object({ label: z.string().min(2) });

router.post(
  "/sites/:siteId/safety-checklist",
  requireRole(...QA_ROLES),
  asyncHandler(async (req, res) => {
    const site = await getSiteInCompany(req.params.siteId, req.user!.companyId);
    const data = checklistItemSchema.parse(req.body);
    const item = await prisma.safetyChecklistItem.create({ data: { ...data, siteId: site.id } });
    res.status(201).json(item);
  })
);

router.patch(
  "/safety-checklist/:id",
  requireRole(...QA_ROLES),
  asyncHandler(async (req, res) => {
    const existing = await prisma.safetyChecklistItem.findFirst({
      where: { id: req.params.id, site: { project: { companyId: req.user!.companyId } } },
    });
    if (!existing) throw new ApiError(404, "Checklist item not found");
    const data = z.object({ checked: z.boolean() }).parse(req.body);
    const item = await prisma.safetyChecklistItem.update({
      where: { id: existing.id },
      data: { checked: data.checked, checkedAt: data.checked ? new Date() : null },
    });
    res.json(item);
  })
);

export default router;
