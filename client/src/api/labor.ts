import { api } from "@/api/client";
import { Attendance, Contractor, Labor, LaborGroup, LaborPayment } from "@/types";

export async function listContractors() {
  const { data } = await api.get<Contractor[]>("/contractors");
  return data;
}

export async function createContractor(payload: { name: string; phone?: string }) {
  const { data } = await api.post<Contractor>("/contractors", payload);
  return data;
}

export async function listLaborGroups() {
  const { data } = await api.get<LaborGroup[]>("/labor-groups");
  return data;
}

export async function createLaborGroup(payload: { name: string; contractorId?: string }) {
  const { data } = await api.post<LaborGroup>("/labor-groups", payload);
  return data;
}

export async function listLabor() {
  const { data } = await api.get<Labor[]>("/labor");
  return data;
}

export async function getLabor(id: string) {
  const { data } = await api.get<Labor>(`/labor/${id}`);
  return data;
}

export async function createLabor(payload: {
  name: string;
  phone?: string;
  dailyWage: number;
  skill?: string;
  laborGroupId?: string;
}) {
  const { data } = await api.post<Labor>("/labor", payload);
  return data;
}

export async function createLaborPayment(
  laborId: string,
  payload: { amount: number; type?: string }
) {
  const { data } = await api.post<LaborPayment>(`/labor/${laborId}/payments`, payload);
  return data;
}

export async function listSiteAttendance(siteId: string, date?: string) {
  const { data } = await api.get<Attendance[]>(`/sites/${siteId}/attendance`, {
    params: date ? { date } : undefined,
  });
  return data;
}

export async function markAttendance(
  siteId: string,
  payload: { laborId: string; date: string; present?: boolean; overtimeHours?: number }
) {
  const { data } = await api.post<Attendance>(`/sites/${siteId}/attendance`, payload);
  return data;
}
