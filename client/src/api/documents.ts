import { api } from "@/api/client";
import { ProjectDocument } from "@/types";

export async function listDocuments(projectId: string, type?: string) {
  const { data } = await api.get<ProjectDocument[]>(`/projects/${projectId}/documents`, {
    params: type ? { type } : undefined,
  });
  return data;
}

export async function createDocument(
  projectId: string,
  payload: { name: string; type: string; url: string }
) {
  const { data } = await api.post<ProjectDocument>(`/projects/${projectId}/documents`, payload);
  return data;
}

export async function deleteDocument(id: string) {
  await api.delete(`/documents/${id}`);
}
