"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ScannerLike = {
  start: (
    cameraConfig: { facingMode: string } | string,
    scanConfig: { fps: number; qrbox: { width: number; height: number } },
    onSuccess: (text: string) => void,
    onFailure: (msg: string) => void,
  ) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => void;
};

interface Props {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  monospace?: boolean;
  autoFocus?: boolean;
  /** Stop the camera and (optionally) submit/handle after a decode. */
  onScanned?: (v: string) => void;
}

export function ScannableInput({
  value,
  onChange,
  required,
  maxLength,
  placeholder,
  monospace = true,
  autoFocus,
  onScanned,
}: Props) {
  const elementId = useId().replace(/:/g, "_");
  const scannerRef = useRef<ScannerLike | null>(null);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function start() {
    setErr(null);
    try {
      const mod = await import("html5-qrcode");
      const scanner = new mod.Html5Qrcode(elementId) as unknown as ScannerLike;
      scannerRef.current = scanner;
      setOpen(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          onChange(decoded);
          if (onScanned) onScanned(decoded);
          stop();
        },
        () => {
          // per-frame "not found" — ignore
        },
      );
    } catch (e) {
      setOpen(false);
      setErr(
        e instanceof Error
          ? e.message
          : "Could not start camera. Grant permission and try again.",
      );
    }
  }

  async function stop() {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try {
        await scanner.stop();
      } catch {
        /* already stopped */
      }
      try {
        scanner.clear();
      } catch {
        /* nothing to clear */
      }
    }
    setOpen(false);
  }

  useEffect(() => {
    return () => {
      void stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex gap-2">
        <input
          className={cn("input flex-1", monospace && "font-mono")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          maxLength={maxLength}
          placeholder={placeholder}
          autoFocus={autoFocus}
        />
        <button
          type="button"
          onClick={open ? stop : start}
          className="btn-secondary px-3 shrink-0"
          aria-label={open ? "Stop camera" : "Scan with camera"}
          title={open ? "Stop camera" : "Scan a QR / barcode label"}
        >
          {open ? <X className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
        </button>
      </div>
      <div
        id={elementId}
        className={
          open
            ? "mt-2 rounded-lg overflow-hidden border border-slate-200"
            : "hidden"
        }
      />
      {err && <div className="mt-1 text-xs text-red-600">{err}</div>}
    </div>
  );
}
