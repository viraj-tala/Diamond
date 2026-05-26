"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { JOB_TYPES } from "@/lib/constants";

interface Vendor { id: string; name: string; }
interface Stone { id: string; qrCode: string; currentWeightCt: number; }

export default function NewJobOrderPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [stones, setStones] = useState<Stone[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [jobType, setJobType] = useState<string>("POLISHING");
  const [ratePerCt, setRatePerCt] = useState("");
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/jobwork/vendors").then((r) => r.json()).then((d) => setVendors(d.items ?? []));
    fetch("/api/manufacturing/stones/list").then((r) => r.json()).then((d) => setStones(d.items ?? []));
    setOrderCode(`JOB-${Date.now().toString().slice(-6)}`);
  }, []);

  const totalCt = stones
    .filter((s) => pickedIds.has(s.id))
    .reduce((a, s) => a + (s.currentWeightCt ?? 0), 0);

  function togglePick(id: string) {
    const next = new Set(pickedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setPickedIds(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pickedIds.size === 0) {
      setErr("Pick at least one stone");
      return;
    }
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/jobwork", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderCode,
        vendorId,
        jobType,
        ratePerCt: parseFloat(ratePerCt || "0"),
        stoneIds: Array.from(pickedIds),
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Failed");
      setBusy(false);
      return;
    }
    router.push("/jobwork");
    router.refresh();
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="New job order" description="Send stones to an outside vendor for processing." />
      <form onSubmit={submit} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Order code</label>
            <input className="input" value={orderCode} onChange={(e) => setOrderCode(e.target.value)} required />
          </div>
          <div>
            <label className="label">Vendor</label>
            <select className="input" value={vendorId} onChange={(e) => setVendorId(e.target.value)} required>
              <option value="">— Choose —</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Job type</label>
            <select className="input" value={jobType} onChange={(e) => setJobType(e.target.value)}>
              {JOB_TYPES.map((j) => <option key={j}>{j}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Rate per ct (USD)</label>
            <input type="number" step="1" min="0" className="input" value={ratePerCt} onChange={(e) => setRatePerCt(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Stones to send ({pickedIds.size} selected · {totalCt.toFixed(2)} ct)</label>
          <div className="border border-slate-200 rounded-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
            {stones.length === 0 ? (
              <div className="px-3 py-4 text-sm text-slate-400">No stones available.</div>
            ) : (
              stones.map((s) => (
                <label key={s.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={pickedIds.has(s.id)}
                    onChange={() => togglePick(s.id)}
                  />
                  <span className="font-mono text-xs flex-1">{s.qrCode}</span>
                  <span className="text-xs text-slate-500">{s.currentWeightCt?.toFixed(2)} ct</span>
                </label>
              ))
            )}
          </div>
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? "Sending..." : "Send to vendor"}</button>
        </div>
      </form>
    </div>
  );
}
