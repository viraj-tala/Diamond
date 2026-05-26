import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const prisma = new PrismaClient();

function sha(prev: string | null, payload: string) {
  return crypto.createHash("sha256").update(`${prev ?? "GENESIS"}|${payload}`).digest("hex");
}

async function main() {
  console.log("🌱 Seeding Yeild...");

  // ── Users ────────────────────────────────────────────────────────
  const adminPass = await bcrypt.hash("admin123", 10);
  const ownerPass = await bcrypt.hash("owner123", 10);
  const plannerPass = await bcrypt.hash("planner123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@yeild.local" },
    update: {},
    create: { email: "admin@yeild.local", password: adminPass, name: "Admin User", role: "ADMIN" },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@yeild.local" },
    update: {},
    create: { email: "owner@yeild.local", password: ownerPass, name: "Ramesh Patel", role: "OWNER" },
  });

  const planner = await prisma.user.upsert({
    where: { email: "planner@yeild.local" },
    update: {},
    create: { email: "planner@yeild.local", password: plannerPass, name: "Anjali Shah", role: "PLANNER" },
  });

  // ── Workers ──────────────────────────────────────────────────────
  const workerSpecs = [
    { name: "Vinod Kumar", code: "EMP001", dept: "SAWING" },
    { name: "Priya Joshi", code: "EMP002", dept: "POLISHING" },
    { name: "Hemant Mehta", code: "EMP003", dept: "BRUTING" },
    { name: "Sneha Desai", code: "EMP004", dept: "POLISHING" },
    { name: "Karan Soni", code: "EMP005", dept: "QC" },
  ];
  const workerPass = await bcrypt.hash("worker123", 10);

  for (const w of workerSpecs) {
    const email = `${w.code.toLowerCase()}@yeild.local`;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) continue;
    const u = await prisma.user.create({
      data: {
        email, name: w.name, password: workerPass, role: "WORKER",
        workerProfile: {
          create: { employeeCode: w.code, department: w.dept, hourlyRate: 25 },
        },
      },
      include: { workerProfile: true },
    });
    if (u.workerProfile) {
      const today = new Date();
      for (let d = 0; d < 14; d++) {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - d);
        await prisma.workerDailyLog.create({
          data: {
            workerId: u.workerProfile.id,
            date,
            piecesCompleted: 8 + Math.floor(Math.random() * 6),
            recoveryPct: 75 + Math.random() * 22,
            errors: Math.random() < 0.2 ? 1 : 0,
            machineHours: 7 + Math.random() * 2,
          },
        });
      }
      await prisma.incentive.create({
        data: { workerId: u.workerProfile.id, monthYear: "2026-05", amount: 250 + Math.floor(Math.random() * 200), basis: "Recovery bonus", paid: false },
      });
    }
  }

  // ── Vendors ──────────────────────────────────────────────────────
  const vendor1 = await prisma.vendor.upsert({
    where: { name: "Krishna Polish Works" }, update: {},
    create: { name: "Krishna Polish Works", contact: "Mahesh Bhai", phone: "+91 98250 12345", address: "Varachha, Surat" },
  });
  await prisma.vendor.upsert({
    where: { name: "Diamond Bruters Co." }, update: {},
    create: { name: "Diamond Bruters Co.", contact: "Sanjay", phone: "+91 99099 88776", address: "Katargam, Surat" },
  });

  // ── Rough stones & yield plans ──────────────────────────────────
  const roughCount = await prisma.roughStone.count();
  if (roughCount === 0) {
    const roughs = [
      { code: "ROUGH-001", weightCt: 3.5, color: "G", clarity: "VS1", shape: "ROUND", costPerCt: 3200 },
      { code: "ROUGH-002", weightCt: 2.1, color: "F", clarity: "VVS2", shape: "OVAL", costPerCt: 4100 },
      { code: "ROUGH-003", weightCt: 5.8, color: "H", clarity: "SI1", shape: "CUSHION", costPerCt: 2400 },
      { code: "ROUGH-004", weightCt: 1.4, color: "E", clarity: "VVS1", shape: "ROUND", costPerCt: 5500 },
    ];

    for (const r of roughs) {
      const rough = await prisma.roughStone.create({ data: r });

      const yieldA = 0.42;
      const yieldB = 0.52;
      const polishedA = rough.weightCt * yieldA;
      const polishedB1 = rough.weightCt * yieldB * 0.5;
      const ppcA = 1800 + Math.random() * 800;
      const ppcB = ppcA * 0.78;
      const cost = rough.weightCt * rough.costPerCt;
      const revA = polishedA * ppcA;
      const revB = (polishedB1 * 2) * ppcB;

      await prisma.cutPlan.create({
        data: {
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
          outputs: { create: { weightCt: +polishedA.toFixed(2), shape: r.shape, color: r.color, clarity: r.clarity, estPricePerCt: Math.round(ppcA) } },
        },
      });

      await prisma.cutPlan.create({
        data: {
          roughStoneId: rough.id,
          name: "Plan B · Two equal stones",
          strategy: "two-stones",
          expectedYieldPct: yieldB * 100,
          estRevenue: Math.round(revB),
          estCost: Math.round(cost),
          estProfit: Math.round(revB - cost),
          notes: "Better recovery.",
          createdById: planner.id,
          outputs: {
            create: [
              { weightCt: +polishedB1.toFixed(2), shape: r.shape, color: r.color, clarity: r.clarity, estPricePerCt: Math.round(ppcB) },
              { weightCt: +polishedB1.toFixed(2), shape: r.shape, color: r.color, clarity: r.clarity, estPricePerCt: Math.round(ppcB) },
            ],
          },
        },
      });
    }

    // ── Stones in manufacturing + trace events ──────────────────
    const stoneStages = [
      { qr: "STN-001", stage: "SAWING", start: 3.5, current: 3.2, rough: "ROUGH-001" },
      { qr: "STN-002", stage: "POLISHING", start: 2.1, current: 1.6, rough: "ROUGH-002" },
      { qr: "STN-003", stage: "QC", start: 5.8, current: 3.2, rough: "ROUGH-003" },
      { qr: "STN-004", stage: "COMPLETED", start: 1.4, current: 0.65, rough: "ROUGH-004" },
    ];

    for (const ss of stoneStages) {
      const r = await prisma.roughStone.findFirst({ where: { code: ss.rough } });
      const stone = await prisma.stone.create({
        data: {
          qrCode: ss.qr,
          roughStoneId: r?.id,
          startWeightCt: ss.start,
          currentWeightCt: ss.current,
          currentStage: ss.stage,
          events: {
            create: {
              stage: ss.stage,
              weightBefore: ss.start,
              weightAfter: ss.stage === "COMPLETED" ? ss.current : null,
              lossCt: ss.stage === "COMPLETED" ? ss.start - ss.current : null,
              completedAt: ss.stage === "COMPLETED" ? new Date() : null,
            },
          },
        },
      });

      let prev: string | null = null;
      const events: { type: string; actor: string; meta: Record<string, unknown> }[] = [
        { type: "RECEIVED", actor: owner.name, meta: { weight: ss.start } },
        { type: "PLANNED", actor: planner.name, meta: { plan: "A" } },
      ];
      if (["SAWING", "POLISHING", "QC", "COMPLETED"].includes(ss.stage)) events.push({ type: "STAGE_SAWING", actor: "Vinod Kumar", meta: { weight: ss.start * 0.85 } });
      if (["POLISHING", "QC", "COMPLETED"].includes(ss.stage)) events.push({ type: "STAGE_POLISHING", actor: "Priya Joshi", meta: { weight: ss.current * 1.1 } });
      if (["QC", "COMPLETED"].includes(ss.stage)) events.push({ type: "QC_INSPECTED", actor: "Karan Soni", meta: { score: 86 } });
      if (ss.stage === "COMPLETED") events.push({ type: "COMPLETED", actor: owner.name, meta: { final: ss.current } });

      for (const e of events) {
        const recordedAt = new Date(Date.now() - (events.length - events.indexOf(e)) * 86400000);
        const metaStr = JSON.stringify(e.meta);
        const payload = `${stone.id}|${e.type}|${e.actor}||${metaStr}|${recordedAt.toISOString()}`;
        const hash = sha(prev, payload);
        await prisma.traceEvent.create({
          data: { stoneId: stone.id, eventType: e.type, actor: e.actor, metadata: metaStr, recordedAt, prevHash: prev, hash },
        });
        prev = hash;
      }
    }

    // ── Polished inventory ───────────────────────────────────────
    const completedStone = await prisma.stone.findFirst({ where: { qrCode: "STN-004" } });
    await prisma.inventoryItem.create({
      data: {
        sku: "INV-100001",
        stoneId: completedStone?.id,
        shape: "ROUND",
        caratWeight: 0.65,
        color: "E",
        clarity: "VVS1",
        cut: "EX", polish: "EX", symmetry: "EX",
        certBody: "GIA",
        certificateNo: "5443210987",
        pricePerCt: 7800,
        totalPrice: 0.65 * 7800,
        status: "IN_STOCK",
        location: "Vault A",
      },
    });

    await prisma.inventoryItem.createMany({
      data: [
        { sku: "INV-100002", shape: "ROUND", caratWeight: 1.02, color: "G", clarity: "VS1", certBody: "GIA", pricePerCt: 5200, totalPrice: 1.02 * 5200, status: "LISTED" },
        { sku: "INV-100003", shape: "OVAL", caratWeight: 1.55, color: "F", clarity: "VS2", certBody: "IGI", pricePerCt: 4400, totalPrice: 1.55 * 4400, status: "IN_STOCK" },
        { sku: "INV-100004", shape: "CUSHION", caratWeight: 2.10, color: "H", clarity: "SI1", certBody: "GIA", pricePerCt: 3100, totalPrice: 2.10 * 3100, status: "RESERVED" },
        { sku: "INV-100005", shape: "PEAR", caratWeight: 0.85, color: "G", clarity: "VVS2", certBody: "HRD", pricePerCt: 6000, totalPrice: 0.85 * 6000, status: "IN_STOCK" },
      ],
    });

    const listedItem = await prisma.inventoryItem.findFirst({ where: { sku: "INV-100002" } });
    if (listedItem) {
      await prisma.marketplaceListing.create({
        data: { itemId: listedItem.id, sellerId: owner.id, listPrice: listedItem.totalPrice, description: "GIA-certified F/VS1, ready to ship.", isPublic: true,
          inquiries: { create: { buyerName: "BlueOcean Jewels", buyerEmail: "buying@blueocean.example", message: "What's your best rate on bulk 3 stones?" } } },
      });
    }

    // ── Price points ─────────────────────────────────────────────
    const today = new Date();
    for (let d = 0; d < 12; d++) {
      const date = new Date(today.getFullYear(), today.getMonth() - d, 1);
      await prisma.pricePoint.create({
        data: {
          shape: "ROUND",
          color: "G",
          clarity: "VS1",
          caratBucket: "1.00-1.49",
          source: "RAPAPORT",
          pricePerCt: 5100 + Math.round(Math.random() * 400 - 200) + d * 8,
          recordedAt: date,
        },
      });
    }

    // ── Quality checks ──────────────────────────────────────────
    const stonesForQC = await prisma.stone.findMany({ take: 3 });
    for (const s of stonesForQC) {
      const score = 60 + Math.floor(Math.random() * 38);
      const rec = score >= 80 ? "PASS" : score >= 55 ? "REWORK" : "REJECT";
      await prisma.qualityCheck.create({
        data: {
          stoneId: s.id,
          inspectorId: planner.id,
          defectsFound: JSON.stringify(score >= 80 ? [] : ["surface_scratch"]),
          defectCount: score >= 80 ? 0 : 1,
          overallScore: score,
          recommendation: rec,
        },
      });
    }

    // ── Job order ───────────────────────────────────────────────
    const sawingStone = await prisma.stone.findFirst({ where: { qrCode: "STN-001" } });
    if (sawingStone) {
      await prisma.jobOrder.create({
        data: {
          orderCode: "JOB-100001",
          vendorId: vendor1.id,
          jobType: "POLISHING",
          ratePerCt: 120,
          totalSentCt: sawingStone.currentWeightCt,
          totalPayment: 0,
          status: "SENT",
          items: { create: { stoneId: sawingStone.id, sentWeightCt: sawingStone.currentWeightCt } },
        },
      });
    }
  }

  console.log("✓ Seed complete.");
  console.log("  Login: admin@yeild.local / admin123");
  console.log("         owner@yeild.local / owner123");
  console.log("         planner@yeild.local / planner123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
