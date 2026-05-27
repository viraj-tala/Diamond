import { like } from "drizzle-orm";
import { db, roughStones } from "@/db";
import { PageHeader } from "@/components/PageHeader";
import { RoughForm } from "./rough-form";

export const dynamic = "force-dynamic";

export default async function NewRoughPage() {
  const year = new Date().getFullYear();
  const prefix = `ROUGH-${year}-`;
  const existing = await db
    .select({ code: roughStones.code })
    .from(roughStones)
    .where(like(roughStones.code, `${prefix}%`));
  const maxSeq = existing.reduce((max, row) => {
    const match = row.code.match(/(\d+)$/);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  const suggestedCode = `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Register a rough stone"
        description="The system auto-generates three cut-plan options the moment you save — single large stone, two equal stones, and yield-max — with revenue, cost, and profit for each."
      />
      <RoughForm suggestedCode={suggestedCode} />
    </div>
  );
}
