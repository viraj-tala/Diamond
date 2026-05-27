import { NextResponse } from "next/server";
import { z } from "zod";
import { asc } from "drizzle-orm";
import { db, vendors } from "@/db";
import { requireSession } from "@/lib/session";

const schema = z.object({
  name: z.string().min(1),
  contact: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export async function GET() {
  await requireSession();
  const items = await db
    .select({ id: vendors.id, name: vendors.name })
    .from(vendors)
    .orderBy(asc(vendors.name));
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  await requireSession();
  const data = schema.parse(await req.json());
  try {
    const [v] = await db.insert(vendors).values(data).returning({ id: vendors.id });
    return NextResponse.json({ id: v.id });
  } catch (e: unknown) {
    const code = (e as { code?: string } | null)?.code;
    if (code === "23505") {
      return NextResponse.json({ error: "Vendor name must be unique" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create" }, { status: 400 });
  }
}
