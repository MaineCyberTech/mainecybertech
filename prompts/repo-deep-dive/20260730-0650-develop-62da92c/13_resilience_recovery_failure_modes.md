# Resilience, Recovery, and Failure Mode Audit

## Audit Metadata

- **Audit name:** repo-deep-dive
- **Run:** 20260730-0650-develop-62da92c
- **Repository:** C:\temp\mainecybertech-portal
- **Branch:** develop
- **Commit SHA:** 62da92c
- **Generated at:** 2026-07-30T06:50:00Z
- **Auditor:** principal-level repository auditor
- **Area code:** RES
- **Scope limitations:** Code analysis only; no production system available for chaos testing. Failure scenarios evaluated against source code and CI/CD artifacts.

## Scope

Full audit of resilience patterns: graceful shutdown, circuit breakers, retry/backoff, timeout enforcement, webhook idempotency, optimistic locking, error boundaries, health checks, container restart policies, worker drain, connection pooling, and rollback capabilities.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |
| `apps/api/src/main.ts` | Graceful shutdown | SIGTERM/SIGINT handlers with 10s drain | server.close() + server.closeAllConnections() |
| `apps/worker/src/main.ts` | Graceful shutdown | inFlightTasks tracking + drain loop | 30s max, 2s interval |
| `apps/worker/src/shutdown.ts` | Worker drain state | isShuttingDown, trackInFlight, drainInFlight | Shared module across all worker consumers |
| `apps/api/src/lib/circuit-breaker.ts` | Circuit breaker | 3-state pattern (closed/open/half-open) | Configurable threshold/cooldown/timeout |
| `apps/api/src/lib/http-client.ts` | Outbound HTTP resilience | 5s timeout, 3 retries, circuit breaker integration, jitter | Retry on >=500, idempotent assumed |
| `apps/api/src/lib/idempotency.ts` | Webhook idempotency | Redis TTL dedup + deterministic keys | 1h TTL, get/set logic |
| `apps/api/src/routes/webhooks.ts` | Webhook idempotency | Idempotency-Key header + 5min window | Dedup check per webhook type |
| `apps/api/src/lib/supabase.ts` | DB circuit breaker | Supabase client wrapped with CircuitBreaker | Connection pooling via undici |
| `apps/api/src/middleware/error.ts` | Error handler | Global error middleware | Sentry capture + structured response |
| `apps/api/src/middleware/security.ts` | Input sanitizer | HTML pattern detection (not mutation) | Removed encoding mutation |
| `apps/api/src/middleware/optimistic-locking.ts` | Optimistic locking | requireIfMatch + checkVersionMatch | Tickets, documents, projects, orgs |
| `apps/worker/src/consumer-bullmq.ts` | Worker queue resilience | BullMQ consumer with graceful shutdown | ShuttingDown check before processing |
| `apps/worker/src/consumer-sqs.ts` | Worker queue resilience | SQS consumer with graceful shutdown | Supports QUEUE_BACKEND=sqs fallback |
| `infra/digitalocean/docker-compose.yml` | Container resilience | restart: always, healthchecks, depends_on | All services with restart policy |
| `.github/workflows/deploy-do.yml` | Deploy resilience | Rollback on failure, image piping | SSH heredoc env writing |
| `docs/ROLLBACK_PROCEDURES.md` | Rollback docs | Docker, Supabase, Terraform rollback procedures | Step-by-step instructions |

## Executive Summary

**Resilience score: 4/5.** The platform has invested heavily in operational resilience. All 12 P0 hardening findings from the 2026-06-23 audit are resolved. Graceful shutdown exists in both API and Worker. Circuit breakers protect all outbound HTTP calls (Stripe, JSM, Teams) and DB queries. Webhooks have Redis-backed idempotency. Optimistic locking prevents stale writes on 4 entity types. Health checks and restart policies cover all containers. Deploy workflow has rollback-on-failure.

### Strengths

- **Graceful shutdown** — API (`main.ts`) drains HTTP connections with 10s timeout. Worker (`shutdown.ts`) tracks in-flight tasks and drains with 30s max.
- **Circuit breakers** — `circuit-breaker.ts` wraps all outbound HTTP calls (`http-client.ts`) and Supabase queries (`supabase.ts`). 3-state with configurable thresholds.
- **Timeouts + retries** — `http-client.ts` enforces 5s timeout, 3 retries with exponential backoff + jitter. Retry only on >= 5xx.
- **Idempotency** — Webhook handlers deduplicate via Redis (`idempotency.ts`) with 1h TTL and deterministic keys.
- **Optimistic locking** — `If-Match` header pattern wired into tickets, documents, projects, orgs PATCH handlers.
- **Container healthchecks** — All 5 services in docker-compose have HEALTHCHECK + `restart: always`.
- **Deploy rollback** — `deploy-do.yml` captures failure with exit code check + manual workflow_dispatch rollback input.

