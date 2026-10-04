#!/bin/sh
# Redis entrypoint that keeps REDIS_PASSWORD out of the process argument vector.
#
# Why this exists (CTR-P2-003 / INFRA-P2-007): the compose file previously ran
#   command: redis-server --requirepass ${REDIS_PASSWORD}
# which puts the credentials in argv, where any process on the host (and
# `docker inspect`) can read them via `ps`. The same applied to the healthcheck's
# `redis-cli -a ${REDIS_PASSWORD}`.
#
# Instead: write requirepass to a short-lived config file with 0600 permissions
# and start redis-server on it. The secret travels only via the container
# environment, never the command line.
set -eu

: "${REDIS_PASSWORD:?REDIS_PASSWORD must be set}"

CONF=/tmp/redis.conf
umask 077
printf 'requirepass %s\n' "$REDIS_PASSWORD" > "$CONF"

exec redis-server "$CONF"
