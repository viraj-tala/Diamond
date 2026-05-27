"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Calendar, DollarSign, Gem, LineChart } from "lucide-react";
import { CLARITIES, COLORS, SHAPES } from "@/lib/constants";
import { PageHeader } from "@/components/PageHeader";
import {
  ErrorBanner,
  Field,
  FormFooter,
  FormSection,
  InfoCallout,
  NumberInput,
  Select,
} from "@/components/Form";

const SOURCES = ["RAPAPORT", "IDEX", "MANUAL"];

const CARAT_BUCKETS = [
  "0.00-0.49",
  "0.50-0.69",
  "0.70-0.89",
  "0.90-0.99",
  "1.00-1.49",
  "1.50-1.99",
  "2.00-2.99",
  "3.00-3.99",
  "4.00-4.99",
  "5.00-9.99",
  "10+",
];

export default function AddPricePage() {
  const router = useRouter();
  const [shape, setShape] = useState("ROUND");
  const [caratBucket, setCaratBucket] = useState("1.00-1.49");
  const [color, setColor] = useState("G");
  const [clarity, setClarity] = useState("VS1");
  const [source, setSource] = useState("RAPAPORT");
  const [pricePerCt, setPricePerCt] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const priceNum = parseFloat(pricePerCt);
  const priceValid = Number.isFinite(priceNum) && priceNum >= 0;
  const canSubmit = priceValid;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shape,
        caratBucket,
        color,
        clarity,
        source,
        pricePerCt: priceNum,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Could not save price point.");
      setBusy(false);
      return;
    }
    router.push("/pricing");
    router.refresh();
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Add a price observation"
        description="Insert one price point from Rapaport, IDEX, or a manual entry. The pricing chart aggregates these over time and the estimator interpolates between them."
      />
      <form onSubmit={submit} className="space-y-6">
        <FormSection
          icon={Gem}
          title="Specification"
          description="The price applies to all stones matching this spec."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Shape" required>
              <Select value={shape} onChange={setShape}>
                {SHAPES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>

            <Field
              label="Carat bucket"
              required
              hint="Rapaport publishes prices by weight band, not exact carat. Pick the band this price applies to."
            >
              <Select value={caratBucket} onChange={setCaratBucket}>
                {CARAT_BUCKETS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </Select>
            </Field>

            <Field label="Color" required>
              <Select value={color} onChange={setColor}>
                {COLORS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>

            <Field label="Clarity" required>
              <Select value={clarity} onChange={setClarity}>
                {CLARITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
          </div>
        </FormSection>

        <FormSection icon={LineChart} title="Price">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field
              label="Source"
              required
              hint="RAPAPORT and IDEX are the industry-standard feeds. MANUAL is for prices you set yourself."
            >
              <Select value={source} onChange={setSource}>
                {SOURCES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>

            <Field
              label={
                <span className="inline-flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  Price per carat (USD)
                </span>
              }
              required
              hint="The published or observed price per carat. Used as a single data point on the trend chart."
            >
              <NumberInput
                value={pricePerCt}
                onChange={setPricePerCt}
                step={1}
                min={0}
                required
                placeholder="5500"
                prefix="$"
                suffix="/ct"
              />
            </Field>
          </div>
        </FormSection>

        <InfoCallout title="What this price point feeds into">
          <ul className="list-disc list-inside space-y-1">
            <li>
              The <span className="font-semibold">trend chart</span> on the Pricing page —
              each point becomes a dot on the timeline.
            </li>
            <li>
              The <span className="font-semibold">price estimator</span> used when adding
              inventory items, so polished stock can be priced against the latest market data.
            </li>
            <li>
              Recorded with a timestamp automatically — you can add the same spec at different
              times to build the historical series.
            </li>
          </ul>
          <div className="flex items-center gap-1.5 pt-1 text-emerald-700">
            <Calendar className="w-3.5 h-3.5" />
            <span className="font-medium">
              Tip: enter Rapaport observations weekly to keep the estimator current.
            </span>
          </div>
        </InfoCallout>

        <ErrorBanner message={err} />

        <FormFooter
          onCancel={() => router.back()}
          busy={busy}
          canSubmit={canSubmit}
          submitLabel="Save price point"
          busyLabel="Saving..."
        />
      </form>
    </div>
  );
}
