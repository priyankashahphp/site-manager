import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/routes/ProtectedRoute";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Dashboard from "@/pages/dashboard/Dashboard";
import ProjectList from "@/pages/projects/ProjectList";
import ProjectDetail from "@/pages/projects/ProjectDetail";
import SiteDetail from "@/pages/sites/SiteDetail";
import UserList from "@/pages/users/UserList";
import PlanningPage from "@/pages/planning/PlanningPage";
import WorkPackageDetail from "@/pages/planning/WorkPackageDetail";
import VendorList from "@/pages/vendors/VendorList";
import VendorDetail from "@/pages/vendors/VendorDetail";
import ProjectPurchaseOrders from "@/pages/vendors/ProjectPurchaseOrders";
import MaterialsPage from "@/pages/materials/MaterialsPage";
import SiteStock from "@/pages/materials/SiteStock";
import LaborPage from "@/pages/labor/LaborPage";
import SiteDiaryPage from "@/pages/sitework/SiteDiaryPage";
import EquipmentPage from "@/pages/equipment/EquipmentPage";
import EquipmentDetail from "@/pages/equipment/EquipmentDetail";
import FinancePage from "@/pages/finance/FinancePage";
import ProjectFinance from "@/pages/finance/ProjectFinance";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/sites/:id" element={<SiteDetail />} />
        <Route path="/projects/:id/planning" element={<PlanningPage />} />
        <Route path="/work-packages/:id" element={<WorkPackageDetail />} />
        <Route path="/vendors" element={<VendorList />} />
        <Route path="/vendors/:id" element={<VendorDetail />} />
        <Route path="/projects/:id/purchase-orders" element={<ProjectPurchaseOrders />} />
        <Route path="/materials" element={<MaterialsPage />} />
        <Route path="/sites/:id/stock" element={<SiteStock />} />
        <Route path="/labor" element={<LaborPage />} />
        <Route path="/sites/:id/diary" element={<SiteDiaryPage />} />
        <Route path="/equipment" element={<EquipmentPage />} />
        <Route path="/equipment/:id" element={<EquipmentDetail />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/projects/:id/finance" element={<ProjectFinance />} />
        <Route path="/users" element={<UserList />} />
      </Route>
    </Routes>
  );
}
