# Monitoring & Alerting Strategy

## Overview

MCT runs on a single DigitalOcean droplet behind Caddy. Monitoring uses application logging, health checks, Sentry error tracking, and CI deploy verification.

---

## 1. Application-Level Logging

All services use **pino** for structured JSON logging with `X-Request-ID` correlation.

### Log format

```
{"level":30,"time":1712345678901,"msg":"request completed","requestId":"abc-123","method":"GET","path":"/api/v1/tickets","status":200,"duration":42}
```

### PII redaction

The following fields are automatically redacted (value replaced with `[REDACTED]`):

- `password`, `secret`, `token`, `authorization`, `cookie`
- `req.headers.authorization`, `req.headers.cookie`
- `email`, `phone`, `fullName`, `full_name`
- `req.body.email`, `req.body.phone`

### Per-service logging

| Service    | Enricher                 | Key fields                                                |
| ---------- | ------------------------ | --------------------------------------------------------- |
| **API**    | `requestId` middleware   | `method`, `path`, `status`, `duration`, `userAgent`, `ip` |
| **Worker** | task handler wrapper     | `type`, `taskId`, `duration`, `success`                   |
| **Web**    | Next.js server-side pino | Standard request logging                                  |

Errors include `requestId`, `path`, `method`, error `code`, `message`, `stack`.

### Viewing logs

On the droplet:

```bash
docker compose logs -f api       # Follow API logs
docker compose logs -f worker    # Follow worker logs
docker compose logs -f web       # Follow web logs
docker compose logs --tail=200   # Last 200 lines all services
```

### Retention across deploys

Container logs use Docker's `json-file` driver with rotation (`max-size: 10m`,
`max-file: 3` per container — `infra/digitalocean/docker-compose.yml`). Because
`deploy-do.yml` recreates the app containers on every deploy (and rollback
still runs `docker compose down`/`up`), replacing a container would otherwise
destroy its logs. Immediately before the rolling recreate, the deploy snapshots
the running stack's logs, gzipped, to
`/opt/mct-portal/logs/pre-deploy-<UTC timestamp>.log.gz` and keeps only the
last 7 snapshots:

```bash
ls -1t /opt/mct-portal/logs/                                  # newest first
zcat /opt/mct-portal/logs/pre-deploy-20261011T042600Z.log.gz | less
```

Shipping logs off-box (e.g. a `vector` sidecar to Loki / Grafana Cloud /
Datadog) remains an operator follow-up; until then these droplet-local
snapshots are the cross-deploy history.

Forward logs to a central service (future):

- `vector` sidecar to ship to Datadog / Grafana Cloud / Loki
- syslog-style `docker compose logs --tail=0 --follow | your-forwarder`

---

## 2. Health Check Endpoints

### Exposed endpoints

| Endpoint             | Service | Port | Expected response                                                  | Checks                                                      |
| -------------------- | ------- | ---- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| `GET /health`        | API     | 4000 | `200 {"service":"api","status":"healthy","uptime":...}`            | DB connectivity (+ Stripe/JSM when configured)              |
| `GET /health/detail` | API     | 4000 | `200` with `checks` + `degraded`; **404** without the bearer token | DB, Stripe, JSM, Redis (see semantics below)                |
| `GET /health`        | Worker  | 3001 | `200 {"status":"healthy","uptime":...}`                            | Task registry loaded, shutting down flag, queue connection  |
| `GET /`              | Web     | 3000 | `200` (any HTML)                                                   | Server is serving                                           |

### API health response

The public probe (`/health`) is deliberately minimal — provider names,
configuration presence (`not_configured`) and raw dependency errors are not
disclosed to unauthenticated callers (SEC-P2-003):

```json
{ "service": "api", "status": "healthy", "uptime": 12345.6 }
```

The full dependency detail lives on `/health/detail`, gated by the same shared
bearer token as `/metrics` (`METRICS_TOKEN`); without a configured/presented
token the route returns **404**:

```json
{
  "service": "api",
  "status": "healthy",
  "checks": {
    "database": { "status": "healthy", "latencyMs": 3 },
    "stripe": { "status": "not_configured" },
    "jsm": { "status": "healthy", "latencyMs": 120 },
    "redis": { "status": "healthy", "latencyMs": 1 }
  },
  "degraded": [],
  "uptime": 12345.6
}
```

Both endpoints return **503** with `"status":"degraded"` when a health-gating
check fails:

- **database** — unhealthy → 503.
- **stripe** / **jsm** — checked only when the matching credentials are
  configured (`not_configured` never degrades); a configured provider that is
  unreachable → 503. Results are cached for 30s so a public probe does not fan
  out to the providers on every hit.
- **redis** — **reported but never degrades** the response. It appears in
  `checks` on `/health/detail` and in `degraded[]` when the probe fails, but
  the API keeps serving on per-process fallbacks (memory cache, in-memory
  idempotency; scan locks fail open), so a Redis outage must not make the API —
  or the deploy gate — look down (ARCH-P2-005).

