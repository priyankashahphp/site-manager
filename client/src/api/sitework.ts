import { api } from "@/api/client";
import { DailyProgressEntry, DailySiteDiary, SiteDayView, SiteIssue, SitePhoto } from "@/types";

export async function listDiaries(siteId: string) {
  const { data } = await api.get<DailySiteDiary[]>(`/sites/${siteId}/diary`);
  return data;
}

export async function getDiaryDay(siteId: string, date: string) {
  const { data } = await api.get<SiteDayView>(`/sites/${siteId}/diary/${date}`);
  return data;
}

export async function saveDiary(
  siteId: string,
  payload: { date: string; weather?: string; notes?: string }
) {
  const { data } = await api.post<DailySiteDiary>(`/sites/${siteId}/diary`, payload);
  return data;
}

export async function addProgress(
  diaryId: string,
  payload: { description: string; percentComplete?: number; activityId?: string }
) {
  const { data } = await api.post<DailyProgressEntry>(`/diary/${diaryId}/progress`, payload);
  return data;
}

export async function listPhotos(siteId: string) {
  const { data } = await api.get<SitePhoto[]>(`/sites/${siteId}/photos`);
  return data;
}

export async function addPhoto(siteId: string, payload: { url: string; caption?: string }) {
  const { data } = await api.post<SitePhoto>(`/sites/${siteId}/photos`, payload);
  return data;
}

export async function listIssues(siteId: string) {
  const { data } = await api.get<SiteIssue[]>(`/sites/${siteId}/issues`);
  return data;
}

export async function createIssue(
  siteId: string,
  payload: { title: string; description?: string; severity?: string }
) {
  const { data } = await api.post<SiteIssue>(`/sites/${siteId}/issues`, payload);
  return data;
}

export async function updateIssue(id: string, payload: { status: string }) {
  const { data } = await api.patch<SiteIssue>(`/issues/${id}`, payload);
  return data;
}
