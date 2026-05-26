import crypto from "node:crypto";

export function hashTraceEvent(payload: {
  stoneId: string;
  eventType: string;
  actor: string;
  location: string | null;
  metadata: string | null;
  recordedAt: Date;
  prevHash: string | null;
}): string {
  const canonical = [
    payload.stoneId,
    payload.eventType,
    payload.actor,
    payload.location ?? "",
    payload.metadata ?? "",
    payload.recordedAt.toISOString(),
    payload.prevHash ?? "GENESIS",
  ].join("|");
  return crypto.createHash("sha256").update(canonical).digest("hex");
}
