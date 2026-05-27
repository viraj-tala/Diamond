import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => createId());

const createdAt = () =>
  timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow();

const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const roleEnum = pgEnum("role", [
  "ADMIN",
  "OWNER",
  "PLANNER",
  "SUPERVISOR",
  "WORKER",
  "DEALER",
  "VIEWER",
]);

export const stageEnum = pgEnum("stage", [
  "PLANNING",
  "SAWING",
  "BRUTING",
  "POLISHING",
  "QC",
  "CERTIFICATION",
  "COMPLETED",
]);

export const inventoryStatusEnum = pgEnum("inventory_status", [
  "IN_STOCK",
  "RESERVED",
  "SOLD",
  "LISTED",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "SENT",
  "IN_PROGRESS",
  "RETURNED",
  "CLOSED",
]);

export const jobTypeEnum = pgEnum("job_type", ["SAWING", "BRUTING", "POLISHING", "QC"]);

export const qcResultEnum = pgEnum("qc_result", ["PASS", "REWORK", "REJECT"]);

export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "OPEN",
  "RESPONDED",
  "CLOSED",
]);

export const priceSourceEnum = pgEnum("price_source", ["RAPAPORT", "IDEX", "MANUAL"]);

// ─────────────────────────────────────────────────────────────
// Identity & access
// ─────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("VIEWER"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// ─────────────────────────────────────────────────────────────
// Module 1 — Yield Optimizer
// ─────────────────────────────────────────────────────────────

export const roughStones = pgTable("rough_stones", {
  id: id(),
  code: text("code").notNull().unique(),
  weightCt: doublePrecision("weight_ct").notNull(),
  color: text("color"),
  clarity: text("clarity"),
  shape: text("shape"),
  scanData: jsonb("scan_data"),
  costPerCt: doublePrecision("cost_per_ct").notNull().default(0),
  notes: text("notes"),
  createdAt: createdAt(),
});