### Major Risks

- **No database connection pool limits** — `supabase.ts` uses `global.fetch` via undici but no explicit pool min/max configuration for pgBouncer.
- **Webhook handler failures are non-fatal but partially unobservable** — `public.ts` handlers `.catch()` webhook failures but don't always emit errors to Sentry.
- **Circuit breaker state not persisted** — Circuit breaker is in-memory. Process restart resets all breakers to closed.
- **BullMQ worker no job retry for transient failures** — Worker tasks that throw non-fatal errors are not re-queued. Only fatal errors crash the worker.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
| ---- | ------------- | ------- | ------------- | ---- | ----- |
| API graceful shutdown | `apps/api/src/main.ts:27-54` | SIGTERM/SIGINT handler | ✅ | Low | 10s force exit, server.closeAllConnections |
| Worker graceful shutdown | `apps/worker/src/main.ts:22-30` | SIGTERM handler → drainInFlight | ✅ | Low | 30s max drain, 2s interval |
| Worker drain state | `apps/worker/src/shutdown.ts` | isShuttingDown + inFlightTasks | ✅ | Low | Shared across consumer modules |
| Circuit breaker | `apps/api/src/lib/circuit-breaker.ts` | 3-state circuit breaker | ✅ | Low | configurable threshold/cooldown/timeout |
| HTTP client | `apps/api/src/lib/http-client.ts` | 5s timeout, 3 retries, jitter | ✅ | Low | Retry >= 5xx |
| Webhook idempotency | `apps/api/src/lib/idempotency.ts` | Redis dedup + deterministic keys | ✅ | Low | 1h TTL, get/set logic |
| DB circuit breaker | `apps/api/src/lib/supabase.ts` | Supabase wrapped with CircuitBreaker | ✅ | Low | Connection pooling via undici |
| Error handler | `apps/api/src/middleware/error.ts` | Global error middleware | ✅ | Low | Sentry + structured error response |
| Optimistic locking | `apps/api/src/middleware/optimistic-locking.ts` | requireIfMatch + checkVersionMatch | ✅ | Low | Tickets, documents, projects, orgs |
| Input sanitizer | `apps/api/src/middleware/security.ts` | HTML pattern detection only | ✅ | Low | Removed encoding mutation |
| BullMQ consumer | `apps/worker/src/consumer-bullmq.ts` | Queue processing with shutdown check | ✅ | Low | ShuttingDown guard at job dispatch |
| SQS consumer | `apps/worker/src/consumer-sqs.ts` | SQS fallback consumer | ✅ | Low | Dormant code path |
| Container restart policy | `infra/digitalocean/docker-compose.yml` | restart: always | ✅ | Low | All services |
| Deploy rollback | `.github/workflows/deploy-do.yml` | Rollback on failure | ✅ | Low | manual rollback via workflow_dispatch |
| Rollback procedures doc | `docs/ROLLBACK_PROCEDURES.md` | Step-by-step rollback | ✅ | Low | Covers Docker, Supabase, Terraform |
| DB connection pool limits | `apps/api/src/lib/supabase.ts` | undici global.fetch | ⚠️ Partial | Medium | No explicit pool config |
| Circuit breaker persistence | `apps/api/src/lib/circuit-breaker.ts` | In-memory only | ⚠️ Present but risky | Medium | Reset on process restart |
| Worker job retry | `apps/worker/src/consumer-bullmq.ts` | No retry config | ❌ Absent | Medium | Transient failures not re-queued |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
| -------- | ----: | -------- | --- | ------------------ |
| Graceful shutdown | 5 | API + Worker drain loops | Worker drain could be slower with many long tasks | Consider 60s timeout for long-running tasks |
| Circuit breakers | 4 | `circuit-breaker.ts`, wired into HTTP + Supabase | In-memory state lost on restart | Add Redis-backed breaker state |
| Retries/backoff | 4 | `http-client.ts` exponential + jitter | No retry for DB queries | Add retry wrapper for transient DB errors |
| Timeouts | 4 | http-client.ts 5s | DB queries have no explicit timeout | Add query_timeout via Supabase config |
| Idempotency | 4 | Redis dedup for webhooks | Only webhooks covered; API mutations not idempotent | Add Idempotency-Key to mutation endpoints |
| Optimistic locking | 4 | requireIfMatch on 4 entity types | Not on tickets bulk upsert, memberships, notifications | Extend to remaining mutation endpoints |
| Error boundaries | 4 | All 4 route groups + global-error.tsx | "Try again" button exists on all 4 | Add error details panel for debugging |
| Health checks | 4 | API + Worker + Docker HEALTHCHECK | Web has no explicit /health | Add Next.js health route |
| Container resilience | 4 | restart: always + depends_on | No resource limits (CPU/memory) | Add mem_limit to docker-compose |
| Deploy rollback | 4 | Failure capture + manual rollback | No automated rollback on deploy health fail | Add automatic rollback in CI |
| Disaster recovery | 3 | Rollback procedures doc + backup scripts | No RTO/RPO documented | Define RTO/RPO targets in docs |

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
| -- | ------------------- | -------- | --------------- | --- | -------- | -------------- |
| RES-001 | Process receives SIGTERM | `main.ts:27-54` | API: 10s drain + closeAllConnections | None | ✅ Closed |
| RES-002 | Worker in-flight tasks during shutdown | `shutdown.ts` + `consumer-bullmq.ts` | isShuttingDown flag, drainInFlight loop | None | ✅ Closed |
| RES-003 | Supabase downstream fails | `supabase.ts` | CircuitBreaker wraps Supabase client | None | ✅ Closed |
| RES-004 | Outbound HTTP request timeout | `http-client.ts` | 5s timeout, 3 retries, jitter | None | ✅ Closed |
| RES-005 | Duplicate webhook delivery | `idempotency.ts` + `webhooks.ts` | Redis dedup 1h TTL, deterministic keys | None | ✅ Closed |
| RES-006 | Stale write (lost update) | `optimistic-locking.ts` | If-Match check on 4 entity types | Missing on bulk upsert, memberships | P2 |
| RES-007 | Input sanitizer corruption | `security.ts` | Pattern detection only (no mutation) | None | ✅ Closed |
| RES-008 | Container exits unexpectedly | `docker-compose.yml` | restart: always, HEALTHCHECK | No resource limits | P3 |
| RES-009 | Deployment fails | `deploy-do.yml` | Rollback on failure + manual rollback | No auto-rollback on health fail | P2 |
| RES-010 | DB connection pool exhaustion | `supabase.ts` | undici global.fetch | No explicit pool limits | P2 |

