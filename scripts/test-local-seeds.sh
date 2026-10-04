#!/bin/bash
# test-local-seeds.sh
# Test the local stack with seed data

set -e

echo "=== MCT Local Stack Seed Test ==="

# Check prerequisites
echo ""
echo "[1/7] Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker not found"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Run: install Node.js 18+"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "ERROR: pnpm not found. Run: npm install -g pnpm"
    exit 1
fi

echo "  Docker: OK"
echo "  Node.js: OK"
echo "  pnpm: OK"

# Clean up existing containers
echo ""
echo "[2/7] Cleaning up existing containers..."
docker compose down 2>/dev/null || true
npx supabase stop 2>/dev/null || true
echo "  Cleanup complete"

# Start Supabase
echo ""
echo "[3/7] Starting Supabase..."
npx supabase start 2>/dev/null
echo "  Supabase started"

# Wait for healthy
echo ""
echo "[4/7] Waiting for Supabase to be healthy..."
max_wait=60
elapsed=0
while [ $elapsed -lt $max_wait ]; do
    if docker ps --format "{{.Names}}:{{.Status}}" 2>/dev/null | grep -q "supabase_db.*healthy"; then
        echo "  Supabase is healthy"
        break
    fi
    sleep 5
    elapsed=$((elapsed + 5))
    echo "  Waiting... ($elapsed/$max_wait seconds)"
done

# Apply migrations and seeds
echo ""
echo "[5/7] Applying migrations and seeds..."
npx supabase db reset 2>/dev/null
echo "  Migrations and seeds applied"

# Sync env vars
echo ""
echo "[6/7] Syncing environment variables..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    pwsh scripts/sync_supabase_env.auto.v2.ps1 -UseNpx -Framework nextjs -EnvFile .env.local
else
    npx supabase status -o env | grep -E "^(API_URL|ANON_KEY|SERVICE_ROLE_KEY|JWT_SECRET|DB_URL)" > apps/api/.env.local
    cp apps/api/.env.local apps/api/.env
    echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > apps/web/.env.local
fi
echo "  Environment variables synced"

# Run tests
echo ""
echo "[7/7] Running tests..."
pnpm test

echo ""
echo "=== Seed test complete! ==="
echo ""
echo "Local stack is ready:"
echo "  Supabase Studio: http://localhost:54323"
echo "  API: http://localhost:4000"
echo "  API Docs: http://localhost:4000/api/v1/docs"
echo "  Web: http://localhost:3000"
echo ""
echo "To start the services:"
echo "  Terminal 1: pnpm --filter=api dev"
echo "  Terminal 2: pnpm --filter=web dev"
echo "  Terminal 3: pnpm --filter=worker dev"