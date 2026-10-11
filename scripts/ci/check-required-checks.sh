#!/bin/sh
# Self-test for scripts/check-required-checks.mjs (BP-P2-005, BP-P2-004).
#
# 1) Runs the guard against the live tree: every required context in
#    .github/branch-protection/*.json must resolve to a workflow check-run,
#    and the emitting workflow's pull_request trigger must not be
#    path-filtered - a filtered required check never reports on PRs that miss
#    its paths (CI-P2-009).
# 2) Runs the same guard against a negative fixture (a required context
#    emitted by a path-filtered workflow) and fails if the guard does not
#    flag it, so a broken detector cannot pass silently.
#
# Usage: scripts/ci/check-required-checks.sh
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
fixture="$root/scripts/ci/fixtures/required-checks-path-filtered"

echo "1/2 required checks must resolve and must not be path-filtered"
node "$root/scripts/check-required-checks.mjs" \
  --workflows-dir "$root/.github/workflows" \
  --branch-protection-dir "$root/.github/branch-protection"

echo "2/2 negative fixture: a path-filtered required workflow must fail the guard"
if out=$(node "$root/scripts/check-required-checks.mjs" \
  --workflows-dir "$fixture/workflows" \
  --branch-protection-dir "$fixture/branch-protection" 2>&1); then
  echo "FAIL: guard passed on the path-filtered fixture; the detector is broken" >&2
  exit 1
fi
if ! printf '%s\n' "$out" | grep -q "FILTERED"; then
  echo "FAIL: guard failed for the wrong reason; expected a FILTERED violation:" >&2
  printf '%s\n' "$out" >&2
  exit 1
fi
echo "    OK: path-filtered required workflow flagged"
echo "PASS: required-check guard"
