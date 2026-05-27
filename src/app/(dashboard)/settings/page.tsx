import { desc } from "drizzle-orm";
import { db, users } from "@/db";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { requireSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { DevicesPanel } from "./devices-panel";

export default async function SettingsPage() {
  const session = await requireSession();
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "OWNER";
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return (
    <div>
      <PageHeader title="Settings" description="Workspace users and system info." />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-semibold mb-3">Users</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td className="font-medium">{u.name}</td>
                    <td className="text-xs">{u.email}</td>
                    <td><Badge tone="brand">{u.role}</Badge></td>
                    <td className="text-xs text-slate-500">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5 text-sm space-y-3">
          <h2 className="font-semibold">Your account</h2>
          <div>
            <div className="text-xs text-slate-500">Name</div>
            <div>{session.user.name}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Email</div>
            <div>{session.user.email}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Role</div>
            <Badge tone="brand">{session.user.role}</Badge>
          </div>
          <hr className="my-3" />
          <div className="text-xs text-slate-500">
            Lustra · v1.0<br />
            PostgreSQL via Drizzle ORM
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="mt-6">
          <DevicesPanel />
        </div>
      )}
    </div>
  );
}
