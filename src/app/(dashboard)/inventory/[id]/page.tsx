import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, inquiries, inventoryItems } from "@/db";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, Badge } from "@/components/Badge";
import { formatCurrency, formatNumber, formatDate, formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { ToggleListingForm, MarkSoldForm } from "./actions";

export default async function InventoryDetailPage({ params }: { params: { id: string } }) {
  const item = await db.query.inventoryItems.findFirst({
    where: eq(inventoryItems.id, params.id),
    with: {
      listing: {
        with: { inquiries: { orderBy: [desc(inquiries.createdAt)] } },
      },
      stone: true,
    },
  });
  if (!item) notFound();

  return (
    <div>
      <PageHeader
        title={item.sku}
        description={`${item.shape} · ${formatNumber(item.caratWeight)} ct · ${item.color}/${item.clarity}`}
        action={<Link href="/inventory" className="btn-secondary text-sm">← Back</Link>}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <h2 className="font-semibold mb-3">Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <Field label="Shape" value={item.shape} />
              <Field label="Carat" value={formatNumber(item.caratWeight)} />
              <Field label="Color" value={item.color} />
              <Field label="Clarity" value={item.clarity} />
              <Field label="Cut" value={item.cut ?? "—"} />
              <Field label="Polish" value={item.polish ?? "—"} />
              <Field label="Symmetry" value={item.symmetry ?? "—"} />
              <Field label="Fluorescence" value={item.fluorescence ?? "—"} />
              <Field label="Certificate" value={item.certBody ? `${item.certBody} ${item.certificateNo ?? ""}` : "—"} />
              <Field label="Price / ct" value={formatCurrency(item.pricePerCt)} />
              <Field label="Total price" value={formatCurrency(item.totalPrice)} />
              <Field label="Location" value={item.location ?? "—"} />
              <Field label="Status" value={<StatusBadge status={item.status} />} />
              <Field label="Created" value={formatDate(item.createdAt)} />
              <Field label="Stone link" value={item.stone?.qrCode ?? "—"} />
            </div>
            {(item.imageUrl || item.videoUrl) && (
              <div className="mt-4 flex gap-3">
                {item.imageUrl && <a href={item.imageUrl} target="_blank" className="text-xs text-iris-600 underline">View image</a>}
                {item.videoUrl && <a href={item.videoUrl} target="_blank" className="text-xs text-iris-600 underline">View video</a>}
              </div>
            )}
          </div>

          {item.listing && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Marketplace inquiries</h2>
                <Badge tone={item.listing.isPublic ? "green" : "slate"}>{item.listing.isPublic ? "Public" : "Private"}</Badge>
              </div>
              {item.listing.inquiries.length === 0 ? (
                <p className="text-sm text-slate-500">No inquiries yet.</p>
              ) : (
                <div className="space-y-3">
                  {item.listing.inquiries.map((inq) => (
                    <div key={inq.id} className="border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{inq.buyerName}</div>
                        <span className="text-xs text-slate-500">{formatDateTime(inq.createdAt)}</span>
                      </div>
                      <div className="text-xs text-slate-500">{inq.buyerEmail}{inq.buyerPhone ? ` · ${inq.buyerPhone}` : ""}</div>
                      {inq.message && <p className="mt-2 text-sm">{inq.message}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="font-semibold mb-3 text-sm">Marketplace listing</h2>
            <ToggleListingForm itemId={item.id} listed={!!item.listing} listPrice={item.listing?.listPrice ?? item.totalPrice} />
          </div>
          <div className="card p-5">
            <h2 className="font-semibold mb-3 text-sm">Mark as sold</h2>
            <MarkSoldForm itemId={item.id} sold={item.status === "SOLD"} />
          </div>
          {item.imageUrl && (
            <div className="card p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt={item.sku} className="rounded-lg w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
