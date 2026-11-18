#!/usr/bin/env bash
# Kestrel-managed portal droplet secrets.
#
# Kestrel is the source of truth for the dev Supabase tokens
# (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY). This script
# checks the droplet against that source and can apply the managed values
# without touching any other line in /opt/mct-portal/.env.
#
# Usage:
#   sudo scripts/kestrel-portal-secrets.sh check
#   sudo scripts/kestrel-portal-secrets.sh apply --dry-run
#   sudo scripts/kestrel-portal-secrets.sh apply
#
# Environment overrides:
#   PORTAL_ENV_FILE               default /opt/mct-portal/.env
#   KESTREL_PORTAL_SECRETS_FILE   default /etc/kestrel/portal/portal.env
#   PORTAL_HEALTH_DETAIL_URL      default https://api.mainecybertech.us/health/detail
#   PORTAL_METRICS_TOKEN_FILE     default /opt/mct-portal/metrics-token
#   PORTAL_COMPOSE_DIR            default /opt/mct-portal
#
# check is read-only. apply makes a timestamped backup, validates the source
# key against Supabase before writing, recreates api+worker, and restores the
# backup if the post-apply check fails. Secret values are never printed; drift
# is reported as a short SHA-256 prefix.
set -Eeuo pipefail

ENV_FILE="${PORTAL_ENV_FILE:-/opt/mct-portal/.env}"
SECRETS_FILE="${KESTREL_PORTAL_SECRETS_FILE:-/etc/kestrel/portal/portal.env}"
HEALTH_URL="${PORTAL_HEALTH_DETAIL_URL:-https://api.mainecybertech.us/health/detail}"
METRICS_TOKEN_FILE="${PORTAL_METRICS_TOKEN_FILE:-/opt/mct-portal/metrics-token}"
COMPOSE_DIR="${PORTAL_COMPOSE_DIR:-/opt/mct-portal}"
MANAGED_KEYS="${KESTREL_MANAGED_KEYS:-SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY}"

MODE="${1:-check}"
DRY_RUN=0
NO_RESTART="${PORTAL_APPLY_NO_RESTART:-0}"
fail=0

usage() {
  sed -n '2,26p' "$0" | sed 's/^# \{0,1\}//'
}

case "$MODE" in
  check|apply) ;;
  help|--help|-h) usage; exit 0 ;;
  *) usage >&2; exit 2 ;;
esac
shift || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1 ;;
    --no-restart) NO_RESTART=1 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

tmp_dir="$(mktemp -d)"
tmp_env=""
trap 'rm -rf "$tmp_dir"; if [[ -n "$tmp_env" ]]; then rm -f "$tmp_env"; fi' EXIT
chmod 700 "$tmp_dir"

ok() { printf '%-36s ok   %s\n' "$1" "$2"; }
bad() { printf '%-36s FAIL %s\n' "$1" "$2" >&2; fail=1; }
skip() { printf '%-36s skip %s\n' "$1" "$2"; }

env_value() {
  local file="$1" key="$2"
  [[ -r "$file" ]] || return 0
  awk -v k="$key" '
    {
      line = $0
      sub(/^[ \t]*/, "", line)
      sub(/^export[ \t]+/, "", line)
      if (index(line, k "=") == 1) {
        sub(/^[^=]*=/, "", line)
        print line
        exit
      }
    }
  ' "$file" | tr -d '\r' | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

key_hash() {
  printf '%s' "$1" | sha256sum | cut -c1-16
}

supabase_status() {
  local url="$1" key="$2" headers="$tmp_dir/supabase.headers"
  printf 'apikey: %s\nAuthorization: Bearer %s\n' "$key" "$key" > "$headers"
  chmod 600 "$headers"
  curl -sS -o /dev/null -w '%{http_code}' --max-time 20 \
    "${url%/}/rest/v1/" -H @"$headers" 2>/dev/null || true
}

metrics_token() {
  if [[ -n "${PORTAL_METRICS_TOKEN:-}" ]]; then
    printf '%s' "$PORTAL_METRICS_TOKEN"
    return 0
  fi
  [[ -r "$METRICS_TOKEN_FILE" ]] || return 0
  tr -d '\r\n' < "$METRICS_TOKEN_FILE"
}

check_private_file() {
  local file="$1" label="$2" mode owner
  if [[ ! -e "$file" ]]; then
    bad "$label" "$file missing"
    return 1
  fi
  if [[ ! -r "$file" ]]; then
    bad "$label" "$file unreadable"
    return 1
  fi
  mode="$(stat -c '%a' "$file")"
  owner="$(stat -c '%U:%G' "$file")"
  if [[ "$mode" == "600" && "$owner" == "root:root" ]]; then
    ok "$label" "$file (600 root:root)"
  else
    bad "$label" "$file has $mode $owner; expected 600 root:root"
  fi
}

check_runtime() {
  local url key code
  check_private_file "$ENV_FILE" "portal-env" || true
  url="$(env_value "$ENV_FILE" SUPABASE_URL)"
  key="$(env_value "$ENV_FILE" SUPABASE_SERVICE_ROLE_KEY)"
  if [[ -n "$url" ]]; then
    ok "supabase-url" "$url"
  else
    bad "supabase-url" "SUPABASE_URL missing from $ENV_FILE"
  fi
  if [[ -z "$key" ]]; then
    bad "runtime-key" "SUPABASE_SERVICE_ROLE_KEY missing from $ENV_FILE"
    return 0
  fi
  [[ -n "$url" ]] || return 0
  code="$(supabase_status "$url" "$key")"
  case "$code" in
    2*) ok "runtime-key" "accepted by Supabase (HTTP $code, sha256 $(key_hash "$key"))" ;;
    401|403) bad "runtime-key" "Supabase rejected the key (HTTP $code)" ;;
    000|"") bad "runtime-key" "Supabase unreachable" ;;
    *) bad "runtime-key" "Supabase returned HTTP $code" ;;
  esac
}

