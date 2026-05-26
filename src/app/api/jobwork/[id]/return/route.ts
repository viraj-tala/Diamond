import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { recordTraceEvent } from "@/lib/trace-recorder";

const schema = z.object({
  items: z.array(z.object({
    id: z.string(),
    stoneId: z.string(),
    returnWeightCt: z.number().min(0),
  })),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  const data = schema.parse(await req.json());

  const order = await prisma.jobOrder.findUnique({ where: { id: params.id }, include: { vendor: true } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let totalReturn = 0;
  await prisma.$transaction(async (tx) => {
    for (const it of data.items) {
      await tx.jobOrderItem.update({ where: { id: it.id }, data: { returnWeightCt: it.returnWeightCt } });
      await tx.stone.update({
        where: { id: it.stoneId },
        data: { currentWeightCt: it.returnWeightCt },
      });
      totalReturn += it.returnWeightCt;
    }
    const loss = order.totalSentCt - totalReturn;
    const payment = order.ratePerCt * totalReturn;
    await tx.jobOrder.update({
      where: { id: params.id },
      data: {
        totalReturnCt: totalReturn,
        lossCt: loss,
        returnedAt: new Date(),
        status: "RETURNED",
        totalPayment: payment,
      },
    });
  });

  await Promise.all(
    data.items.map((it) =>
      recordTraceEvent({
        stoneId: it.stoneId,
        eventType: "RETURNED_FROM_VENDOR",
        actor: session.user.name,
        location: order.vendor.name,
        metadata: { orderCode: order.orderCode, returnWeight: it.returnWeightCt },
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
