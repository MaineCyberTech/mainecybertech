#!/usr/bin/env bash
# Maine CyberTech Supabase Storage backup script (audit DR-P1-001)
#
# Backs up user-uploaded objects from Supabase Storage buckets to an
# S3/Spaces destination, following the same destination contract as the
# database backup (scripts/backup-database.sh):
#   S3_BUCKET  - bucket NAME only (no scheme), default "mainecybertech-backups"
#   S3_PREFIX  - key prefix only, default "storage-backups"
#   Objects:    s3://${S3_BUCKET}/${S3_PREFIX}/<timestamp>/<bucket>/<path>
#
# Storage class (DR-P0-001 investigation): DigitalOcean Spaces only accepts
# STANDARD and rejects other classes, so the default is STANDARD. Real AWS S3
# targets can override with S3_STORAGE_CLASS=STANDARD_IA.
#
# Why REST (not the S3 protocol): this works with the existing service-role
# credential and needs no new Supabase S3 access keys. The service-role key is
# only ever sent in an Authorization header and is NEVER printed.
#
# Usage:
#   SUPABASE_URL=https://xxx.supabase.co \
#   SUPABASE_SERVICE_ROLE_KEY=... \
#   ./scripts/backup-storage.sh
#
# Optional:
#   STORAGE_BUCKETS            - space-separated buckets (default: documents avatars logos)
#   BACKUP_ENCRYPTION_KEY      - openssl passphrase; encrypts the tarball at rest
#   REQUIRE_BACKUP_ENCRYPTION  - "1" to fail if no key is set (CI sets this)
#   VERIFY_BACKUP              - "1" to verify the archive (gzip tar + MANIFEST)
#   S3_OFFSITE_BUCKET          - second destination bucket for an offsite copy
#   S3_OFFSITE_ENDPOINT        - optional endpoint for the offsite copy
#   S3_OFFSITE_ACCESS_KEY_ID / S3_OFFSITE_SECRET_ACCESS_KEY
#                              - optional credentials for that endpoint
#   ALLOW_EMPTY_STORAGE        - "1" permits a manifest-only archive when the
#                              buckets are legitimately empty (dev only; prod
#                              keeps the fail-closed guard)
#   BACKUP_METADATA_FILE       - optional path to copy MANIFEST.txt to before the
#                              staging directory is removed. The workflow
#                              uploads it so the staleness check can ignore
#                              manifest-only archives (DR-P2-010)
set -euo pipefail

S3_BUCKET="${S3_BUCKET:-mainecybertech-backups}"
S3_PREFIX="${S3_PREFIX:-storage-backups}"
S3_STORAGE_CLASS="${S3_STORAGE_CLASS:-STANDARD}"
S3_OFFSITE_BUCKET="${S3_OFFSITE_BUCKET:-}"
S3_OFFSITE_PREFIX="${S3_OFFSITE_PREFIX:-${S3_PREFIX}}"
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
STORAGE_BUCKETS="${STORAGE_BUCKETS:-documents avatars logos}"
BACKUP_DIR="${BACKUP_DIR:-./storage-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)
ARCHIVE_NAME="supabase-storage-${TIMESTAMP}.tar.gz"
STAGE_DIR="${BACKUP_DIR}/${TIMESTAMP}"

: "${SUPABASE_URL:?SUPABASE_URL is required}"
: "${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY is required}"

echo "=== Maine CyberTech Storage Backup ==="
echo "Timestamp: ${TIMESTAMP}"
echo "Buckets: ${STORAGE_BUCKETS}"

mkdir -p "${STAGE_DIR}"
OBJECT_COUNT=0
# Objects the Storage API reported (before download). A backup that downloads
# fewer than it listed is partial and must fail (DR-P2-001).
LISTED_FILES=0

api() {
  # api <method> <path> [curl-args...]
  local method="$1" path="$2"; shift 2
  curl -sS --fail-with-body -X "$method" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    "$@" "${SUPABASE_URL}${path}"
}

