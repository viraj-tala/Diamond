import { and, desc, eq, isNull } from "drizzle-orm";
import { db, qualityChecks, stageEvents, stones } from "@/db";
import { recordTraceEvent } from "@/lib/trace-recorder";
import { emit } from "@/lib/event-bus";
import { STAGES, STAGE_ORDER, type Stage } from "@/lib/constants";

export class AdvanceStoneError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "AdvanceStoneError";
  }
}

export interface AdvanceStoneInput {
  stoneId: string;
  weightAfter?: number;
  workerId?: string | null;
  notes?: string;
  actor: string;
  location?: string;
}

export interface AdvanceStoneResult {
  stoneId: string;
  from: Stage;
  to: Stage;
  weightAfter: number;
  lossCt: number;
}

export async function advanceStone(input: AdvanceStoneInput): Promise<AdvanceStoneResult> {
  const [stone] = await db.select().from(stones).where(eq(stones.id, input.stoneId)).limit(1);
  if (!stone) throw new AdvanceStoneError(404, "Stone not found");

  const from = stone.currentStage as Stage;
  const currentIdx = STAGE_ORDER[from] ?? 0;
  const to = STAGES[currentIdx + 1];
  if (!to) throw new AdvanceStoneError(400, "Stone already completed");

  // QC gate — can only advance from QC to CERTIFICATION if the latest
  // quality inspection is PASS. Prevents stones from being certified
  // while they have a pending REWORK or REJECT recommendation.
  if (from === "QC") {
    const [latestQc] = await db
      .select({ recommendation: qualityChecks.recommendation })
      .from(qualityChecks)
      .where(eq(qualityChecks.stoneId, stone.id))
      .orderBy(desc(qualityChecks.createdAt))
      .limit(1);
    if (!latestQc) {
      throw new AdvanceStoneError(
        400,
        "Run a quality inspection before advancing to CERTIFICATION.",
      );
    }
    if (latestQc.recommendation !== "PASS") {
      throw new AdvanceStoneError(
        400,
        `Latest QC result is ${latestQc.recommendation}. Stone must PASS quality control before advancing to CERTIFICATION.`,
      );
    }
  }

  // weightAfter is optional — scan-only advances (e.g. IoT gates without a scale)
  // default to the current weight, recording zero loss for that stage.
  const weightAfter = input.weightAfter ?? stone.currentWeightCt;
  if (weightAfter <= 0) {
    throw new AdvanceStoneError(400, "Weight after must be positive");
  }
  if (weightAfter > stone.currentWeightCt) {
    throw new AdvanceStoneError(400, "Weight after cannot exceed current weight");
  }
  const lossCt = stone.currentWeightCt - weightAfter;

  await db.transaction(async (tx) => {
    const [currentEvent] = await tx
      .select({ id: stageEvents.id })
      .from(stageEvents)
      .where(
        and(
          eq(stageEvents.stoneId, stone.id),
          eq(stageEvents.stage, stone.currentStage),
          isNull(stageEvents.completedAt),
        ),
      )
      .orderBy(desc(stageEvents.startedAt))
      .limit(1);

    if (currentEvent) {
      await tx
        .update(stageEvents)
        .set({
          completedAt: new Date(),
          weightAfter,
          lossCt,
          workerId: input.workerId || null,
          notes: input.notes,
        })
        .where(eq(stageEvents.id, currentEvent.id));
    }

    await tx
      .update(stones)
      .set({ currentStage: to, currentWeightCt: weightAfter })
      .where(eq(stones.id, stone.id));

    if (to !== "COMPLETED") {
      await tx.insert(stageEvents).values({
        stoneId: stone.id,
        stage: to,
        weightBefore: weightAfter,
      });
    }
  });

  await recordTraceEvent({
    stoneId: stone.id,
    eventType: to === "COMPLETED" ? "COMPLETED" : `STAGE_${to}`,
    actor: input.actor,
    location: input.location,
    metadata: { from, to, weightAfter, lossCt },
  });

  emit({
    type: "stone:advanced",
    stoneId: stone.id,
    qrCode: stone.qrCode,
    from,
    to,
    weightAfter,
    lossCt,
    actor: input.actor,
  });

  return { stoneId: stone.id, from, to, weightAfter, lossCt };
}
