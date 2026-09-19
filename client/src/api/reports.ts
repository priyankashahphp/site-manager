import { api } from "@/api/client";
import { PortfolioReportRow, ProjectReportOverview } from "@/types";

export async function getProjectOverview(projectId: string) {
  const { data } = await api.get<ProjectReportOverview>(`/projects/${projectId}/reports/overview`);
  return data;
}

export async function getPortfolioReport() {
  const { data } = await api.get<PortfolioReportRow[]>("/reports/portfolio");
  return data;
}
