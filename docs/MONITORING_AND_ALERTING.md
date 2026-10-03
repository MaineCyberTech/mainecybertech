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

Forward logs to a central service (future):

- `vector` sidecar to ship to Datadog / Grafana Cloud / Loki
- syslog-style `docker compose logs --tail=0 --follow | your-forwarder`

---

## 2. Health Check Endpoints

### Exposed endpoints

| Endpoint      | Service | Port | Expected response                         | Checks                                   |
| ------------- | ------- | ---- | ----------------------------------------- | ---------------------------------------- |
| `GET /health` | API     | 4000 | `200 {"status":"healthy","checks":{...}}` | DB connectivity, uptime                  |
| `GET /health` | Worker  | 3001 | `200 {"status":"healthy","uptime":...}`   | Task registry loaded, shutting down flag |
| `GET /`       | Web     | 3000 | `200` (any HTML)                          | Server is serving                        |

### API health response

```json
{
  "status": "healthy",
  "service": "api",
  "uptime": 12345.6,
  "checks": {
    "database": { "status": "healthy", "latencyMs": 3 }
  }
}
```

Returns **503** with `"degraded"` if any check fails.

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
  "shuttingDown": false
}
```

---

## 3. Docker Health Checks

Applied in `docker-compose.yml` and Dockerfiles, checked by Docker daemon every 30s.

| Service   | Command                                  | Interval               | Retries |
| --------- | ---------------------------------------- | ---------------------- | ------- |
| **redis** | `redis-cli -a $REDIS_PASSWORD ping`      | 10s                    | 3       |
| **api**   | `wget -qO- http://localhost:4000/health` | 30s                    | 3       |
| **web**   | `wget --spider http://127.0.0.1:3000`    | 30s (40s start period) | 3       |

Unhealthy containers are automatically restarted via `restart: unless-stopped`.

---

## 4. Prometheus Metrics (implemented)

`GET /metrics` (`apps/api/src/app.ts`) exposes Prometheus-formatted counters and histograms, optionally gated by `METRICS_TOKEN` (returns 404 when the token is set and not supplied). `infra/digitalocean/docker-compose.yml` runs a `prometheus` service (`prom/prometheus:v3.5.1`) that scrapes it using `prometheus.yml` + `prometheus.rules.yml`. In production Caddy returns 404 for `/metrics`, so scraping is internal to the compose network.

### Custom metrics

API (`apps/api/src/lib/metrics.ts`, all prefixed `portal_`; default `process_*`/`node_*` metrics are also collected with the same prefix):

| Metric                                                                       | Type      | Labels                           | Status             |
| ---------------------------------------------------------------------------- | --------- | -------------------------------- | ------------------ |
| `portal_http_requests_total`                                                 | Counter   | `method`, `route`, `status_code` | live               |
| `portal_http_request_duration_seconds`                                       | Histogram | `method`, `route`, `status_code` | live               |
| `portal_webhook_deliveries_total`                                            | Counter   | `status`, `event`                | live               |
| `portal_auth_attempts_total`                                                 | Counter   | `result`                         | live               |
| `portal_circuit_breaker_status`                                              | Gauge     | `name`                           | live               |
| `portal_db_query_duration_seconds`                                           | Histogram | `operation`, `table`             | defined, not wired |
| `portal_organizations_created_total` etc. (`projects`/`tickets`/`documents`) | Counter   | —                                | defined, not wired |
| `portal_search_queries_total`                                                | Counter   | —                                | defined, not wired |
| `portal_active_organizations` / `portal_active_users`                        | Gauge     | —                                | defined, not wired |
| `portal_idempotency_key_hits_total`                                          | Counter   | —                                | defined, not wired |

Worker (`apps/worker/src/metrics.ts`):

| Metric                                   | Type      | Labels                |
| ---------------------------------------- | --------- | --------------------- |
| `worker_task_executions_total`           | Counter   | `task_type`, `status` |
| `worker_task_execution_duration_seconds` | Histogram | `task_type`           |
| `worker_task_queue_depth`                | Gauge     | `queue`               |
| `worker_registered_tasks`                | Gauge     | —                     |
| `worker_memory_usage_bytes`              | Gauge     | —                     |

The `MCTHighRequestErrorRate` alert in `prometheus.rules.yml` queries `portal_http_requests_total{status_code=~"5.."}`.

### Scraping

The compose `prometheus` service scrapes the API on the internal network; no public exposure.

### Alert delivery

Firing alerts are forwarded to an **Alertmanager** service (`infra/digitalocean/alertmanager.tmpl.yml`)
on the same internal network — see §9. Without a receiver, alerts are visible only in the
internal Prometheus UI; §9 is what makes the `Watchdog` rule an actual off-box dead-man's switch.

---

## 5. Sentry Error Tracking

Initialized in all 3 services but **skipped when `SENTRY_DSN` is unset** (safe in local dev).

| Service    | Init location                                     | Capture                                                                            |
| ---------- | ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **API**    | `apps/api/src/lib/sentry.ts` → `app.ts`           | All errors via error middleware, attachments include `requestId`, `path`, `method` |
| **Worker** | `apps/worker/src/main.ts`                         | All task failures via `Sentry.captureException` with task type metadata            |
| **Web**    | `instrumentation.ts` + server/edge/client configs | Route errors, unhandled exceptions                                                 |

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
| `Watchdog` (always firing)   | None     | Alertmanager → off-box dead-man's switch (§9) | Alert path itself died → external service pages |

