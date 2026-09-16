import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/db";
import { asyncHandler, ApiError } from "@/middleware/errorHandler";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();
router.use(requireAuth);

const PURCHASERS = ["ADMIN", "PROJECT_MANAGER", "PURCHASE_MANAGER"] as const;

// ============================================================================
// Vendors
// ============================================================================

router.get(
  "/vendors",
  asyncHandler(async (req, res) => {
    const vendors = await prisma.vendor.findMany({
      where: { companyId: req.user!.companyId },
      include: { _count: { select: { purchaseOrders: true, bills: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(vendors);
  })
);

router.get(
  "/vendors/:id",
  asyncHandler(async (req, res) => {
    const vendor = await prisma.vendor.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include: {
        quotations: { orderBy: { createdAt: "desc" } },
        contracts: { orderBy: { startDate: "desc" } },
        purchaseOrders: { orderBy: { createdAt: "desc" } },
        bills: { include: { payments: true }, orderBy: { createdAt: "desc" } },
      },
    });
    if (!vendor) throw new ApiError(404, "Vendor not found");
    res.json(vendor);
  })
);

const vendorSchema = z.object({
  name: z.string().min(2),
  category: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
});

router.post(
  "/vendors",
  requireRole(...PURCHASERS),
  asyncHandler(async (req, res) => {
    const data = vendorSchema.parse(req.body);
    const vendor = await prisma.vendor.create({
      data: { ...data, companyId: req.user!.companyId },
    });
    res.status(201).json(vendor);
  })
);

router.patch(
  "/vendors/:id",
  requireRole(...PURCHASERS),
  asyncHandler(async (req, res) => {
    const data = vendorSchema.partial().parse(req.body);
    const existing = await prisma.vendor.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    });
    if (!existing) throw new ApiError(404, "Vendor not found");
    const vendor = await prisma.vendor.update({ where: { id: existing.id }, data });
    res.json(vendor);
  })
);

router.delete(
  "/vendors/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.vendor.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    });
    if (!existing) throw new ApiError(404, "Vendor not found");
    await prisma.vendor.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

// ============================================================================
// Vendor Quotations
// ============================================================================

const quotationSchema = z.object({
  title: z.string().min(2),
  amount: z.number().nonnegative(),
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]).optional(),
});

router.post(
  "/vendors/:vendorId/quotations",
  requireRole(...PURCHASERS),
  asyncHandler(async (req, res) => {
    const vendor = await prisma.vendor.findFirst({
      where: { id: req.params.vendorId, companyId: req.user!.companyId },
    });
    if (!vendor) throw new ApiError(404, "Vendor not found");
    const data = quotationSchema.parse(req.body);
    const quotation = await prisma.vendorQuotation.create({
      data: { ...data, vendorId: vendor.id },
    });
    res.status(201).json(quotation);
  })
);

router.patch(
  "/quotations/:id",
  requireRole(...PURCHASERS),
  asyncHandler(async (req, res) => {
    const data = quotationSchema.partial().parse(req.body);
    const existing = await prisma.vendorQuotation.findFirst({
      where: { id: req.params.id, vendor: { companyId: req.user!.companyId } },
    });
    if (!existing) throw new ApiError(404, "Quotation not found");
    const quotation = await prisma.vendorQuotation.update({
      where: { id: existing.id },
      data,
    });
    res.json(quotation);
  })
);

// ============================================================================
// Vendor Contracts
// ============================================================================

const contractSchema = z.object({
  title: z.string().min(2),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  value: z.number().nonnegative().optional(),
});

router.post(
  "/vendors/:vendorId/contracts",
  requireRole(...PURCHASERS),
  asyncHandler(async (req, res) => {
    const vendor = await prisma.vendor.findFirst({
      where: { id: req.params.vendorId, companyId: req.user!.companyId },
    });
    if (!vendor) throw new ApiError(404, "Vendor not found");
    const data = contractSchema.parse(req.body);
    const contract = await prisma.vendorContract.create({
      data: {
        title: data.title,
        value: data.value,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        vendorId: vendor.id,
      },
    });
    res.status(201).json(contract);
  })
);

// ============================================================================
// Purchase Orders
// ============================================================================

