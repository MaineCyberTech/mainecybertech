# Observability, Monitoring, and Incident Readiness Audit (Re-audit)

## Audit Metadata

- Audit name: mainecybertech full-domain verification re-audit
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: MaineCyberTech/mainecybertech
- Branch: `main` (worktree at `origin/main`)
- Commit SHA: `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097`
- Generated at: 2026-10-14T00:45:53Z
- Auditor: subagent (group 5)
- Area code: OBS
- Previous run: `mainecybertech-20261011-0426-full-main-8d299b8` (25 OBS findings)
- Scope limitations: static review plus read-only GitHub Actions history and anonymous HTTPS probes of the public endpoints; no live alert was fired, no Alertmanager container was stopped, and secret values were not read.

## Scope

Re-verified all 25 previous OBS findings at `main@7dd0402` and re-ran the observability lens: structured logs, correlation, error tracking, metrics, tracing, health/readiness, job and queue metrics, alert rules/routing, dashboards/SLOs, uptime probes, log retention, and monitoring-of-monitoring.

## Executive Summary

The observability program is now strong on paper and mostly in code: **19 of 25 previous findings are `verified-fixed`**, including every golden-signal gap (23 alert rules now cover latency, errors, circuit breaker, auth failures, impersonation, RLS, webhook/notification delivery, worker jobs/DLQ, queue depth/growth/disconnect, Redis degradation, Stripe drift), the raw-path cardinality fix, the web Sentry DSN, the METRICS_TOKEN deploy guard, promtool in CI, the deploy gate covering Prometheus/Alertmanager, the metric-label route template, and the doc reconciliation. The external uptime probe and the functional smoke check both exist.

Six rows remain `partially-fixed`, and they cluster on **provisioning and exercise** rather than code: the dead-man's-switch receiver URL is still unset (OBS-P0-001 — this re-audit corrects the previous `verified-fixed` call, matching the dry-run's own finding), no backup/restore has ever succeeded (OBS-P2-003), audit-trail-gap alerting is still absent (OBS-P2-005), the alert-path exercise has never run and no monitoring-of-monitoring rules exist (OBS-P2-014), logs are snapshotted on-box but not shipped off-box (OBS-P2-015), and the incident catalog exists but no live tabletop has been facilitated (OBS-P3-001).

One new P2: the external uptime probe has been red on every hourly run since it landed because `api.mainecybertech.com/health` 404s while the API actually serves through `app.mainecybertech.com/api`; the two docs explaining this contradict each other, so the loudest detector is in permanent alarm and no one has triaged it.

## Findings

