#!/usr/bin/env bash
# Resolve the newest object under an S3/Spaces prefix for the restore tests.
#
# DR-P3-008: the workflows used to run `aws s3 ls ... | sort | tail -1` directly
# under `set -euo pipefail`. A credentials/endpoint failure aborted the step
# with only "Process completed with exit code 254", which looked identical to
# an empty bucket. This helper captures the CLI failure, prints a redacted
# diagnostic naming the location/endpoint and which key variables are present,
# and keeps "no objects" a distinct, actionable error.
#
# Usage: find-latest-backup.sh <database|storage>
#   Env: S3_BUCKET, S3_PREFIX, AWS_ENDPOINT_URL, AWS_ACCESS_KEY_ID,
#        AWS_SECRET_ACCESS_KEY
#   Stdout: backup_file=<key> and backup_uri=s3://... lines (GITHUB_OUTPUT)
#   Stderr: human/annotation diagnostics
set -euo pipefail

label="${1:-backup}"
if [ -z "${S3_BUCKET:-}" ]; then
  echo "::error::S3_BUCKET is not set — cannot locate the ${label} backup bucket" >&2
  exit 1
fi
S3_PREFIX="${S3_PREFIX:-}"
AWS_ENDPOINT_URL="${AWS_ENDPOINT_URL:-<unset>}"

key_state() {
  if [ -n "${1:-}" ]; then
    printf 'present'
  else
    printf 'missing'
  fi
}

access_state="$(key_state "${AWS_ACCESS_KEY_ID:-}")"
secret_state="$(key_state "${AWS_SECRET_ACCESS_KEY:-}")"

# Accept both "bucket" and "s3://bucket[/prefix]" shapes, then always build a
# canonical s3://bucket/prefix/ path so a legacy secret cannot point the test at
# the wrong location.
RAW_BUCKET="${S3_BUCKET#s3://}"
RAW_BUCKET="${RAW_BUCKET%/}"
S3_PATH="s3://${RAW_BUCKET}/${S3_PREFIX}/"
echo "Resolved ${label} location: ${S3_PATH} (endpoint ${AWS_ENDPOINT_URL})" >&2

# Capture stdout+stderr; the command sits in an `if` condition so `set -e`
# does not abort before we can explain the failure. In the `else` branch $? is
# the AWS CLI exit code.
if listing="$(aws s3 ls "${S3_PATH}" --recursive 2>&1)"; then
  :
else
  status=$?
  echo "::error::Could not list the ${label} backup location ${S3_PATH} at endpoint ${AWS_ENDPOINT_URL} (AWS_ACCESS_KEY_ID=${access_state}, AWS_SECRET_ACCESS_KEY=${secret_state}). Check S3_BUCKET/S3_PREFIX/S3_ENDPOINT, the AWS/DO_SPACES credentials and the bucket read permission. AWS CLI exited ${status}: ${listing}" >&2
  exit 1
fi

LATEST="$(printf '%s\n' "${listing}" | sort | tail -1 | awk '{print $4}')"
if [ -z "${LATEST}" ]; then
  echo "::error::No ${label} backup objects found under ${S3_PATH} — the bucket is reachable but the prefix is empty. Check S3_PREFIX/S3_BUCKET or run the matching backup workflow first." >&2
  exit 1
fi

# `aws s3 ls --recursive` returns the FULL key (including the prefix). Strip it
# if present and rebuild the URI once so the object path can never be
# double-prefixed (audit DR-P1-002).
REL="${LATEST#"${S3_PREFIX}/"}"
printf 'backup_file=%s\n' "${LATEST}"
printf 'backup_uri=s3://%s/%s/%s\n' "${RAW_BUCKET}" "${S3_PREFIX}" "${REL}"
