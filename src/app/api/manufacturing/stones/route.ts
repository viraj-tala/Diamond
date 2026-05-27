import { NextResponse } from "next/server";
import { z } from "zod";
import { db, stones, stageEvents } from "@/db";
import { requireSession } from "@/lib/session";
import { recordTraceEvent } from "@/lib/trace-recorder";
import { emit } from "@/lib/event-bus";

const schema = z.object({
  qrCode: z.string().min(1).max(64).trim(),
  rfidTag: z.string().min(1).max(64).trim().nullable().optional(),
  roughStoneId: z.string().nullable().optional(),
  startWeightCt: z.number().positive(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await requireSession();
  const data = schema.parse(await req.json());

  try {
    const stone = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(stones)
        .values({
          qrCode: data.qrCode,
          rfidTag: data.rfidTag || null,
          roughStoneId: data.roughStoneId || null,
          startWeightCt: data.startWeightCt,
          currentWeightCt: data.startWeightCt,
          currentStage: "PLANNING",
          notes: data.notes,
        })
        .returning();

      await tx.insert(stageEvents).values({
        stoneId: created.id,
        stage: "PLANNING",
        weightBefore: data.startWeightCt,
      });

      return created;
    });

    await recordTraceEvent({
      stoneId: stone.id,
      eventType: "RECEIVED",
      actor: session.user.name ?? "unknown",
      metadata: { startWeightCt: data.startWeightCt, roughStoneId: data.roughStoneId },
    });

    emit({
      type: "stone:created",
      stoneId: stone.id,
      qrCode: stone.qrCode,
      startWeightCt: data.startWeightCt,
      actor: session.user.name ?? "unknown",
    });

    return NextResponse.json({ id: stone.id });
  } catch (e: unknown) {
    const code = (e as { code?: string } | null)?.code;
    const constraint = (e as { constraint_name?: string } | null)?.constraint_name;
    if (code === "23505") {
      // Postgres unique violation — figure out which column collided so we can
      // tell the user something useful instead of "internal error".
      if (constraint?.includes("rfid")) {
        return NextResponse.json(
          { error: "That RFID tag is already assigned to another stone." },
          { status: 400 },
        );
      }
      if (constraint?.includes("rough")) {
        return NextResponse.json(
          { error: "That rough is already linked to a different stone." },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "That QR / barcode is already in use. Try another." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Could not create stone." }, { status: 500 });
  }
}
