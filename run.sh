#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

cat <<EOF
Kalos dev helper

This repo runs 3 things:
1) Postgres (Docker)
2) MemberGPT API (FastAPI, port 8000)
3) Dashboard (Next.js, port 3001)

Recommended workflow: open 3 terminals and run:

Terminal 1 (DB)
  cd "$ROOT_DIR"
  docker compose up -d

Terminal 2 (API)
  cd "$ROOT_DIR/apps/membergpt-api"
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
  uvicorn app.main:app --reload --port 8000

Terminal 3 (Dashboard)
  cd "$ROOT_DIR"
  corepack enable
  corepack prepare pnpm@10.19.0 --activate
  pnpm install
  pnpm --filter dashboard dev

Then open:
  http://localhost:3001/login
  http://localhost:3001/membergpt
EOF
