# 14_observability_monitoring_incident_readiness — Prompt 14 - Observability, Monitoring, and Incident Readiness Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `14_observability_monitoring_incident_readiness.md` (area OBS, prompt)

## Verification Performed

Domain subagent produced 26 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| OBS-P0-001 | P0 | Total loss of the monitoring/alerting path has no independent dead-man's-switch receiver |
| OBS-P1-001 | P1 | No runtime detection or alerting for tenant-isolation (RLS) regressions |
| OBS-P2-001 | P2 | Prometheus alert rules are not routed anywhere |
| OBS-P2-002 | P2 | No committed dashboards or SLO/error-budget definitions |
| OBS-P2-003 | P2 | Backup/restore is scheduled but not verified on the deployed branch |
| OBS-P2-004 | P2 | Several Prometheus metrics are declared but not wired, limiting incident diagnosis |
| OBS-P2-005 | P2 | No alerting on audit-trail gaps or privileged (impersonation/admin) abuse |
| OBS-P2-006 | P2 | No alerting when webhook dead-letters accumulate or payment reconciliation drifts |
| OBS-P2-007 | P2 | `/health` publicly discloses provider configuration and Redis errors |
| OBS-P2-008 | P2 | Availability detection lives inside the failed domain; no external dead-man's switch or alert delivery |
| OBS-P2-009 | P2 | Most golden-signal and SLO metrics have no alert rules (latency, circuit breaker, auth failures, notification/webhook failures, worker jobs, queue depth) |
| OBS-P2-010 | P2 | HTTP metric labels use the raw request path, creating unbounded Prometheus series cardinality |
| OBS-P2-011 | P2 | Web error tracking is silently disabled in production (code reads NEXT_PUBLIC_SENTRY_DSN; deploy provides SENTRY_DSN) |
| OBS-P2-012 | P2 | Alerting configuration is not validated in CI and the deploy health gate ignores Prometheus/Alertmanager |
| OBS-P2-013 | P2 | Empty METRICS_TOKEN has no deploy guard and is documented as optional; it breaks the API scrape and fires a false service-down alert |
| OBS-P2-014 | P2 | Alert delivery and the dead-man's switch are configured but never exercised end-to-end; no monitoring-of-monitoring rules |
| OBS-P2-015 | P2 | Container logs are not persisted off-box and are destroyed by the deploy's `compose down` |
| OBS-P2-016 | P2 | No repository evidence of external uptime checks for platform endpoints; an edge/proxy failure is undetected in-stack |
| OBS-P3-001 | P3 | Incident runbooks/tabletop evidence is partial |
| OBS-P3-002 | P3 | Monitoring doc and health endpoint disagree on check semantics; Redis severity undocumented in alerts |
| OBS-P3-003 | P3 | `/metrics` is fully public when `METRICS_TOKEN` is unset |
| OBS-P3-004 | P3 | API/worker Sentry release markers are not delivered (no SENTRY_RELEASE/GIT_SHA) |
| OBS-P3-005 | P3 | Alertmanager secret provisioning gaps: matrix omits ALERTMANAGER_*; awk renderer breaks on '&' or backslash in values |
| OBS-P3-006 | P3 | Metrics rate limiter leaves almost no headroom for the 15s scrape (max 5/min vs 4/min) |
| OBS-P3-007 | P3 | SLO and monitoring docs drift from implemented metrics and alert rules |
| OBS-P2-017 | P2 | External uptime probe is permanently red on api.mainecybertech.com while the API answers on app.mainecybertech.com/api, and the docs disagree on why |
