import { desc, like } from "drizzle-orm";
import { db, roughStones, stones } from "@/db";
import { PageHeader } from "@/components/PageHeader";
import { StoneForm } from "./stone-form";

export const dynamic = "force-dynamic";

export default async function NewStonePage() {
  const year = new Date().getFullYear();
  const prefix = `STN-${year}-`;

  const [roughs, existingCodes] = await Promise.all([
    db
      .select({
        id: roughStones.id,
        code: roughStones.code,
        weightCt: roughStones.weightCt,
        color: roughStones.color,
        clarity: roughStones.clarity,
        shape: roughStones.shape,
      })
      .from(roughStones)
      .orderBy(desc(roughStones.createdAt))
      .limit(200),
    db
      .select({ code: stones.qrCode })
      .from(stones)
      .where(like(stones.qrCode, `${prefix}%`)),
  ]);

  // Next sequence number from the highest numeric suffix this year.
  const maxSeq = existingCodes.reduce((max, row) => {
    const match = row.code.match(/(\d+)$/);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  const suggestedQr = `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Register a new stone"
        description="Create a tracker for an individual stone entering the factory. Fill this form once — workers scan the stone afterwards to advance it through each stage."
      />
      <StoneForm roughs={roughs} suggestedQr={suggestedQr} />
    </div>
  );
}
