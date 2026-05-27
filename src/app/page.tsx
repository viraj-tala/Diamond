import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  Gem,
  Factory,
  Users,
  Boxes,
  LineChart,
  ShieldCheck,
  ScanSearch,
  Truck,
} from "lucide-react";

const modules = [
  { icon: Gem, title: "Yield Optimizer", desc: "Plan rough → simulate cut → maximize profit." },
  { icon: Factory, title: "Manufacturing ERP", desc: "Track every stone through every stage." },
  { icon: Users, title: "Worker Productivity", desc: "Efficiency, recovery %, incentives." },
  { icon: Boxes, title: "Inventory + Marketplace", desc: "Search-ready polished inventory & B2B listings." },
  { icon: LineChart, title: "Price Intelligence", desc: "Rapaport-style snapshots & trends." },
  { icon: ShieldCheck, title: "Traceability", desc: "Mine-to-jewelry audit chain." },
  { icon: ScanSearch, title: "Quality Defect Detection", desc: "Image-based QC scoring." },
  { icon: Truck, title: "Job Work / Outsourcing", desc: "Vendor flows, loss, payments." },
];

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-iris-50">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gem className="w-6 h-6 text-iris-600" />
            <span className="font-bold text-lg">Lustra</span>
            <span className="text-xs text-slate-500 hidden sm:inline">Diamond Manufacturing OS</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm">Login</Link>
            <Link href="/register" className="btn-primary text-sm">Get started</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900">
          One platform for the diamond factory floor.
        </h1>
        <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
          From rough planning to traceability, manufacturing ERP to B2B marketplace —
          purpose-built for planners, factory owners, and dealers.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/register" className="btn-primary">Create account</Link>
          <Link href="/login" className="btn-secondary">Sign in</Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((m) => (
            <div key={m.title} className="card p-5">
              <div className="w-10 h-10 rounded-lg bg-iris-50 text-iris-600 flex items-center justify-center">
                <m.icon className="w-5 h-5" />
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">{m.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Built with Next.js · Drizzle · PostgreSQL — self-hostable, no per-seat licensing.
      </footer>
    </main>
  );
}
