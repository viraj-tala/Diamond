import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/Badge";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { Plus, ScanSearch } from "lucide-react";

export default async function QualityPage() {
  const checks = await prisma.qualityCheck.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      stone: { select: { qrCode: true } },
      inspector: { select: { name: true } },
    },
    take: 100,
  });

  const stats = await prisma.qualityCheck.groupBy({
    by: ["recommendation"],
    _count: true,
  });

  const getCount = (k: string) => stats.find((s) => s.recommendation === k)?._count ?? 0;

  return (
    <div>
      <PageHeader
        title="Quality QC"
        description="AI-assisted defect detection and inspection logs."
        action={
          <Link href="/quality/new" className="btn-primary gap-2">
            <Plus className="w-4 h-4" />
            New inspection
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 bg-emerald-50">
          <div className="text-xs text-emerald-700">PASS</div>
          <div className="text-2xl font-semibold text-emerald-700">{getCount("PASS")}</div>
        </div>
        <div className="card p-4 bg-amber-50">
          <div className="text-xs text-amber-700">REWORK</div>
          <div className="text-2xl font-semibold text-amber-700">{getCount("REWORK")}</div>
        </div>
        <div className="card p-4 bg-red-50">
          <div className="text-xs text-red-700">REJECT</div>
          <div className="text-2xl font-semibold text-red-700">{getCount("REJECT")}</div>
        </div>
      </div>

      {checks.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          <ScanSearch className="w-8 h-8 mx-auto text-slate-300 mb-3" />
          No inspections yet. <Link href="/quality/new" className="text-brand-600 font-medium">Run the first one</Link>.
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Stone</th>
                <th>Inspector</th>
                <th>Defects</th>
                <th>Score</th>
                <th>Result</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => {
                const defects = (() => { try { return JSON.parse(c.defectsFound ?? "[]") as string[]; } catch { return []; } })();
                return (
                  <tr key={c.id}>
                    <td className="font-mono text-xs">{c.stone.qrCode}</td>
                    <td className="text-xs">{c.inspector.name}</td>
                    <td className="text-xs">{defects.length ? defects.join(", ") : "—"}</td>
                    <td>{formatNumber(c.overallScore, 0)}</td>
                    <td><StatusBadge status={c.recommendation} /></td>
                    <td className="text-xs text-slate-500">{formatDateTime(c.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
