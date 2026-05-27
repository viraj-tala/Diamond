"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Gem, QrCode, Radio, Scale } from "lucide-react";
import { STAGES } from "@/lib/constants";
import {
  ErrorBanner,
  Field,
  FormFooter,
  FormSection,
  InfoCallout,
  NumberInput,
  OptionalTag,
  Select,
  Textarea,
} from "@/components/Form";
import { ScannableInput } from "@/components/ScannableInput";

interface RoughOption {
  id: string;
  code: string;
  weightCt: number;
  color: string | null;
  clarity: string | null;
  shape: string | null;
}

interface Props {
  roughs: RoughOption[];
  suggestedQr: string;
}

export function StoneForm({ roughs, suggestedQr }: Props) {
  const router = useRouter();
  const [qrCode, setQrCode] = useState(suggestedQr);
  const [rfidTag, setRfidTag] = useState("");
  const [roughId, setRoughId] = useState("");
  const [startWeightCt, setStartWeightCt] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const selectedRough = useMemo(
    () => (roughId ? roughs.find((r) => r.id === roughId) : null),
    [roughId, roughs],
  );

  const weightNum = parseFloat(startWeightCt);
  const weightValid = Number.isFinite(weightNum) && weightNum > 0;
  const weightGrams = weightValid ? weightNum * 0.2 : null;
  const canSubmit = qrCode.trim().length > 0 && weightValid;

  function onRoughChange(newId: string) {
    setRoughId(newId);
    if (newId) {
      const r = roughs.find((x) => x.id === newId);
      if (r) setStartWeightCt(String(r.weightCt));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/manufacturing/stones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        qrCode: qrCode.trim(),
        rfidTag: rfidTag.trim() || null,
        roughStoneId: roughId || null,
        startWeightCt: weightNum,
        notes: notes.trim() || undefined,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Could not create stone.");
      setBusy(false);
      return;
    }
    const data = await res.json();
    router.push(`/manufacturing/${data.id}`);
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <FormSection icon={QrCode} title="Identification">
        <Field
          label="QR / barcode"
          required
          hint="Printed on the packet label. Auto-suggested using this year + the next sequence; edit, or tap the camera to scan a pre-printed label."
        >
          <ScannableInput
            value={qrCode}
            onChange={setQrCode}
            required
            maxLength={64}
            placeholder="STN-2026-0001"
          />
        </Field>

        <Field
          label={
            <span className="inline-flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-slate-400" />
              RFID tag <OptionalTag />
            </span>
          }
          hint={
            <>
              Only if you have RFID readers at workstations. Leave blank for QR-only workflows.{" "}
              <Link href="/scan" className="text-iris-600 underline">
                See Scan page
              </Link>
              .
            </>
          }
        >
          <ScannableInput
            value={rfidTag}
            onChange={setRfidTag}
            maxLength={64}
            placeholder="E2-00-... (EPC format)"
          />
        </Field>
      </FormSection>

      <FormSection icon={Gem} title="Source">
        <Field
          label={
            <>
              Linked rough <OptionalTag />
            </>
          }
          hint="If this stone was cut from a rough you registered in Yield Optimizer, link it so the chain of custody is intact. Leave None for stones received pre-cut."
        >
          {roughs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs text-slate-600">
              No rough stones registered yet.{" "}
              <Link href="/yield/new" className="text-iris-600 font-medium underline">
                Add one in Yield Optimizer
              </Link>{" "}
              first, or skip this field for a standalone stone.
            </div>
          ) : (
            <Select value={roughId} onChange={onRoughChange}>
              <option value="">— None (standalone stone) —</option>
              {roughs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} · {r.weightCt} ct
                  {r.shape ? ` · ${r.shape}` : ""}
                  {r.color ? ` · ${r.color}` : ""}
                  {r.clarity ? `/${r.clarity}` : ""}
                </option>
              ))}
            </Select>
          )}
        </Field>

        {selectedRough && (
          <div className="rounded-lg bg-iris-50 border border-iris-100 px-3 py-2 text-xs text-iris-700">
            Linked to <span className="font-mono font-semibold">{selectedRough.code}</span> —{" "}
            {selectedRough.weightCt} ct
            {selectedRough.shape ? ` · ${selectedRough.shape}` : ""}
            {selectedRough.color ? ` · ${selectedRough.color}` : ""}
            {selectedRough.clarity ? `/${selectedRough.clarity}` : ""}. Start weight prefilled
            from this rough — adjust if the stone is already past sawing.
          </div>
        )}
      </FormSection>

      <FormSection icon={Scale} title="Initial measurement">
        <Field
          label="Start weight (in carats)"
          required
          hint="The stone's weight right now. Weight lost at each cutting stage is calculated from here. (1 carat = 0.2 grams.)"
        >
          <NumberInput
            value={startWeightCt}
            onChange={setStartWeightCt}
            step={0.01}
            min={0.01}
            required
            placeholder="e.g. 2.50"
            suffix={weightGrams !== null ? `≈ ${weightGrams.toFixed(2)} g` : "ct"}
          />
        </Field>
      </FormSection>

      <FormSection icon={FileText} title="Notes">
        <Field
          label={
            <>
              Free notes <OptionalTag />
            </>
          }
          hint="Anything worth remembering — supplier batch ID, expected polished weight, special handling instructions."
        >
          <Textarea
            rows={3}
            value={notes}
            onChange={setNotes}
            placeholder="e.g. Lot received 12 Mar from Antwerp dealer. Expected polished ~1.05 ct."
          />
        </Field>
      </FormSection>

      <InfoCallout title="What happens when you click Create stone">
        <ul className="list-disc list-inside space-y-1">
          <li>
            The stone is registered and enters the{" "}
            <span className="font-semibold">PLANNING</span> stage.
          </li>
          <li>
            A tamper-evident <span className="font-semibold">RECEIVED</span> event is appended
            to the audit chain.
          </li>
          <li>
            From now on, workers can scan it on the{" "}
            <Link href="/scan" className="underline font-medium">
              Scan page
            </Link>{" "}
            (or via an IoT reader) to advance it through every stage.
          </li>
        </ul>
        <div className="flex flex-wrap items-center gap-1.5 pt-2">
          {STAGES.map((s, i) => (
            <span key={s} className="flex items-center gap-1.5">
              <span
                className={
                  i === 0
                    ? "px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-semibold uppercase tracking-wide"
                    : "px-2 py-0.5 rounded-full bg-white border border-emerald-200 text-emerald-700 text-[10px] font-medium uppercase tracking-wide"
                }
              >
                {s}
              </span>
              {i < STAGES.length - 1 && <span className="text-emerald-300">→</span>}
            </span>
          ))}
        </div>
      </InfoCallout>

      <ErrorBanner message={err} />

      <FormFooter
        onCancel={() => router.back()}
        busy={busy}
        canSubmit={canSubmit}
        submitLabel="Create stone"
        busyLabel="Creating..."
      />
    </form>
  );
}
