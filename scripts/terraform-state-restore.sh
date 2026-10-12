#!/usr/bin/env bash
# Terraform state restore (emergency) — DR-P3-005 / IR-P3-001.
#
# Restores a previous version of a Terraform state object from the versioned
# DO Spaces (S3-compatible) backend:
#
#   ./scripts/terraform-state-restore.sh --env dev --list
#   ./scripts/terraform-state-restore.sh --env dev --scratch <VERSION_ID>
#   ./scripts/terraform-state-restore.sh --env prod --restore <VERSION_ID> --yes
#
# --scratch copies the chosen version to a scratch key next to the live object
# so it can be downloaded and inspected without touching production state.
# --restore overwrites the live state object and requires --yes.
#
# The bucket/key mapping is the one in
# infra/terraform/digitalocean/env/backend.<env>.hcl and
# docs/ROLLBACK_PROCEDURES.md §4. This script never runs terraform; the
# plan-only verification step is printed at the end and must pass before any
# apply.
#
# Credentials: AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY (DO Spaces keys) and
# optional AWS_ENDPOINT_URL (default https://nyc3.digitaloceanspaces.com).
# Exercised by scripts/ci/test-terraform-state-restore.sh against a stubbed
# aws CLI; the live Spaces drill is recorded in
# docs/PLATFORM_FAILURE_RUNBOOKS.md §6.
set -euo pipefail

ENDPOINT="${AWS_ENDPOINT_URL:-https://nyc3.digitaloceanspaces.com}"
ENV_NAME=""
MODE=""
VERSION_ID=""
CONFIRMED=0

usage() {
  cat <<'EOF'
Usage: terraform-state-restore.sh --env <dev|prod> <mode> [options]

Modes:
  --list                    List previous state versions (VersionId, date, latest)
  --scratch <VERSION_ID>    Copy the version to a scratch key (non-destructive)
  --restore <VERSION_ID>    Overwrite the live state object (requires --yes)

Options:
  --yes                     Confirm a destructive --restore
EOF
}

die() {
  echo "ERROR: $*" >&2
  exit 2
}

while [ $# -gt 0 ]; do
  case "$1" in
    --env)
      [ $# -ge 2 ] || die "--env needs a value"
      ENV_NAME="$2"
      shift 2
      ;;
    --list)
      MODE="list"
      shift
      ;;
    --scratch)
      [ $# -ge 2 ] || die "--scratch needs a VERSION_ID"
      MODE="scratch"
      VERSION_ID="$2"
      shift 2
      ;;
    --restore)
      [ $# -ge 2 ] || die "--restore needs a VERSION_ID"
      MODE="restore"
      VERSION_ID="$2"
      shift 2
      ;;
    --yes)
      CONFIRMED=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "unknown argument: $1 (see --help)"
      ;;
  esac
done

[ -n "$ENV_NAME" ] || die "--env <dev|prod> is required"
[ -n "$MODE" ] || die "one of --list / --scratch / --restore is required"
[ -n "${AWS_ACCESS_KEY_ID:-}" ] || die "AWS_ACCESS_KEY_ID must be set (DO Spaces access key)"
[ -n "${AWS_SECRET_ACCESS_KEY:-}" ] || die "AWS_SECRET_ACCESS_KEY must be set (DO Spaces secret key)"

case "$ENV_NAME" in
  dev)
    BUCKET="portal-terraform-state-development"
    KEY="digitalocean/dev/terraform.tfstate"
    ;;
  prod)
    BUCKET="portal-terraform-state-production"
    KEY="digitalocean/prod/terraform.tfstate"
    ;;
  *)
    die "--env must be dev or prod (got '$ENV_NAME')"
    ;;
esac

s3api() {
  aws s3api "$@" --endpoint-url "$ENDPOINT"
}

case "$MODE" in
  list)
    echo "State versions for s3://${BUCKET}/${KEY}:"
    s3api list-object-versions --bucket "$BUCKET" --prefix "$KEY" \
      --query 'Versions[].[VersionId,LastModified,IsLatest]' --output table
    ;;
  scratch)
    DEST_KEY="${KEY}.restore-check-$(date -u +%Y%m%dT%H%M%SZ)"
    s3api copy-object --bucket "$BUCKET" --key "$DEST_KEY" \
      --copy-source "${BUCKET}/${KEY}?versionId=${VERSION_ID}" >/dev/null
    echo "Copied version ${VERSION_ID} -> s3://${BUCKET}/${DEST_KEY}"
    echo "Inspect the scratch copy with:"
    echo "  aws s3api get-object --bucket ${BUCKET} --key ${DEST_KEY} --endpoint-url ${ENDPOINT} /tmp/terraform.tfstate.inspect"
    echo "Delete the scratch copy when done (aws s3api delete-object --bucket ${BUCKET} --key ${DEST_KEY} --endpoint-url ${ENDPOINT})."
    ;;
  restore)
    if [ "$CONFIRMED" != "1" ]; then
      echo "Refusing to overwrite s3://${BUCKET}/${KEY} without --yes." >&2
      echo "Run --scratch first to inspect the version, then re-run: --restore ${VERSION_ID} --yes" >&2
      exit 2
    fi
    s3api copy-object --bucket "$BUCKET" --key "$KEY" \
      --copy-source "${BUCKET}/${KEY}?versionId=${VERSION_ID}" >/dev/null
    echo "Restored version ${VERSION_ID} over s3://${BUCKET}/${KEY}"
    ;;
esac

if [ "$MODE" != "list" ]; then
  cat <<EOF

Next step (docs/ROLLBACK_PROCEDURES.md §4): verify with a plan-only run before
any apply:
  cd infra/terraform/digitalocean
  terraform init -reconfigure -backend-config=env/backend.${ENV_NAME}.hcl
  terraform plan -var-file=<your-tfvars>
EOF
fi
