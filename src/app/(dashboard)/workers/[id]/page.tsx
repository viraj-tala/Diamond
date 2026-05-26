import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { formatDate, formatCurrency, formatNumber } from "@/lib/utils";
import Link from "next/link";
import { AddLogForm, AddIncentiveForm } from "./actions";

export default async function WorkerDetailPage({ params }: { params: { id: string } }) {
  const w = await prisma.worker.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      dailyLogs: { orderBy: { date: "desc" }, take: 30 },
      incentives: { orderBy: { monthYear: "desc" } },
    },
  });
  if (!w) notFound();

  const totalPieces = w.dailyLogs.reduce((a, l) => a + l.piecesCompleted, 0);
  const avgRecovery = w.dailyLogs.length
    ? w.dailyLogs.reduce((a, l) => a + l.recoveryPct, 0) / w.dailyLogs.length
    : 0;
  const totalIncentive = w.incentives.reduce((a, i) => a + i.amount, 0);

  return (
    <div>
      <PageHeader
        title={w.user.name}
        description={`${w.employeeCode} · ${w.department}`}
        action={<Link href="/workers" className="btn-secondary text-sm">← Back</Link>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-xs text-slate-500">Joined</div>
          <div className="font-medium">{formatDate(w.joinDate)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Pieces (30d)</div>
          <div className="text-xl font-semibold">{totalPieces}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Avg recovery</div>
          <div className="text-xl font-semibold">{formatNumber(avgRecovery, 1)}%</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Total incentive</div>
          <div className="text-xl font-semibold">{formatCurrency(totalIncentive)}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-semibold mb-3">Daily logs (last 30)</h2>
          {w.dailyLogs.length === 0 ? (
            <div className="text-sm text-slate-500 py-4">No logs yet.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Date</th><th>Pieces</th><th>Recovery %</th><th>Errors</th><th>Hours</th></tr>
                </thead>
                <tbody>
                  {w.dailyLogs.map((l) => (
                    <tr key={l.id}>
                      <td>{formatDate(l.date)}</td>
                      <td>{l.piecesCompleted}</td>
                      <td>{formatNumber(l.recoveryPct, 1)}%</td>
                      <td className={l.errors > 0 ? "text-red-600" : ""}>{l.errors}</td>
                      <td>{formatNumber(l.machineHours, 1)}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="font-semibold mb-3 text-sm">Log a day</h2>
            <AddLogForm workerId={w.id} />
          </div>
          <div className="card p-5">
            <h2 className="font-semibold mb-3 text-sm">Add incentive</h2>
            <AddIncentiveForm workerId={w.id} />
            {w.incentives.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-xs">
                {w.incentives.map((i) => (
                  <li key={i.id} className="flex justify-between">
                    <span>{i.monthYear}</span>
                    <span className="font-medium">{formatCurrency(i.amount)}</span>
                    <Badge tone={i.paid ? "green" : "amber"}>{i.paid ? "Paid" : "Pending"}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
