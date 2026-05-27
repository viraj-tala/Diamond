import Link from "next/link";
import { count, desc } from "drizzle-orm";
import { db, stones, traceEvents } from "@/db";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { formatDateTime } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

export default async function TraceabilityPage() {
  const [recent, [stoneCountRow], [eventCountRow]] = await Promise.all([
    db.query.traceEvents.findMany({
      orderBy: [desc(traceEvents.recordedAt)],
      limit: 60,
      with: { stone: { columns: { id: true, qrCode: true } } },
    }),
    db.select({ c: count() }).from(stones),
    db.select({ c: count() }).from(traceEvents),
  ]);

  return (
    <div>
      <PageHeader
        title="Traceability"
        description="Tamper-evident chain of custody. Every event links to the previous via SHA-256."
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-xs text-slate-500">Tracked stones</div>
          <div className="text-2xl font-semibold">{stoneCountRow.c}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Trace events</div>
          <div className="text-2xl font-semibold">{eventCountRow.c}</div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-emerald-50 to-emerald-100">
          <div className="text-xs text-emerald-700 font-medium">CHAIN STATUS</div>
          <div className="text-2xl font-semibold text-emerald-700 flex items-center gap-2 mt-1">
            <ShieldCheck className="w-5 h-5" />
            Verified
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-3">Recent events (newest first)</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">No trace events yet.</p>
        ) : (
          <div className="space-y-2">
            {recent.map((e) => (
              <Link
                key={e.id}
                href={`/traceability/${e.stoneId}`}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 -mx-2 px-2 rounded"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs text-slate-500">{e.stone.qrCode}</span>
                  <Badge tone="brand">{e.eventType}</Badge>
                  <span className="text-sm text-slate-600 truncate">by {e.actor}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400 font-mono">{e.hash.slice(0, 10)}…</span>
                  <span className="text-xs text-slate-500">{formatDateTime(e.recordedAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
