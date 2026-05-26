import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/Badge";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { SHAPES, COLORS, CLARITIES, INVENTORY_STATUSES } from "@/lib/constants";
import { Plus, Boxes } from "lucide-react";

interface SearchParams {
  shape?: string;
  color?: string;
  clarity?: string;
  status?: string;
  caratMin?: string;
  caratMax?: string;
}

export default async function InventoryPage({ searchParams }: { searchParams: SearchParams }) {
  const where: Record<string, unknown> = {};
  if (searchParams.shape) where.shape = searchParams.shape;
  if (searchParams.color) where.color = searchParams.color;
  if (searchParams.clarity) where.clarity = searchParams.clarity;
  if (searchParams.status) where.status = searchParams.status;

  const caratFilter: { gte?: number; lte?: number } = {};
  if (searchParams.caratMin) caratFilter.gte = parseFloat(searchParams.caratMin);
  if (searchParams.caratMax) caratFilter.lte = parseFloat(searchParams.caratMax);
  if (Object.keys(caratFilter).length) where.caratWeight = caratFilter;

  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { listing: true },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Inventory & Marketplace"
        description="Polished stock with B2B listings. Filter by shape, carat, color, clarity."
        action={
          <Link href="/inventory/new" className="btn-primary gap-2">
            <Plus className="w-4 h-4" />
            Add item
          </Link>
        }
      />

      <form className="card p-4 mb-6 grid grid-cols-2 md:grid-cols-7 gap-2">
        <select name="shape" defaultValue={searchParams.shape ?? ""} className="input text-sm">
          <option value="">All shapes</option>
          {SHAPES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select name="color" defaultValue={searchParams.color ?? ""} className="input text-sm">
          <option value="">All colors</option>
          {COLORS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select name="clarity" defaultValue={searchParams.clarity ?? ""} className="input text-sm">
          <option value="">All clarity</option>
          {CLARITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input name="caratMin" type="number" step="0.01" defaultValue={searchParams.caratMin ?? ""} placeholder="Min ct" className="input text-sm" />
        <input name="caratMax" type="number" step="0.01" defaultValue={searchParams.caratMax ?? ""} placeholder="Max ct" className="input text-sm" />
        <select name="status" defaultValue={searchParams.status ?? ""} className="input text-sm">
          <option value="">Any status</option>
          {INVENTORY_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="btn-primary text-sm">Filter</button>
      </form>

      {items.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          <Boxes className="w-8 h-8 mx-auto text-slate-300 mb-3" />
          No items match. <Link href="/inventory/new" className="text-brand-600 font-medium">Add stock</Link>.
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Shape</th>
                <th>Carat</th>
                <th>C/C</th>
                <th>Cert</th>
                <th>$/ct</th>
                <th>Total</th>
                <th>Status</th>
                <th>Listed</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td className="font-mono text-xs">{i.sku}</td>
                  <td>{i.shape}</td>
                  <td>{formatNumber(i.caratWeight)}</td>
                  <td className="text-xs">{i.color}/{i.clarity}</td>
                  <td className="text-xs">{i.certBody ? `${i.certBody} ${i.certificateNo ?? ""}` : "—"}</td>
                  <td>{formatCurrency(i.pricePerCt)}</td>
                  <td className="font-semibold">{formatCurrency(i.totalPrice)}</td>
                  <td><StatusBadge status={i.status} /></td>
                  <td className="text-xs">{i.listing ? "Public" : "—"}</td>
                  <td>
                    <Link href={`/inventory/${i.id}`} className="text-brand-600 text-xs font-medium">Open →</Link>
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
