import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/db";
import { asyncHandler, ApiError } from "@/middleware/errorHandler";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const projects = await prisma.project.findMany({
      where: { companyId: req.user!.companyId },
      include: {
        projectManager: { select: { id: true, name: true } },
        _count: { select: { sites: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(projects);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include: {
        projectManager: { select: { id: true, name: true } },
        sites: { include: { _count: { select: { buildings: true } } } },
        budgetLines: true,
      },
    });
    if (!project) throw new ApiError(404, "Project not found");
    res.json(project);
  })
);

const projectSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  projectManagerId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().optional(),
  address: z.string().optional(),
});

router.post(
  "/",
  requireRole("ADMIN", "PROJECT_MANAGER"),
  asyncHandler(async (req, res) => {
    const data = projectSchema.parse(req.body);
    const project = await prisma.project.create({
      data: {
        companyId: req.user!.companyId,
        name: data.name,
        code: data.code,
        description: data.description,
        status: data.status,
        projectManagerId: data.projectManagerId,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        budget: data.budget,
        address: data.address,
      },
    });
    res.status(201).json(project);
  })
);

router.patch(
  "/:id",
  requireRole("ADMIN", "PROJECT_MANAGER"),
  asyncHandler(async (req, res) => {
    const data = projectSchema.partial().parse(req.body);
    const existing = await prisma.project.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    });
    if (!existing) throw new ApiError(404, "Project not found");

    const project = await prisma.project.update({
      where: { id: existing.id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
    res.json(project);
  })
);

router.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.project.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    });
    if (!existing) throw new ApiError(404, "Project not found");
    await prisma.project.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

export default router;
