import { NextResponse } from "next/server";
import { z } from "zod";
import { db, workerDailyLogs } from "@/db";
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

  await db
    .insert(workerDailyLogs)
    .values({
      workerId: params.id,
      date,
      piecesCompleted: data.piecesCompleted,
      recoveryPct: data.recoveryPct,
      errors: data.errors,
      machineHours: data.machineHours,
    })
    .onConflictDoUpdate({
      target: [workerDailyLogs.workerId, workerDailyLogs.date],
      set: {
        piecesCompleted: data.piecesCompleted,
        recoveryPct: data.recoveryPct,
        errors: data.errors,
        machineHours: data.machineHours,
      },
    });

  return NextResponse.json({ ok: true });
}
