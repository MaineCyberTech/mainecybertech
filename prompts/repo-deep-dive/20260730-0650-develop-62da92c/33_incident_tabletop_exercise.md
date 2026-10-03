# Incident Tabletop Exercise

## Audit Metadata

- **Audit name:** repo-deep-dive
- **Run:** 20260730-0650-develop-62da92c
- **Repository:** C:\temp\mainecybertech-portal
- **Branch:** develop
- **Commit SHA:** 62da92c
- **Generated at:** 2026-07-30T06:50:00Z
- **Auditor:** principal-level repository auditor
- **Area code:** IR
- **Scope limitations:** Tabletop exercise conducted via code/documentation analysis; no live system or team interview was available. Responses are based on the author's assessment of the platform's capabilities, not a live facilitated exercise.

## Exercise Structure

This tabletop exercise walks through 5 incident scenarios of increasing severity. For each scenario, we evaluate:

1. **Detection** — How is the incident discovered? (Time to detect)
2. **Response** — What automated/manual responses exist?
3. **Recovery** — How is the service restored?
4. **Evidence** — What in the repo supports the response?
5. **Gaps** — What would fail or be missing?

Facilitator note: Each scenario should be read aloud to the team. Answers below represent the "as-built" capabilities. In a live exercise, the team would discuss deviations.

---

## Scenario IR-001: Database Connection Failure

**Scenario:** Supabase (hosted Postgres) experiences a transient connectivity issue. API health check fails, returning 503. The circuit breaker opens after the configured threshold.

### Detection

| Factor | Current state | Evidence |
| ------ | ------------- | -------- |
| **Time to detect** | ~30s (health check interval + Prometheus scrape) | `apps/api/src/routes/health.ts:1-20` — health endpoint returns 200/503 with db latency |
| **How** | Docker HEALTHCHECK marks API unhealthy → Docker compose restarts | `infra/digitalocean/docker-compose.yml` — `healthcheck: test: ["CMD", "wget", "-qO-", "http://localhost:4000/health"]` |
| **Alert** | Sentry alert (configured in MONITORING.md) + Docker restart log | `docs/MONITORING_AND_ALERTING.md` — alert rules documented |
| **Dashboard signal** | API /metrics shows db_query_duration_seconds spike → 0 | `apps/api/src/lib/metrics.ts:22-28` — dbQueryDuration defined (but not wired — PERF-P1-001) |

### Response

| Action | Automated? | Evidence |
| ------ | ---------- | -------- |
| Circuit breaker opens | ✅ | `apps/api/src/lib/circuit-breaker.ts` — tripped after threshold failures to Supabase |
| Health check returns 503 | ✅ | `apps/api/src/routes/health.ts` — DB ping failure |
| Sentry captures error | ✅ | `apps/api/src/middleware/error.ts:15-22` — captureException with request context |
| API returns structured error | ✅ | `apps/api/src/middleware/error.ts:24-35` — `{ error, status, requestId }` |
| Docker restarts unhealthy container | ✅ | `docker-compose.yml` — `restart: always` + healthcheck |

### Recovery

| Step | Automated? | Manual fallback | Evidence |
| ---- | ---------- | --------------- | -------- |
| DB reconnects | ✅ (Supabase recovers independently) | — | — |
| Circuit breaker closes | ✅ (half-open → closed on success) | — | `circuit-breaker.ts` — half-open probe |
| API returns to healthy | ✅ | — | Health check passes |
| Sentry alert resolves | ✅ (Sentry auto-resolve) | — | Sentry default behavior |

### Gaps

| Gap | Severity | Evidence | Mitigation |
| --- | -------- | -------- | ---------- |
| `recordDbQuery` not wired (OBS-P1-001) | P1 | `metrics.ts` defines, not called | Wire metric to see DB degradation before full failure |
| No DB connection pool limits (PERF-P1-004) | P1 | `supabase.ts` no pool config | Connection exhaustion could delay recovery |

### Verdict

**RESPONSE CAPABILITY: ADEQUATE.** Automated circuit breaker, health check, restart, and error capture handle this scenario well. No critical gaps. Enhancement: wire DB query metrics to detect degradation before full failure.

---

## Scenario IR-002: Worker Task Processing Failure

