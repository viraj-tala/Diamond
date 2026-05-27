import { asc, desc, inArray } from "drizzle-orm";
import Link from "next/link";
import { db, scanEvents, users } from "@/db";
import { PageHeader } from "@/components/PageHeader";
import { StageBadge } from "@/components/Badge";
import { formatDateTime } from "@/lib/utils";
import { ScanForm } from "./scan-form";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const [workers, recent] = await Promise.all([
    db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(inArray(users.role, ["WORKER", "SUPERVISOR"]))
      .orderBy(asc(users.name)),
    db.query.scanEvents.findMany({
      orderBy: [desc(scanEvents.createdAt)],
      limit: 8,
      with: {
        stone: { columns: { id: true, qrCode: true } },
        device: { columns: { name: true } },
        user: { columns: { name: true } },
      },
    }),
  ]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div>
        <PageHeader
          title="Scan"
          description="Scan or paste a stone QR / RFID code to advance its stage. Same endpoint as IoT scanners."
        />
        <ScanForm workers={workers} />
      </div>

      <div>
        <h2 className="font-semibold mb-3 text-slate-700">Recent scans</h2>
        {recent.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-500">
            No scans yet. Try scanning a stone, or wire up an IoT device.
          </div>
        ) : (
          <div className="card divide-y divide-slate-100">
            {recent.map((s) => (
              <Link
                key={s.id}
                href={s.stone ? `/manufacturing/${s.stone.id}` : "#"}
                className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-mono text-xs truncate">{s.stone?.qrCode ?? s.scanCode}</div>
                  <div className="text-xs text-slate-500">
                    {s.device ? `device: ${s.device.name}` : s.user ? `by ${s.user.name}` : "manual"}
                    {" · "}
                    {formatDateTime(s.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs shrink-0">
                  <StageBadge stage={s.fromStage} />
                  <span className="text-slate-400">→</span>
                  <StageBadge stage={s.toStage} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