| ID | Sev | Title | Status | Key evidence |
|---|---|---|---|---|
| OBS-P0-001 | P0 | Total loss of the monitoring/alerting path has no independent dead-man's-switch receiver | partially-fixed | mechanism complete; URL unset (`INCIDENT_RESPONSE.md:148-158`); dry-run gap G1 |
| OBS-P1-001 | P1 | No runtime detection or alerting for tenant-isolation (RLS) regressions | verified-fixed | rules `:162-215`; promtool CI |
| OBS-P2-001 | P2 | Prometheus alert rules are not routed anywhere | verified-fixed | `prometheus.yml`, `alertmanager.tmpl.yml:55-152` |
| OBS-P2-002 | P2 | No committed dashboards or SLO/error-budget definitions | verified-fixed | dashboard JSON; `docs/SLO.md` |
| OBS-P2-003 | P2 | Backup/restore is scheduled but not verified on the deployed branch | partially-fixed | staleness check + heartbeat exist; no green run (DR-P0-001) |
| OBS-P2-004 | P2 | Several Prometheus metrics are declared but not wired, limiting incident diagnosis | verified-fixed | all call sites present; docs reconciled |
| OBS-P2-005 | P2 | No alerting on audit-trail gaps or privileged (impersonation/admin) abuse | partially-fixed | impersonation alerts `:102-130`; no audit-gap metric/rule |
| OBS-P2-006 | P2 | No alerting when webhook dead-letters accumulate or payment reconciliation drifts | verified-fixed | rules `:217-228,360-368`; `stripe-reconcile.ts:190-191` |
| OBS-P2-007 | P2 | `/health` publicly discloses provider configuration and Redis errors | verified-fixed | `/health` minimal; `/health/detail` gated |
| OBS-P2-008 | P2 | Availability detection lives inside the failed domain; no external dead-man's switch or alert delivery | verified-fixed | watchdog + fail-closed guard + external ntfy (exercise under OBS-P0-001) |
| OBS-P2-009 | P2 | Most golden-signal and SLO metrics have no alert rules | verified-fixed | 23 rules in `prometheus.rules.yml` |
| OBS-P2-010 | P2 | HTTP metric labels use the raw request path, creating unbounded Prometheus series cardinality | verified-fixed | `request-id.ts` `routeLabel` |
| OBS-P2-011 | P2 | Web error tracking is silently disabled in production | verified-fixed | DSN fallback in web Sentry configs + deploy env |
| OBS-P2-012 | P2 | Alerting configuration is not validated in CI and the deploy health gate ignores Prometheus/Alertmanager | verified-fixed | `.github/actions/prometheus-rules`; gate `:1056-1085` |
| OBS-P2-013 | P2 | Empty METRICS_TOKEN has no deploy guard and is documented as optional | verified-fixed | `deploy-do.yml:818-834` |
| OBS-P2-014 | P2 | Alert delivery and the dead-man's switch are configured but never exercised end-to-end; no monitoring-of-monitoring rules | partially-fixed | exercise workflow 0 runs; no self-monitoring rules |
| OBS-P2-015 | P2 | Container logs are not persisted off-box and are destroyed by the deploy's `compose down` | partially-fixed | pre-deploy snapshot `:952-962`; no off-box shipping |
| OBS-P2-016 | P2 | No repository evidence of external uptime checks for platform endpoints | verified-fixed | `external-uptime-probe.yml` + `smoke-check.yml` |
| OBS-P3-001 | P3 | Incident runbooks/tabletop evidence is partial | partially-fixed | catalog + dry-run exist; no live tabletop; drills `_pending_` |
| OBS-P3-002 | P3 | Monitoring doc and health endpoint disagree on check semantics; Redis severity undocumented in alerts | verified-fixed | `MONITORING_AND_ALERTING.md:82-138` |
| OBS-P3-003 | P3 | `/metrics` is fully public when `METRICS_TOKEN` is unset | verified-fixed | fail-closed API + worker gates |
| OBS-P3-004 | P3 | API/worker Sentry release markers are not delivered (no SENTRY_RELEASE/GIT_SHA) | verified-fixed | `deploy-do.yml:666,770`; compose env |
| OBS-P3-005 | P3 | Alertmanager secret provisioning gaps: matrix omits ALERTMANAGER_*; awk renderer breaks on '&' or backslash in values | verified-fixed | `render-alertmanager.awk`; matrix rows |
| OBS-P3-006 | P3 | Metrics rate limiter leaves almost no headroom for the 15s scrape (max 5/min vs 4/min) | verified-fixed | `rate-limit.ts:165-179` (12/min) |
| OBS-P3-007 | P3 | SLO and monitoring docs drift from implemented metrics and alert rules | verified-fixed | `docs/SLO.md`, `MONITORING_AND_ALERTING.md` reconciled |
| OBS-P2-017 | P2 | External uptime probe is permanently red on api.mainecybertech.com while the API answers on app.mainecybertech.com/api, and the docs disagree on why | **open (new)** | probe runs failing hourly; live 404s vs 400; `probe-targets.json:9-11` vs `PRODUCTION_VS_TESTING_DOMAINS.md:4-6` |

Counts: 19 verified-fixed / 6 partially-fixed / 0 regressed / 1 open (new P2). One status correction: OBS-P0-001 moves from the previous run's `verified-fixed` to `partially-fixed` because the repo itself now states the watchdog URL is unset.

## Recommendations

### Immediate / Release blocking

