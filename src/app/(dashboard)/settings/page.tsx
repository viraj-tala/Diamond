import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { requireSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function SettingsPage() {
  const session = await requireSession();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

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
                {users.map((u) => (
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
            Yeild · v0.1<br />
            SQLite database at <code>prisma/dev.db</code>
          </div>
        </div>
      </div>
    </div>
  );
}
