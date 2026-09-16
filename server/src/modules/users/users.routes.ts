import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/config/db";
import { asyncHandler, ApiError } from "@/middleware/errorHandler";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();
router.use(requireAuth);

const ROLES = [
  "ADMIN",
  "PROJECT_MANAGER",
  "SITE_ENGINEER",
  "SITE_SUPERVISOR",
  "STORE_MANAGER",
  "ACCOUNTANT",
  "PURCHASE_MANAGER",
  "VENDOR",
  "CONTRACTOR",
  "LABOR",
] as const;

// List everyone in the caller's company
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      where: { companyId: req.user!.companyId },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  })
);

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(ROLES),
  phone: z.string().optional(),
});

// Only Admins invite/create new team members
router.post(
  "/",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const data = createUserSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ApiError(409, "Email already in use");

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        companyId: req.user!.companyId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        passwordHash,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    res.status(201).json(user);
  })
);

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(ROLES).optional(),
  isActive: z.boolean().optional(),
  phone: z.string().optional(),
});

router.patch(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const data = updateUserSchema.parse(req.body);
    const target = await prisma.user.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    });
    if (!target) throw new ApiError(404, "User not found");

    const user = await prisma.user.update({
      where: { id: target.id },
      data,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    res.json(user);
  })
);

export default router;
