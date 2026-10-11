# Incident Tabletop Dry-Run — IR-011 (Monitoring-Path Loss)

- **Date (UTC):** 2026-10-11
- **Scenario:** IR-011 — total loss of the monitoring/alerting path
  ([`INCIDENT_TABLETOP_SCENARIOS.md`](INCIDENT_TABLETOP_SCENARIOS.md) §3)
- **Mode:** **desk dry-run** — a documented-procedure walkthrough using only repo
  docs. No live droplet, GitHub environment, ntfy topic, or Supabase project was
  contacted; no container was stopped.
- **Facilitated / recorded by:** remediation agent (AI), repo-only
- **Reviewer (operator, pending):** `<platform-lead-name>` — this record needs a human review before the next quarterly exercise
- **Participants:** none (no human tabletop has been facilitated yet — that is
  the residual gap this record documents)
- **Purpose:** satisfy the `IR-P2-009` recommendation to run and record the
  first exercise of the refreshed catalog without pretending a live drill
  occurred, and to capture the exact blockers the live drill will hit.

> This is **not** the live missed-heartbeat drill. The live drill requires
> stopping `alertmanager` on the droplet and observing an external page
> ([`ALERT_PATH_EXERCISE.md`](ALERT_PATH_EXERCISE.md) §"Manual dead-man's-switch
> drill"); it cannot pass while `ALERTMANAGER_WATCHDOG_WEBHOOK_URL` is unset.

## 1. Preconditions checked against the repo

| Precondition | State at dry-run | Evidence |
|---|---|---|
| Watchdog rule fires continuously | Yes (`expr: vector(1)`) | `infra/digitalocean/prometheus.rules.yml` |
| Watchdog routed to an external receiver | Config present; **URL unset** | `alertmanager.tmpl.yml` watchdog route/receiver; `deploy-do.yml` fail-closed guard |
| Primary alert delivery (ntfy `portal-alerts`) | Wired; **no recorded exercise** | `MONITORING_AND_ALERTING.md` §9; `ALERT_PATH_EXERCISE.md` evidence table |
| Alert-path exercise automation | Workflow + script exist | `.github/workflows/alert-path-exercise.yml`, `scripts/exercise-alert-path.sh` |
| Customer status surface | Documented; **ACL not verified** | `docs/STATUS_AND_COMMUNICATION.md` |
| Runbooks for recovery | Present, drills `_pending_` | `docs/PLATFORM_FAILURE_RUNBOOKS.md` §§0–5 |

## 2. Walkthrough

### Inject A — droplet is up but Prometheus is down

- **Docs path used:** `MONITORING_AND_ALERTING.md` §9 (how an alert leaves the
  box), `PLATFORM_FAILURE_RUNBOOKS.md` §0 (single-host loss) — the latter
  assumes the *host* is gone, not just the monitoring containers.
- **Expected detection:** the off-box `Watchdog` page (independent of the
  droplet). **Actual:** none — the heartbeat stays on the box because
  `ALERTMANAGER_WATCHDOG_WEBHOOK_URL` is unset, so the condition is silent until
  someone notices manually or a customer reports it.
- **Gap:** G1 (off-box receiver not provisioned).

### Inject B — `SENTRY_DSN` is unset so errors are silent

- **Docs path used:** `MONITORING_AND_ALERTING.md` §5 (Sentry init is skipped
  when the DSN is unset).
- **Expected detection:** error-spike email. **Actual:** silent; the only
  remaining signals are Prometheus rules (which Inject A has already disabled)
  and manual checks.
- **Gap:** G2 (no assertion that the DSN is set in prod; no alert on Sentry
  being off).

### Inject C — alert egress is blocked by a firewall rule

- **Docs path used:** `ALERT_PATH_EXERCISE.md` (synthetic delivery + counter
  checks).
- **Expected detection:** failed `alertmanager_notifications_failed_total`
  check, or the monthly exercise failing. **Actual:** the exercise workflow
  exists and would catch it **only after it is first run and recorded** — its
  evidence table is empty, and it does not itself page anyone when it fails.
- **Gap:** G3 (alert-path exercise has no recorded run and is not a paging
  signal on failure).

## 3. Time metrics

| Metric | Value | Note |
|---|---|---|
| TTD (time to detect) | **not measured live** | Repo evidence says: no off-box detection while G1 is open; fallback is human/customer report |
| TTT (time to triage) | **not measured live** | Triage path is SSH + container health checks (`PLATFORM_FAILURE_RUNBOOKS.md` §0, `MONITORING_AND_ALERTING.md` §8) |
| TTR (time to recover) | **not measured live** | Recovery path is `docker compose up -d prometheus alertmanager` + verify the heartbeat; undrilled |
| RTO/RPO | N/A (monitoring path has no published target) | `docs/RTO_RPO.md` |

## 4. Findings and action items

| ID | Finding | Owner | Action | Due |
|---|---|---|---|---|
| G1 | Off-box dead-man's-switch receiver unset, so total monitoring loss is undetected (`IR-P0-003` residual) | Platform lead | Provision `ALERTMANAGER_WATCHDOG_WEBHOOK_URL`; run the live missed-heartbeat drill; record it in `ALERT_PATH_EXERCISE.md` evidence | before next prod deploy (fail-closed guard already blocks it) |
| G2 | No assertion that `SENTRY_DSN` is set in prod; Sentry-off is silent | Platform/infra | Add the DSN to the deploy-time required-secret checks (or a `MONITORING_AND_ALERTING.md` §5 verification step) | this month |
| G3 | Alert-path exercise never run; failure does not page | Platform lead | Run the exercise (dev first) and record the evidence row; decide whether a failed scheduled run should post to ntfy | this month |
| G4 | Status surface configured but ACL-unverified | Platform lead | Verify anonymous read of `portal-status` and record it in `STATUS_AND_COMMUNICATION.md` §3 | with the first real incident-comms test |
| G5 | No human tabletop facilitated yet | Platform lead | Facilitate IR-011 live (after G1) with named roles from the rota | next quarter |

## 5. Conclusion

The desk dry-run confirms the refreshed catalog's IR-011 rating: **detection
remains the weakest link (2/5)** because the only off-box signal is not
provisioned. The repository now contains everything needed to run the live
exercise — the scenario, the runbook, the evidence table, and the automated
synthetic check — but the live drill is operator-gated on G1 and the first
recorded exercise is still pending. Scenario IR-011 stays at 2.3 until the
missed-heartbeat drill is recorded.

## 6. Related

- [`INCIDENT_TABLETOP_SCENARIOS.md`](INCIDENT_TABLETOP_SCENARIOS.md) — catalog + readiness inventory
- [`ALERT_PATH_EXERCISE.md`](ALERT_PATH_EXERCISE.md) — the live drill runbook and evidence table
- [`MONITORING_AND_ALERTING.md`](MONITORING_AND_ALERTING.md) §9 — alert path architecture
- [`PLATFORM_FAILURE_RUNBOOKS.md`](PLATFORM_FAILURE_RUNBOOKS.md) §0 — single-host loss recovery
