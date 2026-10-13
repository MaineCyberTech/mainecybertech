#!/bin/sh
# Self-test for scripts/terraform-state-restore.sh (DR-P3-005 / IR-P3-001).
#
# Uses a stubbed aws CLI so the command construction, the non-destructive
# scratch path and the destructive --restore guard are exercised without DO
# Spaces credentials. The live Spaces drill is an operator action recorded in
# docs/PLATFORM_FAILURE_RUNBOOKS.md §6.
#
# Usage: scripts/ci/test-terraform-state-restore.sh
set -eu

root=$(cd -- "$(dirname -- "$0")/../.." >/dev/null 2>&1 && pwd)
script="$root/scripts/terraform-state-restore.sh"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

stub="$tmp/aws"
calls="$tmp/calls.log"
cat > "$stub" <<'STUB'
#!/bin/sh
echo "$*" >> "$CALLS_LOG"
case "$1 $2" in
  "s3api list-object-versions")
    printf 'FAKE-VERSION-1 2026-01-01T00:00:00.000Z True\n'
    ;;
  "s3api copy-object")
    printf '{"CopyObjectResult": {}}\n'
    ;;
  *)
    echo "stub aws: unexpected call: $*" >&2
    exit 3
    ;;
esac
STUB
chmod +x "$stub"

export CALLS_LOG="$calls"
export AWS_ACCESS_KEY_ID=test-access-key
export AWS_SECRET_ACCESS_KEY=test-secret-key
export PATH="$tmp:$PATH"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

copy_calls() {
  grep -c "s3api copy-object" "$CALLS_LOG" 2>/dev/null || true
}

: > "$calls"

echo "1/6 --list resolves the dev backend coordinates"
"$script" --env dev --list > "$tmp/list.out"
grep -q "s3api list-object-versions --bucket portal-terraform-state-development --prefix digitalocean/dev/terraform.tfstate" "$calls" \
  || fail "--list did not call list-object-versions with the dev bucket/prefix"

echo "2/6 --scratch copies the chosen version to a scratch key"
"$script" --env prod --scratch FAKE-VERSION-1 > "$tmp/scratch.out"
grep -q "s3api copy-object --bucket portal-terraform-state-production --key digitalocean/prod/terraform.tfstate.restore-check-" "$calls" \
  || fail "--scratch did not copy to a scratch key in the prod bucket"
grep -q -- "--copy-source portal-terraform-state-production/digitalocean/prod/terraform.tfstate?versionId=FAKE-VERSION-1" "$calls" \
  || fail "--scratch did not pin the requested versionId"
[ "$(copy_calls)" = "1" ] || fail "--scratch must make exactly one copy call (got $(copy_calls))"

echo "3/6 --restore without --yes is refused"
before=$(copy_calls)
if "$script" --env prod --restore FAKE-VERSION-1 > "$tmp/restore-noyes.out" 2>&1; then
  fail "--restore without --yes must fail"
fi
[ "$(copy_calls)" = "$before" ] || fail "--restore without --yes must not copy anything"

echo "4/6 --restore --yes overwrites the live state key"
"$script" --env prod --restore FAKE-VERSION-1 --yes > "$tmp/restore-yes.out"
grep -q "s3api copy-object --bucket portal-terraform-state-production --key digitalocean/prod/terraform.tfstate --copy-source" "$calls" \
  || fail "--restore --yes did not copy the version over the live key"

echo "5/6 unknown environment is rejected"
if "$script" --env staging --list > "$tmp/badenv.out" 2>&1; then
  fail "--env staging must fail"
fi
grep -q "must be dev or prod" "$tmp/badenv.out" || fail "bad env error message missing"

echo "6/6 missing credentials fail closed"
if env -u AWS_ACCESS_KEY_ID -u AWS_SECRET_ACCESS_KEY "$script" --env dev --list > "$tmp/nocreds.out" 2>&1; then
  fail "missing credentials must fail"
fi

echo "PASS: terraform-state-restore procedure test"
