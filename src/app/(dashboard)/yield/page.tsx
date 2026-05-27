import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, cutPlans, roughStones } from "@/db";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { Gem, Plus } from "lucide-react";

export default async function YieldListPage() {
  const stones = await db.query.roughStones.findMany({
    orderBy: [desc(roughStones.createdAt)],
    with: {
      cutPlans: {
        orderBy: [desc(cutPlans.estProfit)],
        limit: 1,
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
        <EmptyState
          icon={Gem}
          title="No rough stones registered yet"
          description="Register your first rough to instantly see three cut-plan options — single large stone, two equal stones, yield-max — with revenue, cost, and profit side-by-side."
          cta={{ label: "Register the first rough", href: "/yield/new" }}
        />
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
                      <Link href={`/yield/${s.id}`} className="text-iris-600 text-xs font-medium">Open →</Link>
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
