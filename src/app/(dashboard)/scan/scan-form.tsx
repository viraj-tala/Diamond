"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ScannableInput } from "@/components/ScannableInput";
import { NumberInput, Select, Textarea } from "@/components/Form";

interface Props {
  workers: { id: string; name: string }[];
}

interface ScanResult {
  stoneId: string;
  qrCode: string;
  from: string;
  to: string;
  weightAfter: number;
  lossCt: number;
}

export function ScanForm({ workers }: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [weightAfter, setWeightAfter] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setResult(null);
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: code.trim(),
        weightAfter: weightAfter ? parseFloat(weightAfter) : undefined,
        workerId: workerId || null,
        notes: notes || undefined,
      }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(d.error ?? "Scan failed");
      return;
    }
    setResult(d as ScanResult);
    setCode("");
    setWeightAfter("");
    setNotes("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card p-6 space-y-4 text-sm">
      <div>
        <label className="label">QR / RFID code</label>
        <ScannableInput
          value={code}
          onChange={setCode}
          autoFocus
          required
          placeholder="STN-2026-0001"
        />
        <div className="text-xs text-slate-400 mt-1">
          Tap the camera icon to scan a label, paste from a USB scanner, or type.
        </div>
      </div>
      <div>
        <label className="label">
          Weight after (ct) <span className="text-slate-400 text-xs">— optional</span>
        </label>
        <NumberInput
          value={weightAfter}
          onChange={setWeightAfter}
          step={0.01}
          min={0}
          placeholder="leave empty for scan-only (no weight change)"
          suffix="ct"
        />
      </div>
      <div>
        <label className="label">Worker</label>
        <Select value={workerId} onChange={setWorkerId}>
          <option value="">— None —</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="label">Notes</label>
        <Textarea rows={2} value={notes} onChange={setNotes} />
      </div>
      {err && <div className="text-sm text-red-600">{err}</div>}
      {result && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <div className="font-medium">
            {result.qrCode}: {result.from} → {result.to}
          </div>
          {result.lossCt > 0 && (
            <div className="text-xs mt-0.5">
              Recorded loss: {result.lossCt.toFixed(3)} ct
            </div>
          )}
        </div>
      )}
      <button className="btn-primary w-full" disabled={busy || !code}>
        {busy ? "Scanning..." : "Advance stage"}
      </button>
    </form>
  );
}
