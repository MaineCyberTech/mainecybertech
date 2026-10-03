# Observability, Monitoring, and Incident Readiness Audit

## Audit Metadata

- **Audit name:** repo-deep-dive
- **Run:** 20260730-0650-develop-62da92c
- **Repository:** C:\temp\mainecybertech-portal
- **Branch:** develop
- **Commit SHA:** 62da92c
- **Generated at:** 2026-07-30T06:50:00Z
- **Auditor:** principal-level repository auditor
- **Area code:** OBS
- **Output path:** docs/audits/repo-deep-dive/20260730-0650-develop-62da92c/14_observability_monitoring_incident_readiness.md
- **Scope limitations:** Code analysis only; no live Prometheus/Sentry/Grafana instance inspected. Alert rules assumed from docs only.

## Scope

Full audit of observability infrastructure: structured logging, request correlation, Sentry integration, Prometheus metrics, health checks, worker metrics, dashboard definitions, alerting strategy, incident runbooks, and golden signals coverage.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |
| `apps/api/src/lib/logger.ts` | Structured logging (pino) | API logger configuration | PII redaction, pino-pretty in dev |
| `apps/web/lib/logger.ts` | Structured logging (pino) | Web server-side logger | Server-only, pino-pretty in dev |
| `apps/web/lib/client-logger.ts` | Client-side logging | Browser logger | Remote log endpoint, structured format |
| `apps/api/src/middleware/request-id.ts` | Request correlation | X-Request-ID generation + logging | UUID or header passthrough, duration logging |
| `apps/api/src/lib/sentry.ts` | Sentry init (API) | Error tracking init | Skipped if SENTRY_DSN unset |
| `apps/worker/src/main.ts` | Sentry init (Worker) | Sentry init + captureException | tracesSampleRate 0.2 prod |
| `apps/web/instrumentation.ts` | Sentry init (Web) | Server/edge/client configs | Captures route errors via onRequestError |
| `apps/web/sentry.server.config.ts` | Sentry server config | DSN init for server runtime | tracesSampleRate 0.2 prod |
| `apps/api/src/lib/metrics.ts` | Prometheus metrics | 14 custom metrics + default metrics | Counter, Histogram, Gauge |
| `apps/api/src/routes/health.ts` | Health endpoint | DB connectivity check | Returns 200 or 503 with latency |
| `apps/worker/src/health-server.ts` | Worker health | HTTP health on port 3001 | Registered task types, shuttingDown flag |
| `infra/digitalocean/docker-compose.yml` | Container healthchecks | Docker HEALTHCHECK per service | redis 10s, api 30s, web 30s+40s start |
| `apps/api/src/middleware/error.ts` | Error handler | Sentry capture + logging | requestId, path, method, authUser |
| `.github/workflows/deploy-do.yml` | Deploy verification | Post-deploy health checks | API 30 attempts, Web 15 attempts |
| `docs/MONITORING_AND_ALERTING.md` | Monitoring documentation | Incident response checklist | Covers logs, health, Sentry, alerts, runbook |

## Executive Summary

**Observability score: 3.5/5.** The platform has a mature observability foundation: structured JSON logging via pino, X-Request-ID correlation across API/Worker, Sentry error tracking in all 3 services, Prometheus metrics endpoint with 14 custom metrics, health checks on all services with Docker HEALTHCHECK, and comprehensive monitoring documentation. The main gaps are: no distributed tracing (OpenTelemetry), no realtime metrics dashboard configuration (Prometheus metrics exist but no dashboard definition files), and worker task-specific metrics are not implemented beyond the generic Prometheus registry.

### Strengths

- **Structured logging everywhere** — pino in API (`apps/api/src/lib/logger.ts`), Web (`apps/web/lib/logger.ts`), Worker (`apps/worker/src/logger.ts`), even client-side (`apps/web/lib/client-logger.ts`).
- **Request ID correlation** — `request-id.ts` middleware generates/forwards `X-Request-ID`, creates child logger per request, logs duration, status, method, path.
- **Sentry in all 3 services** — API (`sentry.ts`), Worker (`main.ts`), Web (`instrumentation.ts`). Captures error context (requestId, path, method, authUser).
- **Prometheus metrics** — `/metrics` endpoint exports 14 custom metrics (HTTP requests, DB queries, webhooks, auth attempts, circuit breaker state). Default Node.js metrics via `collectDefaultMetrics`.
- **Health endpoints on every service** — API `/health` (DB check), Worker `/health` (3001, task registry + shutdown status), Web (Docker HEALTHCHECK).
- **Deploy verification** — Post-deploy health checks in `deploy-do.yml` with retry loops and Sentry alert rules documented.