export const cutPlans = pgTable("cut_plans", {
  id: id(),
  roughStoneId: text("rough_stone_id")
    .notNull()
    .references(() => roughStones.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  strategy: text("strategy").notNull(),
  expectedYieldPct: doublePrecision("expected_yield_pct").notNull(),
  estProfit: doublePrecision("est_profit").notNull(),
  estRevenue: doublePrecision("est_revenue").notNull(),
  estCost: doublePrecision("est_cost").notNull(),
  notes: text("notes"),
  isSelected: boolean("is_selected").notNull().default(false),
  createdById: text("created_by_id")
    .notNull()
    .references(() => users.id),
  createdAt: createdAt(),
});

export const polishedOutputs = pgTable("polished_outputs", {
  id: id(),
  planId: text("plan_id")
    .notNull()
    .references(() => cutPlans.id, { onDelete: "cascade" }),
  weightCt: doublePrecision("weight_ct").notNull(),
  shape: text("shape").notNull(),
  color: text("color").notNull(),
  clarity: text("clarity").notNull(),
  estPricePerCt: doublePrecision("est_price_per_ct").notNull(),
});

// ─────────────────────────────────────────────────────────────
// Module 2 — Manufacturing ERP
// ─────────────────────────────────────────────────────────────

export const stones = pgTable("stones", {
  id: id(),
  qrCode: text("qr_code").notNull().unique(),
  rfidTag: text("rfid_tag").unique(),
  roughStoneId: text("rough_stone_id")
    .unique()
    .references(() => roughStones.id),
  currentStage: stageEnum("current_stage").notNull().default("PLANNING"),
  startWeightCt: doublePrecision("start_weight_ct").notNull(),
  currentWeightCt: doublePrecision("current_weight_ct").notNull(),
  // Count of times this stone was sent back for re-polish after a failed QC.
  // Industry metric — a stone with a high rework count signals a problem
  // either in the original cutting plan or the polisher's skill.
  reworkCount: integer("rework_count").notNull().default(0),
  notes: text("notes"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const stageEvents = pgTable(
  "stage_events",
  {
    id: id(),
    stoneId: text("stone_id")
      .notNull()
      .references(() => stones.id, { onDelete: "cascade" }),
    stage: stageEnum("stage").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    weightBefore: doublePrecision("weight_before").notNull(),
    weightAfter: doublePrecision("weight_after"),
    lossCt: doublePrecision("loss_ct"),
    workerId: text("worker_id").references(() => users.id),
    notes: text("notes"),
  },
  (t) => ({
    stoneIdx: index("stage_events_stone_idx").on(t.stoneId),
    stoneStageIdx: index("stage_events_stone_stage_idx").on(t.stoneId, t.stage),
  }),
);

// ─────────────────────────────────────────────────────────────
// Module 3 — Worker Productivity
// ─────────────────────────────────────────────────────────────

export const workers = pgTable("workers", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  employeeCode: text("employee_code").notNull().unique(),
  department: text("department").notNull(),
  joinDate: timestamp("join_date", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  hourlyRate: doublePrecision("hourly_rate").notNull().default(0),
});

export const workerDailyLogs = pgTable(
  "worker_daily_logs",
  {
    id: id(),
    workerId: text("worker_id")
      .notNull()
      .references(() => workers.id, { onDelete: "cascade" }),
    date: timestamp("date", { withTimezone: true, mode: "date" }).notNull(),
    piecesCompleted: integer("pieces_completed").notNull().default(0),
    recoveryPct: doublePrecision("recovery_pct").notNull().default(0),
    errors: integer("errors").notNull().default(0),
    machineHours: doublePrecision("machine_hours").notNull().default(0),
    notes: text("notes"),
  },
  (t) => ({
    workerDateUnique: uniqueIndex("worker_daily_logs_worker_date_unique").on(
      t.workerId,
      t.date,
    ),
  }),
);

export const incentives = pgTable(
  "incentives",
  {
    id: id(),
    workerId: text("worker_id")
      .notNull()
      .references(() => workers.id, { onDelete: "cascade" }),
    monthYear: text("month_year").notNull(),
    amount: doublePrecision("amount").notNull(),
    basis: text("basis").notNull(),
    paid: boolean("paid").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => ({
    workerMonthUnique: uniqueIndex("incentives_worker_month_unique").on(
      t.workerId,
      t.monthYear,
    ),
  }),
);

// ─────────────────────────────────────────────────────────────
// Module 4 — Inventory + Marketplace
// ─────────────────────────────────────────────────────────────

export const inventoryItems = pgTable("inventory_items", {
  id: id(),
  sku: text("sku").notNull().unique(),
  stoneId: text("stone_id")
    .unique()
    .references(() => stones.id),
  shape: text("shape").notNull(),
  caratWeight: doublePrecision("carat_weight").notNull(),
  color: text("color").notNull(),
  clarity: text("clarity").notNull(),
  cut: text("cut"),
  polish: text("polish"),
  symmetry: text("symmetry"),
  fluorescence: text("fluorescence"),
  certificateNo: text("certificate_no"),
  certBody: text("cert_body"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  pricePerCt: doublePrecision("price_per_ct").notNull(),
  totalPrice: doublePrecision("total_price").notNull(),
  status: inventoryStatusEnum("status").notNull().default("IN_STOCK"),
  location: text("location"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const marketplaceListings = pgTable("marketplace_listings", {
  id: id(),
  itemId: text("item_id")
    .notNull()
    .unique()
    .references(() => inventoryItems.id, { onDelete: "cascade" }),
  sellerId: text("seller_id")
    .notNull()
    .references(() => users.id),
  listPrice: doublePrecision("list_price").notNull(),
  isPublic: boolean("is_public").notNull().default(true),
  description: text("description"),
  createdAt: createdAt(),
});

export const inquiries = pgTable("inquiries", {
  id: id(),
  listingId: text("listing_id")
    .notNull()
    .references(() => marketplaceListings.id, { onDelete: "cascade" }),
  buyerName: text("buyer_name").notNull(),
  buyerEmail: text("buyer_email").notNull(),
  buyerPhone: text("buyer_phone"),
  message: text("message"),
  status: inquiryStatusEnum("status").notNull().default("OPEN"),
  createdAt: createdAt(),
});

// ─────────────────────────────────────────────────────────────
// Module 5 — Price Intelligence
// ─────────────────────────────────────────────────────────────

export const pricePoints = pgTable(
  "price_points",
  {
    id: id(),
    shape: text("shape").notNull(),
    caratBucket: text("carat_bucket").notNull(),
    color: text("color").notNull(),
    clarity: text("clarity").notNull(),
    source: priceSourceEnum("source").notNull(),
    pricePerCt: doublePrecision("price_per_ct").notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    lookupIdx: index("price_points_lookup_idx").on(
      t.shape,
      t.color,
      t.clarity,
      t.caratBucket,
      t.recordedAt,
    ),
  }),
);

// ─────────────────────────────────────────────────────────────
// Module 6 — Traceability
// ─────────────────────────────────────────────────────────────

export const traceEvents = pgTable(
  "trace_events",
  {
    id: id(),
    stoneId: text("stone_id")
      .notNull()
      .references(() => stones.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    actor: text("actor").notNull(),
    location: text("location"),
    metadata: text("metadata"),
    recordedAt: timestamp("recorded_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    prevHash: text("prev_hash"),
    hash: text("hash").notNull(),
  },
  (t) => ({
    stoneRecordedIdx: index("trace_events_stone_recorded_idx").on(
      t.stoneId,
      t.recordedAt,
    ),
  }),
);

// ─────────────────────────────────────────────────────────────
// Module 7 — Quality
// ─────────────────────────────────────────────────────────────

export const qualityChecks = pgTable("quality_checks", {
  id: id(),
  stoneId: text("stone_id")
    .notNull()
    .references(() => stones.id, { onDelete: "cascade" }),
  inspectorId: text("inspector_id")
    .notNull()
    .references(() => users.id),
  imageUrl: text("image_url"),
  defectsFound: text("defects_found"),
  defectCount: integer("defect_count").notNull().default(0),
  overallScore: doublePrecision("overall_score").notNull(),
  recommendation: qcResultEnum("recommendation").notNull(),
  notes: text("notes"),
  createdAt: createdAt(),
});

// ─────────────────────────────────────────────────────────────
// Module 8 — Job Work / Outsourcing
// ─────────────────────────────────────────────────────────────

export const vendors = pgTable("vendors", {
  id: id(),
  name: text("name").notNull().unique(),
  contact: text("contact"),
  phone: text("phone"),
  address: text("address"),
  createdAt: createdAt(),
});

export const jobOrders = pgTable("job_orders", {
  id: id(),
  orderCode: text("order_code").notNull().unique(),
  vendorId: text("vendor_id")
    .notNull()
    .references(() => vendors.id),
  jobType: jobTypeEnum("job_type").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  expectedAt: timestamp("expected_at", { withTimezone: true, mode: "date" }),
  returnedAt: timestamp("returned_at", { withTimezone: true, mode: "date" }),
  totalSentCt: doublePrecision("total_sent_ct").notNull().default(0),
  totalReturnCt: doublePrecision("total_return_ct").notNull().default(0),
  lossCt: doublePrecision("loss_ct").notNull().default(0),
  ratePerCt: doublePrecision("rate_per_ct").notNull().default(0),
  totalPayment: doublePrecision("total_payment").notNull().default(0),
  paid: boolean("paid").notNull().default(false),
  status: jobStatusEnum("status").notNull().default("SENT"),
  notes: text("notes"),
});

// ─────────────────────────────────────────────────────────────
// IoT — Devices & Scan log
// ─────────────────────────────────────────────────────────────

export const devices = pgTable("devices", {
  id: id(),
  name: text("name").notNull(),
  location: text("location"),
  tokenHash: text("token_hash").notNull(),
  active: boolean("active").notNull().default(true),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: "date" }),
  createdAt: createdAt(),
});

export const scanEvents = pgTable(
  "scan_events",
  {
    id: id(),
    stoneId: text("stone_id")
      .notNull()
      .references(() => stones.id, { onDelete: "cascade" }),
    deviceId: text("device_id").references(() => devices.id, { onDelete: "set null" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    scanCode: text("scan_code").notNull(),
    fromStage: stageEnum("from_stage").notNull(),
    toStage: stageEnum("to_stage").notNull(),
    weightAfter: doublePrecision("weight_after"),
    idempotencyKey: text("idempotency_key").unique(),
    createdAt: createdAt(),
  },
  (t) => ({
    stoneIdx: index("scan_events_stone_idx").on(t.stoneId),
    deviceIdx: index("scan_events_device_idx").on(t.deviceId),
  }),
);

export const jobOrderItems = pgTable("job_order_items", {
  id: id(),
  orderId: text("order_id")
    .notNull()
    .references(() => jobOrders.id, { onDelete: "cascade" }),
  stoneId: text("stone_id")
    .notNull()
    .references(() => stones.id),
  sentWeightCt: doublePrecision("sent_weight_ct").notNull(),
  returnWeightCt: doublePrecision("return_weight_ct"),
});

// ─────────────────────────────────────────────────────────────
// Relations (for Drizzle's relational query API)
// ─────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  workerProfile: one(workers, {
    fields: [users.id],
    references: [workers.userId],
  }),
  cutPlansCreated: many(cutPlans),
  qualityChecks: many(qualityChecks),
  listings: many(marketplaceListings),
  stageEvents: many(stageEvents),
}));

export const roughStonesRelations = relations(roughStones, ({ one, many }) => ({
  cutPlans: many(cutPlans),
  stone: one(stones, {
    fields: [roughStones.id],
    references: [stones.roughStoneId],
  }),
}));

export const cutPlansRelations = relations(cutPlans, ({ one, many }) => ({
  roughStone: one(roughStones, {
    fields: [cutPlans.roughStoneId],
    references: [roughStones.id],
  }),
  createdBy: one(users, {
    fields: [cutPlans.createdById],
    references: [users.id],
  }),
  outputs: many(polishedOutputs),
}));

export const polishedOutputsRelations = relations(polishedOutputs, ({ one }) => ({
  plan: one(cutPlans, {
    fields: [polishedOutputs.planId],
    references: [cutPlans.id],
  }),
}));

export const stonesRelations = relations(stones, ({ one, many }) => ({
  roughStone: one(roughStones, {
    fields: [stones.roughStoneId],
    references: [roughStones.id],
  }),
  events: many(stageEvents),
  qualityChecks: many(qualityChecks),
  inventory: one(inventoryItems, {
    fields: [stones.id],
    references: [inventoryItems.stoneId],
  }),
  traceEvents: many(traceEvents),
  jobOrderItems: many(jobOrderItems),
  scanEvents: many(scanEvents),
}));

export const stageEventsRelations = relations(stageEvents, ({ one }) => ({
  stone: one(stones, {
    fields: [stageEvents.stoneId],
    references: [stones.id],
  }),
  worker: one(users, {
    fields: [stageEvents.workerId],
    references: [users.id],
  }),
}));

export const workersRelations = relations(workers, ({ one, many }) => ({
  user: one(users, {
    fields: [workers.userId],
    references: [users.id],
  }),
  dailyLogs: many(workerDailyLogs),
  incentives: many(incentives),
}));

export const workerDailyLogsRelations = relations(workerDailyLogs, ({ one }) => ({
  worker: one(workers, {
    fields: [workerDailyLogs.workerId],
    references: [workers.id],
  }),
}));

export const incentivesRelations = relations(incentives, ({ one }) => ({
  worker: one(workers, {
    fields: [incentives.workerId],
    references: [workers.id],
  }),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one }) => ({
  stone: one(stones, {
    fields: [inventoryItems.stoneId],
    references: [stones.id],
  }),
  listing: one(marketplaceListings, {
    fields: [inventoryItems.id],
    references: [marketplaceListings.itemId],
  }),
}));

export const marketplaceListingsRelations = relations(marketplaceListings, ({ one, many }) => ({
  item: one(inventoryItems, {
    fields: [marketplaceListings.itemId],
    references: [inventoryItems.id],
  }),
  seller: one(users, {
    fields: [marketplaceListings.sellerId],
    references: [users.id],
  }),
  inquiries: many(inquiries),
}));

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  listing: one(marketplaceListings, {
    fields: [inquiries.listingId],
    references: [marketplaceListings.id],
  }),
}));

export const traceEventsRelations = relations(traceEvents, ({ one }) => ({
  stone: one(stones, {
    fields: [traceEvents.stoneId],
    references: [stones.id],
  }),
}));

export const qualityChecksRelations = relations(qualityChecks, ({ one }) => ({
  stone: one(stones, {
    fields: [qualityChecks.stoneId],
    references: [stones.id],
  }),
  inspector: one(users, {
    fields: [qualityChecks.inspectorId],
    references: [users.id],
  }),
}));

export const vendorsRelations = relations(vendors, ({ many }) => ({
  jobOrders: many(jobOrders),
}));

export const jobOrdersRelations = relations(jobOrders, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [jobOrders.vendorId],
    references: [vendors.id],
  }),
  items: many(jobOrderItems),
}));

