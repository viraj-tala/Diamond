"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, DollarSign, Hash, Package, Truck } from "lucide-react";
import { JOB_TYPES } from "@/lib/constants";
import { StageBadge } from "@/components/Badge";
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

interface Vendor {
  id: string;
  name: string;
}
interface StoneRow {
  id: string;
  qrCode: string;
  currentStage: string;
  currentWeightCt: number;
}

interface Props {
  vendors: Vendor[];
  stones: StoneRow[];
  suggestedOrderCode: string;
}

export function JobOrderForm({ vendors, stones, suggestedOrderCode }: Props) {
  const router = useRouter();
  const [orderCode, setOrderCode] = useState(suggestedOrderCode);
  const [vendorId, setVendorId] = useState("");
  const [jobType, setJobType] = useState<string>("POLISHING");
  const [ratePerCt, setRatePerCt] = useState("");
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return stones;
    return stones.filter((s) => s.qrCode.toLowerCase().includes(q));
  }, [filter, stones]);

  const totalCt = stones
    .filter((s) => pickedIds.has(s.id))
    .reduce((a, s) => a + s.currentWeightCt, 0);

  const rateNum = parseFloat(ratePerCt);
  const rateValid = Number.isFinite(rateNum) && rateNum >= 0;
  const estPayment = rateValid && totalCt > 0 ? rateNum * totalCt : null;

  const canSubmit =
    orderCode.trim().length > 0 && vendorId.length > 0 && pickedIds.size > 0 && rateValid;

  function togglePick(id: string) {
    const next = new Set(pickedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPickedIds(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/jobwork", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderCode: orderCode.trim(),
        vendorId,
        jobType,
        ratePerCt: rateNum,
        stoneIds: Array.from(pickedIds),
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Could not create order.");
      setBusy(false);
      return;
    }
    router.push("/jobwork");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <FormSection icon={Hash} title="Order">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field
            label="Order code"
            required
            hint="Internal reference. Auto-suggested by year + sequence. Tap the camera to scan a pre-printed order label."
          >
            <ScannableInput
              value={orderCode}
              onChange={setOrderCode}
              required
              maxLength={64}
            />
          </Field>

          <Field
            label="Job type"
            required
            hint="The cutting stage you're outsourcing."
          >
            <Select value={jobType} onChange={setJobType}>
              {JOB_TYPES.map((j) => (
                <option key={j}>{j}</option>
              ))}
            </Select>
          </Field>
        </div>
      </FormSection>

      <FormSection icon={Truck} title="Vendor">
        <Field
          label="Receiving vendor"
          required
          hint="The shop the stones are going to."
        >
          {vendors.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs text-slate-600">
              No vendors yet —{" "}
              <Link href="/jobwork/vendors" className="text-iris-600 font-medium underline">
                add one
              </Link>{" "}
              first.
            </div>
          ) : (
            <Select value={vendorId} onChange={setVendorId} required>
              <option value="">— Choose a vendor —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </FormSection>

      <FormSection
        icon={Package}
        title="Stones to send"
        description="Pick every stone going in this packet. Their current weights become the 'sent' baseline."
      >
        <div className="mb-3">
          <TextInput
            value={filter}
            onChange={setFilter}
            placeholder="Filter by QR code..."
            monospace={false}
          />
        </div>
        <div className="border border-slate-200 rounded-lg max-h-64 overflow-y-auto divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-sm text-slate-400 text-center">
              {stones.length === 0
                ? "No stones available — every stone is already COMPLETED."
                : "No stones match that filter."}
            </div>
          ) : (
            filtered.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={pickedIds.has(s.id)}
                  onChange={() => togglePick(s.id)}
                />
                <span className="font-mono text-xs flex-1">{s.qrCode}</span>
                <StageBadge stage={s.currentStage} />
                <span className="text-xs text-slate-500 w-16 text-right">
                  {s.currentWeightCt.toFixed(2)} ct
                </span>
              </label>
            ))
          )}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {pickedIds.size} selected
          </span>
          <span className="font-medium text-slate-800">
            Total sent: {totalCt.toFixed(2)} ct
          </span>
        </div>
      </FormSection>

      <FormSection icon={DollarSign} title="Pricing">
        <Field
          label={
            <>
              Rate per carat (USD) <OptionalTag />
            </>
          }
          hint="What the vendor charges per carat of returned stone. Payment = rate × returned carats (computed when the order returns)."
        >
          <NumberInput
            value={ratePerCt}
            onChange={setRatePerCt}
            step={1}
            min={0}
            placeholder="e.g. 50"
            prefix="$"
            suffix={
              estPayment !== null
                ? `Est. payment: $${estPayment.toLocaleString()}`
                : "/ct"
            }
          />
        </Field>
      </FormSection>

      <InfoCallout title="What happens when you click Send to vendor">
        <ul className="list-disc list-inside space-y-1">
          <li>
            Each selected stone&apos;s current weight is locked in as the{" "}
            <span className="font-semibold">sent weight</span> for this order.
          </li>
          <li>
            A <span className="font-semibold">SENT_TO_VENDOR</span> event is appended to every
            stone&apos;s audit chain.
          </li>
          <li>
            The order status is set to <span className="font-semibold">SENT</span>. When the
            vendor returns the stones, open the order and enter returned weights — the system
            computes loss and payment.
          </li>
        </ul>
      </InfoCallout>

      <ErrorBanner message={err} />

      <FormFooter
        onCancel={() => router.back()}
        busy={busy}
        canSubmit={canSubmit}
        submitLabel="Send to vendor"
        busyLabel="Sending..."
      />
    </form>
  );
}
