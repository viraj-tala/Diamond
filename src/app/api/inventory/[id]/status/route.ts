import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { INVENTORY_STATUSES } from "@/lib/constants";
import { recordTraceEvent } from "@/lib/trace-recorder";

const schema = z.object({ status: z.enum(INVENTORY_STATUSES as unknown as [string, ...string[]]) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  const { status } = schema.parse(await req.json());

  const item = await prisma.inventoryItem.update({
    where: { id: params.id },
    data: { status },
  });

  if (status === "SOLD" && item.stoneId) {
    await recordTraceEvent({
      stoneId: item.stoneId,
      eventType: "SOLD",
      actor: session.user.name,
      metadata: { sku: item.sku, totalPrice: item.totalPrice },
    });
  }

  return NextResponse.json({ ok: true });
}