**Scenario:** A worker task (e.g., JSM Jira sync) encounters a rate limit from the downstream API. The task throws, and the worker continues to the next message. 50% of tasks are failing silently.

### Detection

| Factor | Current state | Evidence |
| ------ | ------------- | -------- |
| **Time to detect** | Unknown — worker has no task failure metrics | `apps/worker/src/main.ts` — no Prometheus metrics |
| **How** | Only via Sentry event for unhandled errors | `apps/worker/src/main.ts:15-17` — captureException |
| **Alert** | Sentry alert (if configured) | `docs/MONITORING_AND_ALERTING.md` — "Worker error rate" alert |
| **Dashboard signal** | None — no worker metrics | `apps/worker/src/` — no metrics endpoint |

### Response

| Action | Automated? | Evidence |
| ------ | ---------- | -------- |
| Sentry captures exception | ✅ | `apps/worker/src/main.ts:15-17` — captureException wrapped |
| Worker continues to next task | ✅ | `apps/worker/src/consumer-bullmq.ts` — error per task, not per worker |
| Graceful shutdown preserves in-flight | ✅ | `apps/worker/src/shutdown.ts` — isShuttingDown flag, inFlightTasks array |
| Task retry on failure | ❌ | `consumer-bullmq.ts` — no retry/backoff config (RES-P2-003) |

### Recovery

| Step | Automated? | Manual fallback | Evidence |
| ---- | ---------- | --------------- | -------- |
| Rate limit expires | ✅ (external API recovers) | — | — |
| Next task succeeds | ✅ | — | Worker continues |
| Failed tasks re-processed | ❌ | Manually re-queue via Redis CLI | No retry configured |
| Worker health check | ✅ | — | `health-server.ts` — /health returns 200, worker appears healthy despite failures |

### Gaps

| Gap | Severity | Evidence | Mitigation |
| --- | -------- | -------- | ---------- |
| No worker task retry (RES-P2-003) | P2 | `consumer-bullmq.ts` no retry | Add BullMQ retry + backoff |
| No worker metrics (OBS-P1-002) | P1 | Worker has no Prometheus endpoint | Add prom-client + /metrics |
| No worker task failure alerting | P1 | No task failure rate alert | Add Sentry alert rule for worker errors |

### Verdict

**RESPONSE CAPABILITY: PARTIAL.** Worker failures are logged and captured by Sentry but there is no retry mechanism and no metrics visibility. A partial failure scenario (50% tasks failing) would be invisible. **Critical gap:** add worker task retry and metrics.

---

## Scenario IR-003: Deploy Failure — New Image Fails Health Check

**Scenario:** A new Docker image for `mct-api` is built, piped to the DO droplet, and started. The health check fails 5 times. Docker compose attempts a restart but the image has a fatal bug.

### Detection

| Factor | Current state | Evidence |
| ------ | ------------- | -------- |
| **Time to detect** | ~2.5min (5 health checks × 30s interval) | `docker-compose.yml` — `interval: 30s`, `retries: 5` |
| **How** | Caddy reverse proxy returns 502 → users see error page | Caddy detects backend down |
| **Alert** | Sentry alert for deploy failure? | Not explicitly — deploy CI failure notification only |
| **Dashboard signal** | API health endpoint returns 503 | `apps/api/src/routes/health.ts` |

### Response

| Action | Automated? | Evidence |
| ------ | ---------- | -------- |
| Docker compose restarts container | ✅ | `docker-compose.yml` — `restart: always` |
| Deploy workflow captures failure | ✅ | `.github/workflows/deploy-do.yml:279-298` — health check retry loop |
| Rollback triggered | ❌ | Manual rollback only (workflow_dispatch) |
| Sentry alert for new deploy error | ⚠️ Partial | Spikes in error rate would trigger, but no explicit deploy-failure alert |
| Old container still available | ✅ | `apps/api/` directory — old image tag still in docker image list |

### Recovery

| Step | Automated? | Manual fallback | Evidence |
| ---- | ---------- | --------------- | -------- |
| Manual rollback | ✅ | `docker compose up -d` with previous tag | `docs/ROLLBACK_PROCEDURES.md` — Docker rollback section |
| Image cleanup dropped | ✅ | Old images not cleaned until new deploy | `deploy-do.yml` — cleanup before loading new images |

### Gaps

