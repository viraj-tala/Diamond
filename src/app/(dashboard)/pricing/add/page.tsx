"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { SHAPES, COLORS, CLARITIES } from "@/lib/constants";

const SOURCES = ["RAPAPORT", "IDEX", "MANUAL"];

export default function AddPricePage() {
  const router = useRouter();
  const [shape, setShape] = useState("ROUND");
  const [caratBucket, setCaratBucket] = useState("1.00-1.49");
  const [color, setColor] = useState("G");
  const [clarity, setClarity] = useState("VS1");
  const [source, setSource] = useState("RAPAPORT");
  const [pricePerCt, setPricePerCt] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shape, caratBucket, color, clarity, source, pricePerCt: parseFloat(pricePerCt) }),
    });
    setBusy(false);
    router.push("/pricing");
    router.refresh();
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="Add price point" description="Insert a single Rapaport / IDEX / manual price observation." />
      <form onSubmit={submit} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Shape</label>
            <select className="input" value={shape} onChange={(e) => setShape(e.target.value)}>
              {SHAPES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Carat bucket</label>
            <input className="input" value={caratBucket} onChange={(e) => setCaratBucket(e.target.value)} placeholder="1.00-1.49" />
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
            <label className="label">Source</label>
            <select className="input" value={source} onChange={(e) => setSource(e.target.value)}>
              {SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Price per ct (USD)</label>
            <input type="number" step="1" min="0" className="input" value={pricePerCt} onChange={(e) => setPricePerCt(e.target.value)} required />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? "Saving..." : "Save price point"}</button>
        </div>
      </form>
    </div>
  );
}