# Recursively list object paths in a bucket via the Storage REST list endpoint.
list_paths() {
  local bucket="$1" prefix="$2"
  local offset=0 page_size body json
  # The list endpoint caps a single response at `limit` entries. The previous
  # version sent one request and silently dropped every object after the first
  # 1000 (DR-P2-001). Keep paging until a short page proves the prefix is
  # exhausted.
  while :; do
    body=$(printf '{"prefix":"%s","limit":1000,"offset":%d}' "${prefix}" "${offset}")
    json=$(api POST "/storage/v1/object/list/${bucket}" \
      -H "Content-Type: application/json" -d "${body}")
    page_size=$(printf '%s' "${json}" | jq 'length')
    # Emit "<name>\t<is_folder>" per entry.
    printf '%s' "${json}" | jq -r '.[] | "\(.name)\t\(if .id == null then "folder" else "file" end)"'
    [ "${page_size}" -lt 1000 ] && break
    offset=$((offset + page_size))
  done
}

walk_bucket() {
  local bucket="$1" prefix="$2"
  local name kind full
  while IFS=$'\t' read -r name kind; do
    [ -n "${name}" ] || continue
    full="${prefix:+${prefix}/}${name}"
    if [ "${kind}" = "folder" ]; then
      walk_bucket "${bucket}" "${full}"
    else
      LISTED_FILES=$((LISTED_FILES + 1))
      local dest="${STAGE_DIR}/${bucket}/${full}"
      mkdir -p "$(dirname "${dest}")"
      api GET "/storage/v1/object/${bucket}/${full}" -o "${dest}"
      OBJECT_COUNT=$((OBJECT_COUNT + 1))
    fi
  done < <(list_paths "${bucket}" "${prefix}")
}

for bucket in ${STORAGE_BUCKETS}; do
  echo "Backing up bucket: ${bucket}"
  mkdir -p "${STAGE_DIR}/${bucket}"
  walk_bucket "${bucket}" ""
done

echo "Listed ${LISTED_FILES} object(s); downloaded ${OBJECT_COUNT}"

# DR-P2-001: an empty or truncated mirror must fail, not upload and report
# success. `set -e` already aborts on a failed download, so the two counts
# should always match; assert both invariants anyway.
if [ "${OBJECT_COUNT}" -eq 0 ]; then
  if [ "${ALLOW_EMPTY_STORAGE:-0}" = "1" ]; then
    echo "WARNING: no objects were downloaded; recording a manifest-only archive because ALLOW_EMPTY_STORAGE=1" >&2
    # DR-P2-010: make the empty result visible on the run instead of letting a
    # green check look like a data-bearing backup.
    echo "::warning title=Manifest-only storage backup::No objects were downloaded; this run records object_count: 0 and does not prove any user data was captured."
  else
    echo "ERROR: no objects were downloaded — refusing to record an empty storage backup" >&2
    exit 1
  fi
fi
if [ "${OBJECT_COUNT}" -ne "${LISTED_FILES}" ]; then
  echo "ERROR: downloaded ${OBJECT_COUNT} object(s) but the listing reported ${LISTED_FILES} — refusing to record a partial backup" >&2
  exit 1
fi

# Manifest so a restore can prove what was captured.
cat > "${STAGE_DIR}/MANIFEST.txt" <<EOF
Supabase Storage backup
timestamp: ${TIMESTAMP}
supabase_url: ${SUPABASE_URL}
buckets: ${STORAGE_BUCKETS}
object_count: ${OBJECT_COUNT}
EOF

# DR-P2-010: keep a copy of the manifest outside the staging directory. The
# workflow uploads it as an artifact and backup-staleness-check.yml reads
# object_count from it; a zero-object (manifest-only) archive must not satisfy
# the freshness gate.
if [ -n "${BACKUP_METADATA_FILE:-}" ]; then
  mkdir -p "$(dirname "${BACKUP_METADATA_FILE}")"
  cp "${STAGE_DIR}/MANIFEST.txt" "${BACKUP_METADATA_FILE}"