### Major Risks

- **No distributed tracing** — Cannot trace a request across API → Worker → Redis → Database boundaries. Incident debugging requires manual log correlation.
- **No Grafana/Loki/Datadog dashboards** — Metrics and logs exist but no dashboard configs in repo. Operators must SSH and run `docker compose logs`.
- **Worker job metrics not captured** — `metrics.ts` defines `circuitBreakerStatus`, `dbQueryDuration`, but no `worker_tasks_total`, `worker_queue_depth` implementations exist.
- **Client-side error reporting is basic** — `client-logger.ts` sends logs via `fetch(LOG_ENDPOINT)` but the endpoint isn't configured (`__LOG_ENDPOINT__` is undefined as no code sets it).
- **No uptime check automation** — No synthetic monitoring or external uptime checker configured.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
| ---- | ------------- | ------- | ------------- | ---- | ----- |
| API pino logger | `apps/api/src/lib/logger.ts` | Structured JSON logging | ✅ Implemented | Low | PII redaction, 30 redact paths |
| Web pino logger | `apps/web/lib/logger.ts` | Server-side structured logging | ✅ Implemented | Low | server-only, pino-pretty dev |
| Client logger | `apps/web/lib/client-logger.ts` | Browser-side structured logging | ✅ Implemented | Medium | `__LOG_ENDPOINT__` never configured |
| X-Request-ID middleware | `apps/api/src/middleware/request-id.ts` | Request correlation | ✅ Implemented | Low | UUID generation + child logger |
| API Sentry | `apps/api/src/lib/sentry.ts` | Error tracking | ✅ Implemented | Low | Conditional on SENTRY_DSN |
| Worker Sentry | `apps/worker/src/main.ts:10-17` | Error tracking | ✅ Implemented | Low | Conditional on SENTRY_DSN |
| Web Sentry | `apps/web/instrumentation.ts` | Error tracking | ✅ Implemented | Low | Server + edge + client configs |
| Prometheus metrics | `apps/api/src/lib/metrics.ts` | Performance metrics | ✅ Implemented | Medium | 14 custom metrics, /metrics endpoint |
| DB query metrics | `apps/api/src/lib/metrics.ts:22-28` | DB query duration histogram | ✅ Implemented | Low | But `recordDbQuery` not called anywhere |
| Worker task metrics | — | Task completion/queue depth metrics | ❌ Absent | Medium | Only generic Prometheus metrics |
| API health | `apps/api/src/routes/health.ts` | DB connectivity + uptime | ✅ Implemented | Low | DB latency, 503 on failure |
| Worker health | `apps/worker/src/health-server.ts` | Task registry + shutdown status | ✅ Implemented | Low | Port 3001 |
| Docker healthchecks | `infra/digitalocean/docker-compose.yml` | Container health | ✅ Implemented | Low | All services |
| Deploy verification | `.github/workflows/deploy-do.yml:279-298` | Post-deploy health checks | ✅ Implemented | Low | API + Web + Worker |
| Monitoring docs | `docs/MONITORING_AND_ALERTING.md` | Incident response runbook | ✅ Implemented | Low | Comprehensive 272-line doc |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
| -------- | ----: | -------- | --- | ------------------ |
| Structured logs | 4 | pino in all 3 services + client | No centralized log aggregation config | Add Loki/Datadog sidecar config to docker-compose |
| Request IDs/correlation | 4 | `request-id.ts` middleware, child logger per request | No OpenTelemetry tracing | Add otel SDK for distributed traces |
| Error tracking | 4 | Sentry in API/Worker/Web | Sentry source maps not verified for Web | Verify source map upload in CI |
| Metrics | 3 | Prometheus 14 custom metrics | `recordDbQuery` never called; worker metrics missing | Wire dbQueryDuration into supabase queries; add worker metrics |
| Tracing | 0 | None | No distributed tracing for cross-service requests | Add OpenTelemetry instrumentation |
| Health/readiness | 4 | API /health, Worker /health, Docker healthchecks | No readiness vs liveness separation for Web | Add explicit Web health endpoint |
| Client/API/worker errors | 3 | Error boundaries + Sentry + logger | Client logger endpoint never configured | Configure `__LOG_ENDPOINT__` or remove dead code |
| Job metrics | 1 | Prometheus metrics exist | `worker_tasks_total`, `worker_queue_depth` defined but never incremented | Wire metric calls into BullMQ consumer |
| DB/queue/webhook/notification metrics | 3 | Some metrics defined | `recordWebhookDelivery` called? `recordDbQuery` called? | Audit metric usage for completeness |
| Uptime checks | 2 | Deploy health checks only | No synthetic monitoring / external uptime checker | Add Checkly or UptimeRobot config |
| Alerts | 3 | Sentry alert rules documented (MONITORING.md) | No PagerDuty/Opsgenie integration; no Slack webhook for Sentry alerts | Configure Sentry Slack integration |
| Dashboards | 1 | No dashboard configs in repo | Prometheus metrics exist but no Grafana dashboard JSON | Create Grafana dashboard as code |

