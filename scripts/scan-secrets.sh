#!/bin/sh

PATTERNS="SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ANON_KEY|JWT_SECRET|STRIPE_SECRET_KEY|AKIA[0-9A-Z]{16}|ghp_[0-9a-zA-Z]{36}|-----BEGIN[ A-Za-z]*PRIVATE KEY-----"

STAGED=$(git diff --cached --diff-filter=ACMR --name-only 2>/dev/null)

if [ -z "$STAGED" ]; then
  exit 0
fi

MATCHES=$(echo "$STAGED" | xargs git diff --cached -U0 -- 2>/dev/null | grep -E "^\+" | grep -v "PATTERNS=" | grep -cE "$PATTERNS" 2>/dev/null)

if [ "$MATCHES" -gt 0 ]; then
  echo ""
  echo "  HIGH-ENTROPY / SECRET PATTERN DETECTED IN STAGED FILES"
  echo ""
  echo "$STAGED" | xargs git diff --cached -U0 -- 2>/dev/null | grep -nE "^\+.*($PATTERNS)" | grep -v "PATTERNS=" | while IFS= read -r line; do
    echo "    $line"
  done
  echo ""
  echo "  Commit blocked. Remove or replace secret values before committing."
  exit 1
fi

exit 0