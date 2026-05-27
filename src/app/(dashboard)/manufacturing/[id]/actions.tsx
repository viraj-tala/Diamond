"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Scale, User } from "lucide-react";
import { StageBadge } from "@/components/Badge";
import {
  ErrorBanner,
  Field,
  NumberInput,
  Select,
  Textarea,
} from "@/components/Form";

interface Props {
  stoneId: string;
  currentStage: string;
  currentWeight: number;
  nextStage: string;
  workers: { id: string; name: string }[];
}

export function AdvanceStageForm({
  stoneId,
  currentStage,
  currentWeight,
  nextStage,
  workers,
}: Props) {
  const router = useRouter();
  const [weightAfter, setWeightAfter] = useState(String(currentWeight));
  const [workerId, setWorkerId] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const weightNum = parseFloat(weightAfter);
  const weightValid =
    Number.isFinite(weightNum) && weightNum > 0 && weightNum <= currentWeight;
  const loss = weightValid ? currentWeight - weightNum : null;
  const lossPct =
    loss !== null && currentWeight > 0 ? (loss / currentWeight) * 100 : null;
  const canSubmit = weightValid;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setErr(null);
    const res = await fetch(`/api/manufacturing/stones/${stoneId}/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weightAfter: weightNum,
        workerId: workerId || null,
        notes: notes.trim() || undefined,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Could not advance.");
      setBusy(false);
      return;
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4 text-sm">
      <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-50 px-3 py-2 border border-slate-200">
        <StageBadge stage={currentStage} />
        <ArrowRight className="w-4 h-4 text-slate-400" />
        <StageBadge stage={nextStage} />
      </div>

      <Field
        label={
          <span className="inline-flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-slate-400" />
            Weight after (ct)
          </span>
        }
        hint={`Current: ${currentWeight} ct. Enter weight measured after this stage. System computes loss automatically.`}
        required
      >
        <NumberInput
          value={weightAfter}
          onChange={setWeightAfter}
          step={0.01}
          min={0}
          max={currentWeight}
          required
          suffix="ct"
        />
        {loss !== null && lossPct !== null && (
          <div
            className={`mt-1.5 text-xs font-medium ${
              loss === 0
                ? "text-slate-500"
                : lossPct < 30
                ? "text-emerald-700"
                : lossPct < 50
                ? "text-amber-700"
                : "text-red-700"
            }`}
          >
            {loss === 0
              ? "No weight change recorded for this stage."
              : `Loss: ${loss.toFixed(3)} ct (${lossPct.toFixed(1)}%)`}
          </div>
        )}
      </Field>

      <Field
        label={
          <span className="inline-flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Worker
          </span>
        }
        hint="Who performed this stage. Drives daily output stats and incentives."
      >
        <Select value={workerId} onChange={setWorkerId}>
          <option value="">— None / not tracked —</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Notes">
        <Textarea
          rows={2}
          value={notes}
          onChange={setNotes}
          placeholder="Anything special about this stage."
        />
      </Field>

      <ErrorBanner message={err} />

      <button className="btn-primary w-full" disabled={!canSubmit || busy}>
        {busy ? "Advancing..." : `Move to ${nextStage}`}
      </button>
    </form>
  );
}
