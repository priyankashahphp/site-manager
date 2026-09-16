import { api } from "@/api/client";
import { Building, Floor, Project, Site, Unit } from "@/types";

export async function listProjects() {
  const { data } = await api.get<Project[]>("/projects");
  return data;
}

export async function getProject(id: string) {
  const { data } = await api.get<Project & { sites: Site[] }>(`/projects/${id}`);
  return data;
}

export async function createProject(payload: Partial<Project>) {
  const { data } = await api.post<Project>("/projects", payload);
  return data;
}

export async function updateProject(id: string, payload: Partial<Project>) {
  const { data } = await api.patch<Project>(`/projects/${id}`, payload);
  return data;
}

export async function deleteProject(id: string) {
  await api.delete(`/projects/${id}`);
}

export async function listSites(projectId: string) {
  const { data } = await api.get<Site[]>(`/projects/${projectId}/sites`);
  return data;
}

export async function getSite(id: string) {
  const { data } = await api.get<Site & { buildings: Building[] }>(`/sites/${id}`);
  return data;
}

export async function createSite(projectId: string, payload: Partial<Site>) {
  const { data } = await api.post<Site>(`/projects/${projectId}/sites`, payload);
  return data;
}

export async function createBuilding(siteId: string, name: string) {
  const { data } = await api.post<Building>(`/sites/${siteId}/buildings`, { name });
  return data;
}

export async function createFloor(buildingId: string, name: string, levelOrder = 0) {
  const { data } = await api.post<Floor>(`/buildings/${buildingId}/floors`, {
    name,
    levelOrder,
  });
  return data;
}

export async function createUnit(floorId: string, payload: Partial<Unit>) {
  const { data } = await api.post<Unit>(`/floors/${floorId}/units`, payload);
  return data;
}
