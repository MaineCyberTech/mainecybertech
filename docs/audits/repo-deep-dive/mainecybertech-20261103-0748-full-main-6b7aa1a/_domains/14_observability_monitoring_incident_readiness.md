# Observability, Monitoring, and Incident Readiness Audit (Re-audit)

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / Commit: `origin/main` @ `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03 (UTC)
- Auditor: subagent (re-audit of `mainecybertech-20261014-0033-full-main-7dd0402`)
- Area code: OBS
- Scope limitations: read-only review plus the public GitHub Actions API. No live Prometheus scrape, Alertmanager delivery or dashboard query was performed; logs require admin access.

## Scope

Re-verified all 26 previous OBS findings at `6b7aa1a`: alert routing/delivery, watchdog/dead-man's switch, dashboards/SLOs, metric wiring, audit/privileged-abuse alerts, webhook/payment alerts, `/health` exposure, golden-signal coverage, label cardinality, Sentry, CI validation, deploy health gates, alert-path exercises, log retention, uptime/smoke probes, RLS detection and host-resource monitoring. The `7dd0402..6b7aa1a` diff added node-exporter host metrics, three host alerts and a billing-lookup alert.

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `infra/digitalocean/prometheus.rules.yml` / `.test.yml` | Read | Alert coverage and unit tests | 505 / 822 lines; host + billing rules tested |
| `infra/digitalocean/prometheus.yml`, `docker-compose.yml` | Read | Scrape targets / node-exporter service | `node-exporter:9100`, internal only |
| `.github/workflows/{external-uptime-probe,smoke-check,alert-path-exercise}.yml` | Read + API | External detection and exercise history | Probe green; alert path failed |
| `apps/api/src/{lib/metrics,middleware/entitlement,routes/health}.ts` | Read | Metric wiring and health semantics | Billing failure counter wired |
| `docs/MONITORING_AND_ALERTING.md`, `docs/SLO.md` | Read | Published signal/gate inventory | Reconciled with host metrics |
| Public GitHub Actions API | Read-only | Probe/smoke/alert-path/deploy history | Run IDs cited |

## Executive Summary

Twenty of the 26 prior findings are `verified-fixed`; six are `partially-fixed`; one new P1 and one new P3 are open. OBS-P2-017 is fixed: the external uptime probe now targets the working app-host API path, and its hourly runs are green again. The diff also adds genuine host-resource coverage — node-exporter, `MCTHostDiskSpaceLow/Critical` and `MCTHostMemoryPressure`, each with promtool cases — plus `MCTBillingLookupFailures`.

The remaining observability gaps are mostly operational: the external watchdog URL is unset and the first alert-path exercise failed; no backup/restore has run green; log shipping is still on-box; the audit-trail-gap alert is absent. The new P1 is separate and release-blocking: the **prod deploy health gate still probes `api.mainecybertech.com/health`**, which the repo docs say is a retired 404 endpoint, so the first real prod deploy will fail its public API gate even though the API serves through `app.mainecybertech.com/api`.

## Findings

| ID | Sev | Status | Title | Key evidence |
|---|---|---|---|---|
| OBS-P0-001 | P0 | partially-fixed | No independent dead-man's switch | Watchdog URL unset; alert-path run 41323651243 failed |
| OBS-P1-001 | P1 | verified-fixed | No RLS-regression detection | RLS metrics + `MCTTenantScopeRegression` |
| OBS-P1-002 | P1 | open (new) | Prod deploy gate probes the dead API host | `deploy-do.yml:1155` + `API_DOMAIN=api.mainecybertech.com`; docs say 404 |
| OBS-P2-001 | P2 | verified-fixed | Alert rules not routed | `prometheus.yml` → alertmanager; receivers |
| OBS-P2-002 | P2 | verified-fixed | No dashboards/SLO/error budgets | Dashboard JSON + `docs/SLO.md` |
| OBS-P2-003 | P2 | partially-fixed | Backup/restore scheduled but unverified | All four runs failed 2026-11-02 |
| OBS-P2-004 | P2 | verified-fixed | Metrics declared but unwired | Live call sites; docs reconciled |
| OBS-P2-005 | P2 | partially-fixed | No audit-gap/privileged-abuse alert | Impersonation covered; audit gap log-only |
| OBS-P2-006 | P2 | verified-fixed | No webhook DLQ/payment drift alerts | Rules + counters |
| OBS-P2-007 | P2 | verified-fixed | `/health` leaks provider/Redis detail | Minimal public; token-gated detail |
| OBS-P2-008 | P2 | verified-fixed | Availability detector inside failed domain | External watchdog + probe (same P0 residual) |
| OBS-P2-009 | P2 | verified-fixed | Golden signals lack alerts | 23+ alerts incl. latency/breaker/auth/queue |
| OBS-P2-010 | P2 | verified-fixed | Raw path label cardinality | Route-template `routeLabel` |
| OBS-P2-011 | P2 | verified-fixed | Web Sentry disabled in prod | DSN fallback + deploy wiring |
| OBS-P2-012 | P2 | verified-fixed | Alert config not CI-validated; gate ignored Prometheus | promtool CI + all-service gate |
| OBS-P2-013 | P2 | verified-fixed | Empty `METRICS_TOKEN` unguarded | Deploy guard; docs |
| OBS-P2-014 | P2 | partially-fixed | Alert delivery/dead-man never exercised | First alert-path run failed; no evidence row |
| OBS-P2-015 | P2 | partially-fixed | Container logs destroyed by deploy | On-box snapshots; no off-box shipping |
| OBS-P2-016 | P2 | verified-fixed | No external uptime checks | `external-uptime-probe.yml`; green |
| OBS-P3-001 | P3 | partially-fixed | Incident runbooks/tabletop evidence partial | Desk dry-run only |
| OBS-P3-002 | P3 | verified-fixed | Monitoring doc/health semantics disagree | `MONITORING_AND_ALERTING.md:82-146` |
| OBS-P3-003 | P3 | verified-fixed | `/metrics` public when token unset | API/worker/Caddy fail closed |
| OBS-P3-004 | P3 | verified-fixed | Sentry release markers missing | `SENTRY_RELEASE`/`GIT_SHA` wired |
| OBS-P3-005 | P3 | verified-fixed | Alertmanager secret rendering gaps | `render-alertmanager.awk`; docs |
| OBS-P3-006 | P3 | verified-fixed | Metrics limiter no scrape headroom | 12/min vs 4/min |
| OBS-P3-007 | P3 | verified-fixed | SLO/monitoring docs drift | Reconciled + host metrics |
| OBS-P2-017 | P2 | verified-fixed | Uptime probe permanently red on dead API host | Probe retargeted to `app.../api/v1/store/products`; green runs |
| OBS-P3-008 | P3 | open (new) | Host-metrics exporter outside service-down alerting; healthcheck only runs the binary | `MCTServiceDown` matches api/worker only; `node_exporter --version` healthcheck |

Counts: **20 verified-fixed / 6 partially-fixed / 0 regressed / 2 open** (OBS-P1-002 and OBS-P3-008 new). OBS-P2-017 moved to fixed.

## Residual detail

### OBS-P1-002 — the prod deploy health gate still uses the dead API host

`deploy-do.yml:92-93` sets `API_DOMAIN=api.mainecybertech.com` for prod; `:1155` polls `https://$API_DOMAIN/health` 30 times and exits 1 if it never returns 200. `docs/MONITORING_AND_ALERTING.md:184-193` states that hostname is a retired non-droplet endpoint returning 404 for every path, and explicitly calls the deploy gate “a separate residual”. The API serves through `https://app.mainecybertech.com/api/v1/*`. The uptime probe was retargeted (OBS-P2-017), but the deploy gate was not. Fix: curl the app-host API path (or restore a Caddy-served `api` host), assert the expected JSON/status, and keep the in-container health check as the authoritative gate.

