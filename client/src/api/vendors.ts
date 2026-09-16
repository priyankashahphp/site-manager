import { api } from "@/api/client";
import { PurchaseOrder, Vendor, VendorBill, VendorContract, VendorPayment, VendorQuotation } from "@/types";

// ---- Vendors ---------------------------------------------------------------

export async function listVendors() {
  const { data } = await api.get<Vendor[]>("/vendors");
  return data;
}

export async function getVendor(id: string) {
  const { data } = await api.get<Vendor>(`/vendors/${id}`);
  return data;
}

export async function createVendor(payload: {
  name: string;
  category?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}) {
  const { data } = await api.post<Vendor>("/vendors", payload);
  return data;
}

// ---- Quotations --------------------------------------------------------------

export async function createQuotation(
  vendorId: string,
  payload: { title: string; amount: number }
) {
  const { data } = await api.post<VendorQuotation>(`/vendors/${vendorId}/quotations`, payload);
  return data;
}

export async function updateQuotation(id: string, payload: { status: string }) {
  const { data } = await api.patch<VendorQuotation>(`/quotations/${id}`, payload);
  return data;
}

// ---- Contracts -----------------------------------------------------------------

export async function createContract(
  vendorId: string,
  payload: { title: string; startDate?: string; endDate?: string; value?: number }
) {
  const { data } = await api.post<VendorContract>(`/vendors/${vendorId}/contracts`, payload);
  return data;
}

// ---- Purchase Orders ----------------------------------------------------------

export async function listPurchaseOrders(projectId: string) {
  const { data } = await api.get<PurchaseOrder[]>(`/projects/${projectId}/purchase-orders`);
  return data;
}

export async function getPurchaseOrder(id: string) {
  const { data } = await api.get<PurchaseOrder>(`/purchase-orders/${id}`);
  return data;
}

export async function createPurchaseOrder(
  projectId: string,
  payload: { vendorId: string; poNumber: string; totalAmount: number }
) {
  const { data } = await api.post<PurchaseOrder>(
    `/projects/${projectId}/purchase-orders`,
    payload
  );
  return data;
}

export async function updatePurchaseOrder(id: string, payload: Partial<PurchaseOrder>) {
  const { data } = await api.patch<PurchaseOrder>(`/purchase-orders/${id}`, payload);
  return data;
}

// ---- Bills & Payments -----------------------------------------------------------

export async function createBill(
  vendorId: string,
  payload: { billNumber: string; amount: number; purchaseOrderId?: string }
) {
  const { data } = await api.post<VendorBill>(`/vendors/${vendorId}/bills`, payload);
  return data;
}

export async function createPayment(
  billId: string,
  payload: { amount: number; method?: string }
) {
  const { data } = await api.post<VendorPayment>(`/bills/${billId}/payments`, payload);
  return data;
}
