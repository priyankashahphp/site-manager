import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/db";
import { asyncHandler, ApiError } from "@/middleware/errorHandler";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();
router.use(requireAuth);

const SITE_WORK_ROLES = ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "SITE_SUPERVISOR"] as const;

async function getSiteInCompany(siteId: string, companyId: string) {
  const site = await prisma.site.findFirst({ where: { id: siteId, project: { companyId } } });
  if (!site) throw new ApiError(404, "Site not found");
  return site;
}

function startOfDay(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
}

// ============================================================================
// Daily Site Diary
// ============================================================================

router.get(
  "/sites/:siteId/diary",
  asyncHandler(async (req, res) => {
    const site = await getSiteInCompany(req.params.siteId, req.user!.companyId);
    const diaries = await prisma.dailySiteDiary.findMany({
      where: { siteId: site.id },
      include: { createdBy: { select: { id: true, name: true } }, _count: { select: { progress: true } } },
      orderBy: { date: "desc" },
      take: 60,
    });
    res.json(diaries);
  })
);

// A single day's full picture: diary + progress + who worked + material consumed + equipment used.
router.get(
  "/sites/:siteId/diary/:date",
  asyncHandler(async (req, res) => {
    const site = await getSiteInCompany(req.params.siteId, req.user!.companyId);
    const date = req.params.date;

    const [diary, attendance, consumption, equipmentUsage, photos, issues] = await Promise.all([
      prisma.dailySiteDiary.findFirst({
        where: { siteId: site.id, date: { gte: startOfDay(date), lte: endOfDay(date) } },
        include: {
          createdBy: { select: { id: true, name: true } },
          progress: { include: { activity: { select: { id: true, name: true } } } },
        },
      }),
      prisma.attendance.findMany({
        where: { siteId: site.id, date: { gte: startOfDay(date), lte: endOfDay(date) } },
        include: { labor: { select: { id: true, name: true, skill: true } } },
      }),
      prisma.stockMovement.findMany({
        where: {
          siteId: site.id,
          type: "CONSUMPTION",
          createdAt: { gte: startOfDay(date), lte: endOfDay(date) },
        },
        include: { material: { select: { id: true, name: true, unit: true } } },
      }),
      prisma.equipmentUsage.findMany({
        where: { siteId: site.id, date: { gte: startOfDay(date), lte: endOfDay(date) } },
        include: { equipment: { select: { id: true, name: true } } },
      }),
      prisma.sitePhoto.findMany({
        where: { siteId: site.id, takenAt: { gte: startOfDay(date), lte: endOfDay(date) } },
        orderBy: { takenAt: "desc" },
      }),
      prisma.siteIssue.findMany({
        where: { siteId: site.id, status: "OPEN" },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    res.json({ date, diary, attendance, materialConsumed: consumption, equipmentUsage, photos, openIssues: issues });
  })
);

const diarySchema = z.object({
  date: z.string().datetime(),
  weather: z.string().optional(),
  notes: z.string().optional(),
});

router.post(
  "/sites/:siteId/diary",
  requireRole(...SITE_WORK_ROLES),
  asyncHandler(async (req, res) => {
    const site = await getSiteInCompany(req.params.siteId, req.user!.companyId);
    const data = diarySchema.parse(req.body);

    // One diary entry per site per date — upsert so re-saving the same day updates it.
    const diary = await prisma.dailySiteDiary.upsert({
      where: { siteId_date: { siteId: site.id, date: new Date(data.date) } },
      create: {
        siteId: site.id,
        date: new Date(data.date),
        weather: data.weather,
        notes: data.notes,
        createdById: req.user!.userId,
      },
      update: { weather: data.weather, notes: data.notes },
    });
    res.status(201).json(diary);
  })
);

// ============================================================================
// Daily Progress
// ============================================================================

const progressSchema = z.object({
  description: z.string().min(2),
  percentComplete: z.number().min(0).max(100).optional(),
  activityId: z.string().optional(),
});

router.post(
  "/diary/:diaryId/progress",
  requireRole(...SITE_WORK_ROLES),
  asyncHandler(async (req, res) => {
    const diary = await prisma.dailySiteDiary.findFirst({
      where: { id: req.params.diaryId, site: { project: { companyId: req.user!.companyId } } },
    });
    if (!diary) throw new ApiError(404, "Diary entry not found");
    const data = progressSchema.parse(req.body);
    const progress = await prisma.dailyProgress.create({
      data: { ...data, diaryId: diary.id },
    });
    res.status(201).json(progress);
  })
);

// ============================================================================
// Site Photos
// ============================================================================

const photoSchema = z.object({ url: z.string().min(1), caption: z.string().optional() });

router.get(
  "/sites/:siteId/photos",
  asyncHandler(async (req, res) => {
    const site = await getSiteInCompany(req.params.siteId, req.user!.companyId);
    const photos = await prisma.sitePhoto.findMany({
      where: { siteId: site.id },
      orderBy: { takenAt: "desc" },
      take: 60,
    });
    res.json(photos);
  })
);

router.post(
  "/sites/:siteId/photos",
  requireRole(...SITE_WORK_ROLES),
  asyncHandler(async (req, res) => {
    const site = await getSiteInCompany(req.params.siteId, req.user!.companyId);
    const data = photoSchema.parse(req.body);
    const photo = await prisma.sitePhoto.create({ data: { ...data, siteId: site.id } });
    res.status(201).json(photo);
  })
);

// ============================================================================
// Site Issues
// ============================================================================

router.get(
  "/sites/:siteId/issues",
  asyncHandler(async (req, res) => {
    const site = await getSiteInCompany(req.params.siteId, req.user!.companyId);
    const issues = await prisma.siteIssue.findMany({
      where: { siteId: site.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(issues);
  })
);

const issueSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
});

router.post(
  "/sites/:siteId/issues",
  requireRole(...SITE_WORK_ROLES),
  asyncHandler(async (req, res) => {
    const site = await getSiteInCompany(req.params.siteId, req.user!.companyId);
    const data = issueSchema.parse(req.body);
    const issue = await prisma.siteIssue.create({ data: { ...data, siteId: site.id } });
    res.status(201).json(issue);
  })
);

const issueUpdateSchema = z.object({ status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]) });

router.patch(
  "/issues/:id",
  requireRole(...SITE_WORK_ROLES),
  asyncHandler(async (req, res) => {
    const existing = await prisma.siteIssue.findFirst({
      where: { id: req.params.id, site: { project: { companyId: req.user!.companyId } } },
    });
    if (!existing) throw new ApiError(404, "Issue not found");
    const data = issueUpdateSchema.parse(req.body);
    const issue = await prisma.siteIssue.update({ where: { id: existing.id }, data });
    res.json(issue);
  })
);

export default router;