### OBS-P0-001 / OBS-P2-014 — monitoring-of-monitoring is unproven

The Watchdog rule and receiver are wired, but `ALERTMANAGER_WATCHDOG_WEBHOOK_URL` is still unset (`INCIDENT_RESPONSE.md:158`; `DATA_BREACH_RESPONSE.md:149`). The first scheduled alert-path exercise (41323651243, 2026-11-01) failed at the “Exercise alert delivery on the droplet” step (exit 1), and `docs/ALERT_PATH_EXERCISE.md:104-110` still records `_none recorded yet_`. Alert delivery is therefore “configured”, not “exercised”.

### OBS-P2-003 — backups are observed but not green

The staleness check and worker heartbeat are independent detectors, but all four backup/restore workflows failed on 2026-11-02 (41440899317, 41448770549, 41471860987, 41484522284). The observability layer is correctly reporting a real gap; it is not the gap.

### OBS-P2-005 — audit-trail failures still have no alert

Impersonation is covered (`MCTImpersonationBurst`, `MCTImpersonationActivity`), but `apps/api/src/services/audit.ts` only logs an insert failure after retries; there is no counter/rule for audit-write failures or gaps. A breach could erase its own evidence trail silently.

### OBS-P2-015 — logs are still on the droplet

The deploy snapshots gzipped logs before recreating and keeps the last seven, so deploy-destroyed logs are recoverable on-box. There is still no off-box shipping; a droplet loss loses all logs. `docs/MONITORING_AND_ALERTING.md` still lists central forwarding as future work.

