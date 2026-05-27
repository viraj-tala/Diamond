import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, users, workers } from "@/db";
import { requireSession } from "@/lib/session";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  employeeCode: z.string().min(1),
  department: z.string(),
  hourlyRate: z.number().min(0).default(0),
});

export async function POST(req: Request) {
  await requireSession();
  const data = schema.parse(await req.json());

  const email = data.email.toLowerCase();

  try {
    const workerId = await db.transaction(async (tx) => {
      const [existingUser] = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (existingUser) throw new Error("EMAIL_IN_USE");

      const [existingCode] = await tx
        .select({ id: workers.id })
        .from(workers)
        .where(eq(workers.employeeCode, data.employeeCode))
        .limit(1);
      if (existingCode) throw new Error("CODE_IN_USE");

      const [user] = await tx
        .insert(users)
        .values({
          name: data.name,
          email,
          password: await bcrypt.hash(data.password, 10),
          role: "WORKER",
        })
        .returning({ id: users.id });

      const [worker] = await tx
        .insert(workers)
        .values({
          userId: user.id,
          employeeCode: data.employeeCode,
          department: data.department,
          hourlyRate: data.hourlyRate,
        })
        .returning({ id: workers.id });

      return worker.id;
    });

    return NextResponse.json({ id: workerId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "EMAIL_IN_USE") {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
    if (msg === "CODE_IN_USE") {
      return NextResponse.json({ error: "Employee code already in use" }, { status: 400 });
    }
    const code = (e as { code?: string } | null)?.code;
    if (code === "23505") {
      return NextResponse.json({ error: "Email or employee code already in use" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create worker" }, { status: 500 });
  }
}
