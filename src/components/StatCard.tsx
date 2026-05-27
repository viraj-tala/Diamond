import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  tone?: "default" | "brand" | "green" | "amber" | "red";
}

const toneClasses = {
  default: {
    iconBg: "bg-slate-100 text-slate-600",
    accent: "from-slate-200 to-transparent",
  },
  brand: {
    iconBg: "bg-iris-100 text-iris-700",
    accent: "from-iris-200 to-transparent",
  },
  green: {
    iconBg: "bg-emerald-100 text-emerald-700",
    accent: "from-emerald-200 to-transparent",
  },
  amber: {
    iconBg: "bg-amber-100 text-amber-700",
    accent: "from-amber-200 to-transparent",
  },
  red: {
    iconBg: "bg-red-100 text-red-700",
    accent: "from-red-200 to-transparent",
  },
} as const;

export function StatCard({ label, value, icon: Icon, hint, tone = "default" }: Props) {
  const t = toneClasses[tone];
  return (
    <div className="card relative overflow-hidden p-5">
      {/* Soft tone wash in the top-right corner */}
      <div
        className={cn(
          "pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br opacity-40 blur-2xl",
          t.accent,
        )}
      />

      <div className="relative flex items-center justify-between">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </div>
        {Icon && (
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shadow-soft",
              t.iconBg,
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="relative mt-2 text-[28px] font-semibold tracking-tight text-slate-900 tabular-nums">
        {value}
      </div>
      {hint && (
        <div className="relative mt-0.5 text-xs text-slate-500 tabular-nums">
          {hint}
        </div>
      )}
    </div>
  );
}