| Gap | Severity | Evidence | Mitigation |
| --- | -------- | -------- | ---------- |
| No automatic rollback on health check failure | P2 | `deploy-do.yml` — no rollback step in CI | Add auto-rollback: if health check fails, re-deploy previous image |
| No deploy-failure alert to team | P2 | No deploy failure notification | Add Slack/GitHub notification on `deploy-do.yml` failure |
| Health check verification URL not versioned | P3 | `/health` endpoint is constant | Acceptable — health checks are generic |

### Verdict

**RESPONSE CAPABILITY: FUNCTIONAL.** The old container is preserved and manual rollback is documented. The gap is automation — a health check failure during deploy requires manual intervention. Auto-rollback would reduce downtime from ~10 min to ~2 min.

---

## Scenario IR-004: Security Incident — JWT Secret Compromise

**Scenario:** The `JWT_SECRET` is accidentally exposed in CI logs. An attacker can forge arbitrary user tokens and impersonate any user. All running sessions are compromised.

### Detection

| Factor | Current state | Evidence |
| ------ | ------------- | -------- |
| **Time to detect** | Unknown — no secret rotation audit logs | `docs/JWT_ROTATION.md` — rotation procedure exists but no automated detection |
| **How** | Manual discovery via CI log scan or external report | No automated secret scan in CI post-deploy |
| **Alert** | None — no secret leak detection | — |
| **Dashboard signal** | None | — |

### Response

| Action | Automated? | Evidence |
| ------ | ---------- | -------- |
| JWT secret rotation procedure exists | ✅ | `docs/JWT_ROTATION.md` — step-by-step rotation with blue-green approach |
| Old tokens become invalid | ✅ | After rotation, old JWT_SECRET moved to `JWT_SECRET_PREVIOUS` for transition period |
| Users re-login | ⚠️ Partial | Auth middleware checks JWT signature — old tokens fail, users redirected to login |
| Session invalidation | ⚠️ Partial | No active session revocation (Supabase sessions remain valid) |
| Audit log of compromise? | ❌ | No documented procedure for logging security incidents |

### Recovery

| Step | Automated? | Manual fallback | Evidence |
| ---- | ---------- | --------------- | -------- |
| Rotate JWT_SECRET | ✅ | Per docs: 1. Generate new, 2. Deploy with JWT_SECRET_PREVIOUS, 3. Remove old | `docs/JWT_ROTATION.md` |
| Deploy new image with rotated secret | ✅ | `deploy-do.yml` — uses GH secret JWT_SECRET | Rotate secret in GitHub → re-deploy |
| Force re-login all users | ❌ | Must wait for token expiry or manually revoke Supabase sessions | JWTs checked against current secret at middleware.ts |

### Gaps

| Gap | Severity | Evidence | Mitigation |
| --- | -------- | -------- | ---------- |
| No automated secret leak detection | P1 | No secret scanner in CI | Add Gitleaks/trufflehog to CI pipeline |
| No active session revocation mechanism | P1 | No API endpoint to revoke all sessions | Add `POST /api/v1/auth/revoke-all-sessions` |
| No security incident response plan | P1 | No incident response doc or runbook | Create `docs/SECURITY_INCIDENT_RESPONSE.md` |
| JWT_SECRET rotation requires deploy | P2 | Secret is env var, not config | Design for runtime rotation without deploy |

### Verdict

**RESPONSE CAPABILITY: PARTIAL.** The JWT rotation procedure is well-documented but there is no automated detection of the leak, no active session revocation, and no security incident response plan. Rotating the secret and re-deploying is the only path, which takes ~10 min.

---

## Scenario IR-005: Droplet-Level Failure

**Scenario:** The single DigitalOcean droplet hosting all services (API, Web, Worker, Redis, Caddy) experiences a hardware failure or becomes unreachable. All services are down.

### Detection

| Factor | Current state | Evidence |
| ------ | ------------- | -------- |
| **Time to detect** | Unknown — no external uptime monitoring | No uptime monitor configured (OBS-P2-003) |
| **How** | Users report site unreachable / error page | No automated detection |
| **Alert** | No automated alert | — |
| **Dashboard signal** | All metrics silent | — |

### Response