**Redis severity:** Redis is an alertable *degradation*, not an API outage.
`portal_redis_connected` and `portal_redis_failures_total` drive the
warning-severity `MCTApiRedisDegraded` (probe failing 5m) and
`MCTRedisOperationFailures` (any fallback in 15m) rules (§4/§7). The worker
`/health` is different: it returns 503 when its BullMQ queue connection is
lost, because a lost consumer is a real outage (RES-P2-008).

### Worker health response

```json
{
  "service": "worker",
  "status": "healthy",
  "uptime": 12345.6,
  "registeredTasks": [
    "stripe-reconcile",
    "jira-sync",
    "jsm-sync",
    "m365-calendar-sync",
    "scheduled-notifications"
  ],
  "shuttingDown": false,
  "queueBackend": "bullmq",
  "queue": { "connected": true }
}
```

Returns **503** with `"status": "degraded"` when the BullMQ queue connection (producer Queue or consumer Worker) is lost, so the compose healthcheck and the deploy health gate fail on a queue outage (RES-P2-008). `queueBackend` is the worker's configured consumer backend (ARCH-P2-004); the API exposes its producer backend as `portal_queue_backend_info` so a mismatch (enqueued work never consumed) is visible.

### External uptime probe (OBS-P2-016)

The health checks above run on the droplet, so a DNS, Cloudflare, edge-proxy or
droplet-network failure leaves every internal scrape green while users are
down. [`external-uptime-probe.yml`](../.github/workflows/external-uptime-probe.yml)
closes that gap: an hourly GitHub Actions job curls the public endpoints from
**outside** the droplet and asserts the status codes and latency budgets
committed in [`scripts/uptime/probe-targets.json`](../scripts/uptime/probe-targets.json):

| Target | Expects | Latency budget |
| ------ | ------- | -------------- |
| `https://app.mainecybertech.com/api/v1/store/products` | 200 | 3000 ms |
| `https://app.mainecybertech.com/login` | 200/301/302/307 | 3000 ms |
| `https://api.mainecybertech.us/health` | 200 | 2000 ms |
| `https://app.mainecybertech.us/login` | 200/301/302/307 | 3000 ms |

Each target gets up to 3 attempts (5 s apart) so a single cold TCP/TLS
handshake does not page anyone; a target that fails every attempt fails the run
and notifies through the same ntfy/Slack pattern as the backup workflows
(fail-loud when no channel is configured). Override the list per run (dispatch
input `targets`) or for all runs with the `UPTIME_PROBE_TARGETS` repository
variable; set `UPTIME_PROBE_ENABLED=false` to pause the schedule during a known
outage. Reports are uploaded as the `uptime-report` artifact.

OBS-P2-017: the production API is served through the web host under `/api/v1/*`
(the web app rewrites those paths to the API), so the probe checks a public API
read there. The documented `api.mainecybertech.com` hostname still resolves to
a retired non-droplet endpoint that answers 404 for every path (an Express
service, not the droplet's Caddy — see `docs/PRODUCTION_VS_TESTING_DOMAINS.md`
for the current droplet topology). Repointing that DNS record at the prod
droplet is operator work; until it is done, the same 404 also fails the prod
deploy's public API gate in `deploy-do.yml` (`https://$API_DOMAIN/health`),
which is a separate residual. Once the record is fixed, add an
`api.mainecybertech.com/health` target back to the probe list.

### Functional smoke check (TEST-P3-002)

The uptime probe asserts status codes and latency; it does not prove a user can
log in and read data. [`smoke-check.yml`](../.github/workflows/smoke-check.yml)
runs every 30 minutes from outside the droplet and exercises the user path with
[`scripts/uptime/smoke.mjs`](../scripts/uptime/smoke.mjs):

1. `GET <api>/health` returns 200;
2. `GET <web>/login` renders;
3. an authenticated read succeeds — `POST /api/v1/auth/sign-in` with the smoke
   account, then `GET /api/v1/auth/me` with the returned token.

It targets **dev by default**. Prod is included once the operator sets the
`SMOKE_PROD_ENABLED` repository variable to `true` (the prod environment must
exist first); a manual dispatch can choose `dev`, `prod` or `both`. Until the
`SMOKE_EMAIL` / `SMOKE_PASSWORD` secrets are provisioned (a dedicated read-only,
non-MFA account — set them on `dev` or repo-wide), the authenticated read is
reported as skipped and only health + login gate. Failures notify through the
same ntfy/Slack path as the backup/uptime workflows (fail-loud when no channel
is configured) and the run's `smoke-report` artifact lists each check.

---

## 3. Docker Health Checks

Defined in `docker-compose.yml` (or the service Dockerfile when compose does not
override it), each with its own interval:

