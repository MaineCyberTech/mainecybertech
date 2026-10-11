# Alert Path Exercise Runbook

> Reproducible exercise for the alert delivery path. Closes the "configured but
> never exercised" gap in findings **OBS-P2-014** / **NOTIF-P2-011** and feeds
> the alert-routing evidence required by
> [`RELEASE_GATE.md`](RELEASE_GATE.md) (pre-go-live operator checklist) and
> [`MONITORING_AND_ALERTING.md`](MONITORING_AND_ALERTING.md) §9.
>
> The first recorded exercise must be linked from the evidence table below —
> do not mark this finding closed without a run URL and an observed ntfy
> notification.

## What is exercised

| Path | Mechanism | Automated? |
| ---- | --------- | ---------- |
| `critical` alert delivery: Alertmanager → ntfy `portal-alerts` | Synthetic `critical` alert posted through the Alertmanager API; webhook counters must move without a failure | Yes — workflow + script |
| ntfy topic + write-only relay credentials | Direct POST to `NTFY_ALERTS_URL` with `NTFY_ALERTS_USER`/`NTFY_ALERTS_PASS`; HTTP 200 required | Yes — workflow (skipped when the secrets are absent) |
| Off-box dead-man's switch (`Watchdog` heartbeat) | Stop Alertmanager, wait out the external service's grace period, confirm the page, restart | **No — manual only** (stopping Alertmanager on a live box is disruptive) |

The workflow never stops a container. The synthetic alert auto-resolves after
two minutes; the script only creates a short, auto-expiring silence for the
always-firing `Watchdog` alert so the webhook counters are specific to the
exercise (a ≤3-minute gap between watchdog heartbeats is well inside any
external grace period, since the heartbeat interval itself is 5 minutes).

## Quick start (automated)

1. **Actions → "Alert path exercise" → Run workflow.**
   - `environment: dev` (default) — no approval.
   - `environment: prod` — attaches the `prod-approval` environment; the run
     pauses until a required reviewer approves (once reviewers are configured).
2. Watch the run: the "Exercise alert delivery on the droplet" step prints
   `PASS:`/`FAIL:` lines and mirrors them into the run summary.
3. Confirm the ntfy notification appears in the `portal-alerts` topic.
4. Record the run URL and the observation in the evidence table below.

> GitHub only dispatches/schedules workflows that exist on the **default
> branch**. Until this workflow is promoted there, use the manual run below
> (the droplet script is self-contained).

The workflow is intentionally **not** a required check: a red run is an
alert-path signal, never a merge or deploy blocker. Scheduled runs (monthly)
always target dev; use `workflow_dispatch` for prod.

## Manual run (no workflow)

On the droplet:

```bash
ssh root@<droplet-ip>
bash /opt/mct-portal/repo/scripts/exercise-alert-path.sh
```

Or from a workstation without touching the repo checkout on the droplet:

```bash
ssh root@<droplet-ip> 'bash -s' < scripts/exercise-alert-path.sh
```

The script (`scripts/exercise-alert-path.sh`) fails fast when
`ALERTMANAGER_CRITICAL_WEBHOOK_URL` is still the compose no-op default, posts
the synthetic alert, and verifies:

- Alertmanager accepts and lists `MCTAlertPathExercise`;
- `alertmanager_notifications_total{integration="webhook"}` increases;
- `alertmanager_notifications_failed_total{integration="webhook"}` does not.

### Manual synthetic alert (raw API)

```bash
# On the droplet — same effect as the script, without the counter checks.
docker exec mct-portal-alertmanager-1 amtool alert add MCTAlertPathExercise \
  severity=critical service=alert-path-exercise \
  --alertmanager.url=http://localhost:9093 \
  --start="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --end="$(date -u -d '+2 minutes' +%Y-%m-%dT%H:%M:%SZ)" \
  --annotation=summary="Manual alert-path exercise"

# No failures since start-up? (nonzero = investigate receiver/credentials)
docker exec mct-portal-alertmanager-1 wget -qO- http://localhost:9093/metrics \
  | grep 'alertmanager_notifications_failed_total{integration="webhook"}'
```

## Manual dead-man's-switch drill (missed heartbeat)

Precondition: `ALERTMANAGER_WATCHDOG_WEBHOOK_URL` is provisioned in the droplet
`.env` (IR-P0-003). While it is unset, the heartbeat stays on the box and this
drill **cannot pass** — record that state instead of pretending it was run.

1. Note the external service's grace period (e.g. Healthchecks.io check
   settings) before starting.
2. On the droplet: `docker compose -p mct-portal stop alertmanager`
3. Wait past the grace period. Confirm the external service reports the missed
   heartbeat / sends its page. Record the timestamp.
4. Restart: `docker compose -p mct-portal start alertmanager`
5. Confirm heartbeats resume and the external service returns to green
   (`docker compose -p mct-portal logs --tail=20 alertmanager` shows the
   Watchdog route active).
6. Record the drill below (who paged, when, how long to detect).

## Evidence

| Date (UTC) | Env | Operator | Workflow run / artifact | ntfy notification observed | Watchdog page observed |
| ---------- | --- | -------- | ----------------------- | -------------------------- | ---------------------- |
| _none recorded yet_ | — | — | — | — | — |

Replace the placeholder row with the first real exercise; keep one row per
run. Link the run URL (or a transcript for manual runs) and name the person
who observed the ntfy message / page. Never record token values.

## Related

- [`MONITORING_AND_ALERTING.md`](MONITORING_AND_ALERTING.md) §9 — alert delivery
  and dead-man's-switch architecture.
- [`GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`](GITHUB_SECRETS_AND_VARIABLES_MATRIX.md)
  — `ALERTMANAGER_*` / `NTFY_ALERTS_*` provisioning.
- [`.github/workflows/alert-path-exercise.yml`](../.github/workflows/alert-path-exercise.yml)
  and [`scripts/exercise-alert-path.sh`](../scripts/exercise-alert-path.sh) —
  the automated check.
