#!/bin/sh
# RLS-P3-002: behavioral RLS allow/deny matrix.
#
# Runs scripts/ci/rls-matrix.sql against the local Supabase database after the
# migration chain (and seeds) have been applied — see
# .github/workflows/e2e.yml, right after `supabase db reset`. The static guards
# prove the policies exist; this proves they allow/deny the representative
# roles at runtime.
#
# The connection string comes from `supabase status` (falling back to the
# default local port) or from RLS_MATRIX_DB_URL for a hand-run database.
#
# Usage: scripts/ci/check-rls-matrix.sh
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
sql="$root/scripts/ci/rls-matrix.sql"

db_url=${RLS_MATRIX_DB_URL:-}
if [ -z "$db_url" ] && command -v supabase >/dev/null 2>&1; then
  db_url=$(supabase status --output json 2>/dev/null | jq -r '.DB_URL // empty' 2>/dev/null || true)
fi
if [ -z "$db_url" ]; then
  db_url="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
fi

exec psql "$db_url" -v ON_ERROR_STOP=1 -f "$sql"
