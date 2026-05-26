import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";

const SELECTABLE = ROLES.filter((r) => r !== "ADMIN");

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(SELECTABLE as [string, ...string[]]),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const email = data.email.toLowerCase();

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { name: data.name, email, password: hashed, role: data.role },
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
