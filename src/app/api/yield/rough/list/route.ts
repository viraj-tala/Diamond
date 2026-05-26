import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  await requireSession();
  const items = await prisma.roughStone.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, code: true, weightCt: true },
    take: 200,
  });
  return NextResponse.json({ items });
}
