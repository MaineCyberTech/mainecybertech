#!/bin/sh
# Self-test for scripts/ci/find-latest-backup.sh (DR-P3-008).
#
# Stubs the aws CLI so the restore-test discovery path is exercised without
# Spaces credentials, including the negative fixture the audit asked for: an
# `aws s3 ls` failure (exit 254) must produce a location/credential diagnostic,
# not the generic "exit 254" that previously looked like an empty bucket.
#
# Usage: scripts/ci/test-find-latest-backup.sh
set -eu

root=$(cd -- "$(dirname -- "$0")/../.." >/dev/null 2>&1 && pwd)
script="$root/scripts/ci/find-latest-backup.sh"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

stub="$tmp/aws"
cat > "$stub" <<'STUB'
#!/bin/sh
case "${STUB_MODE:-ok}" in
  fail)
    echo "An error occurred (InvalidAccessKeyId) when calling the ListObjectsV2 operation: The AWS Access Key Id you provided does not exist" >&2
    exit 254
    ;;
  empty)
    exit 0
    ;;
  ok)
    printf '2026-11-01 00:00:00      1024 database-backups/db-2026-11-01.sql.gz.enc\n'
    printf '2026-11-02 00:00:00      2048 database-backups/db-2026-11-02.sql.gz.enc\n'
    ;;
  *)
    echo "stub aws: unexpected mode ${STUB_MODE}" >&2
    exit 3
    ;;
esac
STUB
chmod +x "$stub"

export PATH="$tmp:$PATH"
export S3_BUCKET="mainecybertech-backups"
export S3_PREFIX="database-backups"
export AWS_ENDPOINT_URL="https://nyc3.digitaloceanspaces.com"
export AWS_ACCESS_KEY_ID="test-access-key"
export AWS_SECRET_ACCESS_KEY="test-secret-key"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

echo "1/3 failing aws s3 ls reports the location and credential state (negative fixture)"
if STUB_MODE=fail "$script" database > "$tmp/fail.out" 2> "$tmp/fail.err"; then
  fail "a failing aws s3 ls must fail the discovery step"
fi
grep -q "Could not list the database backup location s3://mainecybertech-backups/database-backups/" "$tmp/fail.err" \
  || fail "failure diagnostic did not name the bucket/prefix"
grep -q "endpoint https://nyc3.digitaloceanspaces.com" "$tmp/fail.err" \
  || fail "failure diagnostic did not name the endpoint"
grep -q "AWS_ACCESS_KEY_ID=present, AWS_SECRET_ACCESS_KEY=present" "$tmp/fail.err" \
  || fail "failure diagnostic did not report credential presence"
grep -q "AWS CLI exited 254" "$tmp/fail.err" \
  || fail "failure diagnostic did not preserve the AWS exit code"

echo "2/3 an empty but reachable prefix has a distinct message"
if STUB_MODE=empty "$script" database > "$tmp/empty.out" 2> "$tmp/empty.err"; then
  fail "an empty prefix must fail the discovery step"
fi
grep -q "No database backup objects found under s3://mainecybertech-backups/database-backups/" "$tmp/empty.err" \
  || fail "empty-prefix diagnostic did not name the location"
grep -q "bucket is reachable but the prefix is empty" "$tmp/empty.err" \
  || fail "empty-prefix diagnostic did not distinguish an empty bucket from a failure"

echo "3/3 a successful listing emits the newest backup_file/backup_uri"
STUB_MODE=ok "$script" database > "$tmp/ok.out"
grep -q '^backup_file=database-backups/db-2026-11-02.sql.gz.enc$' "$tmp/ok.out" \
  || fail "backup_file did not select the newest object"
grep -q '^backup_uri=s3://mainecybertech-backups/database-backups/db-2026-11-02.sql.gz.enc$' "$tmp/ok.out" \
  || fail "backup_uri was not rebuilt without double-prefixing"

echo "PASS: find-latest-backup diagnostics test"
