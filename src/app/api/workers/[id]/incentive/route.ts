import { NextResponse } from "next/server";
import { z } from "zod";
import { db, incentives } from "@/db";
import { requireSession } from "@/lib/session";

const schema = z.object({
  monthYear: z.string().regex(/^\d{4}-\d{2}$/),
  amount: z.number().min(0),
  basis: z.string(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await requireSession();
  const data = schema.parse(await req.json());

  await db
    .insert(incentives)
    .values({
      workerId: params.id,
      monthYear: data.monthYear,
      amount: data.amount,
      basis: data.basis,
    })
    .onConflictDoUpdate({
      target: [incentives.workerId, incentives.monthYear],
      set: { amount: data.amount, basis: data.basis },
    });

  return NextResponse.json({ ok: true });
}
