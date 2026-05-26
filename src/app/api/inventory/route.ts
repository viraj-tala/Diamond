import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
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
    const item = await prisma.inventoryItem.create({
      data: {
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
      },
    });
    return NextResponse.json({ id: item.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg.includes("Unique") ? "SKU already exists" : "Failed to create" }, { status: 400 });
  }
}
