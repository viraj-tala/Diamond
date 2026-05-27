import { desc, ne } from "drizzle-orm";
import { db, stones } from "@/db";
import { PageHeader } from "@/components/PageHeader";
import { QualityForm } from "./quality-form";

export const dynamic = "force-dynamic";

export default async function NewQualityPage() {
  // Inspect anything not still in PLANNING — stones at SAWING / BRUTING /
  // POLISHING / QC / CERTIFICATION / COMPLETED can all reasonably be inspected.
  const candidates = await db
    .select({
      id: stones.id,
      qrCode: stones.qrCode,
      currentStage: stones.currentStage,
      currentWeightCt: stones.currentWeightCt,
    })
    .from(stones)
    .where(ne(stones.currentStage, "PLANNING"))
    .orderBy(desc(stones.updatedAt))
    .limit(200);

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="New quality inspection"
        description="Submit a stone for defect detection. The detector returns a 0–100 score, the defects it found, and one of three recommendations: PASS, REWORK, REJECT."
      />
      <QualityForm stones={candidates} />
    </div>
  );
}
