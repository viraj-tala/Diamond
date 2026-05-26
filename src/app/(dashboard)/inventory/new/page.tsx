"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { SHAPES, COLORS, CLARITIES, CERT_BODIES } from "@/lib/constants";

export default function NewInventoryPage() {
  const router = useRouter();
  const [sku, setSku] = useState("");
  const [shape, setShape] = useState("ROUND");
  const [caratWeight, setCaratWeight] = useState("");
  const [color, setColor] = useState("G");
  const [clarity, setClarity] = useState("VS1");
  const [pricePerCt, setPricePerCt] = useState("");
  const [certBody, setCertBody] = useState("GIA");
  const [certificateNo, setCertificateNo] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const total = parseFloat(caratWeight || "0") * parseFloat(pricePerCt || "0");

  useEffect(() => {
    if (!sku) {
      const now = Date.now().toString().slice(-6);
      setSku(`INV-${now}`);
    }
  }, [sku]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku,
        shape,
        caratWeight: parseFloat(caratWeight),
        color,
        clarity,
        pricePerCt: parseFloat(pricePerCt),
        certBody: certBody || undefined,
        certificateNo: certificateNo || undefined,
        imageUrl: imageUrl || undefined,
        videoUrl: videoUrl || undefined,
        location: location || undefined,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Failed");
      setBusy(false);
      return;
    }
    router.push("/inventory");
    router.refresh();
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="New inventory item" description="Add polished diamond stock with certificate and media." />
      <form onSubmit={submit} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><label className="label">SKU</label><input className="input" value={sku} onChange={(e) => setSku(e.target.value)} required /></div>
          <div>
            <label className="label">Shape</label>
            <select className="input" value={shape} onChange={(e) => setShape(e.target.value)}>
              {SHAPES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="label">Carat</label><input type="number" step="0.01" min="0" className="input" value={caratWeight} onChange={(e) => setCaratWeight(e.target.value)} required /></div>
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
          <div><label className="label">Price / ct (USD)</label><input type="number" step="1" min="0" className="input" value={pricePerCt} onChange={(e) => setPricePerCt(e.target.value)} required /></div>
          <div>
            <label className="label">Cert body</label>
            <select className="input" value={certBody} onChange={(e) => setCertBody(e.target.value)}>
              <option value="">None</option>
              {CERT_BODIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="label">Certificate no.</label><input className="input" value={certificateNo} onChange={(e) => setCertificateNo(e.target.value)} /></div>
          <div><label className="label">Location</label><input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Vault A" /></div>
          <div className="md:col-span-2"><label className="label">Image URL</label><input className="input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." /></div>
          <div><label className="label">Video URL</label><input className="input" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} /></div>
        </div>

        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
          <span className="text-slate-500">Total estimated value:</span>{" "}
          <span className="font-semibold">{total ? `$${total.toLocaleString()}` : "—"}</span>
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? "Saving..." : "Create item"}</button>
        </div>
      </form>
    </div>
  );
}
