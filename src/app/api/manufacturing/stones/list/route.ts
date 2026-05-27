import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, stones } from "@/db";
import { requireSession } from "@/lib/session";

export async function GET() {
  await requireSession();
  const items = await db
    .select({ id: stones.id, qrCode: stones.qrCode })
    .from(stones)
    .orderBy(desc(stones.updatedAt))
    .limit(200);
  return NextResponse.json({ items });
}
