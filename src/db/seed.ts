import "dotenv/config";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "./index";
import {
  cutPlans,
  incentives,
  inquiries,
  inventoryItems,
  jobOrderItems,
  jobOrders,
  marketplaceListings,
  polishedOutputs,
  pricePoints,
  qualityChecks,
  roughStones,
  stageEvents,
  stones,
  traceEvents,
  users,
  vendors,
  workerDailyLogs,
  workers,
} from "./schema";

function sha(prev: string | null, payload: string) {
  return crypto.createHash("sha256").update(`${prev ?? "GENESIS"}|${payload}`).digest("hex");
}

async function ensureUser(args: {
  email: string;
  name: string;
  password: string;
  role: "ADMIN" | "OWNER" | "PLANNER" | "SUPERVISOR" | "WORKER" | "DEALER" | "VIEWER";
}) {
  const [existing] = await db.select().from(users).where(eq(users.email, args.email)).limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(users)
    .values({
      email: args.email,
      name: args.name,
      password: await bcrypt.hash(args.password, 10),
      role: args.role,
    })
    .returning();
  return created;
}

async function ensureVendor(name: string, contact: string, phone: string, address: string) {
  const [existing] = await db.select().from(vendors).where(eq(vendors.name, name)).limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(vendors)
    .values({ name, contact, phone, address })
    .returning();
  return created;
}

