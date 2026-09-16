import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/db";
import { asyncHandler, ApiError } from "@/middleware/errorHandler";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();
router.use(requireAuth);

const STOCK_MANAGERS = ["ADMIN", "STORE_MANAGER", "PURCHASE_MANAGER"] as const;

/** Signed effect of a movement on stock balance. Transfers reduce the recording
 *  site's balance; complete the other side with a matching INWARD entry there. */
function signedQuantity(type: string, quantity: number) {
  if (type === "INWARD") return quantity;
  if (type === "ADJUSTMENT") return quantity; // caller may pass a negative correction
  return -Math.abs(quantity); // OUTWARD, CONSUMPTION, TRANSFER
}

// ============================================================================
// Material Categories
// ============================================================================

router.get(
  "/material-categories",
  asyncHandler(async (req, res) => {
    const categories = await prisma.materialCategory.findMany({
      where: { companyId: req.user!.companyId },
      include: { _count: { select: { materials: true } } },
      orderBy: { name: "asc" },
    });
    res.json(categories);
  })
);

const categorySchema = z.object({ name: z.string().min(2) });

router.post(
  "/material-categories",
  requireRole(...STOCK_MANAGERS),
  asyncHandler(async (req, res) => {
    const data = categorySchema.parse(req.body);
    const category = await prisma.materialCategory.create({
      data: { ...data, companyId: req.user!.companyId },
    });
    res.status(201).json(category);
  })
);

// ============================================================================
// Materials
// ============================================================================

router.get(
  "/materials",
  asyncHandler(async (req, res) => {
    const materials = await prisma.material.findMany({
      where: { category: { companyId: req.user!.companyId } },
      include: { category: { select: { id: true, name: true } }, stockMoves: true },
      orderBy: { name: "asc" },
    });

    const result = materials.map((m) => {
      const balance = m.stockMoves.reduce(
        (sum, mv) => sum + signedQuantity(mv.type, mv.quantity),
        0
      );
      const { stockMoves, ...rest } = m;
      return { ...rest, balance, lowStock: balance <= m.reorderLevel };
    });

    res.json(result);
  })
);

const materialSchema = z.object({
  categoryId: z.string(),
  name: z.string().min(2),
  unit: z.string().min(1),
  reorderLevel: z.number().nonnegative().optional(),
});

router.post(
  "/materials",
  requireRole(...STOCK_MANAGERS),
  asyncHandler(async (req, res) => {
    const data = materialSchema.parse(req.body);
    const category = await prisma.materialCategory.findFirst({
      where: { id: data.categoryId, companyId: req.user!.companyId },
    });
    if (!category) throw new ApiError(404, "Material category not found");
    const material = await prisma.material.create({ data });
    res.status(201).json(material);
  })
);

// ============================================================================
// Stock — per-site balances and movements
// ============================================================================

router.get(
  "/sites/:siteId/stock",
  asyncHandler(async (req, res) => {
    const site = await prisma.site.findFirst({
      where: { id: req.params.siteId, project: { companyId: req.user!.companyId } },
    });
    if (!site) throw new ApiError(404, "Site not found");

    const movements = await prisma.stockMovement.findMany({
      where: { siteId: site.id },
      include: { material: { include: { category: { select: { name: true } } } } },
    });

    const byMaterial = new Map<
      string,
      { material: (typeof movements)[number]["material"]; balance: number }
    >();
    for (const mv of movements) {
      const entry = byMaterial.get(mv.materialId) ?? { material: mv.material, balance: 0 };
      entry.balance += signedQuantity(mv.type, mv.quantity);
      byMaterial.set(mv.materialId, entry);
    }

    const result = Array.from(byMaterial.values()).map(({ material, balance }) => ({
      materialId: material.id,
      name: material.name,
      unit: material.unit,
      category: material.category.name,
      reorderLevel: material.reorderLevel,
      balance,
      lowStock: balance <= material.reorderLevel,
    }));

    res.json(result.sort((a, b) => a.name.localeCompare(b.name)));
  })
);

router.get(
  "/sites/:siteId/stock-movements",
  asyncHandler(async (req, res) => {
    const site = await prisma.site.findFirst({
      where: { id: req.params.siteId, project: { companyId: req.user!.companyId } },
    });
    if (!site) throw new ApiError(404, "Site not found");

    const movements = await prisma.stockMovement.findMany({
      where: { siteId: site.id },
      include: { material: { select: { id: true, name: true, unit: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json(movements);
  })
);

const movementSchema = z.object({
  materialId: z.string(),
  type: z.enum(["INWARD", "OUTWARD", "TRANSFER", "ADJUSTMENT", "CONSUMPTION"]),
  quantity: z.number(),
  rate: z.number().nonnegative().optional(),
  note: z.string().optional(),
});

router.post(
  "/sites/:siteId/stock-movements",
  requireRole(...STOCK_MANAGERS, "SITE_ENGINEER"),
  asyncHandler(async (req, res) => {
    const site = await prisma.site.findFirst({
      where: { id: req.params.siteId, project: { companyId: req.user!.companyId } },
    });
    if (!site) throw new ApiError(404, "Site not found");

    const data = movementSchema.parse(req.body);
    if (data.type !== "ADJUSTMENT" && data.quantity <= 0) {
      throw new ApiError(400, "Quantity must be positive for this movement type");
    }

    const material = await prisma.material.findFirst({
      where: { id: data.materialId, category: { companyId: req.user!.companyId } },
    });
    if (!material) throw new ApiError(404, "Material not found");

    const movement = await prisma.stockMovement.create({
      data: { ...data, siteId: site.id },
    });
    res.status(201).json(movement);
  })
);

export default router;
