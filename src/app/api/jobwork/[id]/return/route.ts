import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, jobOrders, jobOrderItems, stones, vendors } from "@/db";
import { requireSession } from "@/lib/session";
import { recordTraceEvent } from "@/lib/trace-recorder";

const schema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      stoneId: z.string(),
      returnWeightCt: z.number().min(0),
    }),
  ),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  const data = schema.parse(await req.json());

  const [order] = await db
    .select({
      id: jobOrders.id,
      orderCode: jobOrders.orderCode,
      totalSentCt: jobOrders.totalSentCt,
      ratePerCt: jobOrders.ratePerCt,
      vendorName: vendors.name,
    })
    .from(jobOrders)
    .innerJoin(vendors, eq(jobOrders.vendorId, vendors.id))
    .where(eq(jobOrders.id, params.id))
    .limit(1);

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const totalReturn = data.items.reduce((a, it) => a + it.returnWeightCt, 0);
  const loss = order.totalSentCt - totalReturn;
  const payment = order.ratePerCt * totalReturn;

  await db.transaction(async (tx) => {
    for (const it of data.items) {
      await tx
        .update(jobOrderItems)
        .set({ returnWeightCt: it.returnWeightCt })
        .where(eq(jobOrderItems.id, it.id));
      await tx
        .update(stones)
        .set({ currentWeightCt: it.returnWeightCt })
        .where(eq(stones.id, it.stoneId));
    }
    await tx
      .update(jobOrders)
      .set({
        totalReturnCt: totalReturn,
        lossCt: loss,
        returnedAt: new Date(),
        status: "RETURNED",
        totalPayment: payment,
      })
      .where(eq(jobOrders.id, params.id));
  });

  await Promise.all(
    data.items.map((it) =>
      recordTraceEvent({
        stoneId: it.stoneId,
        eventType: "RETURNED_FROM_VENDOR",
        actor: session.user.name,
        location: order.vendorName,
        metadata: { orderCode: order.orderCode, returnWeight: it.returnWeightCt },
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
