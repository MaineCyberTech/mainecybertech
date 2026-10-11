#!/usr/bin/env bash
set -euo pipefail

# rollback.sh — Roll back MCT portal to a previous deployment SHA
# Usage:
#   ./scripts/rollback.sh <sha> [droplet_ip] [env]
#
# Examples:
#   ./scripts/rollback.sh abc1234                              # dev, auto-resolve IP
#   ./scripts/rollback.sh abc1234 203.0.113.10                 # dev, manual IP
#   ./scripts/rollback.sh abc1234 203.0.113.10 prod            # prod
#
# Requires: DO_API_TOKEN (if auto-resolving IP)
# Optional:
#   GHCR_TOKEN + GHCR_USER  - log in to GHCR before pulling. Without them the
#                             droplet must already be logged in.
#   DO_SSH_HOST_KEY         - pinned droplet host key (the CI secret of the
#                             same name). Without it the script refuses to
#                             run unless ROLLBACK_ALLOW_UNPINNED_HOST_KEY=1
#                             is set (documented last-resort mode).

SHA="${1:?Usage: rollback.sh <sha> [droplet_ip] [env]}"
DROPLET_IP="${2:-}"
ENV="${3:-dev}"

case "$ENV" in
  dev)  API_HOST="api.mainecybertech.us"; APP_HOST="app.mainecybertech.us"; DROPLET_NAME="${DROPLET_NAME:-mct-portal-dev}" ;;
  prod) API_HOST="api.mainecybertech.com"; APP_HOST="app.mainecybertech.com"; DROPLET_NAME="${DROPLET_NAME:-mct-portal-prod}" ;;
  *)    echo "ERROR: unknown env $ENV (use dev|prod)"; exit 1 ;;
esac

# INFRA-P2-006: the deploy pipeline pushes to ghcr.io/<owner>/<repo> (see
# deploy-do.yml `ghcr_prefix`); the old default (`...-portal`) pulled nothing.
GHCR_PREFIX="${GHCR_PREFIX:-ghcr.io/mainecybertech/mainecybertech}"

if [ -z "$DROPLET_IP" ]; then
  : "${DO_API_TOKEN:?DO_API_TOKEN required to look up droplet IP}"
  echo "Resolving IP for $DROPLET_NAME..."
  ALL_DROPLETS=$(curl -sf -H "Authorization: Bearer $DO_API_TOKEN" \
    "https://api.digitalocean.com/v2/droplets?page=1&per_page=200")
  DROPLET_IP=$(echo "$ALL_DROPLETS" | jq -r --arg name "$DROPLET_NAME" \
    '[.droplets[] | select(.name==$name)] | sort_by(.created_at) | last | .networks.v4[0].ip_address // empty')
  if [ -z "$DROPLET_IP" ]; then
    echo "ERROR: Could not resolve $DROPLET_NAME IP"
    exit 1
  fi
fi

echo "=== Rollback: $SHA on $DROPLET_NAME ($DROPLET_IP) ==="