## Findings

### Finding ID: RES-P2-001 - Optimistic locking not extended to all mutable entities

- **Severity:** P2
- **Confidence:** High
- **Area:** Data Integrity
- **Evidence:**
  - `apps/api/src/middleware/optimistic-locking.ts` — requireIfMatch + checkVersionMatch implemented
  - Current usage: tickets (`tickets.ts:142`), documents (`documents.ts:88`), projects (`projects.ts:95`), orgs (`organizations.ts:110`)
  - Not used: memberships (`memberships.ts`), notifications (`notifications.ts`), webhook endpoints (`webhooks.ts`), users (`users.ts`)
- **What is happening:** 4 of ~8 mutable entity types have optimistic locking. The remaining 4 don't, risking lost concurrent updates.
- **Recommended fix:** Add `version` column and `If-Match` middleware to remaining entity routes. This is a data integrity risk.
- **Status:** Open

### Finding ID: RES-P2-002 - Circuit breaker state is in-memory, lost on restart

- **Severity:** P2
- **Confidence:** Medium
- **Area:** Resilience
- **Evidence:**
  - `apps/api/src/lib/circuit-breaker.ts` — state (closed/open/half-open) stored in class instance variables
  - No Redis-backed persistence layer
- **What is happening:** If a downstream service is failing and the API process restarts (deploy, crash), the circuit breaker resets to closed. The next request immediately tries the failing downstream, potentially causing cascading failure again.
- **Recommended fix:** Add Redis-backed circuit breaker state persistence, or accept the (documented) risk of brief re-test on restart.
- **Status:** Open (by design — documented risk)

### Finding ID: RES-P2-003 - Worker tasks lack job retry configuration

- **Severity:** P2
- **Confidence:** Medium
- **Area:** Resilience
- **Evidence:**
  - `apps/worker/src/consumer-bullmq.ts` — no `retry` or `backoff` options on job workers
  - Handler directly awaits task execution without error recovery
