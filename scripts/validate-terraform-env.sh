#!/usr/bin/env bash
set -euo pipefail

# Validates that Terraform variable files don't contain placeholder values
# This prevents accidental deployments with fake credentials

TFVARS_DIR="${1:-infra/terraform/digitalocean/env}"
# INFRA-P3-007: tfvars are also generated/referenced at the module root (the
# terraform-do workflow writes $TF_ENV.tfvars there and ROLLBACK_PROCEDURES.md
# §4 uses -var-file=dev.tfvars). Scan both locations so a placeholder at the
# root cannot slip past the guard.
MODULE_ROOT="${2:-infra/terraform/digitalocean}"

PLACEHOLDERS=(
  "replace_with_real"
  "your-do-api-token"
  "your-cloudflare-api-token"
  "your-ssh-fingerprint"
  "REPLACE_WITH"
)

ERRORS=0

scan_dir() {
  local dir="$1"
  for f in "$dir"/*.tfvars; do
    [ -f "$f" ] || continue

    for PH in "${PLACEHOLDERS[@]}"; do
      if grep -qi "$PH" "$f" 2>/dev/null; then
        echo "ERROR: $f contains placeholder '$PH'"
        ERRORS=$((ERRORS + 1))
      fi
    done
  done
}

scan_dir "$TFVARS_DIR"
[ "$MODULE_ROOT" = "$TFVARS_DIR" ] || scan_dir "$MODULE_ROOT"

if [ $ERRORS -gt 0 ]; then
  echo "FAILED: $ERRORS placeholder value(s) found in Terraform variable files"
  echo "Replace placeholder values with real credentials before deploying."
  exit 1
fi

echo "OK: No placeholder values found in Terraform variable files"