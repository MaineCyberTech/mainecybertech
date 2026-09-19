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

## 4. Prometheus Metrics (Planned)

A `/metrics` endpoint will be added at `GET /api/v1/metrics` exposing Prometheus-formatted counters and histograms.

### Custom metrics (14 planned)

| Metric                        | Type      | Labels                     | Purpose                                           |
| ----------------------------- | --------- | -------------------------- | ------------------------------------------------- |
| `http_requests_total`         | Counter   | `method`, `path`, `status` | Request volume & error rate                       |
| `http_request_duration_ms`    | Histogram | `method`, `path`           | Latency percentiles                               |
| `db_query_duration_ms`        | Histogram | `operation`, `table`       | Database performance                              |
| `db_queries_total`            | Counter   | `operation`, `table`       | Query volume                                      |
| `webhook_deliveries_total`    | Counter   | `service`, `status`        | Outbound webhook throughput                       |
| `auth_attempts_total`         | Counter   | `type`, `success`          | Login/signup attempt rate                         |
| `circuit_breaker_state`       | Gauge     | `name`                     | 0=closed, 1=open, 2=half-open                     |
| `circuit_breaker_trips_total` | Counter   | `name`                     | How many times circuit opened                     |
| `entity_count`                | Gauge     | `entity_type`              | Row counts (tickets, projects, docs, users, orgs) |
| `worker_tasks_total`          | Counter   | `type`, `success`          | Task completion volume                            |
| `worker_queue_depth`          | Gauge     | `queue`                    | BullMQ queue depth                                |
| `cache_hits_total`            | Counter   | `endpoint`                 | Cache effectiveness                               |
| `cache_misses_total`          | Counter   | `endpoint`                 | Cache misses                                      |
| `app_uptime_seconds`          | Gauge     | `service`                  | Process uptime                                    |

### Scraping (future)

Add a `prometheus` service to docker-compose or use DO Managed Monitoring to scrape the droplet.

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

### Notification channels

| Channel                  | Use for                                 |
| ------------------------ | --------------------------------------- |
| **GitHub notifications** | Deploy workflow failures, CI failures   |
| **Email (Sentry)**       | Critical error spikes                   |
| **DO Monitoring**        | Droplet-level CPU, disk, memory         |
| **Teams webhooks**       | Contact form leads (marketing, not ops) |

### No dedicated pager/on-call

This is a single-droplet deployment. Alerts are best-effort. The main alert path is:

1. Sentry captures error → email notification
2. Deploy fails → GitHub notification
3. Operator SSHes in and follows incident response

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
8. Check memory: `docker stats` (limits: api 256m, worker 256m, web 256m, redis 48m, caddy 64m)
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

## Quick Reference

```bash
# Logs
docker compose logs -f api
docker compose logs -f worker
docker compose logs --tail=200

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
