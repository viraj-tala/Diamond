import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, workerDailyLogs, workers } from "@/db";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { formatNumber } from "@/lib/utils";
import { Plus, Users } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export default async function WorkersPage() {
  const all = await db.query.workers.findMany({
    with: {
      user: { columns: { name: true, email: true } },
      dailyLogs: {
        orderBy: [desc(workerDailyLogs.date)],
        limit: 30,
      },
    },
    orderBy: [desc(workers.joinDate)],
  });

  const enriched = all.map((w) => {
    const logs = w.dailyLogs;
    const totalPieces = logs.reduce((a, l) => a + l.piecesCompleted, 0);
    const avgRecovery = logs.length ? logs.reduce((a, l) => a + l.recoveryPct, 0) / logs.length : 0;
    const totalErrors = logs.reduce((a, l) => a + l.errors, 0);
    const totalHours = logs.reduce((a, l) => a + l.machineHours, 0);
    const efficiency = logs.length
      ? Math.max(0, Math.min(100, avgRecovery - (totalErrors / Math.max(1, totalPieces)) * 100))
      : 0;
    return { ...w, totalPieces, avgRecovery, totalErrors, totalHours, efficiency };
  });

  return (
    <div>
      <PageHeader
        title="Workers"
        description="Productivity, recovery %, and incentives — last 30 days of data."
        action={
          <Link href="/workers/new" className="btn-primary gap-2">
            <Plus className="w-4 h-4" />
            Onboard worker
          </Link>
        }
      />

      {enriched.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No workers onboarded yet"
          description="Onboard each worker once. From then on, every stage they touch is automatically attributed to them — making productivity, recovery %, and incentive payouts measurable instead of estimated."
          cta={{ label: "Onboard the first worker", href: "/workers/new" }}
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Pieces (30d)</th>
                <th>Avg recovery</th>
                <th>Errors</th>
                <th>Hours</th>
                <th>Efficiency</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((w) => (
                <tr key={w.id}>
                  <td>
                    <div className="font-medium">{w.user.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{w.employeeCode}</div>
                  </td>
                  <td><Badge tone="brand">{w.department}</Badge></td>
                  <td>{w.totalPieces}</td>
                  <td>{formatNumber(w.avgRecovery, 1)}%</td>
                  <td className={w.totalErrors > 5 ? "text-red-600" : ""}>{w.totalErrors}</td>
                  <td>{formatNumber(w.totalHours, 1)}h</td>
                  <td>
                    <EfficiencyBar value={w.efficiency} />
                  </td>
                  <td>
                    <Link href={`/workers/${w.id}`} className="text-iris-600 text-xs font-medium">Open →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EfficiencyBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium">{formatNumber(pct, 0)}%</span>
    </div>
  );
}
