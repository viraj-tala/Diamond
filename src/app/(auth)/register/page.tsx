"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Gem } from "lucide-react";
import { ROLES } from "@/lib/constants";

const SELECTABLE_ROLES = ROLES.filter((r) => r !== "ADMIN");

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("OWNER");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Registration failed");
      setLoading(false);
      return;
    }
    await signIn("credentials", { email, password, redirect: false });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-brand-50 px-4 py-8">
      <div className="card w-full max-w-md p-8">
        <div className="flex items-center gap-2 mb-6">
          <Gem className="w-6 h-6 text-brand-600" />
          <span className="font-bold text-lg">Yeild</span>
        </div>
        <h1 className="text-2xl font-semibold">Create your workspace</h1>
        <p className="text-sm text-slate-500 mt-1">All modules unlock immediately.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
              {SELECTABLE_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-600 font-medium">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
