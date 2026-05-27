import Link from "next/link";
import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { db, inventoryItems } from "@/db";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/Badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { SHAPES, COLORS, CLARITIES, INVENTORY_STATUSES } from "@/lib/constants";
import { Plus, Boxes } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

interface SearchParams {
  shape?: string;
  color?: string;
  clarity?: string;
  status?: string;
  caratMin?: string;
  caratMax?: string;
}

export default async function InventoryPage({ searchParams }: { searchParams: SearchParams }) {
  const conditions: SQL[] = [];
  if (searchParams.shape) conditions.push(eq(inventoryItems.shape, searchParams.shape));
  if (searchParams.color) conditions.push(eq(inventoryItems.color, searchParams.color));
  if (searchParams.clarity) conditions.push(eq(inventoryItems.clarity, searchParams.clarity));
  if (searchParams.status && (INVENTORY_STATUSES as readonly string[]).includes(searchParams.status)) {
    conditions.push(eq(inventoryItems.status, searchParams.status as (typeof INVENTORY_STATUSES)[number]));
  }
  if (searchParams.caratMin) {
    conditions.push(gte(inventoryItems.caratWeight, parseFloat(searchParams.caratMin)));
  }
  if (searchParams.caratMax) {
    conditions.push(lte(inventoryItems.caratWeight, parseFloat(searchParams.caratMax)));
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const items = await db.query.inventoryItems.findMany({
    where,
    orderBy: [desc(inventoryItems.createdAt)],
    with: { listing: true },
    limit: 200,
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
        <EmptyState
          icon={Boxes}
          title="No inventory items match"
          description="Add polished stones to stock here. Each item carries full spec, certification, media, and price — and can be published to your B2B marketplace with one click."
          cta={{ label: "Add inventory item", href: "/inventory/new" }}
        />
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
                    <Link href={`/inventory/${i.id}`} className="text-iris-600 text-xs font-medium">Open →</Link>
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
