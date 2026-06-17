#!/bin/bash
set -euo pipefail

# Deploy script for MCT Portal on DigitalOcean
# This runs on the droplet via SSH from CI/CD

COMPOSE_DIR="${COMPOSE_DIR:-/opt/mct-portal}"
IMAGE_TAG="${1:-latest}"

cd "$COMPOSE_DIR"

echo "=== Pulling env files from GitHub Secrets ==="
# Env files are written by the CI workflow before SSH
# They should already be in place from the initial setup

echo "=== Pulling images ==="
docker compose pull api worker web

echo "=== Starting services ==="
IMAGE_TAG="$IMAGE_TAG" docker compose up -d --no-deps api worker web caddy

echo "=== Pruning old images ==="
docker image prune -f

echo "=== Health check ==="
sleep 5
if curl -sf http://localhost:4000/health > /dev/null 2>&1; then
  echo "API health check passed"
else
  echo "WARNING: API health check failed" >&2
fi

if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
  echo "Worker health check passed"
else
  echo "WARNING: Worker health check failed" >&2
fi

echo "=== Deploy complete ==="
