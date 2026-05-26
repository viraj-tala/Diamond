import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/Badge";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { Plus, Truck } from "lucide-react";

export default async function JobWorkPage() {
  const orders = await prisma.jobOrder.findMany({
    orderBy: { sentAt: "desc" },
    include: { vendor: true, items: true },
  });

  const totals = await prisma.jobOrder.aggregate({
    _sum: { lossCt: true, totalPayment: true },
  });

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
          <div className="text-2xl font-semibold text-red-600">{formatNumber(totals._sum.lossCt ?? 0)} ct</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Vendor payments</div>
          <div className="text-2xl font-semibold">{formatCurrency(totals._sum.totalPayment ?? 0)}</div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          <Truck className="w-8 h-8 mx-auto text-slate-300 mb-3" />
          No job orders yet. <Link href="/jobwork/new" className="text-brand-600 font-medium">Create one</Link>.
        </div>
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
                    <Link href={`/jobwork/${o.id}`} className="text-brand-600 text-xs font-medium">Open →</Link>
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
