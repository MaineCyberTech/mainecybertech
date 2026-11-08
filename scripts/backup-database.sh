#!/usr/bin/env bash
# Maine CyberTech Database Backup Script
# Usage: SUPABASE_DB_URL=postgresql://... ./scripts/backup-database.sh
#
# Destination contract (audit DR-P1-002 / IR-P1-005) — keep in sync with
# scripts/restore-database.sh, .github/workflows/db-backup.yml and
# .github/workflows/db-restore-test.yml:
#   S3_BUCKET  - bucket NAME only (no scheme), default "mainecybertech-backups"
#   S3_PREFIX  - key prefix only (no leading slash), default "database-backups"
#   Objects are written to: s3://${S3_BUCKET}/${S3_PREFIX}/<file>
# The restore paths read the SAME two variables (a legacy `S3_BACKUP_BUCKET`
# full-URI secret is accepted for backwards compatibility only).
#
# Storage class (DR-P0-001 investigation): DigitalOcean Spaces only accepts
# STANDARD and rejects other classes, so the default is STANDARD. Real AWS S3
# targets can override with S3_STORAGE_CLASS=STANDARD_IA.
#
# Offsite endpoint (optional): S3_OFFSITE_ENDPOINT lets the offsite copy live
# on a different S3-compatible service (Raven Garage, another region, etc.).
# S3_OFFSITE_ACCESS_KEY_ID / S3_OFFSITE_SECRET_ACCESS_KEY override the
# credentials for that endpoint; when omitted, the primary AWS_* credentials
# are reused. Without S3_OFFSITE_ENDPOINT the original single-endpoint behavior
# is unchanged.
#
# Encryption (audit DR-P1-003): when BACKUP_ENCRYPTION_KEY is set the gzipped
# dump is encrypted with openssl AES-256-CBC before upload. The key is supplied
# only via a secret/env var and is NEVER printed or committed. Set
# REQUIRE_BACKUP_ENCRYPTION=1 to make an unencrypted backup a hard failure
# (CI does this).
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_BUCKET="${S3_BUCKET:-mainecybertech-backups}"
S3_PREFIX="${S3_PREFIX:-database-backups}"
S3_STORAGE_CLASS="${S3_STORAGE_CLASS:-STANDARD}"
# Optional second destination for an offsite/cross-provider copy. Bucket name
# only; when set, the same (already encrypted) object is copied there too.
S3_OFFSITE_BUCKET="${S3_OFFSITE_BUCKET:-}"
S3_OFFSITE_PREFIX="${S3_OFFSITE_PREFIX:-${S3_PREFIX}}"
# Optional second endpoint/credentials for the offsite copy. This is what lets
# the offsite destination live on a different S3-compatible service (for
# example Raven Garage) instead of the primary Spaces endpoint. Credentials are
# optional; when omitted the primary AWS_* credentials are reused.
S3_OFFSITE_ENDPOINT="${S3_OFFSITE_ENDPOINT:-}"
S3_OFFSITE_ACCESS_KEY_ID="${S3_OFFSITE_ACCESS_KEY_ID:-}"
S3_OFFSITE_SECRET_ACCESS_KEY="${S3_OFFSITE_SECRET_ACCESS_KEY:-}"

# When the offsite destination is the same bucket/endpoint as the primary
# (Garage promoted to primary), skip the duplicate copy and prune.
primary_endpoint="${AWS_ENDPOINT_URL:-}"
if [ -n "${S3_OFFSITE_BUCKET}" ] && [ "${S3_OFFSITE_BUCKET}" = "${S3_BUCKET}" ] \
   && [ "${S3_OFFSITE_ENDPOINT%/}" = "${primary_endpoint%/}" ]; then
  echo "Offsite destination matches the primary (${S3_BUCKET}); skipping duplicate copy"
  S3_OFFSITE_BUCKET=""
fi
TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)
FILENAME="supabase-dump-${TIMESTAMP}.sql.gz"
LOCAL_PATH="${BACKUP_DIR}/${FILENAME}"

echo "=== Maine CyberTech Database Backup ==="
echo "Timestamp: ${TIMESTAMP}"
echo ""

mkdir -p "${BACKUP_DIR}"

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "ERROR: SUPABASE_DB_URL is not set"
  exit 1
fi

echo "Step 1: Dumping database..."
if command -v pg_dump &>/dev/null; then
  pg_dump "${SUPABASE_DB_URL}" --no-owner | gzip > "${LOCAL_PATH}"
else
  # DR-P3-003: digest-pinned fallback client, same major as the restore test
  # (postgres:17-alpine). A floating tag made a dump/restore pass depend on
  # whichever image happened to be pulled.
  docker run --rm -v "${BACKUP_DIR}:/backups" \
    postgres:17-alpine@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac \
    sh -c "pg_dump '${SUPABASE_DB_URL}' --no-owner | gzip > /backups/${FILENAME}"
fi

if [ ! -f "${LOCAL_PATH}" ]; then
  echo "ERROR: Database dump failed"
  exit 1
fi

# A zero-byte dump "succeeds" but is not a backup. Fail loudly (audit DR-P1-006).
if [ ! -s "${LOCAL_PATH}" ]; then
  echo "ERROR: Database dump is empty (0 bytes) — refusing to record a backup"
  exit 1
fi

FILE_SIZE=$(du -h "${LOCAL_PATH}" | cut -f1)
echo "Backup created: ${LOCAL_PATH} (${FILE_SIZE})"

