#!/bin/sh
# Guard (DATA-P2-002): destructive DDL in a migration must sit inside an
# explicit begin; ... commit; block.
#
# Why this exists (audit DATA-P2-002, run 20261011-0426): migrations are applied
# statement-by-statement by both `supabase db push` and
# tools/migration_chain_check.sh (plain `psql -f`, autocommit). A mid-file
# failure therefore leaves the earlier statements committed: 5302055 had
# already dropped nine tables, and 5302406/5302407 had already dropped the
# table they replace, before the replacement DDL ran. begin;/commit; makes a
# fresh replay atomic. Already-applied migrations are not re-run by `db push`
# (the version ledger, not the file body, decides), so this guard only changes
# fresh-replay semantics.
#
# Flags `drop table` and `alter table ... drop column` statements outside a
# transaction. Table replacement is covered by its `drop table` statement.
#
# A negative fixture is run through the same detector and must be flagged, so a
# broken detector cannot pass silently.
#
# Usage: scripts/ci/check-migration-transactions.sh [migrations-dir]
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
migrations_dir=${1:-"$root/supabase/migrations"}
fixture="$root/scripts/ci/fixtures/migration-transactions-negative.sql"

# Print "<file>:<line>: ..." for every destructive statement that is not
# wrapped in begin;/commit;, and exit 1 when at least one was found.
detect() {
  awk '
    {
      line = $0
      sub(/--.*/, "", line)          # drop trailing -- comments
      l = tolower(line)

      # Transaction markers only count at the start of a line: plpgsql `begin`
      # is never followed by `;`, so function bodies cannot toggle the state.
      if (l ~ /^[ \t]*(begin([ \t]+transaction)?|start[ \t]+transaction)[ \t]*;[ \t]*$/) { in_txn = 1; next }
      if (l ~ /^[ \t]*(commit([ \t]+transaction)?|end|rollback([ \t]+transaction)?)[ \t]*;[ \t]*$/) { in_txn = 0; next }

      destructive = 0
      if (l ~ /(^|[^a-z0-9_])drop[ \t]+table([^a-z0-9_]|$)/) destructive = 1
      # `alter table ... drop column` may span lines; remember we are inside an
      # ALTER TABLE until its terminating semicolon.
      if (l ~ /(^|[^a-z0-9_])alter[ \t]+table([^a-z0-9_]|$)/) alter_pending = 1
      if (alter_pending && l ~ /(^|[^a-z0-9_])drop[ \t]+column([^a-z0-9_]|$)/) destructive = 1
      if (index(line, ";") > 0) alter_pending = 0

      if (destructive) {
        saw_destructive = 1
        if (!in_txn) {
          printf "%s:%d: destructive DDL outside begin;/commit;: %s\n", FILENAME, FNR, $0
          found = 1
        }
      }
    }
    END {
      if (saw_destructive && in_txn) {
        printf "%s: transaction opened but never committed (destructive DDL would roll back)\n", FILENAME
        found = 1
      }
      exit found ? 1 : 0
    }
  ' "$1"
}

checked=0
violations=0
echo "1/2 destructive DDL in migrations must be transaction-wrapped"
for f in "$migrations_dir"/*.sql; do
  [ -e "$f" ] || continue
  checked=$((checked + 1))
  detect "$f" || violations=$((violations + 1))
done
if [ "$checked" -eq 0 ]; then
  echo "FAIL: no *.sql migrations found under $migrations_dir" >&2
  exit 1
fi
if [ "$violations" -ne 0 ]; then
  echo "FAIL: $violations migration file(s) contain unwrapped destructive DDL" >&2
  exit 1
fi
echo "    OK: $checked migration file(s) checked"

echo "2/2 negative fixture must be flagged"
[ -f "$fixture" ] || {
  echo "FAIL: negative fixture missing: $fixture" >&2
  exit 1
}
if detect "$fixture" >/dev/null 2>&1; then
  echo "FAIL: negative fixture was not flagged; the detector is broken" >&2
  exit 1
fi
echo "    OK: unwrapped destructive DDL detected in the fixture"

echo "PASS: migration transaction guard"