# --- SSH host-key policy (INFRA-P2-006) -----------------------------------
# The deploy workflow verifies a pinned droplet host key; a rollback must not
# silently accept a MITM. Use DO_SSH_HOST_KEY when available; otherwise an
# explicit opt-in is required for the last-resort path.
SSH_OPTS=(-o ConnectTimeout=10)
KNOWN_HOSTS=""
if [ -n "${DO_SSH_HOST_KEY:-}" ]; then
  KNOWN_HOSTS="$(mktemp)"
  trap 'rm -f "${KNOWN_HOSTS}"' EXIT
  printf '%s\n' "$DO_SSH_HOST_KEY" | awk -v ip="$DROPLET_IP" 'NF { print ip, $0 }' > "$KNOWN_HOSTS"
  SSH_OPTS+=(-o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$KNOWN_HOSTS")
elif [ "${ROLLBACK_ALLOW_UNPINNED_HOST_KEY:-}" = "1" ]; then
  echo "WARNING: DO_SSH_HOST_KEY is not set — accepting the droplet's host key on first use (last-resort mode)." >&2
  SSH_OPTS+=(-o StrictHostKeyChecking=accept-new)
else
  echo "ERROR: DO_SSH_HOST_KEY is not set. Export the pinned droplet host key (the CI DO_SSH_HOST_KEY secret), or set ROLLBACK_ALLOW_UNPINNED_HOST_KEY=1 for last-resort mode." >&2
  exit 1
fi

# --- GHCR login (INFRA-P2-006) --------------------------------------------
# The previous version referenced $GHCR_TOKEN/$GHCR_USER inside the remote
# heredoc, where neither was set (the unbound-variable failure was swallowed
# by `|| true`), so no registry login ever happened. Log in from here instead:
# the token travels over the SSH channel on stdin and never appears on a
# command line or in `ps` output on either host.
GHCR_USER="${GHCR_USER:-${GITHUB_ACTOR:-}}"
if [ -n "${GHCR_TOKEN:-}" ]; then
  if [ -z "${GHCR_USER}" ]; then
    echo "ERROR: GHCR_TOKEN is set but GHCR_USER (or GITHUB_ACTOR) is not" >&2
    exit 1
  fi
  echo "Logging into GHCR as ${GHCR_USER}..."
  # GHCR_USER is intentionally expanded on the client side (not on the droplet).
  # shellcheck disable=SC2029
  printf '%s' "$GHCR_TOKEN" | ssh "${SSH_OPTS[@]}" "root@$DROPLET_IP" \
    "docker login ghcr.io -u '${GHCR_USER}' --password-stdin"
else
  echo "WARNING: GHCR_TOKEN is not set — skipping docker login; pulls fail unless the droplet is already logged in to GHCR." >&2
fi

ssh "${SSH_OPTS[@]}" "root@$DROPLET_IP" bash -s -- "$SHA" "$GHCR_PREFIX" <<'REMOTE_SCRIPT'
set -euo pipefail
SHA="$1"
GHCR_PREFIX="$2"
for img in mct-api mct-worker mct-web; do
  echo "Pulling $img:$SHA..."
  docker pull "$GHCR_PREFIX/$img:$SHA"
done
echo "Deploying..."
cd /opt/mct-portal
IMAGE_TAG="$SHA" GHCR_IMAGE_PREFIX="$GHCR_PREFIX" docker compose -p mct-portal up -d --remove-orphans
echo "Waiting for containers..."
sleep 15
echo "=== Container status ==="
docker compose -p mct-portal ps --format 'table {{.Name}}\t{{.Status}}\t{{.Ports}}'
REMOTE_SCRIPT

# Container health gate, in parity with deploy-do.yml (INFRA-P2-006/P2-007):
# every service that declares a healthcheck must report healthy, not just the
# app containers.
echo "=== Container health (via SSH) ==="
ssh "${SSH_OPTS[@]}" "root@$DROPLET_IP" bash -s <<'REMOTE_HEALTH'
set -euo pipefail
services="redis api worker web alertmanager prometheus caddy"
for attempt in $(seq 1 18); do
  unhealthy=""
  for svc in $services; do
    status="$(docker inspect --format '{{.State.Health.Status}}' "mct-portal-${svc}-1" 2>/dev/null || echo missing)"
    [ "$status" = "healthy" ] || unhealthy="${unhealthy} ${svc}=${status}"
  done
  if [ -z "${unhealthy}" ]; then
    echo "All gated containers healthy (attempt ${attempt})"
    exit 0
  fi
  echo "Waiting for containers (attempt ${attempt}/18):${unhealthy}"
  sleep 10
done
echo "ERROR: containers did not become healthy after rollback" >&2
exit 1
REMOTE_HEALTH

echo "=== Health checks ==="
# Only success/redirect codes are healthy; a 500/502/503 means the app booted
# but is failing (the old check treated any non-000 code as success).
api_ok=""
for i in $(seq 1 15); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "https://$API_HOST/health" 2>/dev/null || echo "000")
  case "$CODE" in
    200|301|302|307) echo "API ready after $((i*4))s (HTTP $CODE)"; api_ok=1; break ;;
  esac
  echo "Attempt $i/15: HTTP $CODE"; sleep 4
done
if [ "$api_ok" != "1" ]; then
  echo "ERROR: API health check failed (last HTTP $CODE)" >&2
  exit 1
fi

# The worker port is not published, so it must be checked over SSH. A worker
# that is down means queued/scheduled work is not being processed — fatal,
# matching the deploy pipeline's worker gate.
echo "Worker health (via SSH)..."
worker_ok=""
for i in $(seq 1 12); do
  wcode=$(ssh "${SSH_OPTS[@]}" "root@$DROPLET_IP" \
    "docker exec mct-portal-worker-1 wget -qO- http://127.0.0.1:3001/health >/dev/null 2>&1 && echo 200 || echo 000" \
    2>/dev/null | tr -d '\r\n' || echo "000")
  if [ "$wcode" = "200" ]; then
    echo "Worker healthy after $((i*5))s (HTTP 200)"; worker_ok=1; break
  fi
  echo "Worker attempt $i/12: HTTP $wcode"; sleep 5
done
if [ "$worker_ok" != "1" ]; then
  echo "ERROR: Worker health check failed" >&2
  exit 1
fi

web_ok=""
for i in $(seq 1 15); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "https://$APP_HOST/login" 2>/dev/null || echo "000")
  case "$CODE" in
    200|301|302|307) echo "Web ready after $((i*4))s (HTTP $CODE)"; web_ok=1; break ;;
  esac
  echo "Attempt $i/15: HTTP $CODE"; sleep 4
done
if [ "$web_ok" != "1" ]; then
  echo "ERROR: Web health check failed (last HTTP $CODE)" >&2
  exit 1
fi

echo "=== Rollback complete: $SHA on $ENV ==="
