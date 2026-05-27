import Link from "next/link";
import { and, count, desc, eq, ilike, type SQL } from "drizzle-orm";
import { db, stones } from "@/db";
import { PageHeader } from "@/components/PageHeader";
import { StageBadge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { formatDate, formatNumber } from "@/lib/utils";
import { STAGES, type Stage } from "@/lib/constants";
import { Plus, Factory } from "lucide-react";

export default async function ManufacturingPage({
  searchParams,
}: {
  searchParams: { stage?: string; q?: string };
}) {
  const stageFilter = searchParams.stage;
  const q = searchParams.q?.trim();

  const conditions: SQL[] = [];
  if (stageFilter && STAGES.includes(stageFilter as Stage)) {
    conditions.push(eq(stones.currentStage, stageFilter as Stage));
  }
  if (q) {
    conditions.push(ilike(stones.qrCode, `%${q}%`));
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, byStage] = await Promise.all([
    db.query.stones.findMany({
      where,
      orderBy: [desc(stones.updatedAt)],
      limit: 200,
      with: { roughStone: { columns: { code: true } } },
    }),
    db
      .select({ stage: stones.currentStage, c: count() })
      .from(stones)
      .groupBy(stones.currentStage),
  ]);

  const counts = Object.fromEntries(byStage.map((s) => [s.stage, s.c]));

  return (
    <div>
      <PageHeader
        title="Manufacturing"
        description="Every stone, every stage. Scan a QR code to advance."
        action={
          <Link href="/manufacturing/new" className="btn-primary gap-2">
            <Plus className="w-4 h-4" />
            New stone
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {STAGES.map((stage) => (
          <Link key={stage} href={`/manufacturing?stage=${stage}`} className="card p-3 hover:border-iris-400">
            <div className="text-xs text-slate-500">{stage}</div>
            <div className="text-xl font-semibold">{counts[stage] ?? 0}</div>
          </Link>
        ))}
      </div>

      <div className="card p-4 mb-4">
        <form className="flex gap-2 items-center">
          <input
            name="q"
            placeholder="Search by QR code..."
            defaultValue={q ?? ""}
            className="input max-w-xs"
          />
          {stageFilter && <input type="hidden" name="stage" value={stageFilter} />}
          <button className="btn-secondary text-sm">Search</button>
          {(stageFilter || q) && (
            <Link href="/manufacturing" className="text-xs text-iris-600">Clear filters</Link>
          )}
        </form>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Factory}
          title="No stones tracked yet"
          description="Register each stone once — give it a QR code, optional RFID tag, and a start weight. From then on, every stage advance and weight loss is recorded automatically and attributed to the worker who did it."
          cta={{ label: "Register first stone", href: "/manufacturing/new" }}
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>QR Code</th>
                <th>Rough</th>
                <th>Stage</th>
                <th>Start ct</th>
                <th>Current ct</th>
                <th>Loss</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const loss = s.startWeightCt - s.currentWeightCt;
                return (
                  <tr key={s.id}>
                    <td className="font-mono text-xs">{s.qrCode}</td>
                    <td className="text-xs text-slate-500">{s.roughStone?.code ?? "—"}</td>
                    <td><StageBadge stage={s.currentStage} /></td>
                    <td>{formatNumber(s.startWeightCt)}</td>
                    <td>{formatNumber(s.currentWeightCt)}</td>
                    <td className={loss > 0 ? "text-red-600" : "text-slate-500"}>
                      {loss > 0 ? `-${formatNumber(loss)}` : "—"}
                    </td>
                    <td className="text-xs text-slate-500">{formatDate(s.updatedAt)}</td>
                    <td>
                      <Link href={`/manufacturing/${s.id}`} className="text-iris-600 text-xs font-medium">Open →</Link>
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
