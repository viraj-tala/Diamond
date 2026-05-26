export const ROLES = ["ADMIN", "OWNER", "PLANNER", "SUPERVISOR", "WORKER", "DEALER", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];

export const STAGES = [
  "PLANNING",
  "SAWING",
  "BRUTING",
  "POLISHING",
  "QC",
  "CERTIFICATION",
  "COMPLETED",
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_ORDER: Record<Stage, number> = {
  PLANNING: 0,
  SAWING: 1,
  BRUTING: 2,
  POLISHING: 3,
  QC: 4,
  CERTIFICATION: 5,
  COMPLETED: 6,
};

export const SHAPES = [
  "ROUND",
  "PRINCESS",
  "CUSHION",
  "EMERALD",
  "OVAL",
  "PEAR",
  "MARQUISE",
  "RADIANT",
  "ASSCHER",
  "HEART",
] as const;

export const COLORS = ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"] as const;

export const CLARITIES = ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "I1", "I2", "I3"] as const;

export const CERT_BODIES = ["GIA", "IGI", "HRD", "GCAL", "AGS"] as const;

export const QC_RESULTS = ["PASS", "REWORK", "REJECT"] as const;

export const JOB_TYPES = ["SAWING", "BRUTING", "POLISHING", "QC"] as const;

export const JOB_STATUSES = ["SENT", "IN_PROGRESS", "RETURNED", "CLOSED"] as const;

export const INVENTORY_STATUSES = ["IN_STOCK", "RESERVED", "SOLD", "LISTED"] as const;
