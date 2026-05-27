"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Gem } from "lucide-react";
import { ROLES } from "@/lib/constants";
import { PasswordInput, Select, TextInput } from "@/components/Form";

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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-iris-50 px-4 py-8">
      <div className="card w-full max-w-md p-8">
        <div className="flex items-center gap-2 mb-6">
          <Gem className="w-6 h-6 text-iris-600" />
          <span className="font-bold text-lg">Lustra</span>
        </div>
        <h1 className="text-2xl font-semibold">Create your workspace</h1>
        <p className="text-sm text-slate-500 mt-1">All modules unlock immediately.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">Full name</label>
            <TextInput value={name} onChange={setName} required monospace={false} autoComplete="name" />
          </div>
          <div>
            <label className="label">Email</label>
            <TextInput
              type="email"
              value={email}
              onChange={setEmail}
              required
              autoComplete="email"
              monospace={false}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <PasswordInput
              value={password}
              onChange={setPassword}
              minLength={6}
              required
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="label">Role</label>
            <Select value={role} onChange={setRole}>
              {SELECTABLE_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-iris-600 font-medium">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
