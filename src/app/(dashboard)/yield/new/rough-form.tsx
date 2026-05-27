"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DollarSign, FileText, Gem, QrCode, Scale, Sparkles } from "lucide-react";
import { CLARITIES, COLORS, SHAPES } from "@/lib/constants";
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

interface Props {
  suggestedCode: string;
}

export function RoughForm({ suggestedCode }: Props) {
  const router = useRouter();
  const [code, setCode] = useState(suggestedCode);
  const [weightCt, setWeightCt] = useState("");
  const [color, setColor] = useState("G");
  const [clarity, setClarity] = useState("VS1");
  const [shape, setShape] = useState("ROUND");
  const [costPerCt, setCostPerCt] = useState("3000");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const weightNum = parseFloat(weightCt);
  const costNum = parseFloat(costPerCt);
  const weightValid = Number.isFinite(weightNum) && weightNum > 0;
  const costValid = Number.isFinite(costNum) && costNum >= 0;
  const totalCost = weightValid && costValid ? weightNum * costNum : null;
  const grams = weightValid ? weightNum * 0.2 : null;
  const canSubmit = code.trim().length > 0 && weightValid && costValid;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/yield/rough", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: code.trim(),
        weightCt: weightNum,
        color,
        clarity,
        shape,
        costPerCt: costNum,
        notes: notes.trim() || undefined,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Could not create rough stone.");
      setBusy(false);
      return;
    }
    const data = await res.json();
    router.push(`/yield/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <FormSection icon={QrCode} title="Identification">
        <Field
          label="Rough code"
          required
          hint="Internal reference for this rough. Auto-suggested by year + sequence; edit, or tap the camera to scan a pre-printed label."
        >
          <ScannableInput
            value={code}
            onChange={setCode}
            required
            maxLength={64}
            placeholder="ROUGH-2026-0001"
          />
        </Field>
      </FormSection>

      <FormSection
        icon={Gem}
        title="Stone characteristics"
        description="The 4Cs of the rough as estimated by the grader. The planner uses these to project polished value per plan."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field
            label="Weight (carats)"
            required
            hint="Total rough weight. Polished outputs will recover 40–60% of this depending on plan."
          >
            <NumberInput
              value={weightCt}
              onChange={setWeightCt}
              step={0.01}
              min={0.01}
              required
              placeholder="e.g. 5.50"
              suffix={grams !== null ? `≈ ${grams.toFixed(2)} g` : "ct"}
            />
          </Field>

          <Field
            label="Intended shape"
            hint="The shape the planner should optimise toward. Round commands the highest premium."
          >
            <Select value={shape} onChange={setShape}>
              {SHAPES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>

          <Field
            label="Color"
            hint="D is colorless (highest), M is faint yellow (lowest in the demo set)."
          >
            <Select value={color} onChange={setColor}>
              {COLORS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>

          <Field
            label="Clarity"
            hint="FL (flawless) → I3 (heavily included). Estimated from a 10× loupe inspection."
          >
            <Select value={clarity} onChange={setClarity}>
              {CLARITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
        </div>
      </FormSection>

      <FormSection icon={DollarSign} title="Cost basis">
        <Field
          label="Cost per carat (USD)"
          required
          hint="What you paid per carat at acquisition. Used to compute profit on each cut plan."
        >
          <NumberInput
            value={costPerCt}
            onChange={setCostPerCt}
            step={1}
            min={0}
            required
            placeholder="3000"
            prefix="$"
            suffix={totalCost !== null ? `Total: $${totalCost.toLocaleString()}` : null}
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
          hint="Supplier batch, special inclusions to plan around, etc."
        >
          <Textarea
            rows={3}
            value={notes}
            onChange={setNotes}
            placeholder="e.g. Batch from Antwerp dealer. Surface graining on one side — plan around it."
          />
        </Field>
      </FormSection>

      <InfoCallout title="What happens when you click Generate plans">
        <ul className="list-disc list-inside space-y-1">
          <li>
            The rough is saved and <span className="font-semibold">three cut plans</span> are
            generated instantly:
          </li>
          <li className="ml-4 list-[circle]">
            <span className="font-semibold">Plan A — Single large stone</span> (~42% yield,
            premium per-carat price)
          </li>
          <li className="ml-4 list-[circle]">
            <span className="font-semibold">Plan B — Two equal stones</span> (~52% yield, lower
            per-carat price)
          </li>
          <li className="ml-4 list-[circle]">
            <span className="font-semibold">Plan C — Yield-max</span> (~60% yield, one clarity
            grade drop accepted)
          </li>
          <li>
            You&apos;ll land on the comparison page with revenue, cost, and profit for each.
            Click <span className="font-semibold">Select</span> on the winner.
          </li>
        </ul>
        <div className="flex items-center gap-2 pt-1 text-emerald-700">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="font-medium">No data is committed downstream until you select.</span>
        </div>
      </InfoCallout>

      <ErrorBanner message={err} />

      <FormFooter
        onCancel={() => router.back()}
        busy={busy}
        canSubmit={canSubmit}
        submitLabel="Generate plans"
        busyLabel="Generating..."
      />
    </form>
  );
}
