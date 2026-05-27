"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { Gem } from "lucide-react";
import { DiamondLoader } from "@/components/DiamondLoader";
import { PasswordInput, TextInput } from "@/components/Form";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push(params.get("callbackUrl") ?? "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
          required
          autoComplete="current-password"
        />
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-iris-50 px-4">
      <div className="card w-full max-w-md p-8">
        <div className="flex items-center gap-2 mb-6">
          <Gem className="w-6 h-6 text-iris-600" />
          <span className="font-bold text-lg">Lustra</span>
        </div>
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to your workspace.</p>

        <Suspense
          fallback={
            <div className="mt-8 flex justify-center">
              <DiamondLoader size={40} />
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-sm text-slate-600 text-center">
          No account?{" "}
          <Link href="/register" className="text-iris-600 font-medium">
            Create one
          </Link>
        </p>
        <div className="mt-4 text-xs text-slate-500 text-center">
          Demo: <code className="text-slate-700">admin@lustra.local</code> / <code className="text-slate-700">admin123</code>
        </div>
      </div>
    </main>
  );
}
