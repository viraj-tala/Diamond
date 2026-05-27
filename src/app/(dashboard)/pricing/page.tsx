import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { db, pricePoints } from "@/db";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { formatCurrency, formatDate, formatNumber, caratBucket, estimatePricePerCt } from "@/lib/utils";
import { SHAPES, COLORS, CLARITIES } from "@/lib/constants";
import { PriceChart } from "./PriceChart";
import { Plus } from "lucide-react";

interface SearchParams {
  shape?: string;
  color?: string;
  clarity?: string;
  carat?: string;
}

export default async function PricingPage({ searchParams }: { searchParams: SearchParams }) {
  const shape = searchParams.shape || "ROUND";
  const color = searchParams.color || "G";
  const clarity = searchParams.clarity || "VS1";
  const carat = searchParams.carat ? parseFloat(searchParams.carat) : 1.0;
  const bucket = caratBucket(carat);

  const points = await db
    .select()
    .from(pricePoints)
    .where(
      and(
        eq(pricePoints.shape, shape),
        eq(pricePoints.color, color),
        eq(pricePoints.clarity, clarity),
        eq(pricePoints.caratBucket, bucket),
      ),
    )
    .orderBy(asc(pricePoints.recordedAt));

  const estimated = estimatePricePerCt(carat, color, clarity, shape);

  const series = points.map((p) => ({
    date: new Date(p.recordedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    price: p.pricePerCt,
  }));

  const latest = points[points.length - 1];
  const oldest = points[0];
  const changePct = latest && oldest && oldest.pricePerCt > 0
    ? ((latest.pricePerCt - oldest.pricePerCt) / oldest.pricePerCt) * 100
    : 0;

  return (
    <div>
      <PageHeader
        title="Price Intelligence"
        description="Track historical price points, get an instant estimate."
        action={
          <Link href="/pricing/add" className="btn-primary gap-2">
            <Plus className="w-4 h-4" />
            Add data
          </Link>
        }
      />

      <form className="card p-4 mb-6 grid grid-cols-2 md:grid-cols-5 gap-2">
        <select name="shape" defaultValue={shape} className="input text-sm">
          {SHAPES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select name="color" defaultValue={color} className="input text-sm">
          {COLORS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select name="clarity" defaultValue={clarity} className="input text-sm">
          {CLARITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input type="number" step="0.01" name="carat" defaultValue={carat} placeholder="Carat" className="input text-sm" />
        <button className="btn-primary text-sm">Apply</button>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-xs text-slate-500">Estimator</div>
          <div className="text-xl font-semibold">{formatCurrency(estimated)}</div>
          <div className="text-xs text-slate-500">per ct · {shape} {carat}ct {color}/{clarity}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Latest market</div>
          <div className="text-xl font-semibold">{latest ? formatCurrency(latest.pricePerCt) : "—"}</div>
          <div className="text-xs text-slate-500">{latest ? formatDate(latest.recordedAt) : "no data"}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Change (history)</div>
          <div className={`text-xl font-semibold ${changePct > 0 ? "text-emerald-700" : changePct < 0 ? "text-red-600" : ""}`}>
            {changePct === 0 ? "—" : `${changePct > 0 ? "+" : ""}${formatNumber(changePct, 1)}%`}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Total carat</div>
          <div className="text-xl font-semibold">{formatNumber(carat)} ct</div>
          <div className="text-xs text-slate-500">Bucket {bucket}</div>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <h2 className="font-semibold mb-3">Price trend</h2>
        {series.length === 0 ? (
          <div className="text-sm text-slate-500 py-12 text-center">
            No history for this combination. <Link href="/pricing/add" className="text-iris-600">Add price points</Link>.
          </div>
        ) : (
          <PriceChart data={series} />
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-3">Recent entries</h2>
        {points.length === 0 ? (
          <div className="text-sm text-slate-500 py-4">No price points yet.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Source</th><th>Spec</th><th>Bucket</th><th>$/ct</th></tr>
              </thead>
              <tbody>
                {points.slice().reverse().map((p) => (
                  <tr key={p.id}>
                    <td>{formatDate(p.recordedAt)}</td>
                    <td><Badge tone="brand">{p.source}</Badge></td>
                    <td className="text-xs">{p.shape} · {p.color}/{p.clarity}</td>
                    <td className="text-xs">{p.caratBucket}</td>
                    <td>{formatCurrency(p.pricePerCt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
