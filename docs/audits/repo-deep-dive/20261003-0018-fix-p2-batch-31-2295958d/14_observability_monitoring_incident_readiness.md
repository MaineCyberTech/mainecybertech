# Observability, Monitoring, and Incident Readiness Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20261003-0018-fix-p2-batch-31-2295958d
- Repository: C:\temp\mainecybertech
- Branch: fix/p2-batch-31
- Commit SHA: 2295958d
- Generated at: 2026-10-03
- Auditor: repo-deep-dive subagent (base profile)
- Area code: OBS
- Output path: docs/audits/repo-deep-dive/20261003-0018-fix-p2-batch-31-2295958d/14_observability_monitoring_incident_readiness.md
- Scope limitations: Static; no live metrics/dashboards/alerting observed.

## Scope

Logging, metrics, tracing, health checks, alert rules and routing, dashboards, backups/restore drills, incident runbooks/tabletops.

## Evidence Reviewed

- `apps/api/src/lib/{logger,metrics,sentry,health}.ts`; `routes/{health,metrics via app.ts}`.
- `apps/worker/src/{logger,metrics,health-server}.ts`.
- `infra/digitalocean/{prometheus.yml,prometheus.rules.yml,docker-compose.yml}`.
- `.github/workflows/{db-backup,db-restore-test}.yml`; `docs/` monitoring/runbook references.

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| read `prometheus.yml` | config | alerting | `rule_files` present; **no `alerting:` block** |
| read `prometheus.rules.yml` | config | rules | rules defined |
| grep compose for alertmanager | config | routing target | none defined |
| read `health.ts` | source | health checks | provider + redis status |
| read `test.yml` | CI | secret scan/trivy | present |

## Executive Summary

Logging is structured (pino) with request IDs and Sentry wired for errors/traces; the API and worker expose Prometheus metrics, and a rules file is loaded. The critical gap is **alert routing**: there is no `alerting:` block and no Alertmanager service, so rules evaluate but no notification leaves the host. Health endpoints are solid but `/health` leaks provider state (SEC-P2-003). Backup/restore workflows exist but are scheduled from the stale `main` branch and are documented as failing (`review.md`), so recovery confidence is low.

## Inventory

| Signal | Path | State | Risk |
|---|---|---|---|
| Structured logs | `lib/logger.ts` (pino) | implemented | Low |
| Request IDs | `middleware/request-id.ts` | implemented | Low |
| Error tracking | `lib/sentry.ts` | conditional on DSN | Low |
| API metrics | `lib/metrics.ts`, `/metrics` | implemented | Medium |
| Worker metrics | `worker/src/metrics.ts` | implemented | Low |
| Alert rules | `prometheus.rules.yml` | defined | **P2 (not routed)** |
| Alert routing | `prometheus.yml` | absent | High |
| Backups | `db-backup.yml` | scheduled from main | Medium |
| Restore drill | `db-restore-test.yml` | scheduled | Medium |
| Runbooks | `docs/` | partial | Medium |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Logging | 4 | pino + request id | — | keep |
| Metrics | 4 | Prometheus | — | keep |
| Tracing | 3 | Sentry sample rate | limited spans | expand |
| Health checks | 4 | `/health`, worker health | disclosure | SEC-P2-003 |
| Alerting | 1 | rules only | no routing | OBS-P2-001 |
| Dashboards | 2 | none committed | no SLO views | OBS-P2-002 |
| Backup/restore | 2 | workflows | not exercised/green | OBS-P2-003 |
| Incident readiness | 2 | partial docs | no tabletop evidence | OBS-P3-001 |

## Detailed Review

- `/metrics` is internal (scraped over the compose network) but the token is optional (API-P3-001).
- Prometheus rule files exist; without `alerting:` they are evaluated and dropped.
- Backup/restore: `review.md` states scheduled DB backup/restore runs failed and fire from `main`, which is behind `develop`.

## Findings

### Finding ID: OBS-P2-001 - Prometheus alert rules are not routed anywhere

- Severity: P2
- Confidence: High
- Area: OBS
- Evidence:
  - `infra/digitalocean/prometheus.yml:8-9` — `rule_files: [/etc/prometheus/rules.yml]`
  - `infra/digitalocean/prometheus.yml` — no `alerting:` section
  - `infra/digitalocean/docker-compose.yml` — no Alertmanager service
  - `infra/digitalocean/prometheus.rules.yml` — alert rules exist
