import { NextResponse } from "next/server";
import { z } from "zod";
import { inArray, eq } from "drizzle-orm";
import { db, jobOrders, jobOrderItems, stones, vendors } from "@/db";
import { requireSession } from "@/lib/session";
import { recordTraceEvent } from "@/lib/trace-recorder";
import { JOB_TYPES } from "@/lib/constants";

const schema = z.object({
  orderCode: z.string().min(1),
  vendorId: z.string(),
  jobType: z.enum(JOB_TYPES as unknown as [string, ...string[]]),
  ratePerCt: z.number().min(0).default(0),
  stoneIds: z.array(z.string()).min(1),
});

export async function POST(req: Request) {
  const session = await requireSession();
  const data = schema.parse(await req.json());

  const sentStones = await db
    .select({
      id: stones.id,
      currentWeightCt: stones.currentWeightCt,
      qrCode: stones.qrCode,
    })
    .from(stones)
    .where(inArray(stones.id, data.stoneIds));

  if (sentStones.length === 0) {
    return NextResponse.json({ error: "No stones found" }, { status: 400 });
  }

  const totalSent = sentStones.reduce((a, s) => a + s.currentWeightCt, 0);

  const [vendor] = await db
    .select({ name: vendors.name })
    .from(vendors)
    .where(eq(vendors.id, data.vendorId))
    .limit(1);

  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 400 });

  try {
    const order = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(jobOrders)
        .values({
          orderCode: data.orderCode,
          vendorId: data.vendorId,
          jobType: data.jobType as (typeof JOB_TYPES)[number],
          ratePerCt: data.ratePerCt,
          totalSentCt: totalSent,
          totalPayment: 0,
          status: "SENT",
        })
        .returning();

      await tx.insert(jobOrderItems).values(
        sentStones.map((s) => ({
          orderId: created.id,
          stoneId: s.id,
          sentWeightCt: s.currentWeightCt,
        })),
      );

      return created;
    });

    await Promise.all(
      sentStones.map((s) =>
        recordTraceEvent({
          stoneId: s.id,
          eventType: "SENT_TO_VENDOR",
          actor: session.user.name,
          location: vendor.name,
          metadata: { orderCode: data.orderCode, weight: s.currentWeightCt },
        }),
      ),
    );

    return NextResponse.json({ id: order.id });
  } catch (e: unknown) {
    const code = (e as { code?: string } | null)?.code;
    if (code === "23505") {
      return NextResponse.json(
        { error: "That order code is already in use. Try another." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Could not create job order." }, { status: 500 });
  }
}
