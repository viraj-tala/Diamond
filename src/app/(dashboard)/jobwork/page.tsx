import Link from "next/link";
import { desc, sum } from "drizzle-orm";
import { db, jobOrders } from "@/db";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/Badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Plus, Truck } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export default async function JobWorkPage() {
  const [orders, [totals]] = await Promise.all([
    db.query.jobOrders.findMany({
      orderBy: [desc(jobOrders.sentAt)],
      with: { vendor: true, items: true },
    }),
    db
      .select({
        lossCt: sum(jobOrders.lossCt),
        totalPayment: sum(jobOrders.totalPayment),
      })
      .from(jobOrders),
  ]);

  const totalLoss = Number(totals?.lossCt ?? 0);
  const totalPayments = Number(totals?.totalPayment ?? 0);

  return (
    <div>
      <PageHeader
        title="Job Work"
        description="Stones sent to outside vendors — track loss, returns, and payments."
        action={
          <div className="flex gap-2">
            <Link href="/jobwork/vendors" className="btn-secondary gap-2">Vendors</Link>
            <Link href="/jobwork/new" className="btn-primary gap-2">
              <Plus className="w-4 h-4" />
              New order
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-xs text-slate-500">Active orders</div>
          <div className="text-2xl font-semibold">{orders.filter((o) => o.status !== "CLOSED").length}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Total loss tracked</div>
          <div className="text-2xl font-semibold text-red-600">{formatNumber(totalLoss)} ct</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Vendor payments</div>
          <div className="text-2xl font-semibold">{formatCurrency(totalPayments)}</div>
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No job orders yet"
          description="Send stones to a vendor for outsourced sawing, bruting, polishing, or QC. The system locks in what you sent, tracks what came back, computes weight loss, and calculates payment automatically."
          cta={{ label: "Create first job order", href: "/jobwork/new" }}
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Vendor</th>
                <th>Type</th>
                <th>Items</th>
                <th>Sent ct</th>
                <th>Return ct</th>
                <th>Loss</th>
                <th>Payment</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="font-mono text-xs">{o.orderCode}</td>
                  <td>{o.vendor.name}</td>
                  <td className="text-xs">{o.jobType}</td>
                  <td>{o.items.length}</td>
                  <td>{formatNumber(o.totalSentCt)}</td>
                  <td>{o.totalReturnCt ? formatNumber(o.totalReturnCt) : "—"}</td>
                  <td className={o.lossCt > 0 ? "text-red-600" : ""}>{o.lossCt ? `-${formatNumber(o.lossCt)}` : "—"}</td>
                  <td>{formatCurrency(o.totalPayment)} {o.paid ? <span className="text-xs text-emerald-700">paid</span> : ""}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td>
                    <Link href={`/jobwork/${o.id}`} className="text-iris-600 text-xs font-medium">Open →</Link>
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
