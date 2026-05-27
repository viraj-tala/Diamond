import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { db, devices, scanEvents, stones } from "@/db";
import { getSession } from "@/lib/session";
import { advanceStone, AdvanceStoneError } from "@/lib/advance-stone";

const schema = z.object({
  code: z.string().min(1),
  weightAfter: z.number().positive().optional(),
  workerId: z.string().nullable().optional(),
  notes: z.string().optional(),
  clientEventId: z.string().min(1).max(128).optional(),
});

// Device tokens are formatted "{deviceId}.{secret}" — the prefix lets us index
// lookup without scanning every device row.
async function authenticateDevice(req: Request) {
  const token = req.headers.get("x-device-token");
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const deviceId = token.slice(0, dot);
  const secret = token.slice(dot + 1);
  if (!secret) return null;

  const [device] = await db.select().from(devices).where(eq(devices.id, deviceId)).limit(1);
  if (!device || !device.active) return null;

  const ok = await bcrypt.compare(secret, device.tokenHash);
  return ok ? device : null;
}

export async function POST(req: Request) {
  const data = schema.parse(await req.json());

  const device = await authenticateDevice(req);
  let userId: string | null = null;
  let actor: string;
  let location: string | undefined;

  if (device) {
    actor = `device:${device.name}`;
    location = device.location ?? undefined;
  } else {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = (session.user as { id?: string }).id ?? null;
    actor = session.user.name ?? "unknown";
  }

  const [stone] = await db
    .select()
    .from(stones)
    .where(or(eq(stones.qrCode, data.code), eq(stones.rfidTag, data.code)))
    .limit(1);
  if (!stone) {
    return NextResponse.json({ error: "Stone not found for code" }, { status: 404 });
  }

  // Idempotency: devices retry on flaky Wi-Fi; the clientEventId lets the
  // server recognize a duplicate and return the prior result instead of
  // advancing the stone twice.
  let idempotencyKey: string | null = null;
  if (device && data.clientEventId) {
    idempotencyKey = `device:${device.id}:${data.clientEventId}`;
    const [existing] = await db
      .select()
      .from(scanEvents)
      .where(eq(scanEvents.idempotencyKey, idempotencyKey))
      .limit(1);
    if (existing) {
      return NextResponse.json({
        ok: true,
        idempotent: true,
        from: existing.fromStage,
        to: existing.toStage,
      });
    }
  }

  try {
    const result = await advanceStone({
      stoneId: stone.id,
      weightAfter: data.weightAfter,
      workerId: data.workerId,
      notes: data.notes,
      actor,
      location,
    });

    await db.insert(scanEvents).values({
      stoneId: stone.id,
      deviceId: device?.id ?? null,
      userId,
      scanCode: data.code,
      fromStage: result.from,
      toStage: result.to,
      weightAfter: result.weightAfter,
      idempotencyKey,
    });

    if (device) {
      await db.update(devices).set({ lastSeenAt: new Date() }).where(eq(devices.id, device.id));
    }

    return NextResponse.json({
      ok: true,
      stoneId: stone.id,
      qrCode: stone.qrCode,
      from: result.from,
      to: result.to,
      weightAfter: result.weightAfter,
      lossCt: result.lossCt,
    });
  } catch (e) {
    if (e instanceof AdvanceStoneError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
