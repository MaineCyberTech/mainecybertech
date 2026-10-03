#!/usr/bin/env bash
set -euo pipefail

# Database restore script
# Restores the latest (or specified) backup from S3 to a target database.
#
# Destination contract (audit DR-P1-002 / IR-P1-005) — matches
# scripts/backup-database.sh and .github/workflows/db-restore-test.yml:
#   S3_BUCKET  - bucket NAME only (no scheme), default "mainecybertech-backups"
#   S3_PREFIX  - key prefix only, default "database-backups"
#   Full path:  s3://${S3_BUCKET}/${S3_PREFIX}/<file>
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
#   S3_BUCKET             - S3 bucket name (default: mainecybertech-backups)
#   S3_PREFIX             - S3 key prefix (default: database-backups)
#   BACKUP_ENCRYPTION_KEY - openssl passphrase to decrypt `.enc` backups
#   ALLOW_PROD_RESTORE    - set to "yes" to permit restoring into a prod-looking
#                           target; otherwise non-local targets are refused

S3_BUCKET="${S3_BUCKET:-mainecybertech-backups}"
S3_PREFIX="${S3_PREFIX:-database-backups}"
S3_URI="s3://${S3_BUCKET}/${S3_PREFIX}"
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

# Environment guardrail (audit DR-P2-004 / DR-P0-002 "this week"): refuse to
# overwrite a non-local target unless explicitly acknowledged. Loopback hosts
# and a localhost database name are treated as safe.
host_part=$(printf '%s' "$SUPABASE_DB_URL" | sed -E 's|^[^:]+://([^@]*@)?([^:/?]+).*|\2|')
if [[ "$host_part" != "localhost" && "$host_part" != "127.0.0.1" && "$host_part" != "::1" ]]; then
  if [ "${ALLOW_PROD_RESTORE:-}" != "yes" ]; then
    echo "ERROR: target host '$host_part' is not local. Set ALLOW_PROD_RESTORE=yes to confirm you intend to overwrite it." >&2
    exit 1
  fi
fi

echo "=== Database Restore ==="

if [ -n "$BACKUP_FILE" ]; then
  echo "Using specified backup: $BACKUP_FILE"
  aws s3 cp "$BACKUP_FILE" /tmp/restore.download
  DOWNLOAD_NAME="$BACKUP_FILE"
else
  echo "Finding latest backup in $S3_URI..."
  LATEST=$(aws s3 ls "$S3_URI/" --recursive | sort | tail -1 | awk '{print $4}')
  if [ -z "$LATEST" ]; then
    echo "ERROR: No backups found in $S3_URI"
    exit 1
  fi
  echo "Latest backup: $LATEST"
  # `aws s3 ls --recursive` returns the FULL key (including the prefix). Strip
  # the prefix if present and rebuild the URI once, so the location cannot be
  # double-prefixed (audit DR-P1-002).
  REL="${LATEST#"${S3_PREFIX}/"}"
  BACKUP_FILE="s3://${S3_BUCKET}/${S3_PREFIX}/${REL}"
  DOWNLOAD_NAME="$BACKUP_FILE"
  echo "Downloading: $BACKUP_FILE"
  aws s3 cp "$BACKUP_FILE" /tmp/restore.download
fi

# Decrypt if the object is encrypted (audit DR-P1-003).
if [[ "$DOWNLOAD_NAME" == *.enc ]]; then
  if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
    echo "ERROR: backup is encrypted (.enc) but BACKUP_ENCRYPTION_KEY is not set" >&2
    rm -f /tmp/restore.download
    exit 1
  fi
  echo "Decrypting backup..."
  openssl enc -d -aes-256-cbc -pbkdf2 \
    -in /tmp/restore.download -out /tmp/restore.sql.gz -pass env:BACKUP_ENCRYPTION_KEY
  rm -f /tmp/restore.download
else
  mv /tmp/restore.download /tmp/restore.sql.gz
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
  echo "Next: verify recovery per docs/ROLLBACK_PROCEDURES.md §3a (Restore verification checklist)"
else
  echo "Restore failed with exit code $RESULT"
  exit $RESULT
fi
