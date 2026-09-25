#!/bin/sh

# Pre-commit secret scanner — mirrors the CI `secrets-scan` job in
# .github/workflows/test.yml. Keep both pattern lists in sync.
#
# Full-history scan option (run manually, e.g. before a public push):
#   git log --all -p | grep -E "$PATTERNS" | grep -v 'secrets\.' | grep -v 'PATTERNS=' || true
#   git log --all --format='%H' --name-only | xargs grep -lE "$PATTERNS" 2>/dev/null || true
# Note: patterns intentionally include common provider tokens:
#   ghp_ (GitHub PAT), gho_ (GitHub OAuth), github_pat_ (fine-grained PAT),
#   sk_live_/sk_test_ (Stripe), AKIA (AWS access key).

PATTERNS="AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|ghp_[0-9a-zA-Z]{36}|gho_[0-9a-zA-Z]{36}|ghu_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{22,}|sk_(live|test)_[0-9a-zA-Z]{16,}|xox[baprs]-[0-9a-zA-Z-]{10,}|-----BEGIN[ A-Za-z]*PRIVATE KEY-----|eyJhbGciOi[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]{20,}\.[A-Za-z0-9._-]{20,}"

STAGED=$(git diff --cached --diff-filter=ACMR --name-only 2>/dev/null | grep -vE '\.md$|scan-secrets\.|__tests__|jest\.setup|\.test\.' || true)

if [ -z "$STAGED" ]; then
  exit 0
fi

MATCHES=$(echo "$STAGED" | xargs git diff --cached -U0 -- 2>/dev/null | grep -E "^\+" | grep -v "PATTERNS=" | grep -v 'secrets\.' | grep -vE "^\+\s*#" | grep -cE "$PATTERNS" 2>/dev/null)

if [ "$MATCHES" -gt 0 ]; then
  echo ""
  echo "  HIGH-ENTROPY / SECRET PATTERN DETECTED IN STAGED FILES"
  echo ""
  echo "$STAGED" | xargs git diff --cached -U0 -- 2>/dev/null | grep -nE "^\+.*($PATTERNS)" | grep -v "PATTERNS=" | grep -v 'secrets\.' | while IFS= read -r line; do
    echo "    $line"
  done
  echo ""
  echo "  Commit blocked. Remove or replace secret values before committing."
  exit 1
fi

exit 0
