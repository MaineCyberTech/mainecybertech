#!/usr/bin/env bash
# Exercise the alert delivery path end-to-end (OBS-P2-014 / NOTIF-P2-011).
#
# Intended to run ON the droplet. The alert-path-exercise workflow pipes it over
# SSH (`ssh ... 'bash -s' < scripts/exercise-alert-path.sh`), but it also works
# as a manual drill from the droplet:
#
#   bash /opt/mct-portal/repo/scripts/exercise-alert-path.sh
#
# What it does:
#   1. confirms the Alertmanager container is running;
#   2. fails fast when ALERTMANAGER_CRITICAL_WEBHOOK_URL is still the compose
#      no-op default (critical alerts have no delivery path);
#   3. briefly silences the always-firing Watchdog alert (auto-expiring, see
#      below) so the webhook counters below are specific to this exercise;
#   4. posts a synthetic `critical` alert through the Alertmanager API;
#   5. confirms Alertmanager accepts/lists the alert and that the webhook
#      notification counters moved without a failure.
#
# The synthetic alert carries `endsAt = now + 2m`, so it resolves by itself —
# nothing to clean up and no container is stopped. The Watchdog silence is
# removed on exit and expires on its own after 3 minutes even if the script is
# killed; a <=3m gap between watchdog heartbeats is well inside any external
# service's grace period (the heartbeat interval itself is 5m).
#
# The off-box dead-man's switch is deliberately NOT exercised here: stopping
# Alertmanager for the grace period is disruptive and stays a manual procedure
# (see docs/ALERT_PATH_EXERCISE.md).
#
# Exit codes: 0 = exercise passed; 1 = exercise failed; 2 = Alertmanager not running.
set -euo pipefail

AM_CONTAINER="${AM_CONTAINER:-mct-portal-alertmanager-1}"
AM_URL="http://localhost:9093"
ALERT_NAME="MCTAlertPathExercise"

am_get() {
  docker exec "$AM_CONTAINER" wget -qO- "$AM_URL$1"
}

amtool() {
  docker exec "$AM_CONTAINER" amtool --alertmanager.url="$AM_URL" "$@"
}

# Sum a counter family's value for integration="webhook" from Alertmanager /metrics.
webhook_counter() {
  printf '%s\n' "$2" | awk -v m="$1" '$1 ~ "^" m "\\{" && /integration="webhook"/ {s += $NF} END {printf "%d", s + 0}'
}

silence_id=""
cleanup() {
  if [ -n "$silence_id" ]; then
    amtool silence expire "$silence_id" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

echo "== Alert path exercise (OBS-P2-014 / NOTIF-P2-011) =="
echo "time: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

if ! docker inspect -f '{{.State.Running}}' "$AM_CONTAINER" 2>/dev/null | grep -qx true; then
  echo "FAIL: $AM_CONTAINER is not running" >&2
  exit 2
fi
echo "PASS: Alertmanager container is running"

critical_url="$(docker exec "$AM_CONTAINER" printenv ALERTMANAGER_CRITICAL_WEBHOOK_URL 2>/dev/null || true)"
case "$critical_url" in
  "" | http://127.0.0.1:1/*)
    echo "FAIL: ALERTMANAGER_CRITICAL_WEBHOOK_URL is unset (compose no-op default) — critical alerts have no delivery path." >&2
    echo "      Set it (e.g. the ntfy portal topic) and re-run: docs/ALERT_PATH_EXERCISE.md." >&2
    exit 1
    ;;
  *)
    echo "PASS: critical receiver URL is configured (value redacted)"
    ;;
esac

watchdog_url="$(docker exec "$AM_CONTAINER" printenv ALERTMANAGER_WATCHDOG_WEBHOOK_URL 2>/dev/null || true)"
case "$watchdog_url" in
  "" | http://127.0.0.1:1/*)
    echo "WARN: ALERTMANAGER_WATCHDOG_WEBHOOK_URL is unset — the off-box dead-man's switch is not live (IR-P0-003). The missed-heartbeat drill cannot pass until it is provisioned." >&2
    ;;
esac

# Silence the always-firing Watchdog for the observation window so the webhook
# notification counters below reflect this exercise, not watchdog heartbeats.
silence_id="$(amtool silence add alertname=Watchdog --duration=3m \
  --author=alert-path-exercise \
  --comment="OBS-P2-014 alert-path exercise window; auto-expires" | grep -oE '[0-9a-fA-F-]{36}' | head -n1 || true)"
if [ -n "$silence_id" ]; then
  echo "PASS: Watchdog silenced for the exercise window (auto-expires in 3m)"
else
  echo "WARN: could not create the Watchdog silence; a concurrent heartbeat may add noise to the counters" >&2
fi

metrics_before="$(am_get /metrics)"
total_before="$(webhook_counter alertmanager_notifications_total "$metrics_before")"
failed_before="$(webhook_counter alertmanager_notifications_failed_total "$metrics_before")"
echo "webhook notifications before: total=$total_before failed=$failed_before"

starts_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
ends_at="$(date -u -d '+2 minutes' +%Y-%m-%dT%H:%M:%SZ)"
echo "posting synthetic critical alert ($ALERT_NAME, resolves at $ends_at)..."
if ! amtool alert add "$ALERT_NAME" severity=critical service=alert-path-exercise \
  --start="$starts_at" --end="$ends_at" \
  --annotation=summary="Synthetic alert-path exercise (OBS-P2-014 / NOTIF-P2-011)" \
  --annotation=description="Posted by scripts/exercise-alert-path.sh; no action required." \
  >/dev/null; then
  echo "FAIL: Alertmanager rejected the synthetic alert (POST /api/v2/alerts)" >&2
  exit 1
fi

accepted=0
for _ in $(seq 1 12); do
  if am_get /api/v2/alerts 2>/dev/null | grep -q "$ALERT_NAME"; then
    accepted=1
    break
  fi
  sleep 2
done
if [ "$accepted" != 1 ]; then
  echo "FAIL: $ALERT_NAME was not listed by Alertmanager" >&2
  exit 1
fi
echo "PASS: Alertmanager accepted and lists $ALERT_NAME"

delivered=0
for _ in $(seq 1 24); do
  metrics_now="$(am_get /metrics)"
  total_now="$(webhook_counter alertmanager_notifications_total "$metrics_now")"
  failed_now="$(webhook_counter alertmanager_notifications_failed_total "$metrics_now")"
  if [ "$failed_now" -gt "$failed_before" ]; then
    echo "FAIL: webhook notification failures rose ($failed_before -> $failed_now); check ALERTMANAGER_CRITICAL_WEBHOOK_URL and ALERTMANAGER_WEBHOOK_USER/PASS" >&2
    exit 1
  fi
  if [ "$total_now" -gt "$total_before" ]; then
    delivered=1
    break
  fi
  sleep 5
done
if [ "$delivered" != 1 ]; then
  echo "FAIL: no webhook notification was attempted within 120s of the alert being accepted" >&2
  exit 1
fi
echo "PASS: webhook notification delivered without failure (total=$total_before -> $total_now)"
echo "== PASS: alert path exercised end-to-end; confirm the notification in the ntfy topic =="
