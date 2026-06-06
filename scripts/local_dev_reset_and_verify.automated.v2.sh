#!/usr/bin/env bash
set -euo pipefail
SUPABASE_CMD="supabase"
USE_NPX=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --use-npx) USE_NPX=1; shift ;;
    --supabase-cmd) SUPABASE_CMD="$2"; shift 2 ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done
run_supabase() { if [[ "$USE_NPX" -eq 1 ]]; then npx "$SUPABASE_CMD" "$@"; else "$SUPABASE_CMD" "$@"; fi }
run_query_file() { local file_path="$1"; if [[ "$USE_NPX" -eq 1 ]]; then npx "$SUPABASE_CMD" db query < "$file_path"; else "$SUPABASE_CMD" db query < "$file_path"; fi }
printf '
=== Start local Supabase stack ===
'
run_supabase start
printf '
=== Reset local database (ordered seed files run automatically) ===
'
run_supabase db reset
printf '
=== Run extended verification (single statement) ===
'
run_query_file "sql/verify_local_dev_extended.single.sql"
printf '
Automated local dev reset + verify complete.
'
