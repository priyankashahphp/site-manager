import type { ComponentType } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  Truck,
  Package,
  HardHat,
  Wrench,
  Wallet,
  BarChart3,
} from "lucide-react";

interface NavItem {
  label: string;
  to: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

const items: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Projects & Sites", to: "/projects", icon: Building2 },
  { label: "Company & Users", to: "/users", icon: Users },
  { label: "Vendors", to: "/vendors", icon: Truck },
  { label: "Material & Stock", to: "/materials", icon: Package },
  { label: "Labor", to: "/labor", icon: HardHat },
  { label: "Equipment", to: "/equipment", icon: Wrench },
  { label: "Finance", to: "/finance", icon: Wallet },
  { label: "Reports", to: "/reports", icon: BarChart3 },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-blueprint-950 text-blueprint-100">
      <div className="flex items-center gap-2 border-b border-blueprint-800 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-safety text-blueprint-950 font-mono text-sm font-bold">
          S
        </div>
        <div>
          <p className="text-sm font-semibold text-white">SiteOps</p>
          <p className="text-xs text-blueprint-500">Construction Management</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `mb-1 flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors ${
                isActive ? "bg-blueprint-800 text-white" : "text-blueprint-100 hover:bg-blueprint-900"
              }`
            }
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
        <p className="mb-1 mt-5 px-2 pb-1 text-xs font-medium uppercase tracking-wide text-blueprint-600">
          Site-level tools
        </p>
        <p className="px-2 text-xs text-blueprint-600">
          Planning, Diary, Stock, Quality & Safety, Documents, and Purchase Orders live inside each
          project and site — open one from Projects & Sites.
        </p>
      </nav>
    </aside>
  );
}

