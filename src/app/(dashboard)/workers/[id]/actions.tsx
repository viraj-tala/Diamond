"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddLogForm({ workerId }: { workerId: string }) {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [pieces, setPieces] = useState("");
  const [recovery, setRecovery] = useState("");
  const [errors, setErrors] = useState("0");
  const [hours, setHours] = useState("8");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch(`/api/workers/${workerId}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        piecesCompleted: parseInt(pieces, 10),
        recoveryPct: parseFloat(recovery),
        errors: parseInt(errors, 10),
        machineHours: parseFloat(hours),
      }),
    });
    setBusy(false);
    setPieces("");
    setRecovery("");
    setErrors("0");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-2 text-sm">
      <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
      <input className="input" placeholder="Pieces" type="number" min="0" value={pieces} onChange={(e) => setPieces(e.target.value)} required />
      <input className="input" placeholder="Recovery %" type="number" step="0.1" min="0" max="100" value={recovery} onChange={(e) => setRecovery(e.target.value)} required />
      <input className="input" placeholder="Errors" type="number" min="0" value={errors} onChange={(e) => setErrors(e.target.value)} />
      <input className="input" placeholder="Hours" type="number" step="0.1" min="0" value={hours} onChange={(e) => setHours(e.target.value)} />
      <button className="btn-primary w-full text-xs" disabled={busy}>{busy ? "Saving..." : "Save log"}</button>
    </form>
  );
}

export function AddIncentiveForm({ workerId }: { workerId: string }) {
  const router = useRouter();
  const now = new Date();
  const [monthYear, setMonthYear] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [amount, setAmount] = useState("");
  const [basis, setBasis] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch(`/api/workers/${workerId}/incentive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthYear, amount: parseFloat(amount), basis }),
    });
    setBusy(false);
    setAmount("");
    setBasis("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-2 text-sm">
      <input className="input" placeholder="YYYY-MM" value={monthYear} onChange={(e) => setMonthYear(e.target.value)} pattern="\d{4}-\d{2}" required />
      <input className="input" placeholder="Amount" type="number" step="1" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <input className="input" placeholder="Basis (e.g. 5% of efficiency bonus)" value={basis} onChange={(e) => setBasis(e.target.value)} required />
      <button className="btn-primary w-full text-xs" disabled={busy}>{busy ? "Saving..." : "Add incentive"}</button>
    </form>
  );
}
