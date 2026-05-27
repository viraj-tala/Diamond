import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, jobOrders } from "@/db";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/Badge";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import Link from "next/link";
import { ReturnOrderForm, MarkPaidButton } from "./actions";

export default async function JobOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await db.query.jobOrders.findFirst({
    where: eq(jobOrders.id, params.id),
    with: {
      vendor: true,
      items: { with: { stone: true } },
    },
  });
  if (!order) notFound();

  const canReturn = order.status === "SENT" || order.status === "IN_PROGRESS";

  return (
    <div>
      <PageHeader
        title={order.orderCode}
        description={`${order.vendor.name} · ${order.jobType}`}
        action={<Link href="/jobwork" className="btn-secondary text-sm">← Back</Link>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4"><div className="text-xs text-slate-500">Status</div><div className="mt-1"><StatusBadge status={order.status} /></div></div>
        <div className="card p-4"><div className="text-xs text-slate-500">Sent</div><div className="text-sm font-medium">{formatDateTime(order.sentAt)}</div><div className="text-xs">{formatNumber(order.totalSentCt)} ct</div></div>
        <div className="card p-4"><div className="text-xs text-slate-500">Returned</div><div className="text-sm font-medium">{order.returnedAt ? formatDateTime(order.returnedAt) : "—"}</div><div className="text-xs">{order.totalReturnCt ? formatNumber(order.totalReturnCt) : "—"} ct</div></div>
        <div className="card p-4"><div className="text-xs text-slate-500">Loss</div><div className="text-xl font-semibold text-red-600">{formatNumber(order.lossCt)} ct</div></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-semibold mb-3">Stones in order</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Stone</th><th>Sent ct</th><th>Returned ct</th></tr></thead>
              <tbody>
                {order.items.map((it) => (
                  <tr key={it.id}>
                    <td className="font-mono text-xs">{it.stone.qrCode}</td>
                    <td>{formatNumber(it.sentWeightCt)}</td>
                    <td>{it.returnWeightCt != null ? formatNumber(it.returnWeightCt) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="font-semibold mb-3 text-sm">Payment</h2>
            <div className="text-xs text-slate-500">Rate</div>
            <div className="text-sm">{formatCurrency(order.ratePerCt)} / ct</div>
            <div className="text-xs text-slate-500 mt-2">Total</div>
            <div className="text-lg font-semibold">{formatCurrency(order.totalPayment)}</div>
            <div className="mt-3"><MarkPaidButton orderId={order.id} paid={order.paid} /></div>
          </div>

          {canReturn && (
            <div className="card p-5">
              <h2 className="font-semibold mb-3 text-sm">Mark returned</h2>
              <ReturnOrderForm
                orderId={order.id}
                items={order.items.map((i) => ({ id: i.id, stoneId: i.stoneId, qrCode: i.stone.qrCode, sentWeightCt: i.sentWeightCt }))}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
