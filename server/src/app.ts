import express from "express";
import cors from "cors";
import authRoutes from "@/modules/auth/auth.routes";
import usersRoutes from "@/modules/users/users.routes";
import projectsRoutes from "@/modules/projects/projects.routes";
import sitesRoutes from "@/modules/sites/sites.routes";
import planningRoutes from "@/modules/planning/planning.routes";
import vendorsRoutes from "@/modules/vendors/vendors.routes";
import materialsRoutes from "@/modules/materials/materials.routes";
import laborRoutes from "@/modules/labor/labor.routes";
import siteworkRoutes from "@/modules/sitework/sitework.routes";
import equipmentRoutes from "@/modules/equipment/equipment.routes";
import financeRoutes from "@/modules/finance/finance.routes";
import qualityRoutes from "@/modules/quality/quality.routes";
import documentsRoutes from "@/modules/documents/documents.routes";
import reportsRoutes from "@/modules/reports/reports.routes";
import { errorHandler } from "@/middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/projects", projectsRoutes);
  // sites.routes mounts nested paths like /projects/:projectId/sites,
  // so it lives under /api directly.
  app.use("/api", sitesRoutes);
  app.use("/api", planningRoutes);
  app.use("/api", vendorsRoutes);
  app.use("/api", materialsRoutes);
  app.use("/api", laborRoutes);
  app.use("/api", siteworkRoutes);
  app.use("/api", equipmentRoutes);
  app.use("/api", financeRoutes);
  app.use("/api", qualityRoutes);
  app.use("/api", documentsRoutes);
  app.use("/api", reportsRoutes);

  app.use((req, res) => res.status(404).json({ error: `No route for ${req.method} ${req.path}` }));
  app.use(errorHandler);

  return app;
}
