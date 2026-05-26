import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { recordTraceEvent } from "@/lib/trace-recorder";
import { STAGES, STAGE_ORDER, type Stage } from "@/lib/constants";

const schema = z.object({
  weightAfter: z.number().positive(),
  workerId: z.string().nullable().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  const data = schema.parse(await req.json());

  const stone = await prisma.stone.findUnique({ where: { id: params.id } });
  if (!stone) return NextResponse.json({ error: "Stone not found" }, { status: 404 });

  const currentIdx = STAGE_ORDER[stone.currentStage as Stage] ?? 0;
  const nextStage = STAGES[currentIdx + 1];
  if (!nextStage) return NextResponse.json({ error: "Already completed" }, { status: 400 });

  if (data.weightAfter > stone.currentWeightCt) {
    return NextResponse.json({ error: "Weight after cannot exceed current weight" }, { status: 400 });
  }

  const loss = stone.currentWeightCt - data.weightAfter;

  await prisma.$transaction(async (tx) => {
    const currentEvent = await tx.stageEvent.findFirst({
      where: { stoneId: stone.id, stage: stone.currentStage, completedAt: null },
      orderBy: { startedAt: "desc" },
    });
    if (currentEvent) {
      await tx.stageEvent.update({
        where: { id: currentEvent.id },
        data: {
          completedAt: new Date(),
          weightAfter: data.weightAfter,
          lossCt: loss,
          workerId: data.workerId || null,
          notes: data.notes,
        },
      });
    }

    await tx.stone.update({
      where: { id: stone.id },
      data: { currentStage: nextStage, currentWeightCt: data.weightAfter },
    });

    if (nextStage !== "COMPLETED") {
      await tx.stageEvent.create({
        data: {
          stoneId: stone.id,
          stage: nextStage,
          weightBefore: data.weightAfter,
        },
      });
    }
  });

  await recordTraceEvent({
    stoneId: stone.id,
    eventType: nextStage === "COMPLETED" ? "COMPLETED" : `STAGE_${nextStage}`,
    actor: session.user.name,
    metadata: { from: stone.currentStage, to: nextStage, weightAfter: data.weightAfter, lossCt: loss },
  });

  return NextResponse.json({ ok: true, nextStage });
}