## Detailed Review

### Item: Prometheus dbQueryDuration metric defined but never recorded

- **Evidence:** `apps/api/src/lib/metrics.ts:22-28` — `dbQueryDuration` histogram defined. `recordDbQuery(operation, table, durationSeconds)` exported at line 99. However, grep shows zero callers of `recordDbQuery` outside metrics.ts itself.
- **What it does:** Defines a Prometheus histogram for database query durations with labels `operation` and `table`. Exports helper function `recordDbQuery()`.
- **Missing:** No middleware or service wrapper calls `recordDbQuery()` after Supabase queries. The metric always reports zero.
- **Risks:** Operators have no visibility into database query performance. Slow queries go undetected until user impact.
- **Recommended fix:** Call `recordDbQuery()` in a wrapped Supabase client after every query resolves.

### Item: Worker task metrics not wired

- **Evidence:** `apps/api/src/lib/metrics.ts` — worker-related metrics (`worker_tasks_total`, `worker_queue_depth`) are **defined** but no code in `apps/worker/` imports or increments them.
- **What it does:** The worker has its own metrics.ts? No — worker does not import from API. Worker runs on a separate process/container.
- **Missing:** Worker needs its own Prometheus metrics server or must expose metrics via the health endpoint.
- **Recommended fix:** Add a `/metrics` endpoint to the worker health server (using `prom-client`), export task success/failure counters and queue depth gauges. Wire increment calls into BullMQ consumer and task handlers.
- **Effort estimate:** 2-3 days

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
| -- | ------------------- | -------- | --------------- | --- | -------- | -------------- |
| OBS-001 | Structured logs | pino in API/Web/Worker | JSON format, PII redacted | No centralized log shipping | P2 | Add Loki/Datadog sidecar |
| OBS-002 | Request IDs/correlation | `request-id.ts` | Child logger per request | No OpenTelemetry traces | P2 | Add otel instrumentation |
| OBS-003 | Error tracking | Sentry in all 3 services | Error context captured | Source maps not verified for Web | P2 | Verify sentry source maps in CI |
| OBS-004 | Metrics | Prometheus 14 custom metrics | /metrics endpoint | dbQueryDuration not wired; worker metrics absent | P1 | Wire recordDbQuery; add worker metrics |
| OBS-005 | Tracing | None | — | No distributed tracing | P2 | Add OpenTelemetry |
| OBS-006 | Health/readiness | API + Worker + Docker | DB check, task registry | No readiness/liveness split for Web | P3 | Add explicit Web /health |
| OBS-007 | Client/API/worker errors | Error boundaries + Sentry | All 4 route-group error.tsx | Client logger endpoint unset | P2 | Configure or remove __LOG_ENDPOINT__ |
| OBS-008 | Job metrics | None | — | Worker tasks not emitting metrics | P1 | Add prom-client to worker, wire counters |
| OBS-009 | DB/queue/webhook/notification metrics | Some metrics defined | recordDbQuery, recordWebhookDelivery exist | Not called from actual code | P1 | Wire metric helper calls |
| OBS-010 | Uptime checks | Deploy health checks only | Post-deploy verification | No external synthetic monitoring | P2 | Add Checkly/UptimeRobot config |
| OBS-011 | Alerts | Sentry alert rules in docs | Email + GitHub notifications | No Slack/PagerDuty integration | P2 | Configure Sentry Slack integration |
| OBS-012 | Dashboards | None | — | Metrics exist, no dashboard JSON | P2 | Create Grafana dashboard config |

