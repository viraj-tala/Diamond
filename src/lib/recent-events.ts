import { desc, eq, inArray } from "drizzle-orm";
import { db, stones, traceEvents } from "@/db";
import type { LiveEvent } from "@/lib/event-types";

const FEED_EVENT_TYPES = [
  "RECEIVED",
  "STAGE_SAWING",
  "STAGE_BRUTING",
  "STAGE_POLISHING",
  "STAGE_QC",
  "STAGE_CERTIFICATION",
  "COMPLETED",
  "QC_INSPECTED",
  "REWORK_REGRESSED",
] as const;

/**
 * Pulls the most recent factory-floor events from the audit chain and converts
 * them to the same shape the live SSE stream emits. Used to hydrate the Live
 * Activity feed on initial render so the panel is never empty on first load.
 */
export async function getRecentLiveEvents(limit = 8): Promise<LiveEvent[]> {
  const rows = await db
    .select({
      eventType: traceEvents.eventType,
      actor: traceEvents.actor,
      metadata: traceEvents.metadata,
      recordedAt: traceEvents.recordedAt,
      stoneId: traceEvents.stoneId,
      qrCode: stones.qrCode,
    })
    .from(traceEvents)
    .innerJoin(stones, eq(stones.id, traceEvents.stoneId))
    .where(inArray(traceEvents.eventType, FEED_EVENT_TYPES as unknown as string[]))
    .orderBy(desc(traceEvents.recordedAt))
    .limit(limit);

  return rows
    .map((row): LiveEvent | null => {
      const ts = row.recordedAt.toISOString();
      let meta: Record<string, unknown> = {};
      if (row.metadata) {
        try {
          meta = JSON.parse(row.metadata) as Record<string, unknown>;
        } catch {
          /* malformed metadata — fall through with empty meta */
        }
      }

      if (row.eventType === "RECEIVED") {
        return {
          type: "stone:created",
          stoneId: row.stoneId,
          qrCode: row.qrCode,
          startWeightCt: Number(meta.startWeightCt ?? 0),
          actor: row.actor,
          ts,
        };
      }
      if (row.eventType === "QC_INSPECTED") {
        const rec = meta.recommendation;
        const recommendation =
          rec === "PASS" || rec === "REWORK" || rec === "REJECT" ? rec : "PASS";
        return {
          type: "qc:inspected",
          stoneId: row.stoneId,
          qrCode: row.qrCode,
          recommendation,
          score: Number(meta.score ?? 0),
          ts,
        };
      }
      if (row.eventType === "REWORK_REGRESSED") {
        return {
          type: "stone:rework",
          stoneId: row.stoneId,
          qrCode: row.qrCode,
          fromStage: String(meta.fromStage ?? ""),
          reworkCount: Number(meta.reworkCount ?? 1),
          score: Number(meta.score ?? 0),
          actor: row.actor,
          ts,
        };
      }
      // STAGE_* and COMPLETED → stone:advanced
      return {
        type: "stone:advanced",
        stoneId: row.stoneId,
        qrCode: row.qrCode,
        from: String(meta.from ?? ""),
        to: String(meta.to ?? ""),
        weightAfter: Number(meta.weightAfter ?? 0),
        lossCt: Number(meta.lossCt ?? 0),
        actor: row.actor,
        ts,
      };
    })
    .filter((e): e is LiveEvent => e !== null);
}
