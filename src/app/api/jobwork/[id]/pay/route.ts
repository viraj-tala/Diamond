import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const schema = z.object({ paid: z.boolean() });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await requireSession();
  const { paid } = schema.parse(await req.json());
  await prisma.jobOrder.update({ where: { id: params.id }, data: { paid, status: paid ? "CLOSED" : "RETURNED" } });
  return NextResponse.json({ ok: true });
}
