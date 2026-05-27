"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, Image as ImageIcon, ScanSearch } from "lucide-react";
import { StageBadge } from "@/components/Badge";
import {
  ErrorBanner,
  Field,
  FormFooter,
  FormSection,
  InfoCallout,
  OptionalTag,
  Select,
  TextInput,
  Textarea,
} from "@/components/Form";

interface StoneCandidate {
  id: string;
  qrCode: string;
  currentStage: string;
  currentWeightCt: number;
}

interface Props {
  stones: StoneCandidate[];
}

export function QualityForm({ stones }: Props) {
  const router = useRouter();
  const [stoneId, setStoneId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const selected = stones.find((s) => s.id === stoneId);
  const canSubmit = stoneId.length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/quality", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stoneId,
        imageUrl: imageUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Inspection failed.");
      setBusy(false);
      return;
    }
    router.push("/quality");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <FormSection
        icon={ScanSearch}
        title="Stone to inspect"
        description="Pick the stone the inspector is holding."
      >
        <Field label="Stone" required>
          {stones.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs text-slate-600">
              No stones are past PLANNING yet. Advance a stone in Manufacturing first.
            </div>
          ) : (
            <Select value={stoneId} onChange={setStoneId} required>
              <option value="">— Choose a stone —</option>
              {stones.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.qrCode} · {s.currentStage} · {s.currentWeightCt.toFixed(2)} ct
                </option>
              ))}
            </Select>
          )}
        </Field>

        {selected && (
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs">
            <span className="font-mono">{selected.qrCode}</span>
            <span className="text-slate-400">·</span>
            <StageBadge stage={selected.currentStage} />
            <span className="text-slate-400">·</span>
            <span>{selected.currentWeightCt.toFixed(2)} ct</span>
          </div>
        )}
      </FormSection>

      <FormSection icon={ImageIcon} title="Inspection image">
        <Field
          label={
            <>
              Image URL <OptionalTag />
            </>
          }
          hint="A high-resolution macro of the stone, hosted somewhere public. In production this will become a direct upload + CV pipeline (YOLO / SAM). For now, the URL is used deterministically as a seed for the demo detector."
        >
          <TextInput
            type="url"
            value={imageUrl}
            onChange={setImageUrl}
            placeholder="https://..."
          />
          {imageUrl.trim().startsWith("http") && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl.trim()}
              alt="Inspection preview"
              className="mt-2 max-h-40 rounded-lg border border-slate-200 object-contain bg-slate-50"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
        </Field>
      </FormSection>

      <FormSection icon={FileText} title="Inspector notes">
        <Field
          label={
            <>
              Notes <OptionalTag />
            </>
          }
          hint="What the human inspector noticed. Stored alongside the AI score."
        >
          <Textarea
            rows={3}
            value={notes}
            onChange={setNotes}
            placeholder="e.g. Small surface scratch on table. Confirm under 10x loupe."
          />
        </Field>
      </FormSection>

      <InfoCallout title="Scoring & recommendation">
        <ul className="list-disc list-inside space-y-1">
          <li>
            <span className="font-semibold">PASS</span> (score ≥ 80) — stone moves on to
            certification.
          </li>
          <li>
            <span className="font-semibold">REWORK</span> (55–79) — defects are correctable;
            send back for re-polish.
          </li>
          <li>
            <span className="font-semibold">REJECT</span> (&lt; 55) — defects unrecoverable;
            stone is held out.
          </li>
          <li>
            A <span className="font-semibold">QC_INSPECTED</span> event is appended to the
            stone&apos;s tamper-evident audit chain in either case.
          </li>
        </ul>
      </InfoCallout>

      <ErrorBanner message={err} />

      <FormFooter
        onCancel={() => router.back()}
        busy={busy}
        canSubmit={canSubmit}
        submitLabel="Run inspection"
        busyLabel="Inspecting..."
      />
    </form>
  );
}