| Service          | Command                                                                 | Interval               | Retries |
| ---------------- | ----------------------------------------------------------------------- | ---------------------- | ------- |
| **redis**        | `REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli ping` (password via env, not argv) | 10s              | 3       |
| **api**          | `wget -qO- http://localhost:4000/health`                                | 30s (30s start period) | 3       |
| **worker**       | `wget -qO- http://127.0.0.1:3001/health`                                | 30s (30s start period) | 3       |
| **web**          | `wget --spider http://127.0.0.1:3000` (Dockerfile)                      | 30s (40s start period) | 3       |
| **prometheus**   | `wget --spider -q http://localhost:9090/-/ready`                        | 30s (15s start period) | 3       |
| **alertmanager** | `wget --spider -q http://localhost:9093/-/healthy`                      | 30s (10s start period) | 3       |
| **caddy**        | `caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile`      | 30s (20s start period) | 3       |

Unhealthy containers are automatically restarted via `restart: unless-stopped`.

---

## 4. Prometheus Metrics (implemented)

`GET /metrics` (`apps/api/src/app.ts`) exposes Prometheus-formatted counters and histograms behind a **fail-closed shared-token gate**: it returns **404 unless `METRICS_TOKEN` is configured and the caller presents it as a bearer token** (an unset token disables the endpoint rather than exposing metric labels). `infra/digitalocean/docker-compose.yml` runs a `prometheus` service (`prom/prometheus:v3.5.1`) that scrapes it using `prometheus.yml` + `prometheus.rules.yml`, authenticating the API scrape with the `METRICS_TOKEN` bearer credential from the deploy-written `metrics-token` credentials file (mode 400, owned by the container user so the scrape can read it). In production Caddy returns 404 for `/metrics`, so scraping is internal to the compose network.

### Custom metrics

API (`apps/api/src/lib/metrics.ts`, all prefixed `portal_`; default `process_*`/`node_*` metrics are also collected with the same prefix):

| Metric                                                                       | Type      | Labels                           | Status             |
| ---------------------------------------------------------------------------- | --------- | -------------------------------- | ------------------ |
| `portal_http_requests_total`                                                 | Counter   | `method`, `route`, `status_code` | live               |
| `portal_http_request_duration_seconds`                                       | Histogram | `method`, `route`, `status_code` | live               |
| `portal_webhook_deliveries_total`                                            | Counter   | `status`, `event`                | live               |
| `portal_webhook_dead_letters_total`                                          | Counter   | `event`                          | live               |
| `portal_auth_attempts_total`                                                 | Counter   | `result`                         | live               |
| `portal_circuit_breaker_status`                                              | Gauge     | `name`                           | live               |
| `portal_db_query_duration_seconds`                                           | Histogram | `operation`, `table`             | live               |
| `portal_organizations_created_total` etc. (`projects`/`tickets`/`documents`) | Counter   | —                                | live               |
| `portal_search_queries_total`                                                | Counter   | —                                | live               |
| `portal_active_organizations` / `portal_active_users`                        | Gauge     | —                                | live               |
| `portal_idempotency_key_hits_total`                                          | Counter   | —                                | live               |
| `portal_billing_dunning_notifications_total`                                 | Counter   | `outcome`                        | live               |
| `portal_impersonation_events_total`                                          | Counter   | `actor_role_key`, `source`       | live               |
| `portal_rls_bypass_total`                                                    | Counter   | `module`, `kind`, `org_resolved` | live               |
| `portal_rls_enforced_total`                                                  | Counter   | `module`, `kind`                 | live               |
| `portal_notification_delivery_total`                                         | Counter   | `channel`, `status`              | live               |
| `portal_notification_suppressed_total`                                       | Counter   | `channel`, `module`              | live               |
| `portal_notification_dedup_total`                                            | Counter   | `channel`                        | live               |
| `portal_redis_failures_total`                                                | Counter   | `component`, `operation`         | live               |
| `portal_redis_connected`                                                     | Gauge     | —                                | live               |
| `portal_queue_backend_info`                                                  | Gauge     | `backend`                        | live               |

Worker (`apps/worker/src/metrics.ts`):

| Metric                                   | Type      | Labels                |
| ---------------------------------------- | --------- | --------------------- |
| `worker_task_executions_total`           | Counter   | `task_type`, `status` |
| `worker_task_execution_duration_seconds` | Histogram | `task_type`           |
| `worker_task_queue_depth`                | Gauge     | `queue`               |
| `worker_queue_connected`                 | Gauge     | —                     |
| `worker_registered_tasks`                | Gauge     | —                     |
| `worker_memory_usage_bytes`              | Gauge     | —                     |
| `worker_notification_delivery_total`     | Counter   | `channel`, `status`   |
| `worker_notification_suppressed_total`   | Counter   | `channel`, `module`   |
| `worker_webhook_deliveries_total`        | Counter   | `status`, `event`     |
| `worker_webhook_dead_letters_total`      | Counter   | `event`               |
| `worker_task_dead_letters_total`         | Counter   | `task_type`           |
| `worker_push_subscriptions_revoked_total` | Counter  | —                     |
| `worker_stripe_reconcile_drift_total`    | Counter   | `kind`                |
| `worker_redis_failures_total`            | Counter   | `component`, `operation` |
| `worker_queue_backend_info`              | Gauge     | `backend`             |

