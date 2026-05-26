import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const schema = z.object({
  date: z.string(),
  piecesCompleted: z.number().int().min(0),
  recoveryPct: z.number().min(0).max(100),
  errors: z.number().int().min(0).default(0),
  machineHours: z.number().min(0).default(0),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await requireSession();
  const data = schema.parse(await req.json());
  const date = new Date(data.date);

  await prisma.workerDailyLog.upsert({
    where: { workerId_date: { workerId: params.id, date } },
    update: {
      piecesCompleted: data.piecesCompleted,
      recoveryPct: data.recoveryPct,
      errors: data.errors,
      machineHours: data.machineHours,
    },
    create: {
      workerId: params.id,
      date,
      piecesCompleted: data.piecesCompleted,
      recoveryPct: data.recoveryPct,
      errors: data.errors,
      machineHours: data.machineHours,
    },
  });
  return NextResponse.json({ ok: true });
}