export const jobOrderItemsRelations = relations(jobOrderItems, ({ one }) => ({
  order: one(jobOrders, {
    fields: [jobOrderItems.orderId],
    references: [jobOrders.id],
  }),
  stone: one(stones, {
    fields: [jobOrderItems.stoneId],
    references: [stones.id],
  }),
}));

export const devicesRelations = relations(devices, ({ many }) => ({
  scanEvents: many(scanEvents),
}));

export const scanEventsRelations = relations(scanEvents, ({ one }) => ({
  stone: one(stones, {
    fields: [scanEvents.stoneId],
    references: [stones.id],
  }),
  device: one(devices, {
    fields: [scanEvents.deviceId],
    references: [devices.id],
  }),
  user: one(users, {
    fields: [scanEvents.userId],
    references: [users.id],
  }),
}));

// ─────────────────────────────────────────────────────────────
// Convenience types
// ─────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Stone = typeof stones.$inferSelect;
export type RoughStone = typeof roughStones.$inferSelect;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type Worker = typeof workers.$inferSelect;
export type JobOrder = typeof jobOrders.$inferSelect;
export type TraceEvent = typeof traceEvents.$inferSelect;
export type Device = typeof devices.$inferSelect;
export type ScanEvent = typeof scanEvents.$inferSelect;
