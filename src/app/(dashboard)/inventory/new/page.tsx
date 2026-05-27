import { and, desc, eq, isNull, like } from "drizzle-orm";
import { db, inventoryItems, stones } from "@/db";
import { PageHeader } from "@/components/PageHeader";
import { InventoryForm } from "./inventory-form";

export const dynamic = "force-dynamic";

export default async function NewInventoryPage() {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const existing = await db
    .select({ sku: inventoryItems.sku })
    .from(inventoryItems)
    .where(like(inventoryItems.sku, `${prefix}%`));
  const maxSeq = existing.reduce((max, row) => {
    const match = row.sku.match(/(\d+)$/);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  const suggestedSku = `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;

  // COMPLETED stones not yet linked to an inventory item — these are the
  // candidates the user should pick from. Left join filters out linked ones.
  const eligibleStones = await db
    .select({
      id: stones.id,
      qrCode: stones.qrCode,
      currentWeightCt: stones.currentWeightCt,
    })
    .from(stones)
    .leftJoin(inventoryItems, eq(inventoryItems.stoneId, stones.id))
    .where(and(eq(stones.currentStage, "COMPLETED"), isNull(inventoryItems.id)))
    .orderBy(desc(stones.updatedAt))
    .limit(200);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Add polished item to inventory"
        description="Move a finished stone into stock so it can be priced, photographed, and listed for sale."
      />
      <InventoryForm suggestedSku={suggestedSku} eligibleStones={eligibleStones} />
    </div>
  );
}
