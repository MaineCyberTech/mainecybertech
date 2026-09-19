#!/usr/bin/env bash
set -euo pipefail

# Database restore script
# Restores the latest (or specified) backup from S3 to a target database.
#
# Usage:
#   ./scripts/restore-database.sh                  # Restore latest backup to SUPABASE_DB_URL
#   ./scripts/restore-database.sh --backup-file s3://bucket/path/to/dump.sql.gz  # Restore specific file
#   ./scripts/restore-database.sh --dry-run        # List available backups without restoring
#
# Required env vars:
#   SUPABASE_DB_URL       - Target database connection string
#   AWS_ACCESS_KEY_ID     - AWS/S3 access key
#   AWS_SECRET_ACCESS_KEY - AWS/S3 secret key
#
# Optional:
#   S3_BACKUP_BUCKET      - S3 bucket (default: s3://mainecybertech-backups/database-backups)

S3_BUCKET="${S3_BACKUP_BUCKET:-s3://mainecybertech-backups/database-backups}"
DRY_RUN=false
BACKUP_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backup-file) BACKUP_FILE="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "ERROR: SUPABASE_DB_URL is required"
  exit 1
fi

if [ -z "${AWS_ACCESS_KEY_ID:-}" ] || [ -z "${AWS_SECRET_ACCESS_KEY:-}" ]; then
  echo "ERROR: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required"
  exit 1
fi

echo "=== Database Restore ==="

if [ -n "$BACKUP_FILE" ]; then
  echo "Using specified backup: $BACKUP_FILE"
  aws s3 cp "$BACKUP_FILE" /tmp/restore.sql.gz
else
  echo "Finding latest backup in $S3_BUCKET..."
  LATEST=$(aws s3 ls "$S3_BUCKET/" --recursive | sort | tail -1 | awk '{print $4}')
  if [ -z "$LATEST" ]; then
    echo "ERROR: No backups found in $S3_BUCKET"
    exit 1
  fi
  echo "Latest backup: $LATEST"
  BACKUP_FILE="$S3_BUCKET/$LATEST"
  aws s3 cp "$BACKUP_FILE" /tmp/restore.sql.gz
fi

if [ "$DRY_RUN" = true ]; then
  echo "DRY RUN: Would restore /tmp/restore.sql.gz to target database"
  echo "Backup size: $(du -h /tmp/restore.sql.gz | cut -f1)"
  rm -f /tmp/restore.sql.gz
  exit 0
fi

echo "Restoring database..."
echo "WARNING: This will overwrite the target database!"
echo "Target: $(echo "$SUPABASE_DB_URL" | sed 's|://[^:]*:[^@]*@|://***:***@|')"

gunzip -c /tmp/restore.sql.gz | psql "$SUPABASE_DB_URL"
RESULT=$?

rm -f /tmp/restore.sql.gz

if [ $RESULT -eq 0 ]; then
  echo "Restore completed successfully"
else
  echo "Restore failed with exit code $RESULT"
  exit $RESULT
fi