import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, devices } from "@/db";
import { requireRole } from "@/lib/session";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  await requireRole(["ADMIN", "OWNER"]);
  await db.update(devices).set({ active: false }).where(eq(devices.id, params.id));
  return NextResponse.json({ ok: true });
}
