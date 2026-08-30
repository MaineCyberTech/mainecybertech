#!/usr/bin/env bash
set -euo pipefail

# preflight-check.sh — Pre-deployment validation checks
# Run before pushing to main/develop to catch common issues early.
# Exit code: 0 = all checks pass, 1 = one or more checks failed

PASS=0
FAIL=0
SKIP=0

check() {
  local label="$1" result="$2"
  if [ "$result" = "pass" ]; then
    echo "  ✅ $label"
    ((PASS++))
  elif [ "$result" = "skip" ]; then
    echo "  ⏭️  $label"
    ((SKIP++))
  else
    echo "  ❌ $label"
    ((FAIL++))
  fi
}

echo "=== MCT Portal Pre-flight Checks ==="
echo ""

# --- Dockerfiles ---
echo "--- Dockerfile checks ---"
check "apps/api/Dockerfile exists"                 "$([ -f apps/api/Dockerfile ] && echo pass || echo fail)"
check "apps/web/Dockerfile exists"                 "$([ -f apps/web/Dockerfile ] && echo pass || echo fail)"
check "apps/worker/Dockerfile exists"              "$([ -f apps/worker/Dockerfile ] && echo pass || echo fail)"
API_DISTRO=$(head -1 apps/api/Dockerfile 2>/dev/null | grep -c "node:20-alpine" && echo pass || echo fail)
check "API uses node:20-alpine (not :latest)"      "$API_DISTRO"
WORKER_DISTRO=$(head -1 apps/worker/Dockerfile 2>/dev/null | grep -c "node:20-alpine" && echo pass || echo fail)
check "Worker uses node:20-alpine (not :latest)"   "$WORKER_DISTRO"

# --- docker-compose ---
echo ""
echo "--- docker-compose checks ---"
check "docker-compose.yml exists"                  "$([ -f infra/digitalocean/docker-compose.yml ] && echo pass || echo fail)"
check "Caddyfile exists"                           "$([ -f infra/digitalocean/Caddyfile ] && echo pass || echo fail)"

# -- Supabase migrations ---
echo ""
echo "--- Migration checks ---"
MIGRATIONS=$(find supabase/migrations -name "*.sql" 2>/dev/null | wc -l)
check "Supabase migrations exist (>= 1)"           "$([ "$MIGRATIONS" -ge 1 ] && echo pass || echo fail)"
MIGRATION_DUPES=$(find supabase/migrations -name "*.sql" 2>/dev/null | sed 's|.*/||' | cut -d_ -f1 | sort | uniq -d)
check "No duplicate migration timestamps"          "$([ -z "$MIGRATION_DUPES" ] && echo pass || echo fail)"

# --- Environment ---
echo ""
echo "--- Environment checks ---"
check "apps/api/.env.example exists"               "$([ -f apps/api/.env.example ] && echo pass || echo fail)"
check "apps/web/.env.example exists"               "$([ -f apps/web/.env.example ] && echo pass || echo fail)"
check "apps/worker/.env.example exists"            "$([ -f apps/worker/.env.example ] && echo pass || echo fail)"

# --- CI/CD ---
echo ""
echo "--- CI/CD checks ---"
WORKFLOWS=$(find .github/workflows -name "*.yml" 2>/dev/null | wc -l)
check "Workflow files exist (>= 1)"                "$([ "$WORKFLOWS" -ge 1 ] && echo pass || echo fail)"
check "test.yml exists"                            "$([ -f .github/workflows/test.yml ] && echo pass || echo fail)"
check "deploy-do.yml exists"                       "$([ -f .github/workflows/deploy-do.yml ] && echo pass || echo fail)"

# --- Tests ---
echo ""
echo "--- Test checks ---"
if command -v pnpm &>/dev/null; then
  check "pnpm available"                           "pass"
else
  check "pnpm available"                           "skip"
fi

# --- Migration naming convention ---
echo ""
echo "--- Migration naming convention ---"
NO_PREFIX=$(find supabase/migrations -name "*.sql" 2>/dev/null | while read -r f; do
  basename "$f" | grep -qE '^[0-9]{7}_' || echo "$f"
done)
check "All migrations prefixed with timestamp"     "$([ -z "$NO_PREFIX" ] && echo pass || echo fail)"

echo ""
echo "=== Results: $PASS passed, $FAIL failed, $SKIP skipped ==="
exit "$FAIL"
