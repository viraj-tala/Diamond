import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { StageBadge } from "@/components/Badge";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { Gem, Factory, Boxes, Users, LineChart, ShieldCheck, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const [
    roughCount,
    stoneCount,
    activeStones,
    inventoryStats,
    workerCount,
    qcStats,
    recentEvents,
    recentInventory,
  ] = await Promise.all([
    prisma.roughStone.count(),
    prisma.stone.count(),
    prisma.stone.count({ where: { currentStage: { not: "COMPLETED" } } }),
    prisma.inventoryItem.aggregate({
      _count: true,
      _sum: { totalPrice: true, caratWeight: true },
      where: { status: { in: ["IN_STOCK", "LISTED", "RESERVED"] } },
    }),
    prisma.worker.count(),
    prisma.qualityCheck.groupBy({
      by: ["recommendation"],
      _count: true,
    }),
    prisma.stageEvent.findMany({
      take: 8,
      orderBy: { startedAt: "desc" },
      include: { stone: { select: { qrCode: true, currentStage: true } }, worker: { select: { name: true } } },
    }),
    prisma.inventoryItem.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const rejects = qcStats.find((q) => q.recommendation === "REJECT")?._count ?? 0;
  const passes = qcStats.find((q) => q.recommendation === "PASS")?._count ?? 0;
  const reworks = qcStats.find((q) => q.recommendation === "REWORK")?._count ?? 0;

  return (
    <div>
      <PageHeader
        title="Factory overview"
        description="Live operational metrics across all modules."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Rough stones" value={roughCount} icon={Gem} tone="brand" />
        <StatCard label="Active in factory" value={activeStones} icon={Factory} tone="amber" hint={`${stoneCount} total`} />
        <StatCard label="Inventory items" value={inventoryStats._count} icon={Boxes} tone="green" hint={`${formatNumber(inventoryStats._sum.caratWeight ?? 0)} ct`} />
        <StatCard label="Inventory value" value={formatCurrency(inventoryStats._sum.totalPrice ?? 0)} icon={LineChart} tone="brand" />
        <StatCard label="Workers" value={workerCount} icon={Users} />
        <StatCard label="QC passes" value={passes} icon={ShieldCheck} tone="green" />
        <StatCard label="QC reworks" value={reworks} icon={AlertTriangle} tone="amber" />
        <StatCard label="QC rejects" value={rejects} icon={AlertTriangle} tone="red" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent stage events</h2>
            <Link href="/manufacturing" className="text-xs text-brand-600 font-medium">View all →</Link>
          </div>
          {recentEvents.length === 0 ? (
            <div className="text-sm text-slate-500 py-10 text-center">No activity yet. Add a stone to start tracking.</div>
          ) : (
            <div className="space-y-2">
              {recentEvents.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500">{e.stone.qrCode}</span>
                    <StageBadge stage={e.stage} />
                    {e.worker?.name && <span className="text-xs text-slate-500">by {e.worker.name}</span>}
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(e.startedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Latest inventory</h2>
            <Link href="/inventory" className="text-xs text-brand-600 font-medium">View all →</Link>
          </div>
          {recentInventory.length === 0 ? (
            <div className="text-sm text-slate-500 py-10 text-center">No items yet.</div>
          ) : (
            <div className="space-y-2">
              {recentInventory.map((i) => (
                <div key={i.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="text-sm font-medium">{i.sku}</div>
                    <div className="text-xs text-slate-500">
                      {i.shape} · {formatNumber(i.caratWeight)} ct · {i.color}/{i.clarity}
                    </div>
                  </div>
                  <div className="text-sm font-medium">{formatCurrency(i.totalPrice)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
