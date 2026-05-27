import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, jobOrders } from "@/db";
import { requireSession } from "@/lib/session";

const schema = z.object({ paid: z.boolean() });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await requireSession();
  const { paid } = schema.parse(await req.json());
  await db
    .update(jobOrders)
    .set({ paid, status: paid ? "CLOSED" : "RETURNED" })
    .where(eq(jobOrders.id, params.id));
  return NextResponse.json({ ok: true });
}
