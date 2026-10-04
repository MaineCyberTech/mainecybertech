#!/bin/sh
# Verify .gitleaks.toml (DET-P2-002):
#   1. the tracked tree is clean under the reviewed allowlists, and
#   2. a synthetic generic-api-key is STILL detected (negative fixture), so an
#      allowlist cannot silently grow to swallow a real secret.
#
# gitleaks is an optional external tool; when it is not installed this exits 0
# with a notice, so the check can run in any environment.
#
# Usage: scripts/ci/verify-gitleaks-config.sh
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
fixture="$root/scripts/ci/fixtures/gitleaks-negative.env.fixture"
config="$root/.gitleaks.toml"

if ! command -v gitleaks >/dev/null 2>&1; then
  echo "gitleaks not installed; skipping gitleaks config verification"
  exit 0
fi

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

echo "1/2 full-tree scan under .gitleaks.toml must be clean"
if ! gitleaks detect --source "$root" --no-git --redact --exit-code 1 \
      --report-format json --report-path "$tmp/repo.json" \
      --config "$config" >/dev/null 2>&1; then
  echo "FAIL: gitleaks reported findings in the tracked tree" >&2
  exit 1
fi
echo "    OK: no findings"

echo "2/2 negative fixture must still be detected"
mkdir -p "$tmp/neg"
# shellcheck disable=SC1090
. "$fixture"
printf 'API_KEY = "%s%s"\n' "$NEG_LEFT" "$NEG_RIGHT" > "$tmp/neg/negative.env"
if gitleaks detect --source "$tmp/neg" --no-git --redact --exit-code 1 \
      --report-format json --report-path "$tmp/negative.json" \
      --config "$config" >/dev/null 2>&1; then
  echo "FAIL: negative fixture was not detected; the allowlist is too broad" >&2
  exit 1
fi
echo "    OK: synthetic key detected"

echo "PASS: gitleaks config verification"
