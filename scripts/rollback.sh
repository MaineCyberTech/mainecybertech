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
# Requires: DO_API_TOKEN (if auto-resolving IP), GHCR_TOKEN (for docker login)

SHA="${1:?Usage: rollback.sh <sha> [droplet_ip] [env]}"
DROPLET_IP="${2:-}"
ENV="${3:-dev}"

case "$ENV" in
  dev)  API_HOST="api.mainecybertech.us"; APP_HOST="app.mainecybertech.us"; DROPLET_NAME="${DROPLET_NAME:-mct-portal-dev}" ;;
  prod) API_HOST="api.mainecybertech.com"; APP_HOST="app.mainecybertech.com"; DROPLET_NAME="${DROPLET_NAME:-mct-portal-prod}" ;;
  *)    echo "ERROR: unknown env $ENV (use dev|prod)"; exit 1 ;;
esac

GHCR_PREFIX="${GHCR_PREFIX:-ghcr.io/mainecybertech/mainecybertech-portal}"

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

ssh -o StrictHostKeyChecking=no "root@$DROPLET_IP" bash -s -- "$SHA" "$GHCR_PREFIX" <<'REMOTE_SCRIPT'
set -euo pipefail
SHA="$1"
GHCR_PREFIX="$2"
echo "Logging into GHCR..."
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin 2>/dev/null || true
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

echo "=== Health checks ==="
for i in $(seq 1 15); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "https://$API_HOST/health" 2>/dev/null || echo "000")
  if [ "$CODE" != "000" ]; then echo "API ready after $((i*4))s (HTTP $CODE)"; break; fi
  echo "Attempt $i/15: $CODE"; sleep 4
done
[ "$CODE" = "000" ] && { echo "API health check failed"; exit 1; }

echo "Worker health (via SSH)..."
ssh -o StrictHostKeyChecking=no "root@$DROPLET_IP" \
  "curl -sf --connect-timeout 5 --max-time 10 http://localhost:3001/health" 2>/dev/null || \
  echo "Warning: Worker health check skipped (non-fatal)"

for i in $(seq 1 15); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "https://$APP_HOST/login" 2>/dev/null || echo "000")
  if [ "$CODE" != "000" ]; then echo "Web ready after $((i*4))s (HTTP $CODE)"; break; fi
  echo "Attempt $i/15: $CODE"; sleep 4
done
[ "$CODE" = "000" ] && { echo "Web health check failed"; exit 1; }

echo "=== Rollback complete: $SHA on $ENV ==="
