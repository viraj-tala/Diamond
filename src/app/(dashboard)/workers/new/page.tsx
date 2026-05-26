"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";

const DEPARTMENTS = ["SAWING", "BRUTING", "POLISHING", "QC"];

export default function NewWorkerPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [department, setDepartment] = useState("POLISHING");
  const [hourlyRate, setHourlyRate] = useState("0");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/workers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, employeeCode, department, hourlyRate: parseFloat(hourlyRate) }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Failed");
      setBusy(false);
      return;
    }
    router.push("/workers");
    router.refresh();
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Onboard worker" description="Creates a worker account (WORKER role) plus a productivity profile." />
      <form onSubmit={submit} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Employee code</label>
            <input className="input" value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email (login)</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Initial password</label>
            <input type="text" className="input" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          </div>
          <div>
            <label className="label">Department</label>
            <select className="input" value={department} onChange={(e) => setDepartment(e.target.value)}>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Hourly rate</label>
            <input type="number" step="0.5" min="0" className="input" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
          </div>
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? "Creating..." : "Create worker"}</button>
        </div>
      </form>
    </div>
  );
}
