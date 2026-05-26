import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  await requireSession();
  const items = await prisma.stone.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, qrCode: true },
    take: 200,
  });
  return NextResponse.json({ items });
}
