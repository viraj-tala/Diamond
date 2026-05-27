# Lustra — Diamond Manufacturing OS

A single Next.js application covering the nine core operations of a diamond
factory and trading business — yield planning, manufacturing tracking, IoT
scanning, worker productivity, inventory + B2B marketplace, price intelligence,
hash-chained traceability, AI-assisted quality control, and vendor job-work —
structured internally as separate modules so each can later be split into its
own service.

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
- **Drizzle ORM** with **PostgreSQL** (postgres.js driver)
- **NextAuth.js** credentials provider (JWT sessions, bcrypt-hashed passwords)
- **Tailwind CSS** for styling
- **Recharts** for trend charts
- **Zod** for API input validation

## Quick start

### 1. Start Postgres via Docker

```powershell
docker compose up -d        # starts postgres on localhost:5432, data persists in a volume
```

The `.env` is already wired to this local DB. To stop later: `docker compose down` (data persists). To wipe everything: `docker compose down -v`.

**Other options:** instead of Docker, you can use [Neon](https://neon.tech) (free hosted) or any other Postgres — just replace `DATABASE_URL` in `.env` with your connection string.

### 2. Install, migrate, seed, run

```powershell
npm install
npm run db:push       # create all tables in Postgres
npm run db:seed       # populate demo data
npm run dev
```

Open http://localhost:3000.

### Demo accounts

| Email | Password | Role |
| --- | --- | --- |
| `admin@lustra.local` | `admin123` | ADMIN |
| `owner@lustra.local` | `owner123` | OWNER |
| `planner@lustra.local` | `planner123` | PLANNER |
| `emp001@lustra.local` … `emp005@lustra.local` | `worker123` | WORKER |

Or click **Get started** on the home page to create your own account.

## Project layout

```
drizzle.config.ts        ← Drizzle Kit config (migrations + push + studio)
src/
  db/
    schema.ts            ← all tables, enums, and relations for all 8 modules
    index.ts             ← postgres.js pool + drizzle wrapper (singleton)
    seed.ts              ← demo data
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
    auth.ts              ← NextAuth options
    session.ts           ← requireSession helpers
    constants.ts         ← Role / Stage / Shape / Color / Clarity tables
    utils.ts             ← formatters + heuristic price estimator
    yield.ts             ← cut-plan generator
    trace-recorder.ts    ← writes hash-chained TraceEvents
    trace-hash.ts        ← SHA-256 canonicalizer
    quality-stub.ts      ← deterministic "defect detector"
```

## Useful commands

```powershell
npm run dev               # development
npm run build             # production build
npm run start             # serve production build

npm run db:push           # sync schema to DB (fast iteration; non-destructive for compatible changes)
npm run db:generate       # generate a migration SQL file from schema changes
npm run db:migrate        # apply generated migrations
npm run db:studio         # Drizzle Studio (visual DB browser, opens in browser)
npm run db:seed           # reseed demo data (skips if rough stones already exist)
```

### Schema changes: push vs generate

- **`db:push`** is the fastest path while developing — it diffs your schema and applies changes directly. Use this during dev.
- **`db:generate` + `db:migrate`** produces versioned migration SQL files in `./drizzle/`. Use this once you go to production so changes are reviewable and reproducible.

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
| Traceability | SHA-256 hash chain in Postgres | Notarize to public chain (Hyperledger, Polygon) for tamper-proof externally |
| Quality | Stub scoring (`src/lib/quality-stub.ts`) | Wire YOLO / SAM / custom CV pipeline; image upload |
| Job Work | Order + return + loss + payment | Vendor portal, photo proof at hand-off, escrow |
| Auth | Credentials + roles | SSO, per-module RBAC, audit log of admin actions |
| Storage | Single Postgres | Connection pool tuning, read replicas, object storage for media |
