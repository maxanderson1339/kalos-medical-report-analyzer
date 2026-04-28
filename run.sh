set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting Kalos Full Stack App..."

echo "🐘 Starting PostgreSQL..."
docker compose up -d

echo "🐍 Starting MemberGPT API..."

cd "$ROOT_DIR/apps/membergpt-api"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install -r requirements.txt

uvicorn app.main:app --reload --port 8000 &
API_PID=$!

cd "$ROOT_DIR"

echo "🟦 Starting Dashboard..."

corepack enable
corepack prepare pnpm@10.19.0 --activate
pnpm install

pnpm --filter dashboard dev &
WEB_PID=$!

trap "echo 'Stopping services...'; kill $API_PID $WEB_PID 2>/dev/null || true" EXIT

echo ""
echo "   All services running:"
echo "   → API: http://localhost:8000"
echo "   → Dashboard: http://localhost:3001"
echo ""
echo "Press CTRL+C to stop all services"

wait