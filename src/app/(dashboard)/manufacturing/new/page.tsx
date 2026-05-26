"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";

interface RoughOption {
  id: string;
  code: string;
  weightCt: number;
}

export default function NewStonePage() {
  const router = useRouter();
  const [rough, setRough] = useState<RoughOption[]>([]);
  const [qrCode, setQrCode] = useState("");
  const [roughId, setRoughId] = useState("");
  const [startWeightCt, setStartWeightCt] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/yield/rough/list")
      .then((r) => r.json())
      .then((d) => setRough(d.items ?? []))
      .catch(() => setRough([]));
  }, []);

  useEffect(() => {
    if (!roughId) return;
    const r = rough.find((x) => x.id === roughId);
    if (r) setStartWeightCt(String(r.weightCt));
  }, [roughId, rough]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/manufacturing/stones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        qrCode,
        roughStoneId: roughId || null,
        startWeightCt: parseFloat(startWeightCt),
        notes,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Failed to create stone");
      setBusy(false);
      return;
    }
    const data = await res.json();
    router.push(`/manufacturing/${data.id}`);
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="New stone" description="Generate a tracker for an individual stone going through manufacturing." />
      <form onSubmit={submit} className="card p-6 space-y-4">
        <div>
          <label className="label">QR / barcode</label>
          <input className="input" value={qrCode} onChange={(e) => setQrCode(e.target.value)} required placeholder="STN-2026-0001" />
        </div>
        <div>
          <label className="label">Linked rough (optional)</label>
          <select className="input" value={roughId} onChange={(e) => setRoughId(e.target.value)}>
            <option value="">— None —</option>
            {rough.map((r) => (
              <option key={r.id} value={r.id}>{r.code} · {r.weightCt} ct</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Start weight (ct)</label>
          <input type="number" step="0.01" min="0" className="input" value={startWeightCt} onChange={(e) => setStartWeightCt(e.target.value)} required />
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea rows={2} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? "Creating..." : "Create stone"}</button>
        </div>
      </form>
    </div>
  );
}
