import { count, like } from "drizzle-orm";
import { db, workers as workersTable } from "@/db";
import { PageHeader } from "@/components/PageHeader";
import { WorkerForm } from "./worker-form";

export const dynamic = "force-dynamic";

export default async function NewWorkerPage() {
  const prefix = "EMP";
  const existing = await db
    .select({ code: workersTable.employeeCode })
    .from(workersTable)
    .where(like(workersTable.employeeCode, `${prefix}%`));
  const maxSeq = existing.reduce((max, row) => {
    const match = row.code.match(/(\d+)$/);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  const suggestedCode = `${prefix}${String(maxSeq + 1).padStart(3, "0")}`;

  const [totalRow] = await db.select({ c: count() }).from(workersTable);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Onboard a new worker"
        description="Creates a login (WORKER role) and a productivity profile in one step. Workers can log daily output, earn incentives, and be attributed on every stage they touch."
      />
      <WorkerForm suggestedCode={suggestedCode} workerCount={totalRow.c} />
    </div>
  );
}
