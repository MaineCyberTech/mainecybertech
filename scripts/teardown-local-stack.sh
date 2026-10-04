#!/bin/bash
# teardown-local-stack.sh
# Tear down the local development stack

echo "=== MCT Local Stack Teardown ==="

# Stop Node processes
echo ""
echo "[1/4] Stopping Node processes..."
pkill -f "node" 2>/dev/null || true
echo "  Node processes stopped"

# Stop Docker Compose services
echo ""
echo "[2/4] Stopping Docker Compose services..."
docker compose down 2>/dev/null || true
echo "  Docker Compose services stopped"

# Stop Supabase
echo ""
echo "[3/4] Stopping Supabase..."
npx supabase stop 2>/dev/null || true
echo "  Supabase stopped"

# Clean up
echo ""
echo "[4/4] Cleaning up..."
rm -f /tmp/api.log /tmp/api-error.log 2>/dev/null || true
echo "  Cleanup complete"

echo ""
echo "=== Teardown complete ==="
echo ""
echo "All services stopped. Docker containers removed."