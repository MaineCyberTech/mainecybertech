#!/usr/bin/env bash
# Verify this host can use the Kestrel broker for repository access.
# Read-only: it does not print the token, write files or change GitHub.
set -Eeuo pipefail

REPO="${KESTREL_AGENT_REPO:-mainecybertech}"
TOKEN_FILE="${KESTREL_BROKER_TOKEN_FILE:-/etc/kestrel-agents/${REPO}/broker-token}"
BROKER_URL="${KESTREL_BROKER_URL:-http://192.168.222.225:8090}"
OWNER_REPO="MaineCyberTech/${REPO}"
fail=0

ok() { printf '%-32s ok   %s\n' "$1" "$2"; }
bad() { printf '%-32s FAIL %s\n' "$1" "$2" >&2; fail=1; }

for cmd in git gh jq curl; do
  if command -v "$cmd" >/dev/null 2>&1; then
    ok "command:${cmd}" "$(command -v "$cmd")"
  else
    bad "command:${cmd}" "missing"
  fi
done

if [[ -r "$TOKEN_FILE" ]]; then
  mode=$(stat -c '%a' "$TOKEN_FILE")
  owner=$(stat -c '%U:%G' "$TOKEN_FILE")
  if [[ "$mode" == "600" && "$owner" == "root:root" ]]; then
    ok "broker-token" "$TOKEN_FILE ($mode $owner)"
  else
    bad "broker-token" "$TOKEN_FILE has $mode $owner; expected 600 root:root"
  fi
else
  bad "broker-token" "$TOKEN_FILE missing or unreadable"
fi

if curl -fsS --max-time 5 "${BROKER_URL%/}/v1/status" >/dev/null 2>&1; then
  ok "broker-status" "$BROKER_URL/v1/status"
else
  bad "broker-status" "$BROKER_URL/v1/status unreachable (check WireGuard)"
fi

if command -v gh-kestrel >/dev/null 2>&1; then
  if KESTREL_BROKER_TOKEN_FILE="$TOKEN_FILE" KESTREL_AGENT_REPO="$REPO" \
      gh-kestrel api "repos/${OWNER_REPO}" --jq .full_name >/tmp/kestrel-agent-repo.out 2>/dev/null; then
    ok "github-api" "$(cat /tmp/kestrel-agent-repo.out)"
  else
    bad "github-api" "gh-kestrel could not read ${OWNER_REPO}"
  fi
  rm -f /tmp/kestrel-agent-repo.out
else
  bad "gh-kestrel" "missing"
fi

if GIT_TERMINAL_PROMPT=0 KESTREL_BROKER_TOKEN_FILE="$TOKEN_FILE" KESTREL_AGENT_REPO="$REPO" \
    git ls-remote "https://github.com/${OWNER_REPO}.git" HEAD >/dev/null 2>&1; then
  ok "git-read" "https://github.com/${OWNER_REPO}.git"
else
  bad "git-read" "git ls-remote failed"
fi

if [[ "$fail" -eq 0 ]]; then
  echo "result=ok"
else
  echo "result=failed" >&2
fi
exit "$fail"