- What is happening: firing alerts have no receiver.
- Why it matters: incidents are detected only when a human happens to look at metrics.
- User / business impact: extended outages, slower MTTR.
- Security / privacy / reliability impact: reliability/incident readiness.
- Recommended fix: deploy Alertmanager (or configure a webhook receiver) and an `alerting:` block; route to the team channel; add a watchdog/heartbeat so “no alerts” ≠ “no monitoring”.
- Suggested validation: fire a test alert and confirm receipt; verify watchdog heartbeat arrives.
- Owner suggestion: infra/ops
- Effort estimate: M
- Dependencies: notification channel/secret
- Status: open

### Finding ID: OBS-P2-002 - No committed dashboards or SLO/error-budget definitions

- Severity: P2
- Confidence: Medium
- Area: OBS
- Evidence:
  - No Grafana/dashboard JSON under `infra/` or `docs/` (search)
  - `apps/api/src/lib/metrics.ts` exposes metrics but no SLO recording/alert thresholds are defined in-repo
- What is happening: metrics are collected but there is no reviewed definition of “healthy”.
- Why it matters: alert thresholds and capacity decisions are ad hoc.
- Recommended fix: commit dashboard-as-code and define SLOs (availability, p95 latency, job success, queue depth).
- Suggested validation: dashboard loads from repo; synthetic breach triggers an alert.
- Owner suggestion: ops
- Effort estimate: M
- Dependencies: OBS-P2-001
- Status: open

### Finding ID: OBS-P2-003 - Backup/restore is scheduled but not verified on the deployed branch

- Severity: P2
- Confidence: Medium
- Area: OBS
- Evidence:
  - `.github/workflows/db-backup.yml`, `db-restore-test.yml` — scheduled
  - `review.md` — scheduled jobs “only fire from the default branch, and the last backup runs failed”
- What is happening: recovery path is not exercised successfully; the schedule runs from a stale branch.
- Why it matters: RPO/RTO are unproven; a real data loss may be unrecoverable.
- Recommended fix: promote the branch, fix backup failures, record a dated successful restore drill with evidence.
- Suggested validation: one green `db-restore-test` run with restored row-count assertions.
- Owner suggestion: ops/data
- Effort estimate: M
- Dependencies: Spaces credentials
- Status: open

### Finding ID: OBS-P3-001 - Incident runbooks/tabletop evidence is partial

- Severity: P3
- Confidence: Medium
- Area: OBS
- Evidence:
  - `docs/` contains monitoring/operator docs but no committed tabletop exercise output/runbook drill evidence found
- What is happening: incident process documentation is incomplete relative to the platform’s surface.
- Recommended fix: add runbooks for top failure modes (Redis down, Supabase unavailable, failed deploy, webhook backlog) and record one tabletop.
- Owner suggestion: ops
- Effort estimate: M
- Dependencies: none
- Status: open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Alerts never delivered | P2 | High | Long MTTR | OBS-P2-001 | Alertmanager |
| No SLO definition | P2 | Medium | Ad-hoc ops | OBS-P2-002 | dashboards |
| Unverified backups | P2 | Medium | Data loss | OBS-P2-003 | restore drill |
| Partial runbooks | P3 | Medium | Slow response | OBS-P3-001 | docs |

## Recommendations

### Immediate / Release Blocking
- Complete a successful restore drill before go-live (OBS-P2-003).

### This Week
- Wire alert routing (OBS-P2-001); trim `/health` (SEC-P2-003).

### This Month
- Dashboards/SLOs (OBS-P2-002); runbooks/tabletop (OBS-P3-001).

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Alertmanager + webhook | alerts fire | compose, prometheus.yml | test alert |
| Watchdog rule | detects dead monitoring | rules.yml | heartbeat |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| Alert routing | P2 | infra | M | channel |
| Dashboards/SLO | P2 | ops | M | routing |
| Restore drill | P2 | ops | M | creds |
| Runbooks | P3 | ops | M | none |

## Suggested Tests

- Synthetic alert delivery; forced deploy rollback; Redis-down chaos; restore drill with row assertions.

## Suggested Documentation Updates

- `docs/RUNBOOK_*.md`, `docs/SLO.md`, `docs/BACKUP_RESTORE.md` with dated drill evidence.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Is there any external uptime monitor (outside Prometheus)? | detection path | external config |
| Where do current alerts go, if anywhere? | gap scope | live config |

## Appendix

- Worker health server on `:3001`; API health on `/health`; metrics on `/metrics` (both services).
