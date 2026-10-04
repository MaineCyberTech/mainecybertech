#!/usr/bin/env bash
# Maine CyberTech Supabase Storage restore script (audit DR-P1-001)
#
# Restores user-uploaded objects from a Storage backup archive in S3/Spaces
# back into Supabase Storage. Counterpart to scripts/backup-storage.sh.
#
# Destination contract matches the database paths:
#   S3_BUCKET  - bucket NAME only (no scheme), default "mainecybertech-backups"
#   S3_PREFIX  - key prefix only, default "storage-backups"
#
# Usage:
#   SUPABASE_URL=https://xxx.supabase.co \
#   SUPABASE_SERVICE_ROLE_KEY=... \
#   ./scripts/restore-storage.sh                 # newest archive, upload all
#   ./scripts/restore-storage.sh --archive-file s3://b/p/a.tar.gz.enc
#   ./scripts/restore-storage.sh --dry-run       # show what would upload
#
# Optional:
#   BACKUP_ENCRYPTION_KEY - needed when the archive is `.enc`
#   STORAGE_BUCKETS       - limits the restore to these buckets when set
#   RESTORE_UPSERT        - default "1"; set "0" to skip objects already present
set -euo pipefail

S3_BUCKET="${S3_BUCKET:-mainecybertech-backups}"
S3_PREFIX="${S3_PREFIX:-storage-backups}"
S3_URI="s3://${S3_BUCKET}/${S3_PREFIX}"
STAGE_DIR="${STAGE_DIR:-./storage-restore}"
DRY_RUN=false
ARCHIVE_FILE=""
RESTORE_UPSERT="${RESTORE_UPSERT:-1}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --archive-file) ARCHIVE_FILE="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

: "${SUPABASE_URL:?SUPABASE_URL is required}"
: "${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY is required}"

upload_object() {
  # upload_object <bucket> <path> <local-file>
  local bucket="$1" path="$2" file="$3"
  local upsert="false"
  [ "${RESTORE_UPSERT}" = "1" ] && upsert="true"
  curl -sS --fail-with-body -X POST \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "x-upsert: ${upsert}" \
    --data-binary "@${file}" \
    "${SUPABASE_URL}/storage/v1/object/${bucket}/${path}"
}

echo "=== Supabase Storage Restore ==="

if [ -n "${ARCHIVE_FILE}" ]; then
  echo "Using specified archive: ${ARCHIVE_FILE}"
  aws s3 cp "${ARCHIVE_FILE}" /tmp/storage-restore.download
  DOWNLOAD_NAME="${ARCHIVE_FILE}"
else
  echo "Finding latest storage backup in ${S3_URI}..."
  LATEST=$(aws s3 ls "${S3_URI}/" --recursive | sort | tail -1 | awk '{print $4}')
  if [ -z "${LATEST}" ]; then
    echo "ERROR: No storage backups found in ${S3_URI}"
    exit 1
  fi
  echo "Latest archive: ${LATEST}"
  DOWNLOAD_NAME="${LATEST}"
  # `aws s3 ls --recursive` returns the FULL key (including the prefix); strip
  # it if present and rebuild the URI once (audit DR-P1-002).
  REL="${LATEST#"${S3_PREFIX}/"}"
  aws s3 cp "s3://${S3_BUCKET}/${S3_PREFIX}/${REL}" /tmp/storage-restore.download
fi

rm -rf "${STAGE_DIR}"
mkdir -p "${STAGE_DIR}"

if [[ "${DOWNLOAD_NAME}" == *.enc ]]; then
  if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
    echo "ERROR: archive is encrypted (.enc) but BACKUP_ENCRYPTION_KEY is not set" >&2
    exit 1
  fi
  echo "Decrypting archive..."
  openssl enc -d -aes-256-cbc -pbkdf2 \
    -in /tmp/storage-restore.download -out /tmp/storage-restore.tar.gz \
    -pass env:BACKUP_ENCRYPTION_KEY
  rm -f /tmp/storage-restore.download
else
  mv /tmp/storage-restore.download /tmp/storage-restore.tar.gz
fi

tar -C "${STAGE_DIR}" -xzf /tmp/storage-restore.tar.gz
rm -f /tmp/storage-restore.tar.gz

if [ -f "${STAGE_DIR}/MANIFEST.txt" ]; then
  echo "Manifest:"; sed 's/^/  /' "${STAGE_DIR}/MANIFEST.txt"
fi

restored=0
for bucket_dir in "${STAGE_DIR}"/*/; do
  bucket="$(basename "${bucket_dir}")"
  [ -d "${bucket_dir}" ] || continue
  if [ -n "${STORAGE_BUCKETS:-}" ] && ! printf '%s\n' ${STORAGE_BUCKETS} | grep -qx "${bucket}"; then
    echo "Skipping bucket ${bucket} (not in STORAGE_BUCKETS)"
    continue
  fi
  while IFS= read -r file; do
    rel="${file#"${bucket_dir}"}"
    rel="${rel//\\//}"
    if [ "${DRY_RUN}" = true ]; then
      echo "DRY RUN: would upload ${bucket}/${rel}"
    else
      upload_object "${bucket}" "${rel}" "${file}"
      echo "Restored ${bucket}/${rel}"
    fi
    restored=$((restored + 1))
  done < <(find "${bucket_dir}" -type f \
    ! -name MANIFEST.txt)
done

rm -rf "${STAGE_DIR}"

if [ "${DRY_RUN}" = true ]; then
  echo "=== DRY RUN complete: ${restored} object(s) would be restored ==="
else
  echo "=== Storage Restore complete: ${restored} object(s) ==="
fi