### OBS-P3-008 — the new host exporter can fail silently

`MCTServiceDown` only covers `up{job=~"mct-api|mct-worker"}` (`prometheus.rules.yml:11-19`). There is no `up{job="node-exporter"}` rule (and none for Prometheus/Alertmanager), so a dead exporter silently stops the new disk/memory alerts. The compose healthcheck (`docker-compose.yml:297-300`) runs `/bin/node_exporter --version`, which proves the binary exists, not that the HTTP listener works; deploy-do now includes node-exporter in its health gate (`deploy-do.yml:1067`). Add `MCTNodeExporterDown` with a promtool case and either a real HTTP probe or remove the false healthcheck.

### Positive change — host resources

`node-exporter` is now a digest-pinned, internal-only service (`infra/digitalocean/docker-compose.yml:271-300`), scraped by `prometheus.yml:47-53`, with `MCTHostDiskSpaceLow` (<15% for 15m), `MCTHostDiskSpaceCritical` (<7% for 10m) and `MCTHostMemoryPressure` (>90% for 15m), all covered by promtool cases 46-50. This closes a real blind spot (the 2026-10-15 review found the dev droplet at 98% disk with every service-level rule green).

## Recommendations

### Immediate / release blocking

1. Fix the prod deploy health gate (OBS-P1-002) before the next `main` deploy: point it at the working API path or restore the API host.
2. Provision `ALERTMANAGER_WATCHDOG_WEBHOOK_URL` and run the missed-heartbeat drill.

### This week

3. Rerun the alert-path exercise and record the evidence row (OBS-P2-014 / IR-P2-011).
4. Add an audit-write-failure counter/alert (OBS-P2-005).
5. Add a `MCTNodeExporterDown`/`up{job="node-exporter"}` alert; the current node-exporter healthcheck only executes `--version`.

### This month

6. Ship container logs off-box (Loki/CloudWatch/Spaces) and document retention.
7. Update the SLO/monitoring docs with the host metrics and the deploy-gate fix.
8. Verify the backup workflows turn green once secrets are provisioned.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Fix the deploy health URL | Removes a guaranteed prod-deploy failure | `.github/workflows/deploy-do.yml:1155` | prod deploy health step green |
| Link the failed alert-path run | Converts a silent failure into a tracked action | `docs/ALERT_PATH_EXERCISE.md` | evidence row |
| Add `MCTNodeExporterDown` | Catches a failed host-metrics scrape | `prometheus.rules.yml` + test | promtool case |
| Add an audit-write counter | Makes evidence-trail loss visible | `apps/api/src/services/audit.ts` | metric test |

## Suggested Tests

- **Alert delivery**: rerun `alert-path-exercise.yml` on dev; assert ntfy message and Watchdog page observed.
- **Deploy gate**: a dry-run curl against the app-host API path and the dead API host; assert the gate accepts the former and rejects the latter.
- **Host metrics**: promtool cases for node-exporter down/disk/memory; already partly present.
- **Audit gap**: inject an audit insert failure and assert the new counter/rule.

## Suggested Documentation Updates

- `docs/MONITORING_AND_ALERTING.md`: remove the “separate residual” once OBS-P1-002 is fixed; document the node-exporter healthcheck limitation.
- `docs/ALERT_PATH_EXERCISE.md`: fill the evidence table.
- `docs/INCIDENT_RESPONSE.md` / `docs/DATA_BREACH_RESPONSE.md`: remove the unset-watchdog and stale “no alert” statements once true.
- `docs/SLO.md`: add host-resource objectives if they become paging signals.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Does `api.mainecybertech.com` still 404? | Confirms OBS-P1-002 is live, not just documented | live curl or deploy run |
| Why did the alert-path exercise fail? | Distinguishes secrets from a broken receiver | failed run log/step |
| Is `CHROMATIC_PROJECT_TOKEN` / watchdog URL provisioned? | Green jobs may mean “skipped” | environment secret presence |

## Appendix

- GitHub Actions evidence (public API, read-only, 2026-11-03): external-uptime-probe green 41561295979 (2026-11-03), 41501856843 (2026-11-02), 41408537623 (2026-11-02); smoke green 41592985890; alert-path-exercise 41323651243 failed 2026-11-01; deploy-do main@6b7aa1a run 41598762689 was still pending at capture.
- Node-exporter / host alerts: `infra/digitalocean/docker-compose.yml:271-300`, `prometheus.yml:47-53`, `prometheus.rules.yml:457-505`, `prometheus.rules.test.yml:707-822`.
- No prior finding regressed; OBS-P2-017 is fixed, OBS-P1-002 is the only new row.