- **What is happening:** Transient task failures (network blips, rate limits) are lost. The worker is not configured to retry failed jobs.
- **Recommended fix:** Add BullMQ job retry with `retry` and `backoff` strategy. Ensure task handlers are idempotent for safe retry.
- **Status:** Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| ---- | -------- | ---------- | ------ | -------- | ---------- |
| Lost concurrent updates on memberships/users | P2 | Low | Medium | No version check on PATCH | Add If-Match to remaining entities |
| Circuit breaker reset on restart | P2 | Medium | Medium | In-memory state | Accept documented risk or add Redis backend |
| Task failure data loss | P2 | Medium | High | No worker job retry | Add BullMQ retry + backoff |
| DB pool exhaustion | P2 | Low | High | No explicit pool config | Add min/max pool size |
| No auto-rollback on health fail | P2 | Low | Medium | Manual rollback only | Add auto-rollback step |

## Recommendations

### Immediate / Release Blocking

1. Add optimistic locking to memberships, notifications, webhook endpoints, and users routes
2. Configure BullMQ retry + backoff for worker jobs

### This Week

3. Add explicit DB connection pool limits (Supabase client pool config)
4. Add automatic rollback step in deploy workflow for health check failure

### This Month

5. Add Redis-backed circuit breaker persistence (or document as accepted risk)
6. Extend idempotency (Idempotency-Key header) to mutation endpoints beyond webhooks
7. Add container resource limits to docker-compose.yml (mem_limit, cpus)

### Later / Platform Evolution

8. Implement chaos engineering test suite (terminate containers, throttle network, exhaust memory)
9. Add SQL query timeout config to Supabase client

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --------- | ------------ | --------------------- | ---------- |
| Add `version` to remaining entity schemas | Prevents lost concurrent updates | migration + routes files | PATCH returns 409 on stale |
| Add retry to BullMQ jobs | Transient failures recover | `consumer-bullmq.ts` | Jobs retry after rate limit cooldown |
| Add `mem_limit` to docker-compose | Prevents OOM kills of single service | `docker-compose.yml` | Container peaks below limit |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| ------------ | -------- | ---------------- | ------ | ---------- |
| Optimistic locking on remaining entities | P2 | API | 1 day | DB migration per entity |
| Worker job retry | P2 | Worker | 0.5 day | None |
| DB connection pool limits | P2 | API | 1 day | Env schema + pool config |
| Auto-rollback in deploy | P2 | CI | 0.5 day | Rollback step in deploy-do.yml |
| Circuit breaker persistence | P2 | API | 2 days | Redis backend |
| API mutation idempotency | P2 | API | 1 week | Middleware pattern |

## Suggested Tests

- **Unit:** Circuit breaker transitions (closed→open→half-open→closed)
- **Integration:** Worker processes task → fails → retries → succeeds
- **Integration:** Optimistic lock PATCH returns 409 on stale version
- **Integration:** Webhook duplicate key returns 200 skip
- **Chaos:** Terminate API container → health check fails → Docker restarts → service recovers

## Suggested Documentation Updates

1. Update `docs/ROLLBACK_PROCEDURES.md` to document auto-rollback trigger conditions
2. Create `docs/CIRCUIT_BREAKER_STRATEGY.md` documenting breaker thresholds and cooldown

## Open Questions

| Question | Why it matters | Evidence needed |
| -------- | -------------- | --------------- |
| What is the RTO for the platform? | Guides timeout/drain tuning | Missing from all docs |
| What is the RPO for database data? | Guides backup frequency and replication | Missing from all docs |
| Are there any single points of failure on the DO droplet? | Entire platform runs on one droplet | Single-droplet deployment |

## Appendix

### Failure Mode Analysis

| Failure mode | Blast radius | Current control | Gaps | Mitigation |
| ------------ | ------------ | --------------- | ---- | ---------- |
| API crash | All API calls fail | Docker restart: always, 10s drain | No horizontal scaling | Single-droplet limitation |
| Worker crash | Background jobs fail | Docker restart: always, 30s drain | No persistent queue backup | BullMQ Redis persistence |
| Redis failure | Webhook dedup, BullMQ queue lost | Redis HEALTHCHECK, restart: always | No Redis replica | Single Redis instance |
| DB failure (Supabase hosted) | All data operations fail | Circuit breaker, retries | No read replica in plan | Upgrade Supabase plan |
| Downstream API failure (JSM, Stripe, Teams) | Feature-specific failure | Circuit breaker, timeout, retry | No fallback/mock mode | Accept reduced-functionality mode |
| Disk full on droplet | All services crash | No disk monitoring in repo | No disk alerting | Add disk usage alert to monitoring stack |