router.get(
  "/projects/:projectId/purchase-orders",
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, companyId: req.user!.companyId },
    });
    if (!project) throw new ApiError(404, "Project not found");
    const orders = await prisma.purchaseOrder.findMany({
      where: { projectId: project.id },
      include: { vendor: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  })
);

router.get(
  "/purchase-orders/:id",
  asyncHandler(async (req, res) => {
    const order = await prisma.purchaseOrder.findFirst({
      where: { id: req.params.id, project: { companyId: req.user!.companyId } },
      include: {
        vendor: { select: { id: true, name: true } },
        bills: { include: { payments: true } },
      },
    });
    if (!order) throw new ApiError(404, "Purchase order not found");
    res.json(order);
  })
);

const poSchema = z.object({
  vendorId: z.string(),
  poNumber: z.string().min(2),
  totalAmount: z.number().nonnegative(),
  status: z.enum(["DRAFT", "SENT", "ACKNOWLEDGED", "FULFILLED", "CANCELLED"]).optional(),
});

router.post(
  "/projects/:projectId/purchase-orders",
  requireRole(...PURCHASERS),
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, companyId: req.user!.companyId },
    });
    if (!project) throw new ApiError(404, "Project not found");
    const data = poSchema.parse(req.body);

    const vendor = await prisma.vendor.findFirst({
      where: { id: data.vendorId, companyId: req.user!.companyId },
    });
    if (!vendor) throw new ApiError(404, "Vendor not found");

    const existingPo = await prisma.purchaseOrder.findUnique({ where: { poNumber: data.poNumber } });
    if (existingPo) throw new ApiError(409, "PO number already in use");

    const order = await prisma.purchaseOrder.create({
      data: {
        ...data,
        projectId: project.id,
        createdById: req.user!.userId,
      },
    });
    res.status(201).json(order);
  })
);

router.patch(
  "/purchase-orders/:id",
  requireRole(...PURCHASERS),
  asyncHandler(async (req, res) => {
    const data = poSchema.partial().parse(req.body);
    const existing = await prisma.purchaseOrder.findFirst({
      where: { id: req.params.id, project: { companyId: req.user!.companyId } },
    });
    if (!existing) throw new ApiError(404, "Purchase order not found");
    const order = await prisma.purchaseOrder.update({ where: { id: existing.id }, data });
    res.json(order);
  })
);

// ============================================================================
// Vendor Bills
// ============================================================================

const billSchema = z.object({
  billNumber: z.string().min(1),
  amount: z.number().nonnegative(),
  purchaseOrderId: z.string().optional(),
});

router.post(
  "/vendors/:vendorId/bills",
  requireRole(...PURCHASERS, "ACCOUNTANT"),
  asyncHandler(async (req, res) => {
    const vendor = await prisma.vendor.findFirst({
      where: { id: req.params.vendorId, companyId: req.user!.companyId },
    });
    if (!vendor) throw new ApiError(404, "Vendor not found");
    const data = billSchema.parse(req.body);
    const bill = await prisma.vendorBill.create({
      data: { ...data, vendorId: vendor.id },
    });
    res.status(201).json(bill);
  })
);

// ============================================================================
// Vendor Payments
// ============================================================================

const paymentSchema = z.object({
  amount: z.number().positive(),
  method: z.string().optional(),
});

router.post(
  "/bills/:billId/payments",
  requireRole("ADMIN", "ACCOUNTANT"),
  asyncHandler(async (req, res) => {
    const bill = await prisma.vendorBill.findFirst({
      where: { id: req.params.billId, vendor: { companyId: req.user!.companyId } },
      include: { payments: true },
    });
    if (!bill) throw new ApiError(404, "Bill not found");
    const data = paymentSchema.parse(req.body);

    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.vendorPayment.create({
        data: { ...data, billId: bill.id },
      });
      const paidSoFar =
        bill.payments.reduce((sum, p) => sum + Number(p.amount), 0) + Number(data.amount);
      const newStatus = paidSoFar >= Number(bill.amount) ? "PAID" : "PARTIALLY_PAID";
      await tx.vendorBill.update({ where: { id: bill.id }, data: { status: newStatus } });
      return created;
    });

    res.status(201).json(payment);
  })
);

export default router;
