import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, inventoryItems, marketplaceListings } from "@/db";
import { requireSession } from "@/lib/session";

const postSchema = z.object({
  listPrice: z.number().min(0),
  description: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  const data = postSchema.parse(await req.json());

  await db.transaction(async (tx) => {
    await tx
      .insert(marketplaceListings)
      .values({
        itemId: params.id,
        sellerId: session.user.id,
        listPrice: data.listPrice,
        description: data.description,
        isPublic: true,
      })
      .onConflictDoUpdate({
        target: marketplaceListings.itemId,
        set: {
          listPrice: data.listPrice,
          description: data.description,
          isPublic: true,
        },
      });

    await tx
      .update(inventoryItems)
      .set({ status: "LISTED" })
      .where(eq(inventoryItems.id, params.id));
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await requireSession();

  await db.transaction(async (tx) => {
    await tx
      .delete(marketplaceListings)
      .where(eq(marketplaceListings.itemId, params.id));
    await tx
      .update(inventoryItems)
      .set({ status: "IN_STOCK" })
      .where(eq(inventoryItems.id, params.id));
  });

  return NextResponse.json({ ok: true });
}
