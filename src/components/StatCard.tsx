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
  default: "bg-slate-50 text-slate-700",
  brand: "bg-brand-50 text-brand-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
};

export function StatCard({ label, value, icon: Icon, hint, tone = "default" }: Props) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</div>
        {Icon && (
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", toneClasses[tone])}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
