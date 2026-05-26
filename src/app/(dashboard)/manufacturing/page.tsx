import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { StageBadge } from "@/components/Badge";
import { StatCard } from "@/components/StatCard";
import { formatDate, formatNumber } from "@/lib/utils";
import { STAGES } from "@/lib/constants";
import { Plus, Factory } from "lucide-react";

export default async function ManufacturingPage({
  searchParams,
}: {
  searchParams: { stage?: string; q?: string };
}) {
  const stageFilter = searchParams.stage;
  const q = searchParams.q?.trim();

  const where: Record<string, unknown> = {};
  if (stageFilter && STAGES.includes(stageFilter as (typeof STAGES)[number])) {
    where.currentStage = stageFilter;
  }
  if (q) {
    where.qrCode = { contains: q };
  }

  const [stones, byStage] = await Promise.all([
    prisma.stone.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 200,
      include: { roughStone: { select: { code: true } } },
    }),
    prisma.stone.groupBy({
      by: ["currentStage"],
      _count: true,
    }),
  ]);

  const counts = Object.fromEntries(byStage.map((s) => [s.currentStage, s._count]));

  return (
    <div>
      <PageHeader
        title="Manufacturing"
        description="Every stone, every stage. Scan a QR code to advance."
        action={
          <Link href="/manufacturing/new" className="btn-primary gap-2">
            <Plus className="w-4 h-4" />
            New stone
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {STAGES.map((stage) => (
          <Link key={stage} href={`/manufacturing?stage=${stage}`} className="card p-3 hover:border-brand-500">
            <div className="text-xs text-slate-500">{stage}</div>
            <div className="text-xl font-semibold">{counts[stage] ?? 0}</div>
          </Link>
        ))}
      </div>

      <div className="card p-4 mb-4">
        <form className="flex gap-2 items-center">
          <input
            name="q"
            placeholder="Search by QR code..."
            defaultValue={q ?? ""}
            className="input max-w-xs"
          />
          {stageFilter && <input type="hidden" name="stage" value={stageFilter} />}
          <button className="btn-secondary text-sm">Search</button>
          {(stageFilter || q) && (
            <Link href="/manufacturing" className="text-xs text-brand-600">Clear filters</Link>
          )}
        </form>
      </div>

      {stones.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          <Factory className="w-8 h-8 mx-auto text-slate-300 mb-3" />
          No stones in the factory. <Link href="/manufacturing/new" className="text-brand-600 font-medium">Add the first one</Link>.
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>QR Code</th>
                <th>Rough</th>
                <th>Stage</th>
                <th>Start ct</th>
                <th>Current ct</th>
                <th>Loss</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {stones.map((s) => {
                const loss = s.startWeightCt - s.currentWeightCt;
                return (
                  <tr key={s.id}>
                    <td className="font-mono text-xs">{s.qrCode}</td>
                    <td className="text-xs text-slate-500">{s.roughStone?.code ?? "—"}</td>
                    <td><StageBadge stage={s.currentStage} /></td>
                    <td>{formatNumber(s.startWeightCt)}</td>
                    <td>{formatNumber(s.currentWeightCt)}</td>
                    <td className={loss > 0 ? "text-red-600" : "text-slate-500"}>
                      {loss > 0 ? `-${formatNumber(loss)}` : "—"}
                    </td>
                    <td className="text-xs text-slate-500">{formatDate(s.updatedAt)}</td>
                    <td>
                      <Link href={`/manufacturing/${s.id}`} className="text-brand-600 text-xs font-medium">Open →</Link>
                    </td>
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