`portal_notification_delivery_total` records the API-side email enqueue as
`status="queued"` — a hand-off, not a delivery (NOTIF-P2-010). The notification
delivery SLO (#4 in `docs/SLO.md`) is therefore computed from the worker's
terminal `worker_notification_delivery_total{status=~"success|failed"}`
outcomes, which carry the real SMTP result; `MCTNotificationDeliveryFailureRateHigh`
alerts on the same ratio (its API branch still covers inline fallback sends),
and `skipped` is tracked separately by `MCTNotificationEmailSkipped`.

`worker_queue_connected` is 1 while the worker's BullMQ connections are ready and 0 when either is lost; `MCTWorkerQueueDisconnected` alerts on `== 0` for 5m, and `MCTWorkerQueueBacklogGrowing` alerts on a growing `worker_task_queue_depth` (RES-P2-008) alongside the absolute `MCTWorkerQueueBacklog` rule (OBS-P2-009).

`portal_redis_connected`, `portal_redis_failures_total` and `worker_redis_failures_total` make Redis degradation visible (ARCH-P2-005). One non-replicated Redis backs the queue, cache, idempotency and scan locks; when it fails the API keeps serving on per-process fallbacks (memory cache, in-memory idempotency) and scan locks fail open, so `MCTApiRedisDegraded` (probe failing 5m) and `MCTRedisOperationFailures` (any fallback in 15m) are the alertable signals. See `docs/PLATFORM_FAILURE_RUNBOOKS.md` §1 for the per-consumer fail-open/fail-closed behavior.

`portal_queue_backend_info` (API producer) and `worker_queue_backend_info` (worker consumer) expose the shared `QUEUE_BACKEND` contract (ARCH-P2-004). Both processes fail closed in production on anything but `bullmq`, and a mismatch is visible by comparing the two series; the worker `/health` payload also carries `queueBackend`.

The alert rules in §7 are all queries over these series; for example `MCTHighRequestErrorRate` → `portal_http_requests_total{status_code=~"5.."}`, `MCTImpersonationBurst` → `portal_impersonation_events_total`, and `MCTTenantScopeRegression` / `MCTRlsEnforcedShareCollapsed` → `portal_rls_bypass_total` / `portal_rls_enforced_total`.

The `route` label on the two HTTP metrics is the matched Express route template (`req.baseUrl + req.route.path`, e.g. `/api/v1/tickets/:id`), not the concrete request path; requests that never matched a route (404s, `/metrics`) collapse to `unmatched`. Resource ids therefore never become label values and Prometheus series stay bounded (OBS-P2-010 / PERF-P2-001).

### Scraping

The compose `prometheus` service scrapes the API on the internal network; no public exposure. `prometheus.yml` uses a global `scrape_interval` of **15s** — 4 scrapes/min per target (`mct-api`, `mct-worker`, `prometheus`). The API's `/metrics` limiter allows **12 requests/min per source IP** (`apps/api/src/middleware/rate-limit.ts`), so a scrape plus ad-hoc debugging or a retry has headroom and the scrape cannot self-throttle (OBS-P3-006).

### Alert delivery

Firing alerts are forwarded to an **Alertmanager** service (`infra/digitalocean/alertmanager.tmpl.yml`)
on the same internal network — see §9. The deployed receiver is the org **ntfy** instance:
`critical` and `default` alerts POST to `https://ntfy.mainecybertech.us/portal-alerts` with basic
auth from the write-only `portal-relay` user (`ALERTMANAGER_WEBHOOK_USER`/`ALERTMANAGER_WEBHOOK_PASS`).
The `Watchdog` rule routes to a separate external dead-man's-switch receiver; that URL
(`ALERTMANAGER_WATCHDOG_WEBHOOK_URL`) is **still unset**, so the off-box heartbeat is not yet live
and a total loss of the droplet is not independently detected until an operator provisions it (§9).

---

## 5. Sentry Error Tracking

Initialized in all 3 services but **skipped when the DSN is unset** (safe in local dev). The API and worker read `SENTRY_DSN`; the web app reads `NEXT_PUBLIC_SENTRY_DSN` (the same DSN — Sentry DSNs are public by design). `deploy-do.yml` delivers it to the web image as a build arg (Next inlines `NEXT_PUBLIC_*` into the client bundle, which is required for browser error capture) and writes it to the droplet `.env` for the web service runtime env. When it is missing in a production web build, `apps/web/instrumentation.ts` logs a boot warning (OBS-P2-011).

All three services tag events with a **release** (OBS-P3-004): `deploy-do.yml` writes `SENTRY_RELEASE` — the deployed commit/image tag, including the rolled-back SHA on a rollback dispatch — to the droplet `.env`, and compose passes it to the API, worker and web services. The API and worker read it directly (`apps/api/src/lib/sentry.ts`, `apps/worker/src/main.ts`); the web server-side configs use it too, while the browser bundle keeps its build-time `NEXT_PUBLIC_GIT_SHA`.

| Service    | Init location                                     | Capture                                                                            |
| ---------- | ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **API**    | `apps/api/src/lib/sentry.ts` → `app.ts`           | All errors via error middleware, attachments include `requestId`, `path`, `method` |
| **Worker** | `apps/worker/src/main.ts`                         | All task failures via `Sentry.captureException` with task type metadata            |
| **Web**    | `instrumentation.ts` + server/edge/client configs | Route errors, unhandled exceptions                                                 |

### PII scrubbing and retention (AN-P3-004)

Error telemetry is **scrubbed at the SDK boundary** before transport:

- Every init sets `sendDefaultPii: false` and routes events through `beforeSend`
  (`apps/api/src/lib/sentry-scrub.ts`, `apps/web/lib/sentry-scrub.ts`,
  `apps/worker/src/lib/sentry-scrub.ts`). The hook redacts values held under PII
  keys (names, email, phone, credentials, tokens, IP) recursively in
  `extra`/`contexts`/breadcrumb data and request bodies, drops request cookies
  outright, redacts sensitive request headers, and removes
  `user.email`/`username`/`ip_address` (the opaque `user.id` is kept for
  triage). Free-text exception/breadcrumb messages cannot be scrubbed by key
  name — callers must not log personal data there (same rule as audit metadata).
- **Retention** is controlled by the Sentry organization setting, not by this
  repository. The operator keeps it at the shortest plan-supported window and
  records the current value in the subprocessor review; SDK-side scrubbing is
  the primary control because it also protects data in transit and at the
  vendor. Vendor disclosure lives in `docs/SUBPROCESSORS.md` and the public
  privacy page.

### Alert rules (set in Sentry)

- **Any issue with >10 events in 5 min** → Notify #alerts
- **Any issue affecting auth endpoint** → Notify immediately
- **New issue (first seen)** → Notify #alerts
- **Regression** → Notify #alerts

---

## 6. Deploy Verification

CI workflow (`deploy-do.yml`) performs health checks after every deploy:

1. **Push images** to GHCR (`ghcr.io/mainecybertech/mct-{api,worker,web}:$SHA`)
2. **SSH into droplet** → `docker compose pull && docker compose up -d`
3. **Health check loop (API):** retry `https://$API_DOMAIN/health` for up to 120s (30 attempts × 4s)
   - Accepts `200` or `526` (Cloudflare origin cert loading)
   - Fails → workflow exits with error
4. **Health check loop (Web):** retry `https://$APP_DOMAIN/login` for up to 60s (15 attempts × 4s)
   - Accepts any non-zero HTTP code (page loading)
   - Fails → workflow exits with error
5. **Mark deploy as complete** → only healthy deploys proceed

### Rollback on failure

The workflow includes a `rollback-on-failure` step that reverts to the previous image tag. Manual rollback also available via `workflow_dispatch` with `input.rollback-tag`.

---

## 7. Alerting Strategy

### What triggers alerts

| Trigger                      | Severity | Channel                  | Response                      |
| ---------------------------- | -------- | ------------------------ | ----------------------------- |
| Sentry issue >10 events/5min | Warning  | Sentry → Email/Slack     | Investigate and deploy fix    |
| Sentry auth endpoint error   | Critical | Sentry → Email           | Immediate investigation       |
| Deploy workflow failure      | Critical | GitHub notification      | Check workflow logs, rollback |
| Deploy health check timeout  | Critical | GitHub notification      | SSH into droplet, diagnose    |
| Docker container restarting  | Warning  | `docker events` / manual | Check logs, resource limits   |
| Droplet CPU > 80%            | Warning  | DO monitoring            | Check for memory leak, scale  |
| Droplet disk > 85%           | Warning  | DO monitoring            | Prune Docker images, logs     |
| Supabase connection pool     | Warning  | Supabase dashboard       | Check for connection leaks    |
| Prometheus rules | Critical/Warning/None | Alertmanager → ntfy `portal-alerts` (critical/default) or the off-box dead-man's switch (`Watchdog`) | See the rule table below; delivery is wired but not yet exercised end-to-end (OBS-P2-014) |
| `Watchdog` (always firing)   | None     | Alertmanager → off-box dead-man's switch (§9; URL still unset) | Alert path itself died → external service pages (once provisioned) |
| Backup/restore staleness (no successful backup or restore test within its freshness window) | Critical | `Backup Staleness Check` workflow → ntfy/Slack (fail-closed); worker `backup-dr-check` on the `platform_backup_heartbeats` table (DR-P2-008, 30 h) → `MCTWorkerTaskFailures` | Check the backup workflow runs, Spaces credentials and `scripts/backup-*.sh` logs; both checks are independent of the backup jobs |
| External uptime probe failure (public API/web endpoint down or over its latency budget) | Critical | `External uptime probe` workflow → ntfy/Slack (fail-closed) | Open the run's `uptime-report` artifact; if the whole platform is unreachable from outside, follow the platform failure runbooks |
| Smoke check failure (API health, web login or an authenticated read) | Critical | `Smoke check` workflow → ntfy/Slack (fail-loud) | Open the run's `smoke-report` artifact and the job summary; a failing auth read with a green login usually means an auth/session regression, not an outage |

#### Prometheus alert rules (`prometheus.rules.yml`)

Every rule below is delivered through Alertmanager (§9): `critical` → the critical
receiver, everything else → the default receiver, and `Watchdog` → the external
dead-man's switch.

| Alert                                  | Severity | Fires when                                                                                 |
| -------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `MCTServiceDown`                       | critical | `up{job=~"mct-api\|mct-worker"} == 0` for 2m                                               |
| `MCTHighRequestErrorRate`              | warning  | 5xx share of requests > 5% for 5m                                                          |
| `MCTHighRequestLatency`                | warning  | p95 request latency > 2s for 10m (SLO #2)                                                  |
| `MCTCircuitBreakerOpen`                | critical | `portal_circuit_breaker_status == 2` for 5m                                                |
| `MCTAuthFailureRateHigh`               | warning  | auth failure ratio > 50% (≥3 failures/min) for 10m                                         |
| `MCTImpersonationActivity`             | warning  | any cross-tenant/impersonation event in 15m                                                |
| `MCTImpersonationBurst`                | warning  | > 0.5 impersonation events/s over 10m                                                      |
| `MCTTenantScopeRegression`             | warning  | a module serves ≥50% of its RLS-bypassing selections with no org for 15m                   |
| `MCTRlsEnforcedShareCollapsed`         | warning  | a module that used the RLS client produces none for 30m while still serving                |
| `MCTWebhookDeadLettersAccumulating`    | warning  | any webhook dead letter (API or worker) in 1h                                              |
| `MCTWebhookDeliveryFailureRateHigh`    | critical | webhook failure ratio > 50% for 15m                                                        |
| `MCTNotificationDeliveryFailureRateHigh` | warning | notification failure ratio > 5% for 30m (SLO #4)                                          |
| `MCTNotificationEmailSkipped`          | warning  | any email delivery skipped (SMTP not configured) in 1h                                     |
| `MCTWorkerTaskFailures`                | warning  | failure/error/timeout/no_handler executions for 10m                                        |
| `MCTWorkerTaskDeadLettered`            | warning  | any task exhausted its BullMQ retries in 15m                                               |
| `MCTWorkerQueueBacklog`                | warning  | `worker_task_queue_depth{queue="mct-tasks"} > 50` for 15m                                  |
| `MCTWorkerQueueBacklogGrowing`         | warning  | queue depth > 20 and grown by > 25 over 10m, sustained for 10m                             |
| `MCTWorkerQueueDisconnected`           | critical | `worker_queue_connected == 0` for 5m                                                       |
| `MCTStripeReconcileDrift`              | warning  | any Stripe reconciliation drift in 25h                                                     |
| `MCTApiRedisDegraded`                  | warning  | `portal_redis_connected == 0` for 5m (Redis degradation; the API stays up, §2)             |
| `MCTRedisOperationFailures`            | warning  | any Redis fallback operation (API or worker) in 15m                                        |
| `Watchdog`                             | none     | always firing; heartbeat to the off-box dead-man's switch every 5m (§9)                    |

### Notification channels

| Channel                  | Use for                                 |
| ------------------------ | --------------------------------------- |
| **GitHub notifications** | Deploy workflow failures, CI failures   |
| **Email (Sentry)**       | Critical error spikes                   |
| **DO Monitoring**        | Droplet-level CPU, disk, memory         |
| **Teams webhooks**       | Contact form leads (marketing, not ops) |
| **Alertmanager → ntfy** (`portal-alerts` topic) | `critical`/`default` Prometheus alerts (see §9) |
| **ntfy `portal-status`** (public) | Customer-facing platform status updates — [STATUS_AND_COMMUNICATION.md](STATUS_AND_COMMUNICATION.md); not the machine alert feed |
| **Alertmanager → external dead-man's switch** | `Watchdog` heartbeat; URL still unset — operator action (see §9) |

### No dedicated pager/on-call

This is a single-droplet deployment. Alerts are best-effort. The main alert path is:

1. Sentry captures error → email notification
2. Deploy fails → GitHub notification
3. Prometheus alert fires → Alertmanager → ntfy `portal-alerts` (§9)
4. Operator SSHes in and follows incident response

The **off-box dead-man's switch in §9 is the exception to "best-effort"**: it is the only
path that survives the total loss of this droplet, because the receiver lives outside it.
Its external heartbeat URL is still unset, so this path is configured but not yet live
(see §9).

---

## 8. Incident Response Checklist

### Immediate (first 5 min)

1. Check deploy status — was there a recent deploy? Check GitHub Actions
2. SSH into droplet: `ssh root@<droplet-ip>`
3. Check running containers: `docker compose ps`
4. Check logs: `docker compose logs --tail=50 <service>`
5. Hit health endpoints manually: `curl localhost:4000/health`; dependency detail (Stripe/JSM/Redis) requires the token: `curl -H "Authorization: Bearer $METRICS_TOKEN" localhost:4000/health/detail`

### Diagnosis (5-15 min)

6. Check Sentry for recent errors: `https://sentry.io/organizations/mainecybertech/`
7. Check disk space: `df -h` (prune with `docker image prune -a` if >85%)
8. Check memory: `docker stats` (limits: api 256m, worker 256m, web 512m, redis 48m, caddy 64m, prometheus 256m, alertmanager 128m)
9. Check Docker health status: `docker inspect --format='{{json .State.Health}}' <container>`

### Resolution

10. Restart service: `docker compose restart <service>`
11. Full recycle: `docker compose down && docker compose up -d`
12. Rollback image: See `docs/ROLLBACK_PROCEDURES.md`
13. Increase resources: Edit `mem_limit` in `docker-compose.yml`, re-deploy

### Post-incident

14. Open PR with fix and test coverage
15. Add to runbook if new failure mode discovered
16. Update Sentry alert thresholds if needed

---

## 9. Alert Delivery & the Off-Box Dead-Man's Switch (IR-P0-003)

This section documents the alert path that survives the failure of the monitoring stack
itself. It implements the fix for audit finding **IR-P0-003** ("total loss of the
monitoring/alerting path has no independent dead-man's-switch receiver") — with one
operator action still outstanding: the external heartbeat URL is not provisioned yet.

### Components

| Component | Where | Purpose |
| --------- | ----- | ------- |
| `prometheus` (`prometheus.yml`) | compose, internal only | Evaluates `prometheus.rules.yml`; forwards firing alerts via `alerting: alertmanagers:` → `alertmanager:9093` |
| `alertmanager` (`alertmanager.tmpl.yml`) | compose, internal only (port 9093, **not published**) | Routes alerts to receivers. Compose renders `${VAR}` placeholders from the container environment at start (`render-alertmanager.awk`; values are escaped for the double-quoted YAML scalars, so `&`, `\` or `"` in a secret cannot corrupt the config — OBS-P3-005) |
| ntfy receiver (**deployed**) | **off the droplet** (`https://ntfy.mainecybertech.us/portal-alerts`) | The live delivery path for `critical` and `default` alerts; basic auth with the write-only `portal-relay` user |
| Off-box dead-man's switch (**not provisioned**) | **off the droplet** | A ping/heartbeat URL (healthchecks.io-style) that alerts *you* when the pings stop. `ALERTMANAGER_WATCHDOG_WEBHOOK_URL` is **still unset**, so the watchdog heartbeat currently goes to the compose no-op URL instead of leaving the box |

### How an alert leaves the box

1. Prometheus evaluates the rules every 15s (`evaluation_interval`).
2. A firing alert (e.g. `MCTServiceDown`) is pushed to Alertmanager over the internal
   compose network (`http://alertmanager:9093`).
3. Alertmanager's routing tree decides the receiver:
   - `severity="critical"` → the **critical** receiver (ntfy `portal-alerts` webhook; Slack if configured), `repeat_interval: 1h`.
   - `alertname="Watchdog"` → the **watchdog** receiver (the dead-man's switch), `repeat_interval: 5m`.
   - everything else → the **default** receiver (ntfy `portal-alerts` webhook; Slack if configured).
4. The receiver calls an external URL over the droplet's egress. No inbound port is opened
   on the droplet — Alertmanager is reachable only inside the compose network.

### How the dead-man's switch works

The `Watchdog` rule is `expr: vector(1)` — it is *always* firing. That is deliberate.
Prometheus therefore pushes a Watchdog alert to Alertmanager continuously, and
**once `ALERTMANAGER_WATCHDOG_WEBHOOK_URL` points at an external service** Alertmanager
pings that URL every 5 minutes. The external service (e.g. Healthchecks/Deadman) is
configured with a grace period; as long as a ping arrives, it stays quiet. **If the pings
stop, the external service pages you** — from a system that does not share the droplet.
**The URL is still unset in the deployed environment**, so today the heartbeat stays on
the box and this protection is configured but not yet live.

This inverts the failure mode of ordinary alerting: instead of "an alert failed to arrive"
being silent, "no heartbeat arrived" is itself the alarm.

### What happens when the whole stack dies

| Failure | What still works | What you get |
| ------- | ---------------- | ------------ |
| API or Worker container crashes | Prometheus + Alertmanager | `MCTServiceDown` → critical receiver within ~2m |
| Prometheus crashes | Alertmanager still runs but has no input | Watchdog pings stop → **external service pages** after the grace period |
| Alertmanager crashes | Prometheus still runs | Watchdog pings stop → **external service pages** after the grace period |
| Entire droplet / power / network egress is down | Nothing on the box | Watchdog pings stop → **external service pages** after the grace period |
| Sentry DSN unset | Prometheus path unaffected | Watchdog + rule-based alerts still deliver |

The dead-man's switch is the only channel that does not depend on anything inside the
droplet. It should be tested by stopping `alertmanager` (or `prometheus`) and confirming
the external service reports the missed heartbeat within its grace period. While
`ALERTMANAGER_WATCHDOG_WEBHOOK_URL` is unset, the "external service pages" outcomes in
the table above do not apply — a total droplet loss is currently undetected off-box —
and no missed-heartbeat drill has been recorded yet.

### Required environment variables

Set these in the droplet `.env` (and as GitHub environment secrets so redeploys preserve
them). **Names only — never commit the values.**

| Variable | Required? | What it is |
| -------- | --------- | ---------- |
| `ALERTMANAGER_WATCHDOG_WEBHOOK_URL` | **Yes** | **The dead-man's switch.** An external ping/heartbeat URL (healthchecks.io-style) or an external webhook, **not hosted on this droplet**. **Still unset in the deployed environment** — provision it to make the off-box heartbeat real; production deploys fail closed without it. |
| `ALERTMANAGER_CRITICAL_WEBHOOK_URL` | Yes (for real alerts) | External inbound webhook for critical alerts. Set to the ntfy `portal-alerts` topic (`https://ntfy.mainecybertech.us/portal-alerts`) in the deployed environment; Slack/Teams/PagerDuty/Opsgenie/generic relays also work. |
| `ALERTMANAGER_DEFAULT_WEBHOOK_URL` | Optional | Catch-all receiver for non-critical alerts. Set to the ntfy `portal-alerts` topic in the deployed environment. |
| `ALERTMANAGER_SLACK_API_URL` | Optional | Slack incoming-webhook URL used by the default/critical receivers. |
| `ALERTMANAGER_SLACK_CHANNEL` | Optional | Slack channel name (e.g. `#alerts`). Non-secret. |
| `ALERTMANAGER_WEBHOOK_USER` | With a webhook URL | Basic-auth username sent with the critical/default webhook POSTs (the ntfy relay user `portal-relay` in the deployed environment). |
| `ALERTMANAGER_WEBHOOK_PASS` | With a webhook URL | Basic-auth password for the above. Secret. |

If a variable is unset, compose substitutes a no-op localhost URL so the stack still
starts — but **the dead-man's switch is only real when `ALERTMANAGER_WATCHDOG_WEBHOOK_URL`
points at an external service.** That URL is still unset today, so this is the one open
operator action on the alert path (audit `IR-P0-003`). Verify it with:

```bash
# Alertmanager itself is healthy?
docker compose exec alertmanager wget -qO- http://localhost:9093/-/healthy

# Is the Watchdog route firing?
docker compose exec alertmanager wget -qO- http://localhost:9093/api/v2/alerts | grep Watchdog

# Stop Alertmanager and confirm the EXTERNAL service reports the missed heartbeat.
docker compose stop alertmanager
```

---

## Quick Reference

```bash
# Logs
docker compose logs -f api
docker compose logs -f worker
docker compose logs -f prometheus
docker compose logs -f alertmanager
docker compose logs --tail=200

# Alerting path (IR-P0-003)
docker compose exec alertmanager wget -qO- http://localhost:9093/-/healthy   # Alertmanager
docker compose exec alertmanager wget -qO- http://localhost:9093/api/v2/alerts # firing alerts

# Health
curl http://localhost:4000/health        # API
curl -H "Authorization: Bearer $METRICS_TOKEN" http://localhost:4000/health/detail  # API dependency detail
curl http://localhost:3000/              # Web
curl http://localhost:3001/health        # Worker

# Docker status
docker compose ps
docker stats --no-stream

# Disk
df -h
docker system df

# Prune old images
docker image ls | grep mct- | grep -v $(docker compose images -q) | awk '{print $3}' | xargs docker rmi
```