1. Provision `ALERTMANAGER_WATCHDOG_WEBHOOK_URL` and run the missed-heartbeat drill; record it in `docs/ALERT_PATH_EXERCISE.md` (OBS-P0-001 / OBS-P2-014 / IR-P0-003).
2. Reconcile the uptime-probe target and the prod-API documentation (OBS-P2-017): either point the probe at the endpoint that actually serves the API or fix the `api.mainecybertech.com` DNS/origin, and make `PRODUCTION_VS_TESTING_DOMAINS.md`, `MONITORING_AND_ALERTING.md` and `probe-targets.json` agree. While the probe is red by design, consider routing its notifications to a low-severity channel so real edge outages stay visible.

### This week

3. Dispatch `alert-path-exercise.yml` once and record the run + observed ntfy message.
4. Add monitoring-of-monitoring rules: `up{job="prometheus"} == 0`, `rate(prometheus_rule_evaluation_failures_total[5m]) > 0`, and alertmanager notification failures (OBS-P2-014).

### This month

5. Add an audit-write-failure counter and an alert on audit-trail gaps (OBS-P2-005).
6. Ship container logs off-box (or document an accepted RPO for logs) (OBS-P2-015).
7. Get one green backup + restore run so the observability claims about backup freshness become real (OBS-P2-003 → DR-P0-001).

### Later / Platform evolution

8. Facilitate a human tabletop and fill the drill ledger and rota (OBS-P3-001, IR-P2-008/IR-P2-009).
9. Add Grafana to render the committed dashboard (documented as future work).

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Add the three self-monitoring rules | Closes the last monitoring blind spot | `infra/digitalocean/prometheus.rules.yml` | promtool unit test in CI |
| Probe-target/doc reconciliation | Removes the permanent red alert | `scripts/uptime/probe-targets.json`, `docs/MONITORING_AND_ALERTING.md`, `docs/PRODUCTION_VS_TESTING_DOMAINS.md` | probe run green or intentionally skipped |
| Audit-write failure counter | Detects a silent audit-trail gap | `apps/api/src/services/audit.ts`, `lib/metrics.ts`, rules | unit test + promtool |

## Suggested Tests

- **promtool**: fire/no-fire cases for any new self-monitoring and audit-gap rules (pattern already exists in `prometheus.rules.test.yml`).
- **Probe**: a probe self-test that fails when a configured target is unreachable — already exercised by the failing prod target; add a test that the notify step fails when no channel is configured.
- **Manual**: run the documented stop-alertmanager drill and record the observed page.
- **CI**: assert the alert-path evidence table is not empty before the release gate passes.

## Suggested Documentation Updates

- `docs/PRODUCTION_VS_TESTING_DOMAINS.md` and `docs/MONITORING_AND_ALERTING.md`: agree on the prod API hostname and the current serving path.
- `docs/ALERT_PATH_EXERCISE.md`: first evidence row.
- `docs/MONITORING_AND_ALERTING.md`: mark log shipping as accepted-risk or schedule it.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Is `api.mainecybertech.com` supposed to serve the prod API (Caddyfile says yes) and why does it answer Express 404s? | Determines whether OBS-P2-017 is a DNS/legacy artifact or a real prod regression | Droplet/Caddy state or a prod deploy run |
| Is Sentry performance tracing propagating `sentry-trace` across web→api→worker? | Cross-service latency diagnosis depends on it | A recorded trace or config review |
| What is the accepted retention for container logs? | Decides whether off-box shipping is required | Operator decision |

## Appendix

- Live probes (2026-10-14): `api.mainecybertech.com/health` 404, `api.mainecybertech.com/api/v1/auth/sign-in` 404 ("Cannot GET"), `app.mainecybertech.com/api/v1/auth/sign-in` 400 (API), `app.mainecybertech.com/login` 200 (~0.7 s; one earlier sample 3.16 s), `api.mainecybertech.us/health` 200.
- GitHub Actions: external-uptime-probe failing hourly (3 consecutive runs on 2026-10-13); smoke-check green; alert-path-exercise 0 runs; load-test 0 runs.
- Rules inventory: 23 alerts; only `up{job=~"mct-api|mct-worker"}` is self-referential (no Prometheus/Alertmanager self-liveness).