### Notification channels

| Channel                  | Use for                                 |
| ------------------------ | --------------------------------------- |
| **GitHub notifications** | Deploy workflow failures, CI failures   |
| **Email (Sentry)**       | Critical error spikes                   |
| **DO Monitoring**        | Droplet-level CPU, disk, memory         |
| **Teams webhooks**       | Contact form leads (marketing, not ops) |
| **Alertmanager → external receiver** | `Watchdog` dead-man's switch + `critical` Prometheus alerts (see §9) |

### No dedicated pager/on-call

This is a single-droplet deployment. Alerts are best-effort. The main alert path is:

1. Sentry captures error → email notification
2. Deploy fails → GitHub notification
3. Prometheus alert fires → Alertmanager → external receiver (§9)
4. Operator SSHes in and follows incident response

The **off-box dead-man's switch in §9 is the exception to "best-effort"**: it is the only
path that survives the total loss of this droplet, because the receiver lives outside it.

---

## 8. Incident Response Checklist

### Immediate (first 5 min)

1. Check deploy status — was there a recent deploy? Check GitHub Actions
2. SSH into droplet: `ssh root@<droplet-ip>`
3. Check running containers: `docker compose ps`
4. Check logs: `docker compose logs --tail=50 <service>`
5. Hit health endpoints manually: `curl localhost:4000/health`

### Diagnosis (5-15 min)

6. Check Sentry for recent errors: `https://sentry.io/organizations/mainecybertech/`
7. Check disk space: `df -h` (prune with `docker image prune -a` if >85%)
8. Check memory: `docker stats` (limits: api 256m, worker 256m, web 256m, redis 48m, caddy 64m, prometheus 256m, alertmanager 128m)
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
itself. It closes audit finding **IR-P0-003** ("total loss of the monitoring/alerting path
has no independent dead-man's-switch receiver").

### Components

| Component | Where | Purpose |
| --------- | ----- | ------- |
| `prometheus` (`prometheus.yml`) | compose, internal only | Evaluates `prometheus.rules.yml`; forwards firing alerts via `alerting: alertmanagers:` → `alertmanager:9093` |
| `alertmanager` (`alertmanager.tmpl.yml`) | compose, internal only (port 9093, **not published**) | Routes alerts to receivers. Compose renders `${VAR}` placeholders from the container environment at start (Alertmanager has no variable substitution of its own) |
| External receiver | **off the droplet** | Generic webhook / Slack / pager for real alerts |
| Off-box dead-man's switch | **off the droplet** | A ping/heartbeat URL (healthchecks.io-style) that alerts *you* when the pings stop |

### How an alert leaves the box

1. Prometheus evaluates the rules every 15s (`evaluation_interval`).
2. A firing alert (e.g. `MCTServiceDown`) is pushed to Alertmanager over the internal
   compose network (`http://alertmanager:9093`).
3. Alertmanager's routing tree decides the receiver:
   - `severity="critical"` → the **critical** receiver (external webhook / Slack), `repeat_interval: 1h`.
   - `alertname="Watchdog"` → the **watchdog** receiver (the dead-man's switch), `repeat_interval: 5m`.
   - everything else → the **default** receiver.
4. The receiver calls an external URL over the droplet's egress. No inbound port is opened
   on the droplet — Alertmanager is reachable only inside the compose network.

### How the dead-man's switch works

The `Watchdog` rule is `expr: vector(1)` — it is *always* firing. That is deliberate.
Prometheus therefore pushes a Watchdog alert to Alertmanager continuously, and
Alertmanager pings the external `watchdog` receiver URL every 5 minutes. The external
service (e.g. Healthchecks/Deadman) is configured with a grace period; as long as a ping
arrives, it stays quiet. **If the pings stop, the external service pages you** — from a
system that does not share the droplet.

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
the external service reports the missed heartbeat within its grace period.

### Required environment variables

Set these in the droplet `.env` (and as GitHub environment secrets so redeploys preserve
them). **Names only — never commit the values.**

| Variable | Required? | What it is |
| -------- | --------- | ---------- |
| `ALERTMANAGER_WATCHDOG_WEBHOOK_URL` | **Yes** | **The dead-man's switch.** An external ping/heartbeat URL (healthchecks.io-style) or an external webhook, **not hosted on this droplet**. |
| `ALERTMANAGER_CRITICAL_WEBHOOK_URL` | Yes (for real alerts) | External inbound webhook for critical alerts (Slack/Teams/PagerDuty/Opsgenie/generic relay). |
| `ALERTMANAGER_DEFAULT_WEBHOOK_URL` | Optional | Catch-all receiver for non-critical alerts. |
| `ALERTMANAGER_SLACK_API_URL` | Optional | Slack incoming-webhook URL used by the default/critical receivers. |
| `ALERTMANAGER_SLACK_CHANNEL` | Optional | Slack channel name (e.g. `#alerts`). Non-secret. |

If a variable is unset, compose substitutes a no-op localhost URL so the stack still
starts — but **the dead-man's switch is only real when `ALERTMANAGER_WATCHDOG_WEBHOOK_URL`
points at an external service.** Verify it with:

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
