"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { CLARITIES, COLORS, SHAPES } from "@/lib/constants";

export default function NewRoughPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [weightCt, setWeightCt] = useState("");
  const [color, setColor] = useState("G");
  const [clarity, setClarity] = useState("VS1");
  const [shape, setShape] = useState("ROUND");
  const [costPerCt, setCostPerCt] = useState("3000");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    const res = await fetch("/api/yield/rough", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        weightCt: parseFloat(weightCt),
        color,
        clarity,
        shape,
        costPerCt: parseFloat(costPerCt),
        notes,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Failed to create");
      setSubmitting(false);
      return;
    }
    const data = await res.json();
    router.push(`/yield/${data.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="New rough stone" description="System will auto-generate cut plans for comparison." />
      <form onSubmit={submit} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Stone code</label>
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="ROUGH-001" />
          </div>
          <div>
            <label className="label">Weight (ct)</label>
            <input type="number" step="0.01" min="0" className="input" value={weightCt} onChange={(e) => setWeightCt(e.target.value)} required />
          </div>
          <div>
            <label className="label">Color</label>
            <select className="input" value={color} onChange={(e) => setColor(e.target.value)}>
              {COLORS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Clarity</label>
            <select className="input" value={clarity} onChange={(e) => setClarity(e.target.value)}>
              {CLARITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Intended shape</label>
            <select className="input" value={shape} onChange={(e) => setShape(e.target.value)}>
              {SHAPES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Cost per ct (USD)</label>
            <input type="number" step="1" className="input" value={costPerCt} onChange={(e) => setCostPerCt(e.target.value)} required />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          <button className="btn-primary" disabled={submitting}>{submitting ? "Generating plans..." : "Create & generate plans"}</button>
        </div>
      </form>
    </div>
  );
}
