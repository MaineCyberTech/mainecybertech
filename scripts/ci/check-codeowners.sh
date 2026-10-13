#!/bin/sh
# Self-test for scripts/check-codeowners.mjs (BP-P3-005).
#
# 1) Runs the guard against the live .github/CODEOWNERS (syntax always; team
#    handles via the GitHub API only when CODEOWNERS_READ_TOKEN is set, so a
#    missing token degrades to the documented syntax-only fallback).
# 2) Runs a negative fixture (an owner without @) and fails if the guard does
#    not flag it.
# 3) Runs a team-resolution fixture with --verify-api --teams-file: an unknown
#    team must fail, and the same map must pass when every handle exists, so a
#    broken resolver cannot pass silently.
#
# Usage: scripts/ci/check-codeowners.sh
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
invalid="$root/scripts/ci/fixtures/codeowners-invalid/CODEOWNERS"
teams="$root/scripts/ci/fixtures/codeowners-teams"

echo "1/4 live CODEOWNERS syntax (+ team handles when a token is configured)"
if [ -n "${CODEOWNERS_READ_TOKEN:-}" ]; then
  export CODEOWNERS_VERIFY_API=1
fi
node "$root/scripts/check-codeowners.mjs" --codeowners "$root/.github/CODEOWNERS"

echo "2/4 negative fixture: an owner without @ must fail"
if out=$(node "$root/scripts/check-codeowners.mjs" --codeowners "$invalid" 2>&1); then
  echo "FAIL: guard accepted an owner handle without @" >&2
  exit 1
fi
if ! printf '%s\n' "$out" | grep -q "not a valid @user"; then
  echo "FAIL: guard failed for the wrong reason; expected a handle-syntax violation:" >&2
  printf '%s\n' "$out" >&2
  exit 1
fi
echo "    OK: invalid owner handle flagged"

echo "3/4 team fixture: an unknown team must fail under --verify-api"
if out=$(node "$root/scripts/check-codeowners.mjs" \
  --codeowners "$teams/CODEOWNERS" \
  --verify-api --teams-file "$teams/teams.json" 2>&1); then
  echo "FAIL: guard accepted @mainecybertech/ghost-team; the resolver is broken" >&2
  exit 1
fi
if ! printf '%s\n' "$out" | grep -q "ghost-team"; then
  echo "FAIL: guard failed for the wrong reason; expected the unknown team to be named:" >&2
  printf '%s\n' "$out" >&2
  exit 1
fi
echo "    OK: unknown team handle flagged"

echo "4/4 team fixture: the same map passes when every handle exists"
node "$root/scripts/check-codeowners.mjs" \
  --codeowners "$teams/CODEOWNERS" \
  --verify-api --teams-file "$teams/teams-full.json"
echo "PASS: CODEOWNERS guard"
