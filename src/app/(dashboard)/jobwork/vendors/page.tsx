import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { formatDate } from "@/lib/utils";
import { AddVendorForm } from "./actions";

export default async function VendorsPage() {
  const vendors = await prisma.vendor.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { jobOrders: true } } },
  });

  return (
    <div>
      <PageHeader title="Vendors" description="Outside processors you send job work to." action={<Link href="/jobwork" className="btn-secondary text-sm">← Job orders</Link>} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-semibold mb-3">All vendors</h2>
          {vendors.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No vendors yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Name</th><th>Contact</th><th>Phone</th><th>Orders</th><th>Added</th></tr></thead>
                <tbody>
                  {vendors.map((v) => (
                    <tr key={v.id}>
                      <td className="font-medium">{v.name}</td>
                      <td>{v.contact ?? "—"}</td>
                      <td>{v.phone ?? "—"}</td>
                      <td>{v._count.jobOrders}</td>
                      <td className="text-xs text-slate-500">{formatDate(v.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="card p-5">
          <h2 className="font-semibold mb-3 text-sm">Add vendor</h2>
          <AddVendorForm />
        </div>
      </div>
    </div>
  );
}
