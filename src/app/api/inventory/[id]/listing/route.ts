import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const postSchema = z.object({
  listPrice: z.number().min(0),
  description: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  const data = postSchema.parse(await req.json());

  await prisma.$transaction([
    prisma.marketplaceListing.upsert({
      where: { itemId: params.id },
      update: { listPrice: data.listPrice, description: data.description, isPublic: true },
      create: {
        itemId: params.id,
        sellerId: session.user.id,
        listPrice: data.listPrice,
        description: data.description,
        isPublic: true,
      },
    }),
    prisma.inventoryItem.update({
      where: { id: params.id },
      data: { status: "LISTED" },
    }),
  ]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await requireSession();
  await prisma.$transaction([
    prisma.marketplaceListing.deleteMany({ where: { itemId: params.id } }),
    prisma.inventoryItem.update({ where: { id: params.id }, data: { status: "IN_STOCK" } }),
  ]);
  return NextResponse.json({ ok: true });
}
