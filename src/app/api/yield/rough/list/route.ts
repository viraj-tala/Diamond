import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, roughStones } from "@/db";
import { requireSession } from "@/lib/session";

export async function GET() {
  await requireSession();
  const items = await db
    .select({
      id: roughStones.id,
      code: roughStones.code,
      weightCt: roughStones.weightCt,
    })
    .from(roughStones)
    .orderBy(desc(roughStones.createdAt))
    .limit(200);
  return NextResponse.json({ items });
}
