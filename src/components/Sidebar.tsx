"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Gem,
  Factory,
  QrCode,
  Users,
  Boxes,
  LineChart,
  ShieldCheck,
  ScanSearch,
  Truck,
  Settings,
} from "lucide-react";

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Operations",
    items: [
      { href: "/yield", label: "Yield Optimizer", icon: Gem },
      { href: "/manufacturing", label: "Manufacturing", icon: Factory },
      { href: "/scan", label: "Scan", icon: QrCode },
      { href: "/quality", label: "Quality QC", icon: ScanSearch },
      { href: "/jobwork", label: "Job Work", icon: Truck },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/inventory", label: "Inventory & Market", icon: Boxes },
      { href: "/pricing", label: "Price Intel", icon: LineChart },
    ],
  },
  {
    label: "Trust & Admin",
    items: [
      { href: "/traceability", label: "Traceability", icon: ShieldCheck },
      { href: "/workers", label: "Workers", icon: Users },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-white flex flex-col">
      {/* Brand mark */}
      <div className="relative h-14 flex items-center gap-2 px-5 border-b border-slate-200 overflow-hidden">
        <div className="absolute inset-0 bg-prism-soft opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <BrandMark />
        <span className="relative font-bold text-slate-900 tracking-tight text-lg">
          Lustra
        </span>
      </div>

      {/* Grouped navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                      active
                        ? "bg-iris-50 text-iris-800 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    )}
                  >
                    {/* Active-state iris accent bar */}
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-iris-500" />
                    )}
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition",
                        active
                          ? "text-iris-600"
                          : "text-slate-400 group-hover:text-slate-600",
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / version */}
      <div className="px-5 py-3 border-t border-slate-200 text-[11px] text-slate-400 flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>v1.0 · Postgres</span>
      </div>
    </aside>
  );
}

function BrandMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-6 h-6 relative animate-sparkle"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="brandMarkPrism" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <path
        d="M12 2 L4 9 L12 22 L20 9 Z"
        fill="url(#brandMarkPrism)"
      />
      <path
        d="M4 9 L20 9 M8 9 L12 22 M16 9 L12 22 M12 2 L12 9"
        stroke="white"
        strokeOpacity="0.55"
        strokeWidth="0.6"
        fill="none"
      />
    </svg>
  );
}
