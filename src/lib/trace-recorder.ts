import { desc, eq } from "drizzle-orm";
import { db, traceEvents } from "@/db";
import { hashTraceEvent } from "@/lib/trace-hash";

interface RecordInput {
  stoneId: string;
  eventType: string;
  actor: string;
  location?: string;
  metadata?: Record<string, unknown>;
}

export async function recordTraceEvent({
  stoneId,
  eventType,
  actor,
  location,
  metadata,
}: RecordInput) {
  const [prev] = await db
    .select({ hash: traceEvents.hash })
    .from(traceEvents)
    .where(eq(traceEvents.stoneId, stoneId))
    .orderBy(desc(traceEvents.recordedAt))
    .limit(1);

  const recordedAt = new Date();
  const metaStr = metadata ? JSON.stringify(metadata) : null;
  const hash = hashTraceEvent({
    stoneId,
    eventType,
    actor,
    location: location ?? null,
    metadata: metaStr,
    recordedAt,
    prevHash: prev?.hash ?? null,
  });

  const [inserted] = await db
    .insert(traceEvents)
    .values({
      stoneId,
      eventType,
      actor,
      location: location ?? null,
      metadata: metaStr,
      recordedAt,
      prevHash: prev?.hash ?? null,
      hash,
    })
    .returning();

  return inserted;
}
