#!/usr/bin/env bash
set -euo pipefail

# Validates that Terraform variable files don't contain placeholder values
# This prevents accidental deployments with fake credentials

TFVARS_DIR="${1:-infra/terraform/digitalocean/env}"

PLACEHOLDERS=(
  "replace_with_real"
  "your-do-api-token"
  "your-cloudflare-api-token"
  "your-ssh-fingerprint"
  "REPLACE_WITH"
)

ERRORS=0

for f in "$TFVARS_DIR"/*.tfvars; do
  [ -f "$f" ] || continue
  BASENAME=$(basename "$f")
  
  for PH in "${PLACEHOLDERS[@]}"; do
    if grep -qi "$PH" "$f" 2>/dev/null; then
      echo "ERROR: $BASENAME contains placeholder '$PH'"
      ERRORS=$((ERRORS + 1))
    fi
  done
done

if [ $ERRORS -gt 0 ]; then
  echo "FAILED: $ERRORS placeholder value(s) found in Terraform variable files"
  echo "Replace placeholder values with real credentials before deploying."
  exit 1
fi

echo "OK: No placeholder values found in Terraform variable files"