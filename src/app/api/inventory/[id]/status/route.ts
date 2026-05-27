import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, inventoryItems } from "@/db";
import { requireSession } from "@/lib/session";
import { INVENTORY_STATUSES } from "@/lib/constants";
import { recordTraceEvent } from "@/lib/trace-recorder";
import { emit } from "@/lib/event-bus";

const schema = z.object({
  status: z.enum(INVENTORY_STATUSES as unknown as [string, ...string[]]),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  const { status } = schema.parse(await req.json());

  const [item] = await db
    .update(inventoryItems)
    .set({ status: status as (typeof INVENTORY_STATUSES)[number] })
    .where(eq(inventoryItems.id, params.id))
    .returning();

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (status === "SOLD") {
    if (item.stoneId) {
      await recordTraceEvent({
        stoneId: item.stoneId,
        eventType: "SOLD",
        actor: session.user.name,
        metadata: { sku: item.sku, totalPrice: item.totalPrice },
      });
    }
    emit({
      type: "inventory:sold",
      itemId: item.id,
      sku: item.sku,
      totalPrice: item.totalPrice,
      caratWeight: item.caratWeight,
    });
  }

  return NextResponse.json({ ok: true });
}
