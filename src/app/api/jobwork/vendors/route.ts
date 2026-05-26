import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const schema = z.object({
  name: z.string().min(1),
  contact: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export async function GET() {
  await requireSession();
  const items = await prisma.vendor.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  await requireSession();
  const data = schema.parse(await req.json());
  try {
    const v = await prisma.vendor.create({ data });
    return NextResponse.json({ id: v.id });
  } catch {
    return NextResponse.json({ error: "Vendor name must be unique" }, { status: 400 });
  }
}
