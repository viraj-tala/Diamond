"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  stoneId: string;
  currentWeight: number;
  nextStage: string;
  workers: { id: string; name: string }[];
}

export function AdvanceStageForm({ stoneId, currentWeight, nextStage, workers }: Props) {
  const router = useRouter();
  const [weightAfter, setWeightAfter] = useState(String(currentWeight));
  const [workerId, setWorkerId] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch(`/api/manufacturing/stones/${stoneId}/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weightAfter: parseFloat(weightAfter),
        workerId: workerId || null,
        notes,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Failed");
      setBusy(false);
      return;
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3 text-sm">
      <div className="text-xs text-slate-500">
        Next: <span className="font-semibold text-slate-900">{nextStage}</span>
      </div>
      <div>
        <label className="label">Weight after (ct)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          max={currentWeight}
          className="input"
          value={weightAfter}
          onChange={(e) => setWeightAfter(e.target.value)}
          required
        />
        <div className="text-xs text-slate-400 mt-0.5">Current: {currentWeight} ct</div>
      </div>
      <div>
        <label className="label">Worker</label>
        <select className="input" value={workerId} onChange={(e) => setWorkerId(e.target.value)}>
          <option value="">— None —</option>
          {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea rows={2} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {err && <div className="text-xs text-red-600">{err}</div>}
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "Advancing..." : `Move to ${nextStage}`}
      </button>
    </form>
  );
}
