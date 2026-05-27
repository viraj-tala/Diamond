import { desc, like, ne } from "drizzle-orm";
import { db, jobOrders, stones, vendors } from "@/db";
import { PageHeader } from "@/components/PageHeader";
import { JobOrderForm } from "./order-form";

export const dynamic = "force-dynamic";

export default async function NewJobOrderPage() {
  const year = new Date().getFullYear();
  const prefix = `JOB-${year}-`;

  const [vendorList, stoneList, existingCodes] = await Promise.all([
    db
      .select({ id: vendors.id, name: vendors.name })
      .from(vendors)
      .orderBy(vendors.name),
    db
      .select({
        id: stones.id,
        qrCode: stones.qrCode,
        currentStage: stones.currentStage,
        currentWeightCt: stones.currentWeightCt,
      })
      .from(stones)
      .where(ne(stones.currentStage, "COMPLETED"))
      .orderBy(desc(stones.updatedAt))
      .limit(300),
    db
      .select({ code: jobOrders.orderCode })
      .from(jobOrders)
      .where(like(jobOrders.orderCode, `${prefix}%`)),
  ]);

  const maxSeq = existingCodes.reduce((max, row) => {
    const match = row.code.match(/(\d+)$/);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  const suggestedOrderCode = `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Send stones to a vendor"
        description="Outsource a cutting stage. The system records what you sent, what came back, the weight loss, and the payment owed."
      />
      <JobOrderForm
        vendors={vendorList}
        stones={stoneList}
        suggestedOrderCode={suggestedOrderCode}
      />
    </div>
  );
}
