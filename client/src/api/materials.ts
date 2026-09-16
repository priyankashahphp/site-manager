import { api } from "@/api/client";
import { Material, MaterialCategory, StockBalanceRow, StockMovement } from "@/types";

export async function listMaterialCategories() {
  const { data } = await api.get<MaterialCategory[]>("/material-categories");
  return data;
}

export async function createMaterialCategory(name: string) {
  const { data } = await api.post<MaterialCategory>("/material-categories", { name });
  return data;
}

export async function listMaterials() {
  const { data } = await api.get<Material[]>("/materials");
  return data;
}

export async function createMaterial(payload: {
  categoryId: string;
  name: string;
  unit: string;
  reorderLevel?: number;
}) {
  const { data } = await api.post<Material>("/materials", payload);
  return data;
}

export async function getSiteStock(siteId: string) {
  const { data } = await api.get<StockBalanceRow[]>(`/sites/${siteId}/stock`);
  return data;
}

export async function listStockMovements(siteId: string) {
  const { data } = await api.get<StockMovement[]>(`/sites/${siteId}/stock-movements`);
  return data;
}

export async function createStockMovement(
  siteId: string,
  payload: {
    materialId: string;
    type: string;
    quantity: number;
    rate?: number;
    note?: string;
  }
) {
  const { data } = await api.post<StockMovement>(`/sites/${siteId}/stock-movements`, payload);
  return data;
}