check_drift() {
  local key expected runtime compared=0
  if [[ ! -e "$SECRETS_FILE" ]]; then
    skip "kestrel-source" "$SECRETS_FILE not present"
    return 0
  fi
  if [[ ! -r "$SECRETS_FILE" ]]; then
    bad "kestrel-source" "$SECRETS_FILE exists but is unreadable"
    return 0
  fi
  for key in $MANAGED_KEYS; do
    expected="$(env_value "$SECRETS_FILE" "$key")"
    [[ -n "$expected" ]] || continue
    runtime="$(env_value "$ENV_FILE" "$key")"
    compared=$((compared + 1))
    if [[ -z "$runtime" ]]; then
      bad "drift:$key" "missing from $ENV_FILE"
    elif [[ "$(key_hash "$runtime")" == "$(key_hash "$expected")" ]]; then
      ok "drift:$key" "matches Kestrel (sha256 $(key_hash "$runtime"))"
    else
      bad "drift:$key" "runtime $(key_hash "$runtime") != Kestrel $(key_hash "$expected")"
    fi
  done
  if [[ "$compared" -eq 0 ]]; then
    skip "kestrel-source" "no managed keys present in $SECRETS_FILE"
  fi
}

check_health() {
  local token code db
  token="$(metrics_token)"
  if [[ -z "$token" ]]; then
    bad "api-database" "empty METRICS_TOKEN (set PORTAL_METRICS_TOKEN or $METRICS_TOKEN_FILE)"
    return 0
  fi
  printf 'Authorization: Bearer %s\n' "$token" > "$tmp_dir/health.headers"
  chmod 600 "$tmp_dir/health.headers"
  code="$(curl -sS -o "$tmp_dir/health.json" -w '%{http_code}' --max-time 20 \
    -H @"$tmp_dir/health.headers" "$HEALTH_URL" 2>/dev/null || true)"
  if [[ "$code" != "200" && "$code" != "503" ]]; then
    bad "api-database" "GET $HEALTH_URL -> HTTP ${code:-000}"
    return 0
  fi
  db="$(jq -r '.data.checks.database.status // "missing"' "$tmp_dir/health.json" 2>/dev/null || printf 'missing')"
  if [[ "$db" == "healthy" ]]; then
    ok "api-database" "healthy (HTTP $code)"
  else
    bad "api-database" "$db (HTTP $code)"
  fi
}

run_check() {
  check_runtime
  check_drift
  check_health
}

restart_services() {
  local api_image worker_image
  api_image="$(docker inspect --format '{{.Config.Image}}' mct-portal-api-1 2>/dev/null || true)"
  worker_image="$(docker inspect --format '{{.Config.Image}}' mct-portal-worker-1 2>/dev/null || true)"
  if [[ -z "$api_image" || -z "$worker_image" ]]; then
    bad "restart" "cannot resolve the current api/worker images; refusing a tag fallback"
    return 1
  fi
  (
    cd "$COMPOSE_DIR"
    IMAGE_TAG="${IMAGE_TAG:-kestrel-apply}" \
    MCT_API_IMAGE="$api_image" \
    MCT_WORKER_IMAGE="$worker_image" \
      docker compose --env-file "$ENV_FILE" -p mct-portal up -d --no-deps --force-recreate api worker
  )
}

wait_for_health() {
  local svc status attempt
  for svc in api worker; do
    status=""
    for attempt in $(seq 1 18); do
      status="$(docker inspect --format '{{.State.Health.Status}}' "mct-portal-${svc}-1" 2>/dev/null || true)"
      [[ "$status" == "healthy" ]] && break
      sleep 5
    done
    if [[ "$status" == "healthy" ]]; then
      ok "service:$svc" "healthy (attempt $attempt)"
    else
      bad "service:$svc" "not healthy after 90s (status ${status:-missing})"
    fi
  done
}

