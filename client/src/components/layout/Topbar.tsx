import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  PROJECT_MANAGER: "Project Manager",
  SITE_ENGINEER: "Site Engineer",
  SITE_SUPERVISOR: "Site Supervisor",
  STORE_MANAGER: "Store Manager",
  ACCOUNTANT: "Accountant",
  PURCHASE_MANAGER: "Purchase Manager",
  VENDOR: "Vendor",
  CONTRACTOR: "Contractor",
  LABOR: "Labor",
};

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-concrete-200 bg-white px-6">
      <div>
        <p className="text-sm text-concrete-400">{user?.company?.name}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-concrete-900">{user?.name}</p>
          <p className="text-xs text-concrete-400">{user ? ROLE_LABELS[user.role] : ""}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded border border-concrete-200 px-3 py-1.5 text-sm text-concrete-700 hover:bg-concrete-50"
        >
          <LogOut size={14} />
          Log out
        </button>
      </div>
    </header>
  );
}
