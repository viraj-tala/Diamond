import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db, qualityChecks, stageEvents, stones } from "@/db";
import { requireSession } from "@/lib/session";
import { detectDefects } from "@/lib/quality-stub";
import { recordTraceEvent } from "@/lib/trace-recorder";
import { emit } from "@/lib/event-bus";
import { STAGE_ORDER, type Stage } from "@/lib/constants";

const schema = z.object({
  stoneId: z.string(),
  imageUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await requireSession();
  const data = schema.parse(await req.json());

  const [stone] = await db
    .select({
      id: stones.id,
      qrCode: stones.qrCode,
      currentStage: stones.currentStage,
      currentWeightCt: stones.currentWeightCt,
      reworkCount: stones.reworkCount,
    })
    .from(stones)
    .where(eq(stones.id, data.stoneId))
    .limit(1);

  if (!stone) {
    return NextResponse.json({ error: "Stone not found" }, { status: 404 });
  }

  const seed = data.imageUrl ?? `${data.stoneId}-${Date.now()}`;
  const result = detectDefects(seed);

  const [qc] = await db
    .insert(qualityChecks)
    .values({
      stoneId: data.stoneId,
      inspectorId: session.user.id,
      imageUrl: data.imageUrl,
      defectsFound: JSON.stringify(result.defects),
      defectCount: result.defectCount,
      overallScore: result.overallScore,
      recommendation: result.recommendation,
      notes: data.notes,
    })
    .returning({ id: qualityChecks.id });

  await recordTraceEvent({
    stoneId: data.stoneId,
    eventType: "QC_INSPECTED",
    actor: session.user.name,
    metadata: {
      score: result.overallScore,
      recommendation: result.recommendation,
      defects: result.defects,
    },
  });

  emit({
    type: "qc:inspected",
    stoneId: data.stoneId,
    qrCode: stone.qrCode,
    recommendation: result.recommendation,
    score: result.overallScore,
  });

  // ─── REWORK regression ──────────────────────────────────────
  // If the QC says REWORK and the stone is at or past POLISHING,
  // send it back to POLISHING and bump its rework counter. This is
  // the standard factory loop: a stone fails inspection, it goes
  // back to the polisher. Works even if the stone is already
  // CERTIFICATION/COMPLETED (post-completion spot check found a defect).
  // ────────────────────────────────────────────────────────────
  let newReworkCount = stone.reworkCount;
  let regressedFrom: string | null = null;
  if (result.recommendation === "REWORK") {
    const fromIdx = STAGE_ORDER[stone.currentStage as Stage];
    const polishingIdx = STAGE_ORDER["POLISHING"];
    if (fromIdx >= polishingIdx) {
      newReworkCount = stone.reworkCount + 1;
      regressedFrom = stone.currentStage;

      await db.transaction(async (tx) => {
        // Close any open stage event for the current stage.
        await tx
          .update(stageEvents)
          .set({ completedAt: new Date() })
          .where(
            sql`${stageEvents.stoneId} = ${stone.id}
              AND ${stageEvents.stage} = ${stone.currentStage}
              AND ${stageEvents.completedAt} IS NULL`,
          );

        // Regress the stone to POLISHING and bump the rework counter.
        await tx
          .update(stones)
          .set({
            currentStage: "POLISHING",
            reworkCount: newReworkCount,
          })
          .where(eq(stones.id, stone.id));

        // Open a new stage_events row for this rework cycle so the
        // timeline shows "POLISHING (rework #N)" cleanly.
        await tx.insert(stageEvents).values({
          stoneId: stone.id,
          stage: "POLISHING",
          weightBefore: stone.currentWeightCt,
          notes: `Rework #${newReworkCount} — sent back from ${stone.currentStage} after QC failure (score ${result.overallScore})`,
        });
      });

      await recordTraceEvent({
        stoneId: stone.id,
        eventType: "REWORK_REGRESSED",
        actor: session.user.name,
        metadata: {
          fromStage: stone.currentStage,
          toStage: "POLISHING",
          reworkCount: newReworkCount,
          score: result.overallScore,
          defects: result.defects,
        },
      });

      emit({
        type: "stone:rework",
        stoneId: stone.id,
        qrCode: stone.qrCode,
        fromStage: stone.currentStage,
        reworkCount: newReworkCount,
        score: result.overallScore,
        actor: session.user.name,
      });
    }
  }

  return NextResponse.json({
    id: qc.id,
    ...result,
    regressedFrom,
    reworkCount: newReworkCount,
  });
}
