import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, stones, traceEvents } from "@/db";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { formatDateTime } from "@/lib/utils";
import { hashTraceEvent } from "@/lib/trace-hash";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default async function StoneTracePage({ params }: { params: { stoneId: string } }) {
  const stone = await db.query.stones.findFirst({
    where: eq(stones.id, params.stoneId),
    with: {
      roughStone: true,
      traceEvents: { orderBy: [asc(traceEvents.recordedAt)] },
    },
  });
  if (!stone) notFound();

  const verified: { id: string; ok: boolean; expected: string }[] = [];
  let prevHash: string | null = null;
  for (const ev of stone.traceEvents) {
    const expected = hashTraceEvent({
      stoneId: ev.stoneId,
      eventType: ev.eventType,
      actor: ev.actor,
      location: ev.location,
      metadata: ev.metadata,
      recordedAt: ev.recordedAt,
      prevHash,
    });
    verified.push({ id: ev.id, ok: expected === ev.hash, expected });
    prevHash = ev.hash;
  }
  const allValid = verified.every((v) => v.ok);

  return (
    <div>
      <PageHeader
        title={`Chain · ${stone.qrCode}`}
        description={stone.roughStone ? `Originated from rough ${stone.roughStone.code}` : "Standalone stone"}
        action={<Link href="/traceability" className="btn-secondary text-sm">← All chains</Link>}
      />

      <div className={`card p-5 mb-6 ${allValid ? "bg-gradient-to-br from-emerald-50 to-emerald-100" : "bg-gradient-to-br from-red-50 to-red-100"}`}>
        <div className="flex items-center gap-3">
          {allValid ? (
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          ) : (
            <ShieldAlert className="w-8 h-8 text-red-600" />
          )}
          <div>
            <div className={`font-semibold ${allValid ? "text-emerald-900" : "text-red-900"}`}>
              {allValid ? "Chain integrity verified" : "Chain integrity broken"}
            </div>
            <div className="text-xs text-slate-700 mt-0.5">
              {stone.traceEvents.length} events · {verified.filter((v) => v.ok).length} match expected hash
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-4">Audit chain</h2>
        {stone.traceEvents.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">No events recorded.</p>
        ) : (
          <ol className="space-y-3">
            {stone.traceEvents.map((ev, idx) => {
              const v = verified[idx];
              return (
                <li key={ev.id} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-iris-100 text-iris-700 font-mono text-xs flex items-center justify-center">{idx + 1}</span>
                      <Badge tone="brand">{ev.eventType}</Badge>
                      <span className="text-sm">by {ev.actor}</span>
                      {ev.location && <span className="text-xs text-slate-500">· {ev.location}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={v.ok ? "green" : "red"}>{v.ok ? "Valid" : "Tampered"}</Badge>
                      <span className="text-xs text-slate-500">{formatDateTime(ev.recordedAt)}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs font-mono text-slate-500 break-all">
                    <div>prev: {ev.prevHash ?? "GENESIS"}</div>
                    <div>hash: {ev.hash}</div>
                  </div>
                  {ev.metadata && (
                    <pre className="mt-2 text-xs bg-slate-50 p-2 rounded overflow-x-auto">{ev.metadata}</pre>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
