"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Award,
  DollarSign,
  Image as ImageIcon,
  MapPin,
  QrCode,
  Sparkle,
} from "lucide-react";
import { CERT_BODIES, CLARITIES, COLORS, SHAPES } from "@/lib/constants";
import {
  ErrorBanner,
  Field,
  FormFooter,
  FormSection,
  InfoCallout,
  NumberInput,
  OptionalTag,
  Select,
  TextInput,
} from "@/components/Form";
import { ScannableInput } from "@/components/ScannableInput";

interface EligibleStone {
  id: string;
  qrCode: string;
  currentWeightCt: number;
}

interface Props {
  suggestedSku: string;
  eligibleStones: EligibleStone[];
}

export function InventoryForm({ suggestedSku, eligibleStones }: Props) {
  const router = useRouter();
  const [sku, setSku] = useState(suggestedSku);
  const [stoneId, setStoneId] = useState("");
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

  const linkedStone = useMemo(
    () => (stoneId ? eligibleStones.find((s) => s.id === stoneId) : null),
    [stoneId, eligibleStones],
  );

  const caratNum = parseFloat(caratWeight);
  const priceNum = parseFloat(pricePerCt);
  const caratValid = Number.isFinite(caratNum) && caratNum > 0;
  const priceValid = Number.isFinite(priceNum) && priceNum >= 0;
  const totalPrice = caratValid && priceValid ? caratNum * priceNum : null;
  const grams = caratValid ? caratNum * 0.2 : null;
  const canSubmit = sku.trim().length > 0 && caratValid && priceValid;

  function onStoneChange(id: string) {
    setStoneId(id);
    if (id) {
      const s = eligibleStones.find((x) => x.id === id);
      if (s) setCaratWeight(String(s.currentWeightCt));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku: sku.trim(),
        stoneId: stoneId || undefined,
        shape,
        caratWeight: caratNum,
        color,
        clarity,
        pricePerCt: priceNum,
        certBody: certBody || undefined,
        certificateNo: certificateNo.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        location: location.trim() || undefined,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Could not create item.");
      setBusy(false);
      return;
    }
    router.push("/inventory");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <FormSection icon={QrCode} title="Identification">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field
            label="SKU"
            required
            hint="Stock-keeping unit. Auto-suggested by year + sequence. Used on labels, invoices, and B2B listings. Tap the camera to scan a pre-printed barcode."
          >
            <ScannableInput
              value={sku}
              onChange={setSku}
              required
              maxLength={64}
            />
          </Field>

          <Field
            label={
              <>
                Linked manufactured stone <OptionalTag />
              </>
            }
            hint="Link to a stone that just completed manufacturing. The spec is pulled from there and full provenance is preserved."
          >
            {eligibleStones.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs text-slate-600">
                No completed stones available — advance a stone to{" "}
                <span className="font-semibold">COMPLETED</span> in Manufacturing first, or
                add this item as standalone stock.
              </div>
            ) : (
              <Select value={stoneId} onChange={onStoneChange}>
                <option value="">— None (standalone item) —</option>
                {eligibleStones.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.qrCode} · {s.currentWeightCt.toFixed(2)} ct
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        {linkedStone && (
          <div className="rounded-lg bg-iris-50 border border-iris-100 px-3 py-2 text-xs text-iris-700">
            Linked to <span className="font-mono font-semibold">{linkedStone.qrCode}</span> —
            carat prefilled from the completed stone. Full audit chain is preserved.
          </div>
        )}
      </FormSection>

      <FormSection
        icon={Sparkle}
        title="Specification (4Cs)"
        description="The grading data buyers look at first."
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
            label="Carat weight"
            required
            hint="Final polished weight."
          >
            <NumberInput
              value={caratWeight}
              onChange={setCaratWeight}
              step={0.01}
              min={0.01}
              required
              suffix={grams !== null ? `≈ ${grams.toFixed(2)} g` : "ct"}
            />
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

      <FormSection icon={DollarSign} title="Pricing">
        <Field
          label="Price per carat (USD)"
          required
          hint="Set from the price-intelligence chart or Rapaport. Total auto-calculates."
        >
          <NumberInput
            value={pricePerCt}
            onChange={setPricePerCt}
            step={1}
            min={0}
            required
            placeholder="5000"
            prefix="$"
            suffix={totalPrice !== null ? `Total: $${totalPrice.toLocaleString()}` : "/ct"}
          />
        </Field>
      </FormSection>

      <FormSection
        icon={Award}
        title="Certification"
        description="Third-party grading report — buyers expect this for stones over ~0.50 ct."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field
            label={
              <>
                Certifying body <OptionalTag />
              </>
            }
            hint="Lab that graded this stone. GIA is the most widely accepted."
          >
            <Select value={certBody} onChange={setCertBody}>
              <option value="">— None —</option>
              {CERT_BODIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>

          <Field
            label={
              <>
                Certificate number <OptionalTag />
              </>
            }
            hint="Looked up against the lab's public registry by buyers."
          >
            <TextInput
              value={certificateNo}
              onChange={setCertificateNo}
              monospace
              placeholder="2185749632"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection icon={ImageIcon} title="Media & location" description="Optional, but listings with media sell faster.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field
            label={
              <>
                Image URL <OptionalTag />
              </>
            }
            hint="Public URL of a high-res photo. Production will move to direct upload."
          >
            <TextInput
              type="url"
              value={imageUrl}
              onChange={setImageUrl}
              placeholder="https://..."
            />
          </Field>

          <Field
            label={
              <>
                Video URL <OptionalTag />
              </>
            }
            hint="A 360° rotation video shown on the marketplace listing."
          >
            <TextInput
              type="url"
              value={videoUrl}
              onChange={setVideoUrl}
              placeholder="https://..."
            />
          </Field>

          <Field
            label={
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Storage location <OptionalTag />
              </span>
            }
            hint="Physical location in the vault. Speeds up fulfilment."
          >
            <TextInput
              value={location}
              onChange={setLocation}
              placeholder="Vault A · Tray 12"
            />
          </Field>
        </div>
      </FormSection>

      <InfoCallout title="What happens when you click Create item">
        <ul className="list-disc list-inside space-y-1">
          <li>
            The item enters stock with status <span className="font-semibold">IN_STOCK</span>.
          </li>
          <li>
            From the inventory detail page you can{" "}
            <span className="font-semibold">List for sale</span> to publish it on the
            marketplace.
          </li>
          <li>Buyer inquiries on a listed item land in the Inventory module for triage.</li>
          <li>
            If linked to a manufactured stone, marking it{" "}
            <span className="font-semibold">SOLD</span> later appends a sale event to that
            stone&apos;s audit chain.
          </li>
        </ul>
      </InfoCallout>

      <ErrorBanner message={err} />

      <FormFooter
        onCancel={() => router.back()}
        busy={busy}
        canSubmit={canSubmit}
        submitLabel="Create item"
        busyLabel="Saving..."
      />
    </form>
  );
}
