import { api } from "@/api/client";
import {
  Activity,
  BoqItem,
  EquipmentRequirement,
  LaborRequirement,
  MaterialRequirement,
  ProjectRequirement,
  WorkPackage,
} from "@/types";

// ---- Project Requirements -----------------------------------------------

export async function listRequirements(projectId: string) {
  const { data } = await api.get<ProjectRequirement[]>(`/projects/${projectId}/requirements`);
  return data;
}

export async function createRequirement(
  projectId: string,
  payload: { title: string; description?: string }
) {
  const { data } = await api.post<ProjectRequirement>(
    `/projects/${projectId}/requirements`,
    payload
  );
  return data;
}

export async function deleteRequirement(id: string) {
  await api.delete(`/requirements/${id}`);
}

// ---- Work Packages --------------------------------------------------------

export async function listWorkPackages(projectId: string) {
  const { data } = await api.get<WorkPackage[]>(`/projects/${projectId}/work-packages`);
  return data;
}

export async function getWorkPackage(id: string) {
  const { data } = await api.get<WorkPackage>(`/work-packages/${id}`);
  return data;
}

export async function createWorkPackage(
  projectId: string,
  payload: { name: string; startDate?: string; endDate?: string }
) {
  const { data } = await api.post<WorkPackage>(`/projects/${projectId}/work-packages`, payload);
  return data;
}

export async function updateWorkPackage(id: string, payload: Partial<WorkPackage>) {
  const { data } = await api.patch<WorkPackage>(`/work-packages/${id}`, payload);
  return data;
}

export async function deleteWorkPackage(id: string) {
  await api.delete(`/work-packages/${id}`);
}

// ---- Activities -------------------------------------------------------------

export async function createActivity(
  workPackageId: string,
  payload: { name: string; startDate?: string; endDate?: string }
) {
  const { data } = await api.post<Activity>(`/work-packages/${workPackageId}/activities`, payload);
  return data;
}

export async function updateActivity(id: string, payload: Partial<Activity>) {
  const { data } = await api.patch<Activity>(`/activities/${id}`, payload);
  return data;
}

export async function deleteActivity(id: string) {
  await api.delete(`/activities/${id}`);
}

// ---- BOQ ----------------------------------------------------------------------

export async function createBoqItem(
  workPackageId: string,
  payload: { itemCode?: string; description: string; unit: string; quantity: number; rate: number }
) {
  const { data } = await api.post<BoqItem>(`/work-packages/${workPackageId}/boq`, payload);
  return data;
}

export async function deleteBoqItem(id: string) {
  await api.delete(`/boq/${id}`);
}

// ---- Material Requirements --------------------------------------------------

export async function createMaterialRequirement(
  workPackageId: string,
  payload: { materialName: string; unit: string; quantity: number; neededBy?: string }
) {
  const { data } = await api.post<MaterialRequirement>(
    `/work-packages/${workPackageId}/material-requirements`,
    payload
  );
  return data;
}

export async function updateMaterialRequirement(id: string, payload: Partial<MaterialRequirement>) {
  const { data } = await api.patch<MaterialRequirement>(`/material-requirements/${id}`, payload);
  return data;
}

export async function deleteMaterialRequirement(id: string) {
  await api.delete(`/material-requirements/${id}`);
}

// ---- Labor Requirements -------------------------------------------------------

export async function createLaborRequirement(
  workPackageId: string,
  payload: { skill: string; headcount: number; fromDate?: string; toDate?: string }
) {
  const { data } = await api.post<LaborRequirement>(
    `/work-packages/${workPackageId}/labor-requirements`,
    payload
  );
  return data;
}

export async function updateLaborRequirement(id: string, payload: Partial<LaborRequirement>) {
  const { data } = await api.patch<LaborRequirement>(`/labor-requirements/${id}`, payload);
  return data;
}

export async function deleteLaborRequirement(id: string) {
  await api.delete(`/labor-requirements/${id}`);
}

// ---- Equipment Requirements ---------------------------------------------------

export async function createEquipmentRequirement(
  workPackageId: string,
  payload: { equipmentType: string; count: number; fromDate?: string; toDate?: string }
) {
  const { data } = await api.post<EquipmentRequirement>(
    `/work-packages/${workPackageId}/equipment-requirements`,
    payload
  );
  return data;
}

export async function updateEquipmentRequirement(
  id: string,
  payload: Partial<EquipmentRequirement>
) {
  const { data } = await api.patch<EquipmentRequirement>(`/equipment-requirements/${id}`, payload);
  return data;
}

export async function deleteEquipmentRequirement(id: string) {
  await api.delete(`/equipment-requirements/${id}`);
}
