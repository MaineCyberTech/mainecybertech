#!/usr/bin/env bash
# start-local-stack.sh — Start the full MCT local development stack (Linux/macOS)
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=== MCT Local Stack Start ==="

echo ""
echo "[1/8] Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker not found"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js not found"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "ERROR: pnpm not found"; exit 1; }
command -v supabase >/dev/null 2>&1 || echo "WARNING: supabase CLI not found (install: npm install -g supabase)"
echo "  Prerequisites OK"

echo ""
echo "[2/8] Installing dependencies..."
pnpm install
echo "  Dependencies installed"

echo ""
echo "[3/8] Starting Supabase..."
docker compose down 2>/dev/null || true
npx supabase stop --no-backup 2>/dev/null || true
npx supabase start
echo "  Supabase started"

echo ""
echo "[4/8] Waiting for Supabase to be healthy..."
for i in $(seq 1 18); do
  STATUS=$(docker ps --format "{{.Names}}:{{.Status}}" 2>/dev/null | grep "supabase_db" | head -1)
  if echo "$STATUS" | grep -q "healthy"; then
    echo "  Supabase healthy after $((i * 5))s"
    break
  fi
  sleep 5
done

echo ""
echo "[5/8] Applying migrations and seeds..."
npx supabase db reset
echo "  Migrations applied"

echo ""
echo "[6/8] Syncing environment variables..."
eval "$(npx supabase status -o env 2>/dev/null | grep -E '^ANON_KEY|^SERVICE_ROLE_KEY|^JWT_SECRET')"

cat > apps/api/.env.local << EOF
NODE_ENV=development
API_PORT=4000
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
JWT_SECRET=$JWT_SECRET
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
EOF
cp apps/api/.env.local apps/api/.env

echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > apps/web/.env.local

cat > apps/worker/.env.local << EOF
NODE_ENV=development
LOG_LEVEL=info
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=$ANON_KEY
WORKER_CONCURRENCY=10
WORKER_TIMEOUT=30000
HEALTH_PORT=3001
EOF

echo "  Environment variables synced"

echo ""
echo "[7/8] Building API..."
pnpm --filter=api build
echo "  API built"

echo ""
echo "[8/8] Starting services..."
pnpm --filter=api start &
API_PID=$!
echo "  API starting (PID $API_PID)"

sleep 5
for i in $(seq 1 15); do
  if curl -sf http://localhost:4000/health > /dev/null 2>&1; then
    echo "  API: Ready"
    break
  fi
  sleep 2
done

pnpm --filter=web dev &
WEB_PID=$!
echo "  Web starting (PID $WEB_PID)"

echo ""
echo "=== Local Stack Ready ==="
echo ""
echo "Services:"
echo "  Supabase Studio: http://localhost:54323"
echo "  API:             http://localhost:4000"
echo "  API Docs:        http://localhost:4000/api/v1/docs"
echo "  Web:             http://localhost:3000"
echo ""
echo "Seed users (password: 1):"
echo "  superadmin.real@mainecybertech.local"
echo "  mspadmin.real@mainecybertech.local"
echo "  clientadmin.real@acme.example"
echo "  technician.real@acme.example"
echo "  user.real@acme.example"
echo "  clientadmin.real@beta.example"
echo "  user.real@beta.example"
echo ""
echo "Press Ctrl+C to stop all services"
wait
