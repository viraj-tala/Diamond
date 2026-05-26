import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { requireSession } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          name={session.user.name}
          email={session.user.email}
          role={session.user.role}
        />
        <main className="flex-1 p-6 bg-slate-50 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
