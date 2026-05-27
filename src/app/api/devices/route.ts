import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { desc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db, devices } from "@/db";
import { requireRole } from "@/lib/session";

export async function GET() {
  await requireRole(["ADMIN", "OWNER"]);
  const rows = await db
    .select({
      id: devices.id,
      name: devices.name,
      location: devices.location,
      active: devices.active,
      lastSeenAt: devices.lastSeenAt,
      createdAt: devices.createdAt,
    })
    .from(devices)
    .orderBy(desc(devices.createdAt));
  return NextResponse.json({ items: rows });
}

const createSchema = z.object({
  name: z.string().min(1).max(80),
  location: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  await requireRole(["ADMIN", "OWNER"]);
  const data = createSchema.parse(await req.json());
  const id = createId();
  const secret = createId() + createId();
  const tokenHash = await bcrypt.hash(secret, 10);
  await db.insert(devices).values({
    id,
    name: data.name,
    location: data.location,
    tokenHash,
  });
  return NextResponse.json({
    id,
    name: data.name,
    token: `${id}.${secret}`,
  });
}