apply_secrets() {
  local source_url source_key runtime_url probe_url code
  local key value runtime_value replace_keys="" backup
  if [[ "$(id -u)" -ne 0 ]]; then
    bad "apply" "must run as root"
    return 1
  fi
  check_private_file "$SECRETS_FILE" "kestrel-source" || true
  check_private_file "$ENV_FILE" "portal-env" || true
  [[ "$fail" -eq 0 ]] || return 1

  source_url="$(env_value "$SECRETS_FILE" SUPABASE_URL)"
  source_key="$(env_value "$SECRETS_FILE" SUPABASE_SERVICE_ROLE_KEY)"
  runtime_url="$(env_value "$ENV_FILE" SUPABASE_URL)"
  probe_url="${source_url:-$runtime_url}"
  if [[ -z "$source_key" ]]; then
    bad "kestrel-source" "SUPABASE_SERVICE_ROLE_KEY missing from $SECRETS_FILE"
    return 1
  fi
  if [[ -z "$probe_url" ]]; then
    bad "kestrel-source" "SUPABASE_URL missing from both files"
    return 1
  fi
  code="$(supabase_status "$probe_url" "$source_key")"
  case "$code" in
    2*) ok "source-key" "accepted by Supabase (HTTP $code, sha256 $(key_hash "$source_key"))" ;;
    401|403) bad "source-key" "Supabase rejected the key (HTTP $code)"; return 1 ;;
    000|"") bad "source-key" "Supabase unreachable"; return 1 ;;
    *) bad "source-key" "Supabase returned HTTP $code"; return 1 ;;
  esac

  for key in $MANAGED_KEYS; do
    value="$(env_value "$SECRETS_FILE" "$key")"
    if [[ -n "$value" ]]; then
      replace_keys="${replace_keys} ${key}"
    fi
  done
  replace_keys="${replace_keys# }"
  if [[ -z "$replace_keys" ]]; then
    bad "kestrel-source" "no managed keys present in $SECRETS_FILE"
    return 1
  fi

  if [[ "$DRY_RUN" -eq 1 ]]; then
    for key in $replace_keys; do
      value="$(env_value "$SECRETS_FILE" "$key")"
      runtime_value="$(env_value "$ENV_FILE" "$key")"
      if [[ "$(key_hash "$value")" == "$(key_hash "$runtime_value")" ]]; then
        ok "dry-run:$key" "already current (sha256 $(key_hash "$value"))"
      else
        printf '%-36s would update %s -> %s\n' "dry-run:$key" "$(key_hash "$runtime_value")" "$(key_hash "$value")"
      fi
    done
    echo "apply=dry-run"
    return 0
  fi

  backup="${ENV_FILE}.bak-kestrel-$(date -u +%Y%m%dT%H%M%SZ)"
  cp -p "$ENV_FILE" "$backup"
  chmod 600 "$backup"

  tmp_env="$(mktemp "${ENV_FILE}.kestrel.XXXXXX")"
  chmod 600 "$tmp_env"
  awk -v keys="$replace_keys" '
    BEGIN { n = split(keys, a, " "); for (i = 1; i <= n; i++) skip[a[i]] = 1 }
    {
      line = $0
      sub(/^[ \t]*/, "", line)
      sub(/^export[ \t]+/, "", line)
      eq = index(line, "=")
      if (eq > 0) {
        k = substr(line, 1, eq - 1)
        if (k in skip) next
      }
      print
    }
  ' "$ENV_FILE" > "$tmp_env"
  for key in $replace_keys; do
    value="$(env_value "$SECRETS_FILE" "$key")"
    printf '%s=%s\n' "$key" "$value" >> "$tmp_env"
  done
  chown root:root "$tmp_env"
  chmod 600 "$tmp_env"
  mv "$tmp_env" "$ENV_FILE"
  tmp_env=""
  ok "env-merge" "updated ${replace_keys} (backup $(basename "$backup"))"

  if [[ "$NO_RESTART" -eq 1 ]]; then
    echo "apply=merged-only (restart skipped)"
    return 0
  fi

  if ! restart_services; then
    bad "apply" "restart failed; restoring $backup"
    cp -p "$backup" "$ENV_FILE"
    restart_services || true
    return 1
  fi

  wait_for_health
  run_check
  if [[ "$fail" -ne 0 ]]; then
    bad "apply" "post-apply check failed; restoring $backup"
    cp -p "$backup" "$ENV_FILE"
    restart_services || true
    return 1
  fi
  echo "apply=ok"
}

case "$MODE" in
  check) run_check ;;
  apply) apply_secrets || true ;;
esac

if [[ "$fail" -eq 0 ]]; then
  echo "result=ok"
else
  echo "result=failed" >&2
fi
exit "$fail"
