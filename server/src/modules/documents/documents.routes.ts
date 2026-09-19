import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/db";
import { asyncHandler, ApiError } from "@/middleware/errorHandler";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();
router.use(requireAuth);

const DOC_MANAGERS = ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "ACCOUNTANT", "PURCHASE_MANAGER"] as const;

router.get(
  "/projects/:projectId/documents",
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, companyId: req.user!.companyId },
    });
    if (!project) throw new ApiError(404, "Project not found");

    const typeFilter = req.query.type as string | undefined;
    const documents = await prisma.document.findMany({
      where: { projectId: project.id, type: typeFilter },
      orderBy: { uploadedAt: "desc" },
    });
    res.json(documents);
  })
);

const documentSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["DRAWING", "CONTRACT", "PURCHASE", "BILL", "PHOTO", "CERTIFICATE", "OTHER"]),
  url: z.string().min(1),
});

router.post(
  "/projects/:projectId/documents",
  requireRole(...DOC_MANAGERS),
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, companyId: req.user!.companyId },
    });
    if (!project) throw new ApiError(404, "Project not found");

    const data = documentSchema.parse(req.body);
    const document = await prisma.document.create({ data: { ...data, projectId: project.id } });
    res.status(201).json(document);
  })
);

router.delete(
  "/documents/:id",
  requireRole(...DOC_MANAGERS),
  asyncHandler(async (req, res) => {
    const existing = await prisma.document.findFirst({
      where: { id: req.params.id, project: { companyId: req.user!.companyId } },
    });
    if (!existing) throw new ApiError(404, "Document not found");
    await prisma.document.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

export default router;
