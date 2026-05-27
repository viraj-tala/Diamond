"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Briefcase, DollarSign, KeyRound, User } from "lucide-react";
import {
  ErrorBanner,
  Field,
  FormFooter,
  FormSection,
  InfoCallout,
  NumberInput,
  PasswordInput,
  Select,
  TextInput,
} from "@/components/Form";
import { ScannableInput } from "@/components/ScannableInput";

const DEPARTMENTS = ["SAWING", "BRUTING", "POLISHING", "QC"];

interface Props {
  suggestedCode: string;
  workerCount: number;
}

export function WorkerForm({ suggestedCode, workerCount }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [employeeCode, setEmployeeCode] = useState(suggestedCode);
  const [department, setDepartment] = useState("POLISHING");
  const [hourlyRate, setHourlyRate] = useState("0");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const passwordStrength =
    password.length === 0
      ? null
      : password.length < 6
      ? "weak"
      : password.length < 10
      ? "ok"
      : "strong";

  const emailLooksValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

  const canSubmit =
    name.trim().length > 0 &&
    emailLooksValid &&
    password.length >= 6 &&
    employeeCode.trim().length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/workers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        employeeCode: employeeCode.trim(),
        department,
        hourlyRate: parseFloat(hourlyRate || "0"),
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Could not create worker.");
      setBusy(false);
      return;
    }
    router.push("/workers");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <FormSection
        icon={User}
        title="Identity"
        description="The worker's name and unique employee code. The code appears in stage attribution logs and payroll exports."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Full name" required hint="As it appears on payroll.">
            <TextInput
              value={name}
              onChange={setName}
              required
              placeholder="Rahul Patel"
            />
          </Field>

          <Field
            label="Employee code"
            required
            hint="Auto-suggested. Stays with the worker for their entire tenure. Tap the camera to scan a pre-printed badge."
          >
            <ScannableInput
              value={employeeCode}
              onChange={setEmployeeCode}
              required
              maxLength={32}
              placeholder="EMP001"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        icon={Briefcase}
        title="Employment"
        description="Where they work and what they're paid per hour."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field
            label="Department"
            hint="The cutting stage where this worker primarily operates. Used for shift planning and station-level analytics."
          >
            <Select value={department} onChange={setDepartment}>
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
          </Field>

          <Field
            label={
              <span className="inline-flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                Hourly rate (USD)
              </span>
            }
            hint="Base hourly pay. Incentives are added on top via monthly incentive entries."
          >
            <NumberInput
              value={hourlyRate}
              onChange={setHourlyRate}
              step={0.5}
              min={0}
              placeholder="0"
              prefix="$"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        icon={KeyRound}
        title="Access credentials"
        description="The worker uses this email + password to log into the Lustra app on their phone — scanning stones, viewing their own logs."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field
            label="Email (login)"
            required
            hint="Must be unique across the entire system."
          >
            <TextInput
              type="email"
              value={email}
              onChange={setEmail}
              required
              placeholder="rahul@lustra.local"
              autoComplete="email"
            />
            {email.length > 0 && !emailLooksValid && (
              <div className="mt-1 text-xs text-red-600">
                That doesn&apos;t look like a valid email.
              </div>
            )}
          </Field>

          <Field
            label="Initial password"
            required
            hint="Minimum 6 characters. The worker should change this on first login (feature on the roadmap)."
          >
            <PasswordInput
              value={password}
              onChange={setPassword}
              minLength={6}
              required
              placeholder="at least 6 characters"
              autoComplete="new-password"
            />
            {passwordStrength && (
              <div
                className={`mt-1 text-xs font-medium ${
                  passwordStrength === "weak"
                    ? "text-red-600"
                    : passwordStrength === "ok"
                    ? "text-amber-700"
                    : "text-emerald-700"
                }`}
              >
                {passwordStrength === "weak" && "Too short — minimum 6 characters."}
                {passwordStrength === "ok" && "OK. Longer is better."}
                {passwordStrength === "strong" && "Good length."}
              </div>
            )}
          </Field>
        </div>
      </FormSection>

      <InfoCallout
        tone={workerCount === 0 ? "brand" : "emerald"}
        title="What happens when you click Create worker"
      >
        <ul className="list-disc list-inside space-y-1">
          <li>
            A user account is created with role <span className="font-semibold">WORKER</span>{" "}
            (can log in, scan, view their own data).
          </li>
          <li>
            A productivity profile is created with the chosen department and hourly rate.
          </li>
          <li>
            The worker becomes selectable on the Manufacturing &quot;Advance stage&quot; form
            and starts receiving stage attribution.
          </li>
          {workerCount === 0 && (
            <li className="font-medium">
              This is the first worker — once you create them, the &quot;Workers&quot;
              dashboard will populate.
            </li>
          )}
        </ul>
      </InfoCallout>

      <ErrorBanner message={err} />

      <FormFooter
        onCancel={() => router.back()}
        busy={busy}
        canSubmit={canSubmit}
        submitLabel="Create worker"
        busyLabel="Creating..."
      />
    </form>
  );
}
