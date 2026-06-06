#!/usr/bin/env bash
# Maine CyberTech Database Backup Script
# Usage: SUPABASE_DB_URL=postgresql://... ./scripts/backup-database.sh
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_BUCKET="${S3_BUCKET:-mainecybertech-backups}"
S3_PREFIX="${S3_PREFIX:-database-backups}"
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

FILE_SIZE=$(du -h "${LOCAL_PATH}" | cut -f1)
echo "Backup created: ${LOCAL_PATH} (${FILE_SIZE})"

echo ""
echo "Step 2: Uploading to S3..."
aws s3 cp "${LOCAL_PATH}" "s3://${S3_BUCKET}/${S3_PREFIX}/${FILENAME}" --storage-class STANDARD_IA

echo ""
echo "Step 3: Cleaning up local backup..."
rm -f "${LOCAL_PATH}"

echo ""
echo "Step 4: Removing backups older than ${RETENTION_DAYS} days..."
cutoff=$(date -d "-${RETENTION_DAYS} days" +%Y-%m-%d)
aws s3api list-objects-v2 \
  --bucket "${S3_BUCKET}" \
  --prefix "${S3_PREFIX}/" \
  --query "Contents[?LastModified<=\`${cutoff}T00:00:00Z\`].Key" \
  --output json | jq -r '.[]' | while read -r key; do
    aws s3api delete-object --bucket "${S3_BUCKET}" --key "${key}"
    echo "Deleted: ${key}"
  done

echo ""
echo "=== Backup Complete ==="
