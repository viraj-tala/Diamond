"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";

interface StoneOption { id: string; qrCode: string; }

export default function NewQualityPage() {
  const router = useRouter();
  const [stones, setStones] = useState<StoneOption[]>([]);
  const [stoneId, setStoneId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/manufacturing/stones/list")
      .then((r) => r.json())
      .then((d) => setStones(d.items ?? []));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/quality", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stoneId, imageUrl: imageUrl || undefined, notes }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Failed");
      setBusy(false);
      return;
    }
    router.push("/quality");
    router.refresh();
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="New inspection" description="Submit an image — the AI stub will return a defect score and recommendation." />
      <form onSubmit={submit} className="card p-6 space-y-4">
        <div>
          <label className="label">Stone</label>
          <select className="input" value={stoneId} onChange={(e) => setStoneId(e.target.value)} required>
            <option value="">— Choose a stone —</option>
            {stones.map((s) => <option key={s.id} value={s.id}>{s.qrCode}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Image URL (optional)</label>
          <input className="input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
          <p className="mt-1 text-xs text-slate-400">In production: upload a high-res macro image. Here we use the URL as a seed for the demo detector.</p>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea rows={2} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? "Inspecting..." : "Run inspection"}</button>
        </div>
      </form>
    </div>
  );
}