async function main() {
  console.log("🌱 Seeding Lustra...");

  // ── Users ────────────────────────────────────────────────────────
  const admin = await ensureUser({
    email: "admin@lustra.local",
    name: "Admin User",
    password: "admin123",
    role: "ADMIN",
  });
  const owner = await ensureUser({
    email: "owner@lustra.local",
    name: "Ramesh Patel",
    password: "owner123",
    role: "OWNER",
  });
  const planner = await ensureUser({
    email: "planner@lustra.local",
    name: "Anjali Shah",
    password: "planner123",
    role: "PLANNER",
  });

  // ── Workers ──────────────────────────────────────────────────────
  const workerSpecs = [
    { name: "Vinod Kumar", code: "EMP001", dept: "SAWING" },
    { name: "Priya Joshi", code: "EMP002", dept: "POLISHING" },
    { name: "Hemant Mehta", code: "EMP003", dept: "BRUTING" },
    { name: "Sneha Desai", code: "EMP004", dept: "POLISHING" },
    { name: "Karan Soni", code: "EMP005", dept: "QC" },
  ];

  for (const w of workerSpecs) {
    const email = `${w.code.toLowerCase()}@lustra.local`;
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) continue;

    const [u] = await db
      .insert(users)
      .values({
        email,
        name: w.name,
        password: await bcrypt.hash("worker123", 10),
        role: "WORKER",
      })
      .returning();

    const [wk] = await db
      .insert(workers)
      .values({
        userId: u.id,
        employeeCode: w.code,
        department: w.dept,
        hourlyRate: 25,
      })
      .returning();

    const today = new Date();
    for (let d = 0; d < 14; d++) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - d);
      await db.insert(workerDailyLogs).values({
        workerId: wk.id,
        date,
        piecesCompleted: 8 + Math.floor(Math.random() * 6),
        recoveryPct: 75 + Math.random() * 22,
        errors: Math.random() < 0.2 ? 1 : 0,
        machineHours: 7 + Math.random() * 2,
      });
    }

    await db.insert(incentives).values({
      workerId: wk.id,
      monthYear: "2026-05",
      amount: 250 + Math.floor(Math.random() * 200),
      basis: "Recovery bonus",
      paid: false,
    });
  }

  // ── Vendors ──────────────────────────────────────────────────────
  const vendor1 = await ensureVendor(
    "Krishna Polish Works",
    "Mahesh Bhai",
    "+91 98250 12345",
    "Varachha, Surat",
  );
  await ensureVendor(
    "Diamond Bruters Co.",
    "Sanjay",
    "+91 99099 88776",
    "Katargam, Surat",
  );

  // ── Rough stones, plans, stones, inventory, prices, QC, jobs ────
  const [{ c: roughCount }] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(roughStones);

  if (roughCount === 0) {
    const roughs = [
      { code: "ROUGH-001", weightCt: 3.5, color: "G", clarity: "VS1", shape: "ROUND", costPerCt: 3200 },
      { code: "ROUGH-002", weightCt: 2.1, color: "F", clarity: "VVS2", shape: "OVAL", costPerCt: 4100 },
      { code: "ROUGH-003", weightCt: 5.8, color: "H", clarity: "SI1", shape: "CUSHION", costPerCt: 2400 },
      { code: "ROUGH-004", weightCt: 1.4, color: "E", clarity: "VVS1", shape: "ROUND", costPerCt: 5500 },
    ];

    for (const r of roughs) {
      const [rough] = await db.insert(roughStones).values(r).returning();

      const yieldA = 0.42;
      const yieldB = 0.52;
      const polishedA = rough.weightCt * yieldA;
      const polishedB1 = rough.weightCt * yieldB * 0.5;
      const ppcA = 1800 + Math.random() * 800;
      const ppcB = ppcA * 0.78;
      const cost = rough.weightCt * rough.costPerCt;
      const revA = polishedA * ppcA;
      const revB = polishedB1 * 2 * ppcB;

      const [planA] = await db
        .insert(cutPlans)
        .values({
          roughStoneId: rough.id,
          name: "Plan A · Single large stone",
          strategy: "single-large",
          expectedYieldPct: yieldA * 100,
          estRevenue: Math.round(revA),
          estCost: Math.round(cost),
          estProfit: Math.round(revA - cost),
          notes: "Maximizes price per ct.",
          isSelected: true,
          createdById: planner.id,
        })
        .returning();
      await db.insert(polishedOutputs).values({
        planId: planA.id,
        weightCt: +polishedA.toFixed(2),
        shape: r.shape,
        color: r.color,
        clarity: r.clarity,
        estPricePerCt: Math.round(ppcA),
      });

      const [planB] = await db
        .insert(cutPlans)
        .values({
          roughStoneId: rough.id,
          name: "Plan B · Two equal stones",
          strategy: "two-stones",
          expectedYieldPct: yieldB * 100,
          estRevenue: Math.round(revB),
          estCost: Math.round(cost),
          estProfit: Math.round(revB - cost),
          notes: "Better recovery.",
          createdById: planner.id,
        })
        .returning();
      await db.insert(polishedOutputs).values([
        {
          planId: planB.id,
          weightCt: +polishedB1.toFixed(2),
          shape: r.shape,
          color: r.color,
          clarity: r.clarity,
          estPricePerCt: Math.round(ppcB),
        },
        {
          planId: planB.id,
          weightCt: +polishedB1.toFixed(2),
          shape: r.shape,
          color: r.color,
          clarity: r.clarity,
          estPricePerCt: Math.round(ppcB),
        },
      ]);
    }

    const stoneStages = [
      { qr: "STN-001", stage: "SAWING" as const, start: 3.5, current: 3.2, rough: "ROUGH-001" },
      { qr: "STN-002", stage: "POLISHING" as const, start: 2.1, current: 1.6, rough: "ROUGH-002" },
      { qr: "STN-003", stage: "QC" as const, start: 5.8, current: 3.2, rough: "ROUGH-003" },
      { qr: "STN-004", stage: "COMPLETED" as const, start: 1.4, current: 0.65, rough: "ROUGH-004" },
    ];

    for (const ss of stoneStages) {
      const [r] = await db
        .select()
        .from(roughStones)
        .where(eq(roughStones.code, ss.rough))
        .limit(1);

      const [stone] = await db
        .insert(stones)
        .values({
          qrCode: ss.qr,
          roughStoneId: r?.id,
          startWeightCt: ss.start,
          currentWeightCt: ss.current,
          currentStage: ss.stage,
        })
        .returning();

      await db.insert(stageEvents).values({
        stoneId: stone.id,
        stage: ss.stage,
        weightBefore: ss.start,
        weightAfter: ss.stage === "COMPLETED" ? ss.current : null,
        lossCt: ss.stage === "COMPLETED" ? ss.start - ss.current : null,
        completedAt: ss.stage === "COMPLETED" ? new Date() : null,
      });

      let prev: string | null = null;
      const events: { type: string; actor: string; meta: Record<string, unknown> }[] = [
        { type: "RECEIVED", actor: owner.name, meta: { weight: ss.start } },
        { type: "PLANNED", actor: planner.name, meta: { plan: "A" } },
      ];
      if (["SAWING", "POLISHING", "QC", "COMPLETED"].includes(ss.stage))
        events.push({ type: "STAGE_SAWING", actor: "Vinod Kumar", meta: { weight: ss.start * 0.85 } });
      if (["POLISHING", "QC", "COMPLETED"].includes(ss.stage))
        events.push({ type: "STAGE_POLISHING", actor: "Priya Joshi", meta: { weight: ss.current * 1.1 } });
      if (["QC", "COMPLETED"].includes(ss.stage))
        events.push({ type: "QC_INSPECTED", actor: "Karan Soni", meta: { score: 86 } });
      if (ss.stage === "COMPLETED")
        events.push({ type: "COMPLETED", actor: owner.name, meta: { final: ss.current } });

      for (let i = 0; i < events.length; i++) {
        const e = events[i];
        const recordedAt = new Date(Date.now() - (events.length - i) * 86400000);
        const metaStr = JSON.stringify(e.meta);
        const payload = `${stone.id}|${e.type}|${e.actor}||${metaStr}|${recordedAt.toISOString()}`;
        const hash = sha(prev, payload);
        await db.insert(traceEvents).values({
          stoneId: stone.id,
          eventType: e.type,
          actor: e.actor,
          metadata: metaStr,
          recordedAt,
          prevHash: prev,
          hash,
        });
        prev = hash;
      }
    }

    const [completedStone] = await db
      .select()
      .from(stones)
      .where(eq(stones.qrCode, "STN-004"))
      .limit(1);

    await db.insert(inventoryItems).values({
      sku: "INV-100001",
      stoneId: completedStone?.id,
      shape: "ROUND",
      caratWeight: 0.65,
      color: "E",
      clarity: "VVS1",
      cut: "EX",
      polish: "EX",
      symmetry: "EX",
      certBody: "GIA",
      certificateNo: "5443210987",
      pricePerCt: 7800,
      totalPrice: 0.65 * 7800,
      status: "IN_STOCK",
      location: "Vault A",
    });

    await db.insert(inventoryItems).values([
      { sku: "INV-100002", shape: "ROUND", caratWeight: 1.02, color: "G", clarity: "VS1", certBody: "GIA", pricePerCt: 5200, totalPrice: 1.02 * 5200, status: "LISTED" },
      { sku: "INV-100003", shape: "OVAL", caratWeight: 1.55, color: "F", clarity: "VS2", certBody: "IGI", pricePerCt: 4400, totalPrice: 1.55 * 4400, status: "IN_STOCK" },
      { sku: "INV-100004", shape: "CUSHION", caratWeight: 2.10, color: "H", clarity: "SI1", certBody: "GIA", pricePerCt: 3100, totalPrice: 2.10 * 3100, status: "RESERVED" },
      { sku: "INV-100005", shape: "PEAR", caratWeight: 0.85, color: "G", clarity: "VVS2", certBody: "HRD", pricePerCt: 6000, totalPrice: 0.85 * 6000, status: "IN_STOCK" },
    ]);

    const [listedItem] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.sku, "INV-100002"))
      .limit(1);

    if (listedItem) {
      const [listing] = await db
        .insert(marketplaceListings)
        .values({
          itemId: listedItem.id,
          sellerId: owner.id,
          listPrice: listedItem.totalPrice,
          description: "GIA-certified F/VS1, ready to ship.",
          isPublic: true,
        })
        .returning();

      await db.insert(inquiries).values({
        listingId: listing.id,
        buyerName: "BlueOcean Jewels",
        buyerEmail: "buying@blueocean.example",
        message: "What's your best rate on bulk 3 stones?",
      });
    }

    const today = new Date();
    for (let d = 0; d < 12; d++) {
      const date = new Date(today.getFullYear(), today.getMonth() - d, 1);
      await db.insert(pricePoints).values({
        shape: "ROUND",
        color: "G",
        clarity: "VS1",
        caratBucket: "1.00-1.49",
        source: "RAPAPORT",
        pricePerCt: 5100 + Math.round(Math.random() * 400 - 200) + d * 8,
        recordedAt: date,
      });
    }

    const stonesForQC = await db.select().from(stones).limit(3);
    for (const s of stonesForQC) {
      const score = 60 + Math.floor(Math.random() * 38);
      const rec = score >= 80 ? "PASS" : score >= 55 ? "REWORK" : "REJECT";
      await db.insert(qualityChecks).values({
        stoneId: s.id,
        inspectorId: planner.id,
        defectsFound: JSON.stringify(score >= 80 ? [] : ["surface_scratch"]),
        defectCount: score >= 80 ? 0 : 1,
        overallScore: score,
        recommendation: rec,
      });
    }

    const [sawingStone] = await db
      .select()
      .from(stones)
      .where(eq(stones.qrCode, "STN-001"))
      .limit(1);

    if (sawingStone) {
      const [order] = await db
        .insert(jobOrders)
        .values({
          orderCode: "JOB-100001",
          vendorId: vendor1.id,
          jobType: "POLISHING",
          ratePerCt: 120,
          totalSentCt: sawingStone.currentWeightCt,
          totalPayment: 0,
          status: "SENT",
        })
        .returning();
      await db.insert(jobOrderItems).values({
        orderId: order.id,
        stoneId: sawingStone.id,
        sentWeightCt: sawingStone.currentWeightCt,
      });
    }
  }

  console.log("✓ Seed complete.");
  console.log("  Login: admin@lustra.local / admin123");
  console.log("         owner@lustra.local / owner123");
  console.log("         planner@lustra.local / planner123");
  console.log(`  Admin: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
