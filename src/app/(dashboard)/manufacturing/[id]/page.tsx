import { notFound } from "next/navigation";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db, qualityChecks, stageEvents, stones, users } from "@/db";
import { PageHeader } from "@/components/PageHeader";
import { StageBadge } from "@/components/Badge";
import { formatDateTime, formatNumber } from "@/lib/utils";
import Link from "next/link";
import { AdvanceStageForm } from "./actions";
import { STAGES, STAGE_ORDER } from "@/lib/constants";

export default async function StoneDetailPage({ params }: { params: { id: string } }) {
  const stone = await db.query.stones.findFirst({
    where: eq(stones.id, params.id),
    with: {
      roughStone: true,
      events: {
        orderBy: [desc(stageEvents.startedAt)],
        with: { worker: { columns: { name: true } } },
      },
      qualityChecks: {
        orderBy: [desc(qualityChecks.createdAt)],
        limit: 3,
      },
    },
  });
  if (!stone) notFound();

  const workerOptions = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(inArray(users.role, ["WORKER", "SUPERVISOR"]))
    .orderBy(asc(users.name));

  const currentIdx = STAGE_ORDER[stone.currentStage as keyof typeof STAGE_ORDER] ?? 0;
  const nextStage = STAGES[currentIdx + 1];
  const totalLoss = stone.startWeightCt - stone.currentWeightCt;
  const lossPct = stone.startWeightCt > 0 ? (totalLoss / stone.startWeightCt) * 100 : 0;

  return (
    <div>
      <PageHeader
        title={stone.qrCode}
        description={
          <>
            {stone.roughStone ? `From rough ${stone.roughStone.code}` : "Standalone stone"}
            {stone.rfidTag && (
              <span className="ml-3 text-xs text-slate-500">
                RFID: <span className="font-mono">{stone.rfidTag}</span>
              </span>
            )}
            {stone.reworkCount > 0 && (
              <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                Reworked {stone.reworkCount}×
              </span>
            )}
          </>
        }
        action={<Link href="/manufacturing" className="btn-secondary text-sm">← Back</Link>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-xs text-slate-500">Current stage</div>
          <div className="mt-1"><StageBadge stage={stone.currentStage} /></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Start weight</div>
          <div className="text-xl font-semibold">{formatNumber(stone.startWeightCt)} ct</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Current weight</div>
          <div className="text-xl font-semibold">{formatNumber(stone.currentWeightCt)} ct</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Total loss</div>
          <div className="text-xl font-semibold text-red-600">
            {formatNumber(totalLoss)} ct
            <span className="ml-2 text-sm text-slate-500">({formatNumber(lossPct, 1)}%)</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-semibold mb-3">Stage history</h2>
          {stone.events.length === 0 ? (
            <div className="text-sm text-slate-500 py-6 text-center">No stage events yet.</div>
          ) : (
            <div className="space-y-3">
              {stone.events.map((e) => (
                <div key={e.id} className="border-l-2 border-slate-200 pl-4 py-1">
                  <div className="flex items-center justify-between">
                    <StageBadge stage={e.stage} />
                    <span className="text-xs text-slate-500">{formatDateTime(e.startedAt)}</span>
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {formatNumber(e.weightBefore)} ct → {e.weightAfter ? `${formatNumber(e.weightAfter)} ct` : "in progress"}
                    {e.lossCt != null && e.lossCt > 0 && (
                      <span className="ml-2 text-red-600">(-{formatNumber(e.lossCt)})</span>
                    )}
                    {e.worker?.name && <span className="ml-2 text-slate-500">· by {e.worker.name}</span>}
                  </div>
                  {e.notes && <div className="text-xs text-slate-500 mt-1">{e.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold mb-3">Advance stage</h2>
          {stone.currentStage === "COMPLETED" ? (
            <p className="text-sm text-slate-500">Stone has completed manufacturing.</p>
          ) : (
            <AdvanceStageForm
              stoneId={stone.id}
              currentStage={stone.currentStage}
              currentWeight={stone.currentWeightCt}
              nextStage={nextStage}
              workers={workerOptions}
            />
          )}

          {stone.qualityChecks.length > 0 && (
            <>
              <h3 className="font-semibold mt-6 mb-2 text-sm">Recent QC</h3>
              <ul className="text-xs space-y-2">
                {stone.qualityChecks.map((q) => (
                  <li key={q.id} className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>Score {formatNumber(q.overallScore, 0)}</span>
                    <span className="font-medium">{q.recommendation}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
