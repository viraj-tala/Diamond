import { NextResponse } from "next/server";
import { z } from "zod";
import { db, pricePoints } from "@/db";
import { requireSession } from "@/lib/session";

const PRICE_SOURCES = ["RAPAPORT", "IDEX", "MANUAL"] as const;

const schema = z.object({
  shape: z.string(),
  caratBucket: z.string(),
  color: z.string(),
  clarity: z.string(),
  source: z.enum(PRICE_SOURCES),
  pricePerCt: z.number().min(0),
});

export async function POST(req: Request) {
  await requireSession();
  const data = schema.parse(await req.json());
  await db.insert(pricePoints).values(data);
  return NextResponse.json({ ok: true });
}