if [ -n "${VERIFY_BACKUP:-}" ]; then
  echo "Step 1b: Verifying dump is a restorable archive..."
  gunzip -t "${LOCAL_PATH}"
  # grep -q closes the pipe on the first match; with pipefail the upstream
  # gunzip/head can then look like a failure even though the header is present.
  if ! (set +o pipefail; gunzip -c "${LOCAL_PATH}" | head -c 4096 | grep -q "PostgreSQL database dump"); then
    echo "ERROR: dump does not look like a PostgreSQL dump"
    exit 1
  fi
  echo "Dump integrity check passed"
fi

# --- Optional client-side encryption (audit DR-P1-003) --------------------
# Encrypts the gzipped dump at rest in the bucket. The passphrase comes from
# BACKUP_ENCRYPTION_KEY (a GitHub secret). `.enc` is appended so restore paths
# can detect and decrypt it. NEVER echo the key.
UPLOAD_PATH="${LOCAL_PATH}"
if [ -n "${BACKUP_ENCRYPTION_KEY:-}" ]; then
  echo ""
  echo "Step 1c: Encrypting dump (openssl AES-256-CBC, PBKDF2)..."
  ENCRYPTED_PATH="${LOCAL_PATH}.enc"
  # -pbkdf2 makes the key derivation brute-force resistant; the salt is random
  # per file and is written into the object header by openssl.
  BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY}" openssl enc -aes-256-cbc -salt -pbkdf2 \
    -in "${LOCAL_PATH}" -out "${ENCRYPTED_PATH}" -pass env:BACKUP_ENCRYPTION_KEY
  rm -f "${LOCAL_PATH}"
  UPLOAD_PATH="${ENCRYPTED_PATH}"
  echo "Encryption complete: $(basename "${UPLOAD_PATH}")"
elif [ -n "${REQUIRE_BACKUP_ENCRYPTION:-}" ]; then
  echo "ERROR: REQUIRE_BACKUP_ENCRYPTION is set but BACKUP_ENCRYPTION_KEY is empty — refusing to upload an unencrypted dump" >&2
  exit 1
else
  echo "WARNING: BACKUP_ENCRYPTION_KEY is not set — uploading an UNENCRYPTED dump (audit DR-P1-003)" >&2
fi

UPLOAD_NAME="$(basename "${UPLOAD_PATH}")"

# Run an aws CLI command against an optional endpoint/credential pair. Empty
# endpoint/credentials preserve the original single-endpoint behavior.
aws_s3() {
  local endpoint="$1" access_key="$2" secret_key="$3"; shift 3
  local -a args=()
  [ -n "${endpoint}" ] && args+=(--endpoint-url "${endpoint}")
  if [ -n "${access_key}" ] || [ -n "${secret_key}" ]; then
    env AWS_ACCESS_KEY_ID="${access_key:-${AWS_ACCESS_KEY_ID:-}}" \
        AWS_SECRET_ACCESS_KEY="${secret_key:-${AWS_SECRET_ACCESS_KEY:-}}" \
        aws "${args[@]}" "$@"
  else
    aws "${args[@]}" "$@"
  fi
}

echo ""
echo "Step 2: Uploading to S3..."
aws_s3 "" "" "" s3 cp "${UPLOAD_PATH}" "s3://${S3_BUCKET}/${S3_PREFIX}/${UPLOAD_NAME}" --storage-class "${S3_STORAGE_CLASS}"

# --- Optional offsite/second-region copy (audit DR-P1-003) ----------------
if [ -n "${S3_OFFSITE_BUCKET}" ]; then
  echo ""
  echo "Step 2b: Copying to offsite bucket ${S3_OFFSITE_BUCKET}${S3_OFFSITE_ENDPOINT:+ via ${S3_OFFSITE_ENDPOINT}}..."
  aws_s3 "${S3_OFFSITE_ENDPOINT}" "${S3_OFFSITE_ACCESS_KEY_ID}" "${S3_OFFSITE_SECRET_ACCESS_KEY}" \
    s3 cp "${UPLOAD_PATH}" "s3://${S3_OFFSITE_BUCKET}/${S3_OFFSITE_PREFIX}/${UPLOAD_NAME}" --storage-class "${S3_STORAGE_CLASS}"
  echo "Offsite copy complete"
fi

echo ""
echo "Step 3: Cleaning up local backup..."
rm -f "${UPLOAD_PATH}"

echo ""
echo "Step 4: Removing backups older than ${RETENTION_DAYS} days..."
cutoff=$(date -d "-${RETENTION_DAYS} days" +%Y-%m-%d)
prune_bucket() {
  local bucket="$1" prefix="$2" endpoint="${3:-}" access_key="${4:-}" secret_key="${5:-}"
  aws_s3 "${endpoint}" "${access_key}" "${secret_key}" s3api list-objects-v2 \
    --bucket "${bucket}" \
    --prefix "${prefix}/" \
    --query "Contents[?LastModified<=\`${cutoff}T00:00:00Z\`].Key" \
    --output json | jq -r '.[]? // empty' | while read -r key; do
      [ -n "${key}" ] || continue
      aws_s3 "${endpoint}" "${access_key}" "${secret_key}" s3api delete-object --bucket "${bucket}" --key "${key}"
      echo "Deleted: ${key}"
    done
}
prune_bucket "${S3_BUCKET}" "${S3_PREFIX}"
if [ -n "${S3_OFFSITE_BUCKET}" ]; then
  prune_bucket "${S3_OFFSITE_BUCKET}" "${S3_OFFSITE_PREFIX}" \
    "${S3_OFFSITE_ENDPOINT}" "${S3_OFFSITE_ACCESS_KEY_ID}" "${S3_OFFSITE_SECRET_ACCESS_KEY}"
fi

echo ""
echo "=== Backup Complete ==="