fi

ARCHIVE_PATH="${BACKUP_DIR}/${ARCHIVE_NAME}"
tar -C "${STAGE_DIR}" -czf "${ARCHIVE_PATH}" .
echo "Archive created: ${ARCHIVE_PATH} ($(du -h "${ARCHIVE_PATH}" | cut -f1))"

# DR-P2-001: same integrity gate as the database backup (VERIFY_BACKUP) — the
# archive must be a readable gzip tar that carries the manifest, so a corrupt
# or manifest-less archive cannot be uploaded and called a backup.
if [ -n "${VERIFY_BACKUP:-}" ]; then
  echo "Verifying archive integrity (tar -tzf)..."
  tar -tzf "${ARCHIVE_PATH}" >/dev/null
  if ! tar -tzf "${ARCHIVE_PATH}" | grep -qE '(^|/)MANIFEST\.txt$'; then
    echo "ERROR: archive does not contain MANIFEST.txt" >&2
    exit 1
  fi
  echo "Archive integrity check passed"
fi

UPLOAD_PATH="${ARCHIVE_PATH}"
if [ -n "${BACKUP_ENCRYPTION_KEY:-}" ]; then
  echo "Encrypting archive (openssl AES-256-CBC, PBKDF2)..."
  BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY}" openssl enc -aes-256-cbc -salt -pbkdf2 \
    -in "${ARCHIVE_PATH}" -out "${ARCHIVE_PATH}.enc" -pass env:BACKUP_ENCRYPTION_KEY
  rm -f "${ARCHIVE_PATH}"
  UPLOAD_PATH="${ARCHIVE_PATH}.enc"
elif [ -n "${REQUIRE_BACKUP_ENCRYPTION:-}" ]; then
  echo "ERROR: REQUIRE_BACKUP_ENCRYPTION is set but BACKUP_ENCRYPTION_KEY is empty" >&2
  exit 1
else
  echo "WARNING: BACKUP_ENCRYPTION_KEY is not set — uploading an UNENCRYPTED archive" >&2
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

echo "Uploading to s3://${S3_BUCKET}/${S3_PREFIX}/${UPLOAD_NAME}"
aws_s3 "" "" "" s3 cp "${UPLOAD_PATH}" "s3://${S3_BUCKET}/${S3_PREFIX}/${UPLOAD_NAME}" --storage-class "${S3_STORAGE_CLASS}"

if [ -n "${S3_OFFSITE_BUCKET}" ]; then
  echo "Copying to offsite bucket ${S3_OFFSITE_BUCKET}${S3_OFFSITE_ENDPOINT:+ via ${S3_OFFSITE_ENDPOINT}}..."
  aws_s3 "${S3_OFFSITE_ENDPOINT}" "${S3_OFFSITE_ACCESS_KEY_ID}" "${S3_OFFSITE_SECRET_ACCESS_KEY}" \
    s3 cp "${UPLOAD_PATH}" "s3://${S3_OFFSITE_BUCKET}/${S3_OFFSITE_PREFIX}/${UPLOAD_NAME}" --storage-class "${S3_STORAGE_CLASS}"
fi

rm -rf "${STAGE_DIR}" "${UPLOAD_PATH}"

echo "Pruning storage backups older than ${RETENTION_DAYS} days..."
cutoff=$(date -d "-${RETENTION_DAYS} days" +%Y-%m-%d)
prune_bucket() {
  local bucket="$1" prefix="$2" endpoint="${3:-}" access_key="${4:-}" secret_key="${5:-}"
  aws_s3 "${endpoint}" "${access_key}" "${secret_key}" s3api list-objects-v2 \
    --bucket "${bucket}" --prefix "${prefix}/" \
    --query "Contents[?LastModified<=\`${cutoff}T00:00:00Z\`].Key" --output json \
    | jq -r '.[]? // empty' | while read -r key; do
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
echo "=== Storage Backup Complete (${OBJECT_COUNT} objects) ==="
