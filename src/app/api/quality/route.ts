import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { detectDefects } from "@/lib/quality-stub";
import { recordTraceEvent } from "@/lib/trace-recorder";

const schema = z.object({
  stoneId: z.string(),
  imageUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await requireSession();
  const data = schema.parse(await req.json());

  const seed = data.imageUrl ?? `${data.stoneId}-${Date.now()}`;
  const result = detectDefects(seed);

  const qc = await prisma.qualityCheck.create({
    data: {
      stoneId: data.stoneId,
      inspectorId: session.user.id,
      imageUrl: data.imageUrl,
      defectsFound: JSON.stringify(result.defects),
      defectCount: result.defectCount,
      overallScore: result.overallScore,
      recommendation: result.recommendation,
      notes: data.notes,
    },
  });

  await recordTraceEvent({
    stoneId: data.stoneId,
    eventType: "QC_INSPECTED",
    actor: session.user.name,
    metadata: { score: result.overallScore, recommendation: result.recommendation, defects: result.defects },
  });

  return NextResponse.json({ id: qc.id, ...result });
}