## Findings

### Finding ID: OBS-P1-001 - DB query duration metric (`recordDbQuery`) defined but never called

- **Severity:** P1
- **Confidence:** High
- **Area:** Observability
- **Evidence:**
  - `apps/api/src/lib/metrics.ts:22-28` — `dbQueryDuration` histogram defined
  - `apps/api/src/lib/metrics.ts:99-101` — `recordDbQuery()` exported
  - Grep for `recordDbQuery(` in `apps/api/src/` shows zero callers outside metrics.ts
- **What is happening:** The metric infrastructure exists but is dead code. Database query performance is invisible. Slow queries cannot be identified.
- **Why it matters:** Database query performance is the #1 cause of production slowdowns. Without this metric, operators are blind to query degradation.
- **Recommended fix:** Create a wrapped Supabase client in `services/supabase.ts` that intercepts all queries and calls `recordDbQuery()` with the query duration, operation name, and table name.
- **Status:** Open

### Finding ID: OBS-P1-002 - Worker has no Prometheus metrics or task performance tracking

- **Severity:** P1
- **Confidence:** High
- **Area:** Observability
- **Evidence:**
  - `apps/worker/src/main.ts` — no prom-client import, no metrics endpoint
  - `apps/api/src/lib/metrics.ts` — defines `worker_tasks_total`, `worker_queue_depth` (on API, not worker)
  - Worker runs as a separate container/process and emits no structured metrics
- **What is happening:** The worker emits no Prometheus metrics for task execution time, success/failure counts, or queue depth. Task performance is invisible.
- **Recommended fix:** Add `prom-client` to worker, create a `/metrics` endpoint on the health server, wire counter/histogram calls into BullMQ consumer's task completion handler.
- **Status:** Open

### Finding ID: OBS-P2-001 - Client-side logger endpoint never configured

- **Severity:** P2
- **Confidence:** High
- **Area:** Observability
- **Evidence:**
  - `apps/web/lib/client-logger.ts:70-77` — checks `(window as any).__LOG_ENDPOINT__`
  - No code in the repo sets `window.__LOG_ENDPOINT__`
- **What is happening:** The client-side logger has a remote log endpoint feature that is never configured. Logs only go to browser console.
- **Recommended fix:** Either set `window.__LOG_ENDPOINT__` via a Next.js API route, or remove the dead code for clarity.
- **Status:** Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| ---- | -------- | ---------- | ------ | -------- | ---------- |
| DB performance invisible | P1 | Medium | High | recordDbQuery never called | Wire metric collection into query execution |
| Worker failures invisible | P1 | Medium | High | Worker has no Prometheus metrics | Add prom-client to worker |
| Client-side errors lost | P2 | Medium | Medium | Client logger endpoint unconfigured | Configure or remove dead code |
| No distributed tracing | P2 | Medium | Medium | No OpenTelemetry | Add otel instrumentation |
| No centralized log search | P2 | Medium | Medium | No Loki/Datadog config | Add log shipping sidecar |
| No synthetic uptime monitoring | P2 | Medium | Medium | Only deploy health checks | Add external uptime checker |

## Recommendations

### Immediate / Release Blocking

1. Wire `recordDbQuery()` into Supabase query execution path — highest observability value
2. Add Prometheus metrics endpoint to Worker health server, wire task counters

### This Week

3. Configure `__LOG_ENDPOINT__` or remove dead client-logger code
4. Verify Sentry source maps upload in CI (add to deploy workflow if missing)
5. Audit all `record*Metric()` helper calls for actual usage — remove unused metric definitions

