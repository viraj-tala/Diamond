import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const schema = z.object({
  shape: z.string(),
  caratBucket: z.string(),
  color: z.string(),
  clarity: z.string(),
  source: z.string(),
  pricePerCt: z.number().min(0),
});

export async function POST(req: Request) {
  await requireSession();
  const data = schema.parse(await req.json());
  await prisma.pricePoint.create({ data });
  return NextResponse.json({ ok: true });
}
