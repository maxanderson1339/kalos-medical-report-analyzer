# Kalos Take-Home — Member Dashboard + MemberGPT

Two apps sharing a single Postgres database:

- **Member Dashboard** (`apps/dashboard`): member login + scan history + upload a new DEXA PDF (parsed into a new `Scan` record)
- **MemberGPT** (`apps/dashboard/app/membergpt` + `apps/membergpt-api`): coach-facing chat UI + API that answers questions grounded in scan data and parses uploaded PDFs

## Tech stack

- **DB:** Postgres (via `docker-compose.yml`)
- **ORM / schema:** Prisma (`packages/db/prisma/schema.prisma`)
- **Dashboard:** Next.js App Router + Tailwind (`apps/dashboard`)
- **API:** FastAPI + SQLAlchemy (`apps/membergpt-api`)
- **PDF parsing:** `pdfplumber` + regex (and optional Gemini extraction fallback)

## Local development

### Prereqs

- Node.js 20+ (or 18+, but this repo uses modern Next.js)
- Python 3.11+
- Docker (for Postgres)

### 1) Install JS deps

This repo uses `pnpm` workspaces.

```bash
corepack enable
corepack prepare pnpm@10.19.0 --activate
pnpm install
```

### 2) Start Postgres

```bash
docker compose up -d
```

### 3) Configure env vars

Copy the example env files and adjust as needed:

```bash
cp apps/dashboard/.env.local.example apps/dashboard/.env.local
cp apps/membergpt-api/.env.example apps/membergpt-api/.env
```

Important values:

- `DATABASE_URL` must be the same for Prisma and the FastAPI service
- `MEMBERGPT_API_URL` is used by the dashboard upload route to call the PDF parser
- `NEXT_PUBLIC_MEMBERGPT_API_URL` is used by the browser to call the MemberGPT chat API

### 4) Create schema + seed

```bash
pnpm db:push
pnpm db:seed
```

### 5) Start the FastAPI backend (port 8000)

```bash
cd apps/membergpt-api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health check: `GET http://127.0.0.1:8000/health`

### 6) Start the dashboard (port 3001)

From the repo root:

```bash
pnpm --filter dashboard dev
```

Open:

- Member Dashboard: `http://localhost:3001/login` → `http://localhost:3001/dashboard`
- MemberGPT: `http://localhost:3001/membergpt` (no auth)

## Demo accounts

Seeded members (password is `password123` for all):

- `sarah@example.com` (1 scan)
- `jordan@example.com` (2 scans)
- `maria@example.com` (3+ scans)
- `david@example.com` (5+ scans)
- `ava@example.com` (2 scans)

## DEXA upload + parsing

On the member dashboard, use “Upload DEXA PDF” to upload a report (the sample file in this repo is `01_DEXA.pdf`).

What gets stored (subset of the available DEXA fields):

- Required: `weightKg`, `bodyFatPercent`, `fatMassKg`, `leanMassKg`, `scanDate`
- Optional when available: `visceralFatMassKg` (VAT), `boneMassKg` (from BMC), `trunkFatKg`, `trunkLeanMassKg`, `androidFatPercent`, `gynoidFatPercent`

If the parser service is unreachable, the dashboard still saves a scan using fallback values (latest scan values) and marks the upload as failed.

## Repo layout

- `apps/dashboard`: Member Dashboard + MemberGPT UI (Next.js)
- `apps/membergpt-api`: FastAPI service for `/chat` (grounded answers) and `/parse/parse` (PDF parsing)
- `packages/db`: Prisma schema + shared Prisma client used by the dashboard
