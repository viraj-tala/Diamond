import { cn } from "@/lib/utils";

const TONES: Record<string, string> = {
  slate: "bg-slate-100 text-slate-700",
  brand: "bg-iris-50 text-iris-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-sky-50 text-sky-700",
  violet: "bg-violet-50 text-violet-700",
};

const STAGE_TONE: Record<string, string> = {
  PLANNING: "slate",
  SAWING: "amber",
  BRUTING: "amber",
  POLISHING: "blue",
  QC: "violet",
  CERTIFICATION: "brand",
  COMPLETED: "green",
};

const STATUS_TONE: Record<string, string> = {
  IN_STOCK: "green",
  RESERVED: "amber",
  SOLD: "slate",
  LISTED: "blue",
  SENT: "amber",
  IN_PROGRESS: "blue",
  RETURNED: "violet",
  CLOSED: "slate",
  OPEN: "amber",
  RESPONDED: "blue",
  PASS: "green",
  REWORK: "amber",
  REJECT: "red",
};

export function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: keyof typeof TONES }) {
  return <span className={cn("badge", TONES[tone])}>{children}</span>;
}

export function StageBadge({ stage }: { stage: string }) {
  const tone = (STAGE_TONE[stage] ?? "slate") as keyof typeof TONES;
  return <Badge tone={tone}>{stage}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone = (STATUS_TONE[status] ?? "slate") as keyof typeof TONES;
  return <Badge tone={tone}>{status}</Badge>;
}
