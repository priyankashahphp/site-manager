import { api } from "@/api/client";
import { Equipment, EquipmentMaintenance, EquipmentUsage } from "@/types";

export async function listEquipment() {
  const { data } = await api.get<Equipment[]>("/equipment");
  return data;
}

export async function getEquipment(id: string) {
  const { data } = await api.get<Equipment>(`/equipment/${id}`);
  return data;
}

export async function createEquipment(payload: {
  name: string;
  type?: string;
  ownership?: string;
}) {
  const { data } = await api.post<Equipment>("/equipment", payload);
  return data;
}

export async function listSiteEquipmentUsage(siteId: string) {
  const { data } = await api.get<EquipmentUsage[]>(`/sites/${siteId}/equipment-usage`);
  return data;
}

export async function logEquipmentUsage(
  siteId: string,
  payload: { equipmentId: string; date: string; hoursUsed: number; fuelUsed?: number; rentalCost?: number }
) {
  const { data } = await api.post<EquipmentUsage>(`/sites/${siteId}/equipment-usage`, payload);
  return data;
}

export async function logMaintenance(
  equipmentId: string,
  payload: { date: string; description: string; cost?: number }
) {
  const { data } = await api.post<EquipmentMaintenance>(`/equipment/${equipmentId}/maintenance`, payload);
  return data;
}
