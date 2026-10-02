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
# Optional second destination for an offsite/cross-provider copy. Bucket name
# only; when set, the same (already encrypted) object is copied there too.
S3_OFFSITE_BUCKET="${S3_OFFSITE_BUCKET:-}"
S3_OFFSITE_PREFIX="${S3_OFFSITE_PREFIX:-${S3_PREFIX}}"
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
  docker run --rm -v "${BACKUP_DIR}:/backups" postgres:15 \
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
  if ! gunzip -c "${LOCAL_PATH}" | head -c 4096 | grep -q "PostgreSQL database dump"; then
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

echo ""
echo "Step 2: Uploading to S3..."
aws s3 cp "${UPLOAD_PATH}" "s3://${S3_BUCKET}/${S3_PREFIX}/${UPLOAD_NAME}" --storage-class STANDARD_IA

# --- Optional offsite/second-region copy (audit DR-P1-003) ----------------
if [ -n "${S3_OFFSITE_BUCKET}" ]; then
  echo ""
  echo "Step 2b: Copying to offsite bucket ${S3_OFFSITE_BUCKET}..."
  aws s3 cp "${UPLOAD_PATH}" "s3://${S3_OFFSITE_BUCKET}/${S3_OFFSITE_PREFIX}/${UPLOAD_NAME}" --storage-class STANDARD_IA
  echo "Offsite copy complete"
fi

echo ""
echo "Step 3: Cleaning up local backup..."
rm -f "${UPLOAD_PATH}"

echo ""
echo "Step 4: Removing backups older than ${RETENTION_DAYS} days..."
cutoff=$(date -d "-${RETENTION_DAYS} days" +%Y-%m-%d)
prune_bucket() {
  local bucket="$1" prefix="$2"
  aws s3api list-objects-v2 \
    --bucket "${bucket}" \
    --prefix "${prefix}/" \
    --query "Contents[?LastModified<=\`${cutoff}T00:00:00Z\`].Key" \
    --output json | jq -r '.[]? // empty' | while read -r key; do
      [ -n "${key}" ] || continue
      aws s3api delete-object --bucket "${bucket}" --key "${key}"
      echo "Deleted: ${key}"
    done
}
prune_bucket "${S3_BUCKET}" "${S3_PREFIX}"
if [ -n "${S3_OFFSITE_BUCKET}" ]; then
  prune_bucket "${S3_OFFSITE_BUCKET}" "${S3_OFFSITE_PREFIX}"
fi

echo ""
echo "=== Backup Complete ==="
