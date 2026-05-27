import { NextResponse } from "next/server";
import { z } from "zod";
import { db, inventoryItems } from "@/db";
import { requireSession } from "@/lib/session";

const schema = z.object({
  sku: z.string().min(1),
  shape: z.string(),
  caratWeight: z.number().positive(),
  color: z.string(),
  clarity: z.string(),
  pricePerCt: z.number().min(0),
  certBody: z.string().optional(),
  certificateNo: z.string().optional(),
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  location: z.string().optional(),
  stoneId: z.string().optional(),
});

export async function POST(req: Request) {
  await requireSession();
  const data = schema.parse(await req.json());
  const totalPrice = data.caratWeight * data.pricePerCt;

  try {
    const [item] = await db
      .insert(inventoryItems)
      .values({
        sku: data.sku,
        shape: data.shape,
        caratWeight: data.caratWeight,
        color: data.color,
        clarity: data.clarity,
        pricePerCt: data.pricePerCt,
        totalPrice,
        certBody: data.certBody,
        certificateNo: data.certificateNo,
        imageUrl: data.imageUrl,
        videoUrl: data.videoUrl,
        location: data.location,
        stoneId: data.stoneId,
      })
      .returning({ id: inventoryItems.id });
    return NextResponse.json({ id: item.id });
  } catch (e: unknown) {
    const code = (e as { code?: string } | null)?.code;
    if (code === "23505") {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create" }, { status: 400 });
  }
}
