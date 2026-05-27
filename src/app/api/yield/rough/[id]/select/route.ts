import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, cutPlans } from "@/db";
import { requireSession } from "@/lib/session";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await requireSession();
  const { planId } = (await req.json()) as { planId: string };

  await db.transaction(async (tx) => {
    await tx
      .update(cutPlans)
      .set({ isSelected: false })
      .where(eq(cutPlans.roughStoneId, params.id));
    await tx
      .update(cutPlans)
      .set({ isSelected: true })
      .where(eq(cutPlans.id, planId));
  });

  return NextResponse.json({ ok: true });
}
