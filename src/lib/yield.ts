import { estimatePricePerCt } from "@/lib/utils";

export interface PlanOutput {
  weightCt: number;
  shape: string;
  color: string;
  clarity: string;
  estPricePerCt: number;
}

export interface GeneratedPlan {
  name: string;
  strategy: string;
  expectedYieldPct: number;
  estRevenue: number;
  estCost: number;
  estProfit: number;
  notes: string;
  outputs: PlanOutput[];
}

interface Input {
  weightCt: number;
  color: string;
  clarity: string;
  shape: string;
  costPerCt: number;
}

// Heuristic plan generator. In production this would call a real planning engine
// (Sarine Advisor / Galaxy etc). The math here is deterministic so demos are
// reproducible.
export function generatePlans(input: Input): GeneratedPlan[] {
  const { weightCt, color, clarity, shape, costPerCt } = input;
  const totalCost = weightCt * costPerCt;

  const yieldA = 0.42;
  const outA: PlanOutput = {
    weightCt: +(weightCt * yieldA).toFixed(2),
    shape: shape || "ROUND",
    color,
    clarity,
    estPricePerCt: estimatePricePerCt(weightCt * yieldA, color, clarity, shape || "ROUND"),
  };
  const revA = outA.weightCt * outA.estPricePerCt;

  const yieldB = 0.52;
  const half = +(weightCt * yieldB * 0.5).toFixed(2);
  const outB1: PlanOutput = {
    weightCt: half,
    shape: shape || "ROUND",
    color,
    clarity,
    estPricePerCt: estimatePricePerCt(half, color, clarity, shape || "ROUND"),
  };
  const outB2: PlanOutput = { ...outB1 };
  const revB = (outB1.weightCt + outB2.weightCt) * outB1.estPricePerCt;

  const yieldC = 0.6;
  const outC: PlanOutput = {
    weightCt: +(weightCt * yieldC * 0.7).toFixed(2),
    shape: shape || "OVAL",
    color,
    clarity: weakenClarity(clarity),
    estPricePerCt: estimatePricePerCt(weightCt * yieldC * 0.7, color, weakenClarity(clarity), shape || "OVAL"),
  };
  const outC2: PlanOutput = {
    weightCt: +(weightCt * yieldC * 0.3).toFixed(2),
    shape: "PEAR",
    color,
    clarity: weakenClarity(clarity),
    estPricePerCt: estimatePricePerCt(weightCt * yieldC * 0.3, color, weakenClarity(clarity), "PEAR"),
  };
  const revC = outC.weightCt * outC.estPricePerCt + outC2.weightCt * outC2.estPricePerCt;

  return [
    {
      name: "Plan A · Single large stone",
      strategy: "single-large",
      expectedYieldPct: yieldA * 100,
      estRevenue: Math.round(revA),
      estCost: Math.round(totalCost),
      estProfit: Math.round(revA - totalCost),
      notes: "Maximizes per-carat price by keeping one premium stone.",
      outputs: [outA],
    },
    {
      name: "Plan B · Two equal stones",
      strategy: "two-stones",
      expectedYieldPct: yieldB * 100,
      estRevenue: Math.round(revB),
      estCost: Math.round(totalCost),
      estProfit: Math.round(revB - totalCost),
      notes: "Better recovery, but per-carat price drops at lower weight.",
      outputs: [outB1, outB2],
    },
    {
      name: "Plan C · Yield-max (lower clarity)",
      strategy: "yield-max",
      expectedYieldPct: yieldC * 100,
      estRevenue: Math.round(revC),
      estCost: Math.round(totalCost),
      estProfit: Math.round(revC - totalCost),
      notes: "Accepts one clarity grade drop to preserve weight.",
      outputs: [outC, outC2],
    },
  ];
}

function weakenClarity(c: string): string {
  const order = ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "I1", "I2", "I3"];
  const idx = order.indexOf(c.toUpperCase());
  if (idx === -1 || idx >= order.length - 1) return c;
  return order[idx + 1];
}
