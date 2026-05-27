import { count, desc, inArray, ne, sum } from "drizzle-orm";
import { db, inventoryItems, qualityChecks, roughStones, stones, workers } from "@/db";
import { PageHeader } from "@/components/PageHeader";
import { formatCurrency, formatNumber } from "@/lib/utils";
import Link from "next/link";
import { LiveActivityFeed } from "./live-feed";
import { LiveStats } from "./live-stats";
import { getRecentLiveEvents } from "@/lib/recent-events";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    [roughRow],
    [stoneRow],
    [activeRow],
    [inventoryAgg],
    [workerRow],
    qcStats,
    recentInventory,
    recentEvents,
  ] = await Promise.all([
    db.select({ c: count() }).from(roughStones),
    db.select({ c: count() }).from(stones),
    db.select({ c: count() }).from(stones).where(ne(stones.currentStage, "COMPLETED")),
    db
      .select({
        c: count(),
        totalPrice: sum(inventoryItems.totalPrice),
        caratWeight: sum(inventoryItems.caratWeight),
      })
      .from(inventoryItems)
      .where(inArray(inventoryItems.status, ["IN_STOCK", "LISTED", "RESERVED"])),
    db.select({ c: count() }).from(workers),
    db
      .select({
        recommendation: qualityChecks.recommendation,
        c: count(),
      })
      .from(qualityChecks)
      .groupBy(qualityChecks.recommendation),
    db.query.inventoryItems.findMany({
      limit: 5,
      orderBy: [desc(inventoryItems.createdAt)],
    }),
    getRecentLiveEvents(8),
  ]);

  const rejects = qcStats.find((q) => q.recommendation === "REJECT")?.c ?? 0;
  const passes = qcStats.find((q) => q.recommendation === "PASS")?.c ?? 0;
  const reworks = qcStats.find((q) => q.recommendation === "REWORK")?.c ?? 0;

  const inventoryCount = inventoryAgg?.c ?? 0;
  const inventoryTotalPrice = Number(inventoryAgg?.totalPrice ?? 0);
  const inventoryCarat = Number(inventoryAgg?.caratWeight ?? 0);

  return (
    <div>
      <PageHeader
        title="Factory overview"
        description="Live operational metrics across all modules."
      />

      <LiveStats
        initial={{
          rough: roughRow.c,
          totalStones: stoneRow.c,
          active: activeRow.c,
          inventory: {
            count: inventoryCount,
            totalPrice: inventoryTotalPrice,
            caratWeight: inventoryCarat,
          },
          workers: workerRow.c,
          qc: { pass: passes, rework: reworks, reject: rejects },
        }}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <LiveActivityFeed initialEvents={recentEvents} />

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Latest inventory</h2>
            <Link href="/inventory" className="text-xs text-iris-600 font-medium">View all →</Link>
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
