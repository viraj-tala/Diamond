import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { recordTraceEvent } from "@/lib/trace-recorder";

const schema = z.object({
  orderCode: z.string().min(1),
  vendorId: z.string(),
  jobType: z.string(),
  ratePerCt: z.number().min(0).default(0),
  stoneIds: z.array(z.string()).min(1),
});

export async function POST(req: Request) {
  const session = await requireSession();
  const data = schema.parse(await req.json());

  const stones = await prisma.stone.findMany({
    where: { id: { in: data.stoneIds } },
    select: { id: true, currentWeightCt: true, qrCode: true },
  });
  if (stones.length === 0) return NextResponse.json({ error: "No stones found" }, { status: 400 });

  const totalSent = stones.reduce((a, s) => a + s.currentWeightCt, 0);

  const order = await prisma.jobOrder.create({
    data: {
      orderCode: data.orderCode,
      vendorId: data.vendorId,
      jobType: data.jobType,
      ratePerCt: data.ratePerCt,
      totalSentCt: totalSent,
      totalPayment: 0,
      status: "SENT",
      items: {
        create: stones.map((s) => ({ stoneId: s.id, sentWeightCt: s.currentWeightCt })),
      },
    },
    include: { vendor: true },
  });

  await Promise.all(
    stones.map((s) =>
      recordTraceEvent({
        stoneId: s.id,
        eventType: "SENT_TO_VENDOR",
        actor: session.user.name,
        location: order.vendor.name,
        metadata: { orderCode: data.orderCode, weight: s.currentWeightCt },
      }),
    ),
  );

  return NextResponse.json({ id: order.id });
}
