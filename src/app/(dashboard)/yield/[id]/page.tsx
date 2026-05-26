import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/Badge";
import { SelectPlanButton } from "./actions";
import Link from "next/link";

export default async function RoughDetailPage({ params }: { params: { id: string } }) {
  const rough = await prisma.roughStone.findUnique({
    where: { id: params.id },
    include: {
      cutPlans: {
        include: { outputs: true, createdBy: { select: { name: true } } },
        orderBy: { estProfit: "desc" },
      },
    },
  });
  if (!rough) notFound();

  const totalCost = rough.weightCt * rough.costPerCt;
  const best = rough.cutPlans[0];

  return (
    <div>
      <PageHeader
        title={rough.code}
        description={`${formatNumber(rough.weightCt)} ct rough · ${rough.color}/${rough.clarity}`}
        action={<Link href="/yield" className="btn-secondary text-sm">← Back</Link>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-xs text-slate-500">Weight</div>
          <div className="text-xl font-semibold">{formatNumber(rough.weightCt)} ct</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Cost basis</div>
          <div className="text-xl font-semibold">{formatCurrency(totalCost)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Best plan</div>
          <div className="text-sm font-semibold">{best?.name ?? "—"}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Est. profit</div>
          <div className="text-xl font-semibold text-emerald-700">{best ? formatCurrency(best.estProfit) : "—"}</div>
        </div>
      </div>

      <h2 className="font-semibold mb-3">Cut plan options</h2>
      <div className="grid lg:grid-cols-3 gap-4">
        {rough.cutPlans.map((p) => {
          const margin = p.estRevenue > 0 ? (p.estProfit / p.estRevenue) * 100 : 0;
          return (
            <div key={p.id} className={`card p-5 ${p.isSelected ? "ring-2 ring-brand-500" : ""}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Yield: {formatNumber(p.expectedYieldPct, 1)}%</div>
                </div>
                {p.isSelected && <Badge tone="brand">Selected</Badge>}
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <Row label="Revenue" value={formatCurrency(p.estRevenue)} />
                <Row label="Cost" value={formatCurrency(p.estCost)} />
                <Row label="Profit" value={<span className="text-emerald-700 font-semibold">{formatCurrency(p.estProfit)}</span>} />
                <Row label="Margin" value={`${formatNumber(margin, 1)}%`} />
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-xs font-medium text-slate-500 mb-2">Polished outputs</div>
                <ul className="text-xs space-y-1">
                  {p.outputs.map((o) => (
                    <li key={o.id} className="flex justify-between">
                      <span>{o.shape} · {formatNumber(o.weightCt)} ct · {o.color}/{o.clarity}</span>
                      <span className="text-slate-500">{formatCurrency(o.estPricePerCt)}/ct</span>
                    </li>
                  ))}
                </ul>
              </div>
              {p.notes && <p className="mt-3 text-xs text-slate-500">{p.notes}</p>}
              <div className="mt-4">
                <SelectPlanButton planId={p.id} roughId={rough.id} selected={p.isSelected} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
