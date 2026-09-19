import { api } from "@/api/client";
import { Defect, Inspection, SafetyChecklistItem, SafetyIncident } from "@/types";

// ---- Inspections -----------------------------------------------------------

export async function listInspections(siteId: string) {
  const { data } = await api.get<Inspection[]>(`/sites/${siteId}/inspections`);
  return data;
}

export async function getInspection(id: string) {
  const { data } = await api.get<Inspection>(`/inspections/${id}`);
  return data;
}

export async function createInspection(
  siteId: string,
  payload: { title: string; checklistLabels?: string[] }
) {
  const { data } = await api.post<Inspection>(`/sites/${siteId}/inspections`, payload);
  return data;
}

export async function updateInspection(id: string, payload: { result?: string; notes?: string }) {
  const { data } = await api.patch<Inspection>(`/inspections/${id}`, payload);
  return data;
}

export async function toggleChecklistItem(id: string, passed: boolean) {
  const { data } = await api.patch(`/checklist-items/${id}`, { passed });
  return data;
}

export async function createDefect(inspectionId: string, description: string) {
  const { data } = await api.post<Defect>(`/inspections/${inspectionId}/defects`, { description });
  return data;
}

export async function updateDefect(id: string, status: string) {
  const { data } = await api.patch<Defect>(`/defects/${id}`, { status });
  return data;
}

// ---- Safety Incidents -------------------------------------------------------

export async function listSafetyIncidents(siteId: string) {
  const { data } = await api.get<SafetyIncident[]>(`/sites/${siteId}/safety-incidents`);
  return data;
}

export async function createSafetyIncident(
  siteId: string,
  payload: { title: string; description?: string; severity?: string }
) {
  const { data } = await api.post<SafetyIncident>(`/sites/${siteId}/safety-incidents`, payload);
  return data;
}

export async function updateSafetyIncident(id: string, status: string) {
  const { data } = await api.patch<SafetyIncident>(`/safety-incidents/${id}`, { status });
  return data;
}

// ---- Safety Checklist -----------------------------------------------------

export async function listSafetyChecklist(siteId: string) {
  const { data } = await api.get<SafetyChecklistItem[]>(`/sites/${siteId}/safety-checklist`);
  return data;
}

export async function addSafetyChecklistItem(siteId: string, label: string) {
  const { data } = await api.post<SafetyChecklistItem>(`/sites/${siteId}/safety-checklist`, { label });
  return data;
}

export async function toggleSafetyChecklistItem(id: string, checked: boolean) {
  const { data } = await api.patch<SafetyChecklistItem>(`/safety-checklist/${id}`, { checked });
  return data;
}
