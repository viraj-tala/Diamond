"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type ToastTone = "success" | "error" | "info";

export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
}

interface Toast extends Required<Omit<ToastInput, "description">> {
  id: string;
  description?: string;
}

interface ToastContextValue {
  show: (toast: ToastInput) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast() must be used inside <ToastProvider>");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    ({ title, description, tone = "info", duration = 4000 }: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [
        ...prev,
        { id, title, description, tone, duration },
      ]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const t of map.values()) clearTimeout(t);
      map.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const palette = TONES[toast.tone];
  const Icon = palette.icon;
  return (
    <div
      role="status"
      className={`pointer-events-auto animate-slide-in-right overflow-hidden rounded-xl border ${palette.border} ${palette.bg} shadow-lift`}
    >
      <div className="flex items-start gap-3 p-3.5">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${palette.iconColor}`} />
        <div className="min-w-0 flex-1">
          <div className={`text-sm font-semibold ${palette.titleColor}`}>
            {toast.title}
          </div>
          {toast.description && (
            <div className={`mt-0.5 text-xs ${palette.descColor}`}>
              {toast.description}
            </div>
          )}
        </div>
        <button
          onClick={onDismiss}
          className={`-mr-1 -mt-1 rounded p-1 transition ${palette.dismissHover}`}
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div
        className={`h-0.5 ${palette.bar}`}
        style={{
          animation: `toastBar ${toast.duration}ms linear forwards`,
        }}
      />
      <style jsx>{`
        @keyframes toastBar {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
        div[style] {
          transform-origin: left;
        }
      `}</style>
    </div>
  );
}

const TONES = {
  success: {
    icon: CheckCircle2,
    border: "border-emerald-200",
    bg: "bg-white",
    iconColor: "text-emerald-600",
    titleColor: "text-slate-900",
    descColor: "text-slate-600",
    bar: "bg-emerald-500",
    dismissHover: "text-slate-400 hover:bg-emerald-50 hover:text-emerald-700",
  },
  error: {
    icon: AlertCircle,
    border: "border-red-200",
    bg: "bg-white",
    iconColor: "text-red-600",
    titleColor: "text-slate-900",
    descColor: "text-slate-600",
    bar: "bg-red-500",
    dismissHover: "text-slate-400 hover:bg-red-50 hover:text-red-700",
  },
  info: {
    icon: Info,
    border: "border-iris-200",
    bg: "bg-white",
    iconColor: "text-iris-600",
    titleColor: "text-slate-900",
    descColor: "text-slate-600",
    bar: "bg-iris-500",
    dismissHover: "text-slate-400 hover:bg-iris-50 hover:text-iris-700",
  },
} as const;