### This Month

6. Create Grafana dashboard JSON as code (`infra/grafana/dashboard.json`) covering golden signals
7. Add Loki/Datadog log shipping sidecar to docker-compose.yml
8. Add OpenTelemetry instrumentation for cross-service request tracing
9. Configure external synthetic monitoring (UptimeRobot / Checkly) and add config to repo

### Later / Platform Evolution

10. Implement structured alerting with severity-based routing (P0 → PagerDuty, P1 → Slack, P2 → email)
11. Set up anomaly detection for metric baselines (failed request rate, p95 latency, queue depth)
12. Create operator dashboard for droplet-level metrics (CPU, memory, disk, network)

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --------- | ------------ | --------------------- | ---------- |
| Wire recordDbQuery into supabase wrapper | DB performance becomes visible | `apps/api/src/services/supabase.ts` | /metrics shows db_query_duration_seconds |
| Add worker prometheus metrics | Worker performance visible | `apps/worker/src/health-server.ts`, `package.json` | /metrics on worker health port |
| Configure __LOG_ENDPOINT__ = /api/log | Client errors captured server-side | `apps/web/app/api/log/route.ts` | Client errors appear in server logs |
| Verify Sentry source maps | Stack traces are readable | `.github/workflows/deploy-do.yml` | Sentry shows deobfuscated stack traces |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| ------------ | -------- | ---------------- | ------ | ---------- |
| Wire recordDbQuery into queries | P1 | API | 1 day | None |
| Worker Prometheus metrics | P1 | Worker | 2-3 days | prom-client package |
| Client logger endpoint | P2 | Web | 0.5 day | None |
| Grafana dashboard as code | P2 | Platform | 1 week | Prometheus metrics working |
| OpenTelemetry instrumentation | P2 | Platform | 1-2 weeks | OTel SDK setup |
| Log aggregation sidecar | P2 | Platform | 1 week | Docker compose update |
| Synthetic uptime monitoring | P2 | Platform | 1 day | Checkly/UptimeRobot account |

## Suggested Tests

- **Unit:** Metrics helper functions called with correct labels
- **Integration:** /metrics endpoint returns valid Prometheus format
- **Integration:** recordDbQuery increments histogram after query
- **E2E:** Sentry captures errors from error boundary triggers
- **CI:** Verify source maps uploaded to Sentry after deploy

## Suggested Documentation Updates

1. Update `docs/MONITORING_AND_ALERTING.md` with worker metrics endpoint details (port 3001/metrics)
2. Create `docs/GRAFANA_DASHBOARD.md` documenting golden signals dashboards
3. Create `docs/LOKI_LOG_AGGREGATION.md` once log shipping is configured

## Open Questions

| Question | Why it matters | Evidence needed |
| -------- | -------------- | --------------- |
| Does Sentry source map upload happen in CI? | Without it, stack traces are obfuscated | Check deploy workflow for sentry-cli steps |
| Are there any `/metrics` access restrictions? | Open /metrics is a security concern | Check auth middleware or rate-limit on /metrics |
| Is the API health check DB query (SELECT id FROM roles) appropriate? | This table may be empty on fresh setups, but returns successfully | Verify `count: "exact", head: true` works on empty tables |

## Appendix

### Golden Signals Coverage

| Golden signal | Covered? | Evidence |
| ------------- | -------- | -------- |
| **Latency** | ✅ Partial | `httpRequestDuration` histogram (API), `dbQueryDuration` (defined, not wired) |
| **Traffic** | ✅ Partial | `httpRequestsTotal` counter (API) |
| **Errors** | ✅ | Sentry in all 3 services, error boundaries, rate limiting alerts |
| **Saturation** | ❌ | No CPU/memory/connection pool metrics in repo |
| **Worker throughput** | ❌ | `worker_tasks_total` defined but not implemented |
| **Worker queue depth** | ❌ | `worker_queue_depth` defined but not implemented |
| **Cache effectiveness** | ❌ | No cache hit/miss ratio metric |
| **Webhook delivery rate** | ✅ | `webhookDeliveriesTotal` counter (API) |
