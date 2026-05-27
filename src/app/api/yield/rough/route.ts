import { NextResponse } from "next/server";
import { z } from "zod";
import { db, roughStones, cutPlans, polishedOutputs } from "@/db";
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

  const plans = generatePlans(data);

  try {
    const roughId = await db.transaction(async (tx) => {
      const [rough] = await tx
        .insert(roughStones)
        .values({
          code: data.code,
          weightCt: data.weightCt,
          color: data.color,
          clarity: data.clarity,
          shape: data.shape,
          costPerCt: data.costPerCt,
          notes: data.notes,
        })
        .returning({ id: roughStones.id });

      for (const plan of plans) {
        const [createdPlan] = await tx
          .insert(cutPlans)
          .values({
            roughStoneId: rough.id,
            name: plan.name,
            strategy: plan.strategy,
            expectedYieldPct: plan.expectedYieldPct,
            estRevenue: plan.estRevenue,
            estCost: plan.estCost,
            estProfit: plan.estProfit,
            notes: plan.notes,
            createdById: session.user.id,
          })
          .returning({ id: cutPlans.id });

        if (plan.outputs.length > 0) {
          await tx.insert(polishedOutputs).values(
            plan.outputs.map((o) => ({
              planId: createdPlan.id,
              weightCt: o.weightCt,
              shape: o.shape,
              color: o.color,
              clarity: o.clarity,
              estPricePerCt: o.estPricePerCt,
            })),
          );
        }
      }

      return rough.id;
    });

    return NextResponse.json({ id: roughId });
  } catch (e: unknown) {
    const code = (e as { code?: string } | null)?.code;
    if (code === "23505") {
      return NextResponse.json(
        { error: "That rough code is already in use. Try another." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Could not create rough stone." }, { status: 500 });
  }
}
