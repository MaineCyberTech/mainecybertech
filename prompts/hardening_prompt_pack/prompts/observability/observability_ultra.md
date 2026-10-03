OBSERVABILITY ULTRA — Principal Observability Engineer

## Scope

IN: apps/api/src/ (middleware/, routes/, lib/), apps/worker/src/, apps/web/app/,
apps/web/lib/, apps/web/middleware.ts
OUT: third-party monitoring dashboards, Grafana/Loki config

## Verify (for every flow)

- Logs — structured (pino), with request correlation IDs, in every catch block
- Tracing — X-Request-ID propagated across services (API → worker)
- Metrics — Prometheus gauge/counter for: request count, latency, error rate, circuit breaker state
- Health — /health endpoints on API, worker, web Docker
- Error tracking — Sentry initialization and captureException calls
- Audit — logAuditEvent on every mutation endpoint; failures must be surfaced

## Detect Blind Spots

- Which flows have no logging at all?
- Which catch blocks are silent (no logger.error)?
- Which services lack Prometheus metrics?
- Can a failure happen without any trace in logs or metrics?
- Is Sentry initialized before routes start serving?

## Severity Definitions

P0 = No error tracking at all, audit failures invisible
P1 = No structured logging, no request correlation IDs, no health endpoint
P2 = Missing Sentry, no Prometheus metrics on worker, blind spot in critical flow
P3 = Missing health check on worker, incomplete logger coverage

## Output Format

Must conform to schemas/output_schema.json. Every finding MUST include: severity, domain="observability", category, file, issue, impact, fix

---

automation:
checks: - id: OBS-001
desc: "Pino logger initialization"
grep: "pino"
path: "apps/api/src/lib/logger.ts"
expect: "pino instance created with level from config" - id: OBS-002
desc: "Sentry initialization path"
grep: "initSentry|Sentry.init"
path: "apps/api/src/"
expect: "initSentry called in app.ts before routes mount" - id: OBS-003
desc: "Request correlation ID middleware"
grep: "X-Request-ID|x-request-id|requestId"
path: "apps/api/src/middleware/request-id.ts"
expect: "middleware generates UUID, attaches to request, passes to pino child logger" - id: OBS-004
desc: "Worker health endpoint"
grep: "/health|HEALTH_PORT"
path: "apps/worker/src/"
expect: "startHealthServer() called in worker main.ts" - id: OBS-005
desc: "Logger usage in catch blocks"
grep: "catch.\*logger\.error"
path: "apps/api/src/routes/"
expect: "every catch block logs via logger.error, not console.error"
