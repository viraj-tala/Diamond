import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/session";
import { advanceStone, AdvanceStoneError } from "@/lib/advance-stone";

const schema = z.object({
  weightAfter: z.number().positive(),
  workerId: z.string().nullable().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  const data = schema.parse(await req.json());

  try {
    const result = await advanceStone({
      stoneId: params.id,
      weightAfter: data.weightAfter,
      workerId: data.workerId,
      notes: data.notes,
      actor: session.user.name ?? "unknown",
    });
    return NextResponse.json({ ok: true, nextStage: result.to });
  } catch (e) {
    if (e instanceof AdvanceStoneError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
