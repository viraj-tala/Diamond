import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { generatePlans } from "@/lib/yield";

const schema = z.object({
  code: z.string().min(1),
  weightCt: z.number().positive(),
  color: z.string(),
  clarity: z.string(),
  shape: z.string(),
  costPerCt: z.number().min(0),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await requireSession();
  const data = schema.parse(await req.json());

  const rough = await prisma.roughStone.create({
    data: {
      code: data.code,
      weightCt: data.weightCt,
      color: data.color,
      clarity: data.clarity,
      shape: data.shape,
      costPerCt: data.costPerCt,
      notes: data.notes,
    },
  });

  const plans = generatePlans(data);
  for (const plan of plans) {
    await prisma.cutPlan.create({
      data: {
        roughStoneId: rough.id,
        name: plan.name,
        strategy: plan.strategy,
        expectedYieldPct: plan.expectedYieldPct,
        estRevenue: plan.estRevenue,
        estCost: plan.estCost,
        estProfit: plan.estProfit,
        notes: plan.notes,
        createdById: session.user.id,
        outputs: { create: plan.outputs },
      },
    });
  }

  return NextResponse.json({ id: rough.id });
}
