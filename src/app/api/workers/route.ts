import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
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
  const existsUser = await prisma.user.findUnique({ where: { email } });
  if (existsUser) return NextResponse.json({ error: "Email already in use" }, { status: 400 });

  const existsCode = await prisma.worker.findUnique({ where: { employeeCode: data.employeeCode } });
  if (existsCode) return NextResponse.json({ error: "Employee code already in use" }, { status: 400 });

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email,
      password: await bcrypt.hash(data.password, 10),
      role: "WORKER",
      workerProfile: {
        create: {
          employeeCode: data.employeeCode,
          department: data.department,
          hourlyRate: data.hourlyRate,
        },
      },
    },
    include: { workerProfile: true },
  });

  return NextResponse.json({ id: user.workerProfile?.id });
}
