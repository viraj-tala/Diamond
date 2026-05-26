# Yeild — Diamond Industry Suite

A single Next.js application covering the eight core operations of a diamond
factory and trading business, structured internally as separate modules so each
can later be split into its own service.

Runs entirely on your machine on SQLite — no cloud dependencies.

## Modules

1. **Yield Optimizer** — upload rough stone specs, auto-generate cut plan options (single large vs two stones vs yield-max), compare profit/margin, pick a plan.
2. **Manufacturing ERP** — every stone gets a QR code, moves through PLANNING → SAWING → BRUTING → POLISHING → QC → CERTIFICATION → COMPLETED with weight-loss tracking per stage and worker attribution.
3. **Worker Productivity** — onboard workers, log daily pieces / recovery % / errors / machine hours, compute efficiency, add monthly incentives.
4. **Inventory & Marketplace** — polished stock with full spec, certificate, image/video; filterable B2B-style search; publish/unpublish listings, capture inquiries, mark sold.
5. **Price Intelligence** — Rapaport/IDEX/manual price points by shape/carat/color/clarity; trend chart; instant price estimator.
6. **Traceability** — SHA-256 hash-chained audit log of every event per stone (received, planned, sawed, polished, inspected, sent to vendor, sold). UI verifies the entire chain and surfaces tampered events.
7. **Quality Defect Detection** — submit an inspection (image URL + stone), receive a deterministic stub score with defect list and PASS / REWORK / REJECT recommendation. Wire in a real CV model later by replacing `src/lib/quality-stub.ts`.
8. **Job Work / Outsourcing** — vendors directory, send N stones to a vendor for a specific job type, track returns and loss, calculate payment from rate × returned carat, mark paid.

A dashboard cross-cuts all modules with live counters, recent events, and latest inventory.

## Tech stack

- **Next.js 14** App Router + TypeScript
- **Prisma** ORM with **SQLite** (`prisma/dev.db`)
- **NextAuth.js** credentials provider (JWT sessions, bcrypt-hashed passwords)
- **Tailwind CSS** for styling
- **Recharts** for trend charts
- **Zod** for API input validation

## Quick start

```powershell
# 1. install
npm install

# 2. create DB + tables
npx prisma db push

# 3. seed demo data (4 rough stones, stones at various stages,
#    5 workers with 2 weeks of logs, vendors, inventory, price history, etc.)
npm run db:seed

# 4. run
npm run dev
```

Open http://localhost:3000.

### Demo accounts

| Email | Password | Role |
| --- | --- | --- |
| `admin@yeild.local` | `admin123` | ADMIN |
| `owner@yeild.local` | `owner123` | OWNER |
| `planner@yeild.local` | `planner123` | PLANNER |
| `emp001@yeild.local` … `emp005@yeild.local` | `worker123` | WORKER |

Or click **Get started** on the home page to create your own account.

## Project layout

```
prisma/
  schema.prisma          ← all models for all 8 modules
  seed.ts                ← demo data
src/
  app/
    (auth)/login, register
    (dashboard)/
      dashboard          ← cross-module overview
      yield              ← Module 1
      manufacturing      ← Module 2
      workers            ← Module 3
      inventory          ← Module 4
      pricing            ← Module 5
      traceability       ← Module 6
      quality            ← Module 7
      jobwork            ← Module 8
      settings
    api/
      auth/[...nextauth] ← NextAuth handler
      yield/             ← Module 1 endpoints
      manufacturing/     ← Module 2 endpoints
      workers/           ← Module 3 endpoints
      inventory/         ← Module 4 endpoints
      pricing/           ← Module 5 endpoints
      quality/           ← Module 7 endpoints
      jobwork/           ← Module 8 endpoints
      register/
  components/            ← Sidebar, Header, StatCard, Badge, PageHeader
  lib/
    prisma.ts            ← DB client singleton
    auth.ts              ← NextAuth options
    session.ts           ← requireSession helpers
    constants.ts         ← Role / Stage / Shape / Color / Clarity tables
    utils.ts             ← formatters + heuristic price estimator
    yield.ts             ← cut-plan generator
    trace-recorder.ts    ← writes hash-chained TraceEvents
    trace-hash.ts        ← SHA-256 canonicalizer
    quality-stub.ts      ← deterministic "defect detector"
```

## Where production work would go next

This codebase is a working foundation, not a finished SaaS. Realistic next
steps before shipping to a real factory:

| Area | Foundation present | Production work needed |
| --- | --- | --- |
| Yield AI | Heuristic plan generator (`src/lib/yield.ts`) | Integrate Sarine Advisor / Galaxy data; replace heuristic with real planner output |
| Manufacturing | Stage events, weight loss, worker attribution | Mobile-first QR scanning, barcode printers, real-time notifications |
| Workers | Daily logs + incentives | Biometric attendance, shift planning, payroll export |
| Inventory | CRUD + search + listing + inquiries | Image upload (S3), GIA cert auto-fetch, multi-currency |
| Pricing | Manual price points + chart | Auto-pull Rapaport CSVs, IDEX scraping, IDEX/RAPNET API |
| Traceability | SHA-256 hash chain in SQLite | Notarize to public chain (Hyperledger, Polygon) for tamper-proof externally |
| Quality | Stub scoring (`src/lib/quality-stub.ts`) | Wire YOLO / SAM / custom CV pipeline; image upload |
| Job Work | Order + return + loss + payment | Vendor portal, photo proof at hand-off, escrow |
| Auth | Credentials + roles | SSO, per-module RBAC, audit log of admin actions |
| Storage | SQLite | PostgreSQL when concurrent writes matter; current code only touches `DATABASE_URL` |

## Useful commands

```powershell
npm run dev         # development
npm run build       # production build (runs prisma generate + db push first)
npm run start       # serve production build
npm run db:seed     # reset + reseed demo data
npm run db:studio   # Prisma Studio (visual DB browser)
npm run db:push     # apply schema changes to dev.db
```

## Environment variables

`.env` (already created):

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-me-in-prod-..."
```

For real deployment, generate a strong `NEXTAUTH_SECRET` with
`openssl rand -base64 32` and point `DATABASE_URL` at PostgreSQL.