| Action | Automated? | Evidence |
| ------ | ---------- | -------- |
| DigitalOcean auto-restart droplet | ✅ (if hardware issue, DO migrates to new host) | DO default behavior |
| Caddy fails → 502 | ✅ | Reverse proxy can't reach backends |
| Error pages display | ✅ | Web error boundaries render fallback UI |
| Docker restart on droplet reboot | ✅ | `restart: always` policy |

### Recovery

| Step | Automated? | Manual fallback | Evidence |
| ---- | ---------- | --------------- | -------- |
| Droplet re-creation from Terraform | ✅ | `terraform apply` with saved state | `infra/terraform/digitalocean/` — IaC complete |
| Docker compose stack restart | ✅ | SSH → docker compose up -d | Deploy workflow documents steps |
| Database restore | ⚠️ Partial | Restore from latest pg_dump | `scripts/backup-database.sh` + ROLLBACK_PROCEDURES.md |
| DNS propagation | ✅ | Cloudflare DNS (proxied, automatic) | Terraform DNS records, orange cloud proxied |

### Gaps

| Gap | Severity | Evidence | Mitigation |
| --- | -------- | -------- | ---------- |
| No external uptime monitoring | P1 | No uptime checker configured | Add UptimeRobot/Checkly external monitor |
| No automated droplet failover | P1 | Single droplet | Accept single-droplet architecture limitation |
| Terraform state loss risk (DR-P1-003) | P1 | State stored locally | Add remote state backend |
| Restore not tested (DR-P1-002) | P1 | Never tested | Quarterly restore drill |

### Verdict

**RESPONSE CAPABILITY: WEAK.** The single-droplet architecture is the platform's biggest resilience weakness. While Terraform allows full infra recreation, the lack of external monitoring and untested restore procedures means recovery time depends entirely on manual operator intervention. **First priority:** external uptime monitoring and Terraform state backup.

---

## Summary

### Scenario Verdicts

| Scenario | Detection | Response | Recovery | Overall | Priority |
| -------- | --------- | -------- | -------- | ------- | -------- |
| IR-001: DB failure | ✅ Fast | ✅ Strong | ✅ Automated | **ADEQUATE** | — |
| IR-002: Worker failure | ❌ Blind | ⚠️ Partial | ❌ Manual | **PARTIAL** | P1 |
| IR-003: Deploy failure | ⚠️ Partial | ⚠️ Partial | ⚠️ Manual | **FUNCTIONAL** | P2 |
| IR-004: JWT compromise | ❌ Blind | ⚠️ Partial | ⚠️ Manual | **PARTIAL** | P1 |
| IR-005: Droplet failure | ❌ Blind | ⚠️ Partial | ⚠️ Partial | **WEAK** | P1 |

### Cross-Cutting Gaps

| Gap | Affected scenarios | Severity | Recommendation |
| --- | ------------------ | -------- | -------------- |
| No external uptime monitoring | All | P1 | Add UptimeRobot/Checkly external monitor |
| No worker metrics/task retry | IR-002 | P1 | Add Prometheus + retry config |
| No auto-rollback on deploy health fail | IR-003 | P2 | Add auto-rollback step to deploy CI |
| No secret leak detection | IR-004 | P1 | Add Gitleaks to CI |
| No security incident response plan | IR-004 | P1 | Create SECURITY_INCIDENT_RESPONSE.md |
| No active session revocation | IR-004 | P1 | Add revoke-all-sessions API endpoint |
| No restore testing | IR-005 | P1 | Quarterly restore drill |
| Local Terraform state only | IR-005 | P1 | Remote state backend |
| No RTO/RPO documented | IR-005 | P1 | Define and document targets |

### Recommendations

**Immediate (this week):**
1. Add external uptime monitoring (UptimeRobot/Checkly) for www.mainecybertech.com, app.mainecybertech.com, api.mainecybertech.com
2. Add Gitleaks secret scanner to CI pipeline
3. Add failure notification to deploy workflow (Slack webhook)
4. Add remote Terraform state backend

**This month:**
5. Add worker task retry and Prometheus metrics
6. Create security incident response plan (`docs/SECURITY_INCIDENT_RESPONSE.md`)
7. Add `POST /api/v1/auth/revoke-all-sessions` API endpoint
8. Execute first quarterly restore drill

**Quarterly:**
9. Run this tabletop exercise with the full team
10. Update procedures based on drill findings
