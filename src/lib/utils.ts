import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

export function formatNumber(n: number, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

export function formatDate(d: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(d));
}

export function formatDateTime(d: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(d));
}

export function caratBucket(ct: number): string {
  const buckets = [
    [0, 0.49],
    [0.5, 0.69],
    [0.7, 0.89],
    [0.9, 0.99],
    [1.0, 1.49],
    [1.5, 1.99],
    [2.0, 2.99],
    [3.0, 3.99],
    [4.0, 4.99],
    [5.0, 9.99],
    [10.0, Infinity],
  ] as const;
  for (const [lo, hi] of buckets) {
    if (ct >= lo && ct <= hi) {
      return hi === Infinity ? `${lo}+` : `${lo.toFixed(2)}-${hi.toFixed(2)}`;
    }
  }
  return "0.00-0.49";
}

const COLOR_BASE: Record<string, number> = {
  D: 100,
  E: 92,
  F: 86,
  G: 80,
  H: 73,
  I: 65,
  J: 58,
  K: 50,
  L: 44,
  M: 38,
};

const CLARITY_BASE: Record<string, number> = {
  FL: 100,
  IF: 95,
  VVS1: 88,
  VVS2: 82,
  VS1: 75,
  VS2: 68,
  SI1: 58,
  SI2: 48,
  I1: 32,
  I2: 22,
  I3: 14,
};

// Toy price estimator: not market-accurate, but produces consistent demo numbers.
export function estimatePricePerCt(
  caratWeight: number,
  color: string,
  clarity: string,
  shape: string = "ROUND",
): number {
  const c = COLOR_BASE[color.toUpperCase()] ?? 60;
  const q = CLARITY_BASE[clarity.toUpperCase()] ?? 50;
  const sizeMult =
    caratWeight < 0.5 ? 0.6 :
    caratWeight < 1 ? 1 :
    caratWeight < 2 ? 1.6 :
    caratWeight < 3 ? 2.2 :
    caratWeight < 5 ? 3.0 : 4.2;
  const shapeMult = shape.toUpperCase() === "ROUND" ? 1.0 : 0.88;
  const base = 1800;
  return Math.round(base * (c / 100) * (q / 100) * sizeMult * shapeMult);
}
