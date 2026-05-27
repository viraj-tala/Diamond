"use client";

import { AlertCircle, Eye, EyeOff, Info, Sparkles } from "lucide-react";
import {
  forwardRef,
  ReactNode,
  TextareaHTMLAttributes,
  useState,
} from "react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Layout primitives — pages compose these around inputs
// ─────────────────────────────────────────────────────────────

export function FormSection({
  icon: Icon,
  title,
  children,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Icon className="w-4 h-4 text-iris-600" />
          {title}
        </div>
        {description && (
          <div className="mt-1.5 text-xs text-slate-500 pl-6">{description}</div>
        )}
      </div>
      {children}
    </section>
  );
}

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="label flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && (
        <div className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
}

export function OptionalTag() {
  return <span className="text-slate-400 font-normal">— optional</span>;
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function InfoCallout({
  tone = "emerald",
  title,
  children,
}: {
  tone?: "emerald" | "brand" | "amber";
  title: ReactNode;
  children: ReactNode;
}) {
  const tones = {
    emerald: {
      border: "border-emerald-200",
      bg: "bg-emerald-50",
      iconText: "text-emerald-700",
      titleText: "text-emerald-900",
      body: "text-emerald-800",
    },
    brand: {
      border: "border-iris-200",
      bg: "bg-iris-50",
      iconText: "text-iris-700",
      titleText: "text-iris-900",
      body: "text-iris-800",
    },
    amber: {
      border: "border-amber-200",
      bg: "bg-amber-50",
      iconText: "text-amber-700",
      titleText: "text-amber-900",
      body: "text-amber-800",
    },
  } as const;
  const t = tones[tone];
  return (
    <div className={`rounded-xl border ${t.border} ${t.bg} p-4`}>
      <div className="flex items-start gap-2.5">
        <Sparkles className={`w-4 h-4 mt-0.5 shrink-0 ${t.iconText}`} />
        <div className="text-xs space-y-2">
          <div className={`font-semibold ${t.titleText}`}>{title}</div>
          <div className={t.body}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export function FormFooter({
  onCancel,
  busy,
  canSubmit,
  submitLabel,
  busyLabel,
}: {
  onCancel: () => void;
  busy: boolean;
  canSubmit: boolean;
  submitLabel: string;
  busyLabel?: string;
}) {
  return (
    <div className="flex justify-end gap-3">
      <button type="button" onClick={onCancel} className="btn-secondary">
        Cancel
      </button>
      <button className="btn-primary" disabled={!canSubmit || busy}>
        {busy ? busyLabel ?? "Saving..." : submitLabel}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Input primitives — every controlled input in the app uses one
// of these. Single source of truth for styling + behaviour.
// ─────────────────────────────────────────────────────────────

export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "url" | "tel" | "date" | "month" | "search";
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  monospace?: boolean;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email" | "url";
  name?: string;
  id?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ value, onChange, type = "text", monospace, ...rest }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn("input", monospace && "font-mono")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    );
  },
);

export interface NumberInputProps {
  value: string;
  onChange: (value: string) => void;
  step?: number | "any";
  min?: number | string;
  max?: number | string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  name?: string;
  id?: string;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  function NumberInput({ value, onChange, prefix, suffix, ...rest }, ref) {
    const hasPrefix = prefix != null;
    const hasSuffix = suffix != null;
    if (!hasPrefix && !hasSuffix) {
      return (
        <input
          ref={ref}
          type="number"
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...rest}
        />
      );
    }
    return (
      <div className="relative">
        {hasPrefix && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
            {prefix}
          </div>
        )}
        <input
          ref={ref}
          type="number"
          className={cn("input", hasPrefix && "pl-7", hasSuffix && "pr-12")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...rest}
        />
        {hasSuffix && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            {suffix}
          </div>
        )}
      </div>
    );
  },
);

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  name?: string;
  id?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { value, onChange, children, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    >
      {children}
    </select>
  );
});

export interface TextareaProps
  extends Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    "value" | "onChange" | "className"
  > {
  value: string;
  onChange: (value: string) => void;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ value, onChange, rows = 3, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className="input"
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    );
  },
);

export interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  autoComplete?: "current-password" | "new-password" | "off";
  name?: string;
  id?: string;
}

export function PasswordInput({
  value,
  onChange,
  autoComplete = "current-password",
  ...rest
}: PasswordInputProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        className="input pr-10 font-mono"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded"
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
