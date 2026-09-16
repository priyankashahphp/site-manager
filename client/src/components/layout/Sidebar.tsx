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
  ShieldCheck,
  FileText,
  BarChart3,
} from "lucide-react";

interface NavItem {
  label: string;
  to?: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  phase: 1 | 2;
}

const items: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard, phase: 1 },
  { label: "Projects & Sites", to: "/projects", icon: Building2, phase: 1 },
  { label: "Company & Users", to: "/users", icon: Users, phase: 1 },
  { label: "Vendors", to: "/vendors", icon: Truck, phase: 1 },
  { label: "Material & Stock", to: "/materials", icon: Package, phase: 1 },
  { label: "Labor", to: "/labor", icon: HardHat, phase: 1 },
  { label: "Equipment", to: "/equipment", icon: Wrench, phase: 1 },
  { label: "Finance", to: "/finance", icon: Wallet, phase: 1 },
  { label: "Quality & Safety", icon: ShieldCheck, phase: 2 },
  { label: "Documents", icon: FileText, phase: 2 },
  { label: "Reports", icon: BarChart3, phase: 2 },
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
        <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-blueprint-600">
          Live modules
        </p>
        {items
          .filter((i) => i.phase === 1)
          .map((item) => (
            <NavLink
              key={item.label}
              to={item.to!}
              end={item.to === "/"}
              className={({ isActive }) =>
                `mb-1 flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-blueprint-800 text-white"
                    : "text-blueprint-100 hover:bg-blueprint-900"
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}

        <p className="mb-1 mt-5 px-2 pb-2 text-xs font-medium uppercase tracking-wide text-blueprint-600">
          Phase 6 — planned
        </p>
        {items
          .filter((i) => i.phase === 2)
          .map((item) => (
            <div
              key={item.label}
              className="mb-1 flex items-center gap-3 rounded px-3 py-2 text-sm text-blueprint-600"
              title="Coming in the next build phase"
            >
              <item.icon size={16} />
              {item.label}
            </div>
          ))}
      </nav>
    </aside>
  );
}
