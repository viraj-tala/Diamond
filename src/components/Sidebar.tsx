"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Gem,
  Factory,
  Users,
  Boxes,
  LineChart,
  ShieldCheck,
  ScanSearch,
  Truck,
  Settings,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/yield", label: "Yield Optimizer", icon: Gem },
  { href: "/manufacturing", label: "Manufacturing", icon: Factory },
  { href: "/workers", label: "Workers", icon: Users },
  { href: "/inventory", label: "Inventory & Market", icon: Boxes },
  { href: "/pricing", label: "Price Intel", icon: LineChart },
  { href: "/traceability", label: "Traceability", icon: ShieldCheck },
  { href: "/quality", label: "Quality QC", icon: ScanSearch },
  { href: "/jobwork", label: "Job Work", icon: Truck },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-white flex flex-col">
      <div className="h-14 flex items-center gap-2 px-5 border-b border-slate-200">
        <Gem className="w-5 h-5 text-brand-600" />
        <span className="font-bold">Yeild</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition",
                active
                  ? "bg-brand-50 text-brand-700 font-medium"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-slate-200 text-xs text-slate-400">
        v0.1 · Local SQLite
      </div>
    </aside>
  );
}
