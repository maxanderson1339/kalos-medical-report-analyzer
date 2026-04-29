#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$ROOT_DIR/apps/dashboard/.env.local"

if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<'EOF'
DATABASE_URL=postgresql://postgres:wRwtKYXGHvwjiWMUAapoEpehmakidwXi@switchback.proxy.rlwy.net:32414/railway
NEXTAUTH_SECRET=Ui2qu7Sl3Ghu4INtKDV0cvoItzFfOHa91ATSHL+eL/M=
NEXTAUTH_URL=http://localhost:3001
EOF
  echo ".env.local created"
fi

cd "$ROOT_DIR"

echo "Installing dependencies..."
pnpm install

echo "Building shared UI..."
pnpm --filter @repo/ui run build:styles
pnpm --filter @repo/ui run build:components

echo "Generating Prisma client..."
pnpm --filter dashboard exec prisma generate --schema ../../packages/db/prisma/schema.prisma

echo ""
echo "Starting Kalos..."
echo "  Dashboard: http://localhost:3001"
echo "  MemberGPT: http://localhost:3001/chat"
echo ""
echo "Press CTRL+C to stop"
echo ""

pnpm --filter dashboard dev
