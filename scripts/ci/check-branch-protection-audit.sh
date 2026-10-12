#!/bin/sh
# Self-test for scripts/branch-protection-audit.mjs (BP-P2-002 / BP-P2-003).
#
# 1) drift: a matching live fixture passes.
# 2) drift: a live fixture with weaker settings (enforce_admins off, a required
#    context removed, force pushes allowed) fails with DRIFT.
# 3) drift: a branch with no live protection fails with DRIFT.
# 4) bypass: a merged PR whose head check-runs satisfy every required context
#    passes.
# 5) bypass: merged PRs with a failing and a missing required context fail and
#    name both PRs.
#
# Usage: scripts/ci/check-branch-protection-audit.sh
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
fixtures="$root/scripts/ci/fixtures/branch-protection-audit"
audit="$root/scripts/branch-protection-audit.mjs"

echo "1/5 drift: matching fixture passes"
node "$audit" --mode drift --repo fixture/repo \
  --branch-protection-dir "$fixtures/committed" \
  --live-dir "$fixtures/live-matching"

echo "2/5 drift: weaker live settings fail"
if out=$(node "$audit" --mode drift --repo fixture/repo \
  --branch-protection-dir "$fixtures/committed" \
  --live-dir "$fixtures/live-drifted" 2>&1); then
  echo "FAIL: drifted fixture passed; the drift detector is broken" >&2
  exit 1
fi
if ! printf '%s\n' "$out" | grep -q "DRIFT"; then
  echo "FAIL: drifted fixture failed for the wrong reason:" >&2
  printf '%s\n' "$out" >&2
  exit 1
fi

echo "3/5 drift: a branch without live protection fails"
if out=$(node "$audit" --mode drift --repo fixture/repo \
  --branch-protection-dir "$fixtures/committed" \
  --live-dir "$fixtures/live-unprotected" 2>&1); then
  echo "FAIL: unprotected branch passed; the drift detector is broken" >&2
  exit 1
fi
if ! printf '%s\n' "$out" | grep -q "no branch protection"; then
  echo "FAIL: unprotected fixture failed for the wrong reason:" >&2
  printf '%s\n' "$out" >&2
  exit 1
fi

echo "4/5 bypass: a clean merged PR passes"
node "$audit" --mode bypass --repo fixture/repo --lookback-days 36500 \
  --branch-protection-dir "$fixtures/committed" \
  --live-dir "$fixtures/live-matching" \
  --prs-file "$fixtures/prs-clean.json" \
  --check-runs-dir "$fixtures/check-runs"

echo "5/5 bypass: failing and missing required contexts fail"
if out=$(node "$audit" --mode bypass --repo fixture/repo --lookback-days 36500 \
  --branch-protection-dir "$fixtures/committed" \
  --live-dir "$fixtures/live-matching" \
  --prs-file "$fixtures/prs-bypass.json" \
  --check-runs-dir "$fixtures/check-runs" 2>&1); then
  echo "FAIL: bypass fixture passed; the bypass detector is broken" >&2
  exit 1
fi
if ! printf '%s\n' "$out" | grep -q "BYPASS #902" ||
  ! printf '%s\n' "$out" | grep -q "BYPASS #904"; then
  echo "FAIL: bypass fixture failed for the wrong reason:" >&2
  printf '%s\n' "$out" >&2
  exit 1
fi
echo "PASS: branch-protection audit self-test"
