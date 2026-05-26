"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Item { id: string; stoneId: string; qrCode: string; sentWeightCt: number; }

export function ReturnOrderForm({ orderId, items }: { orderId: string; items: Item[] }) {
  const router = useRouter();
  const [returns, setReturns] = useState<Record<string, string>>(
    Object.fromEntries(items.map((i) => [i.id, String(i.sentWeightCt)])),
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const items_payload = items.map((i) => ({
      id: i.id,
      stoneId: i.stoneId,
      returnWeightCt: parseFloat(returns[i.id] || "0"),
    }));
    const res = await fetch(`/api/jobwork/${orderId}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items_payload }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Failed");
      setBusy(false);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-2 text-sm">
      <div className="space-y-1.5">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-2">
            <span className="font-mono text-xs flex-1">{it.qrCode}</span>
            <span className="text-xs text-slate-400">/ {it.sentWeightCt.toFixed(2)}</span>
            <input
              type="number"
              step="0.01"
              min="0"
              max={it.sentWeightCt}
              className="input text-sm w-24"
              value={returns[it.id] ?? ""}
              onChange={(e) => setReturns({ ...returns, [it.id]: e.target.value })}
              required
            />
          </div>
        ))}
      </div>
      {err && <div className="text-xs text-red-600">{err}</div>}
      <button className="btn-primary w-full text-xs" disabled={busy}>{busy ? "Saving..." : "Mark returned"}</button>
    </form>
  );
}

export function MarkPaidButton({ orderId, paid }: { orderId: string; paid: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function action() {
    setBusy(true);
    await fetch(`/api/jobwork/${orderId}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: !paid }),
    });
    setBusy(false);
    router.refresh();
  }
  return (
    <button onClick={action} disabled={busy} className={paid ? "btn-secondary w-full text-xs" : "btn-primary w-full text-xs"}>
      {busy ? "..." : paid ? "Mark unpaid" : "Mark paid"}
    </button>
  );
}
