import Link from "next/link";
import { Plus } from "lucide-react";
import { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: ReactNode;
  description: ReactNode;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="card p-12 text-center">
      <div className="w-12 h-12 rounded-full bg-iris-50 text-iris-600 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <div className="font-semibold text-slate-900 mb-1.5">{title}</div>
      <div className="text-sm text-slate-500 max-w-md mx-auto mb-5">{description}</div>
      {cta && (
        <Link href={cta.href} className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {cta.label}
        </Link>
      )}
    </div>
  );
}
