#!/usr/bin/env bash
# FILE-P3-004: bounded exercise of the Supabase Storage restore path.
#
# The weekly storage-restore-test workflow only fires from the default branch
# and needs live Spaces secrets, so the restore path could sit unexercised for
# a long time. This script fabricates synthetic storage archives (a valid one,
# three corrupt shapes, and an encrypted copy) and drives
# `scripts/restore-storage.sh --verify-only` against them, asserting that:
#   * a complete archive passes verification;
#   * a missing manifest, a count mismatch and an empty archive are refused;
#   * an encrypted archive verifies with the key and fails without it.
#
# No Supabase credentials, no AWS CLI and no network access are used — this is
# a local exercise of the same assertions the weekly workflow runs.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RESTORE="${REPO_ROOT}/scripts/restore-storage.sh"
WORK="$(mktemp -d)"
trap 'rm -rf "${WORK}"; rm -f /tmp/storage-restore.download /tmp/storage-restore.tar.gz' EXIT

passed=0
failed=0

# build_archive <name> <object_count> <files...> [--no-manifest]
# Creates a tar.gz with a MANIFEST.txt recording <object_count> and one staged
# file per remaining argument (relative path under the archive root). Pass
# --no-manifest to produce an archive without the manifest.
build_archive() {
  local name="$1" object_count="$2"
  shift 2
  local with_manifest=true
  if [ "${1:-}" = "--no-manifest" ]; then
    with_manifest=false
    shift
  fi
  local stage="${WORK}/stage-${name}"
  mkdir -p "${stage}/documents"
  if [ "${with_manifest}" = true ]; then
    printf 'Supabase Storage backup\ntimestamp: 2026-10-12-000000\nobject_count: %s\n' \
      "${object_count}" > "${stage}/MANIFEST.txt"
  fi
  local file
  for file in "$@"; do
    mkdir -p "$(dirname "${stage}/documents/${file}")"
    printf 'synthetic object: %s\n' "${file}" > "${stage}/documents/${file}"
  done
  tar -C "${stage}" -czf "${WORK}/${name}.tar.gz" .
}

expect_pass() {
  local label="$1" archive="$2"
  shift 2
  local stage="${WORK}/verify-${label//[^a-zA-Z0-9]/_}"
  if env STAGE_DIR="${stage}" "$@" bash "${RESTORE}" --verify-only \
    --archive-file "${archive}" > "${WORK}/${label}.log" 2>&1; then
    echo "PASS (expected): ${label}"
    passed=$((passed + 1))
  else
    echo "FAIL (unexpected rejection): ${label}"
    sed 's/^/  /' "${WORK}/${label}.log"
    failed=$((failed + 1))
  fi
}

expect_fail() {
  local label="$1" archive="$2"
  shift 2
  local stage="${WORK}/verify-${label//[^a-zA-Z0-9]/_}"
  if env STAGE_DIR="${stage}" "$@" bash "${RESTORE}" --verify-only \
    --archive-file "${archive}" > "${WORK}/${label}.log" 2>&1; then
    echo "FAIL (unexpected acceptance): ${label}"
    sed 's/^/  /' "${WORK}/${label}.log"
    failed=$((failed + 1))
  else
    echo "PASS (refused as expected): ${label}"
    passed=$((passed + 1))
  fi
}

echo "=== Storage restore exercise (FILE-P3-004) ==="

build_archive valid 2 "invoice.pdf" "subdir/photo.png"
expect_pass valid "${WORK}/valid.tar.gz"

# Missing MANIFEST.txt: the archive cannot prove what it contains.
build_archive no-manifest 1 --no-manifest "invoice.pdf"
expect_fail no-manifest "${WORK}/no-manifest.tar.gz"

# Manifest says 2 objects but only 1 is present: partial/corrupt backup.
build_archive count-mismatch 2 "invoice.pdf"
expect_fail count-mismatch "${WORK}/count-mismatch.tar.gz"

# Empty archive: restoring "nothing" must never be reported as a success.
build_archive empty 0
expect_fail empty "${WORK}/empty.tar.gz"

# Encrypted archives must fail closed without the key and verify with it.
build_archive encrypted 1 "invoice.pdf"
openssl enc -aes-256-cbc -salt -pbkdf2 \
  -in "${WORK}/encrypted.tar.gz" -out "${WORK}/encrypted.tar.gz.enc" \
  -pass pass:exercise-passphrase >/dev/null 2>&1
expect_fail encrypted-no-key "${WORK}/encrypted.tar.gz.enc"
expect_pass encrypted-with-key "${WORK}/encrypted.tar.gz.enc" \
  BACKUP_ENCRYPTION_KEY=exercise-passphrase

echo ""
if [ "${failed}" -ne 0 ]; then
  echo "=== Storage restore exercise FAILED (${passed} passed, ${failed} failed) ==="
  exit 1
fi
echo "=== Storage restore exercise passed (${passed} checks) ==="
