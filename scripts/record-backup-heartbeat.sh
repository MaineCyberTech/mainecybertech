#!/usr/bin/env bash
# Record a platform backup success heartbeat (DR-P2-008).
#
# The `backup_status` table is client-facing product data (seeded per-org rows);
# nothing in the platform writes it, so the worker's `backup-dr-check` cannot
# trust it as a platform signal. This script records the authoritative signal —
# the last successful run of the database backup — into
# public.platform_backup_heartbeats (migration 5302449).
#
# Fail closed: a backup whose success cannot be recorded is not verifiable, so
# this exits non-zero and the workflow run goes red.
#
# Usage: HEARTBEAT_WORKFLOW=db-backup SUPABASE_DB_URL=... ./scripts/record-backup-heartbeat.sh
set -euo pipefail

: "${HEARTBEAT_WORKFLOW:?HEARTBEAT_WORKFLOW is required (e.g. db-backup)}"
: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is required (direct database connection)}"

RUN_ID="${GITHUB_RUN_ID:-local}"
RUN_URL=""
if [ -n "${GITHUB_REPOSITORY:-}" ] && [ -n "${GITHUB_RUN_ID:-}" ]; then
  RUN_URL="https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"
fi

# The heartbeat table has no API write policies, so service-role/direct SQL is
# the only writer. -v binds the values safely (no shell interpolation into SQL).
psql "${SUPABASE_DB_URL}" -v ON_ERROR_STOP=1 -q \
  -v workflow="${HEARTBEAT_WORKFLOW}" \
  -v run_id="${RUN_ID}" \
  -v run_url="${RUN_URL}" <<'SQL'
insert into public.platform_backup_heartbeats (workflow, last_success_at, run_id, run_url)
values (:'workflow', now(), :'run_id', :'run_url')
on conflict (workflow) do update
  set last_success_at = excluded.last_success_at,
      run_id = excluded.run_id,
      run_url = excluded.run_url,
      recorded_at = now();
SQL

echo "Recorded ${HEARTBEAT_WORKFLOW} backup heartbeat"
