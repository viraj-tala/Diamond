import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await requireSession();
  const { planId } = await req.json();

  await prisma.cutPlan.updateMany({
    where: { roughStoneId: params.id },
    data: { isSelected: false },
  });
  await prisma.cutPlan.update({
    where: { id: planId },
    data: { isSelected: true },
  });

  return NextResponse.json({ ok: true });
}
