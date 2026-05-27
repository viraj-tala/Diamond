"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { NumberInput, TextInput } from "@/components/Form";

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
      <TextInput type="date" value={date} onChange={setDate} required monospace={false} />
      <NumberInput value={pieces} onChange={setPieces} min={0} placeholder="Pieces" required />
      <NumberInput
        value={recovery}
        onChange={setRecovery}
        step={0.1}
        min={0}
        max={100}
        placeholder="Recovery"
        required
        suffix="%"
      />
      <NumberInput value={errors} onChange={setErrors} min={0} placeholder="Errors" />
      <NumberInput
        value={hours}
        onChange={setHours}
        step={0.1}
        min={0}
        placeholder="Hours"
        suffix="h"
      />
      <button className="btn-primary w-full text-xs" disabled={busy}>
        {busy ? "Saving..." : "Save log"}
      </button>
    </form>
  );
}

export function AddIncentiveForm({ workerId }: { workerId: string }) {
  const router = useRouter();
  const now = new Date();
  const [monthYear, setMonthYear] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  );
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
      <TextInput
        type="month"
        value={monthYear}
        onChange={setMonthYear}
        pattern="\d{4}-\d{2}"
        required
        monospace={false}
      />
      <NumberInput
        value={amount}
        onChange={setAmount}
        step={1}
        min={0}
        required
        placeholder="Amount"
        prefix="$"
      />
      <TextInput
        value={basis}
        onChange={setBasis}
        placeholder="Basis (e.g. 5% of efficiency bonus)"
        required
        monospace={false}
      />
      <button className="btn-primary w-full text-xs" disabled={busy}>
        {busy ? "Saving..." : "Add incentive"}
      </button>
    </form>
  );
}
