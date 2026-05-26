import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function YieldListPage() {
  const stones = await prisma.roughStone.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      cutPlans: {
        orderBy: { estProfit: "desc" },
        take: 1,
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="Yield Optimizer"
        description="Rough stones and their planned cut strategies."
        action={
          <Link href="/yield/new" className="btn-primary gap-2">
            <Plus className="w-4 h-4" />
            New rough
          </Link>
        }
      />

      {stones.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          No rough stones yet. <Link href="/yield/new" className="text-brand-600 font-medium">Add one</Link> to generate cut plans.
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Weight</th>
                <th>Color/Clarity</th>
                <th>Cost</th>
                <th>Best plan</th>
                <th>Est. profit</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {stones.map((s) => {
                const best = s.cutPlans[0];
                return (
                  <tr key={s.id}>
                    <td className="font-mono text-xs">{s.code}</td>
                    <td>{formatNumber(s.weightCt)} ct</td>
                    <td className="text-xs">{s.color}/{s.clarity}</td>
                    <td>{formatCurrency(s.weightCt * s.costPerCt)}</td>
                    <td className="text-xs">{best?.name ?? "—"}</td>
                    <td className="text-emerald-700 font-medium">{best ? formatCurrency(best.estProfit) : "—"}</td>
                    <td className="text-xs text-slate-500">{formatDate(s.createdAt)}</td>
                    <td>
                      <Link href={`/yield/${s.id}`} className="text-brand-600 text-xs font-medium">Open →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
