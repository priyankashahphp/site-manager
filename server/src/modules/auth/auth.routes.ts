import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/config/db";
import { signToken } from "@/utils/jwt";
import { asyncHandler, ApiError } from "@/middleware/errorHandler";
import { requireAuth } from "@/middleware/auth";

const router = Router();

const registerSchema = z.object({
  companyName: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

// Registers a new Company + its first Admin user in one step.
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ApiError(409, "Email already in use");

    const passwordHash = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({ data: { name: data.companyName } });
      const user = await tx.user.create({
        data: {
          companyId: company.id,
          name: data.name,
          email: data.email,
          passwordHash,
          role: "ADMIN",
        },
      });
      return { company, user };
    });

    const token = signToken({
      userId: result.user.id,
      companyId: result.company.id,
      role: result.user.role,
    });

    res.status(201).json({
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
      company: { id: result.company.id, name: result.company.name },
    });
  })
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !user.isActive) throw new ApiError(401, "Invalid credentials");

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw new ApiError(401, "Invalid credentials");

    const token = signToken({ userId: user.id, companyId: user.companyId, role: user.role });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company: { select: { id: true, name: true } },
      },
    });
    if (!user) throw new ApiError(404, "User not found");
    res.json(user);
  })
);

export default router;
