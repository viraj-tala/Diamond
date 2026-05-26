import { prisma } from "@/lib/prisma";
import { hashTraceEvent } from "@/lib/trace-hash";

interface RecordInput {
  stoneId: string;
  eventType: string;
  actor: string;
  location?: string;
  metadata?: Record<string, unknown>;
}

export async function recordTraceEvent({ stoneId, eventType, actor, location, metadata }: RecordInput) {
  const prev = await prisma.traceEvent.findFirst({
    where: { stoneId },
    orderBy: { recordedAt: "desc" },
  });

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

  return prisma.traceEvent.create({
    data: {
      stoneId,
      eventType,
      actor,
      location: location ?? null,
      metadata: metaStr,
      recordedAt,
      prevHash: prev?.hash ?? null,
      hash,
    },
  });
}
