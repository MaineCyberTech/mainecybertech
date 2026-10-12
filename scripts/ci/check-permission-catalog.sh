#!/bin/sh
# Self-test for scripts/check-permission-catalog.mjs (ACM-P3-002 / EVOL-P3-002).
#
# 1) Runs the guard against the live tree: every requirePermission literal,
#    every live RLS user_has_permission predicate, and every registerCrud
#    module key must resolve against the permission catalog extracted from
#    supabase/migrations.
# 2) Runs the same guard against a negative fixture (a route referencing a
#    key absent from the fixture catalog) and fails if the guard does not flag
#    it, so a broken detector cannot pass silently.
#
# Usage: scripts/ci/check-permission-catalog.sh
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
fixture="$root/scripts/ci/fixtures/permission-catalog"

echo "1/2 permission references must resolve against the catalog"
node "$root/scripts/check-permission-catalog.mjs"

echo "2/2 negative fixture: an uncatalogued permission key must fail the guard"
if out=$(node "$root/scripts/check-permission-catalog.mjs" --root "$fixture" 2>&1); then
  echo "FAIL: guard passed on the uncatalogued fixture; the detector is broken" >&2
  exit 1
fi
if ! printf '%s\n' "$out" | grep -q "ghost:view"; then
  echo "FAIL: guard failed for the wrong reason; expected ghost:view to be flagged:" >&2
  printf '%s\n' "$out" >&2
  exit 1
fi
echo "    OK: uncatalogued permission key flagged"
echo "PASS: permission-catalog guard"
