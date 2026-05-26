import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { recordTraceEvent } from "@/lib/trace-recorder";

const schema = z.object({
  qrCode: z.string().min(1),
  roughStoneId: z.string().nullable().optional(),
  startWeightCt: z.number().positive(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await requireSession();
  const data = schema.parse(await req.json());

  const stone = await prisma.stone.create({
    data: {
      qrCode: data.qrCode,
      roughStoneId: data.roughStoneId || null,
      startWeightCt: data.startWeightCt,
      currentWeightCt: data.startWeightCt,
      currentStage: "PLANNING",
      notes: data.notes,
      events: {
        create: {
          stage: "PLANNING",
          weightBefore: data.startWeightCt,
        },
      },
    },
  });

  await recordTraceEvent({
    stoneId: stone.id,
    eventType: "RECEIVED",
    actor: session.user.name,
    metadata: { startWeightCt: data.startWeightCt, roughStoneId: data.roughStoneId },
  });

  return NextResponse.json({ id: stone.id });
}
