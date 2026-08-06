# Resilience, Recovery, and Failure Modes Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260806-1722-develop-75d3926
- Repository: C:\temp\mainecybertech-portal
- Branch: develop
- Commit SHA: 75d3926 (75d39269310fcc09826fe532d5838d3a53d1739a)
- Generated at: 2026-08-06
- Auditor: Principal repository auditor (fresh audit, no reliance on prior reports)
- Area code: RES (plus OBS cross-check annex)
- Output path: prompts/repo-deep-dive/20260806-1722-develop-75d3926/13_resilience_recovery_failure_modes.md
- Scope limitations:
  - No live outage/failure injection was performed (safety rules prohibit touching production and destructive actions). All statements are code-path analysis at HEAD plus the fresh unit-test runs.
  - Redis/queue behavior is analyzed from source; no live Redis was available in this environment.

## Scope

Reviewed at commit 75d3926: API startup/shutdown (`apps/api/src/main.ts`), worker bootstrap and scheduling (`apps/worker/src/main.ts`), queue producer/consumer (API + worker), task registry and all 23 registered task handlers, cache layer (`apps/api/src/middleware/cache.ts`), circuit breaker + Supabase wiring, health checks (API + worker), webhook dispatch/retry/DLQ, retention/orphan tasks, timeouts/idempotency/SSRF controls, and the observability stack (Sentry, pino redaction, X-Request-ID, Prometheus metrics). No code was modified.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |
| `apps/api/src/main.ts` | Source | unhandledRejection handler, graceful shutdown, cache init, Redis probe | Log-and-continue confirmed at lines 73-75 |
| `apps/worker/src/main.ts` | Source | Task scheduling, consumer startup | 20 scheduled intervals; scan offsets partially applied |
| `apps/worker/src/producer.ts` | Source | BullMQ producer (worker-side) | attempts 3, exp backoff 5s, REDIS_PASSWORD |
| `apps/api/src/lib/task-producer.ts` | Source | BullMQ producer (API-side) | non-throwing, falls back gracefully |
| `apps/worker/src/consumer-bullmq.ts` | Source | BullMQ consumer | QUEUE_BACKEND default "bullmq" |
| `apps/worker/src/consumer-sqs.ts` | Source | SQS consumer (dormant path) | retained for QUEUE_BACKEND=sqs |
| `apps/worker/src/task-registry.ts` | Source | executeTask, metrics, Sentry | 23 registered handlers + ping |
| `apps/worker/src/tasks/index.ts` | Source | Task registration | retention/orphan-cleanup registered, never scheduled |
| `apps/worker/src/tasks/module-tasks.ts` | Source | 17 scan handlers | 856 lines; behavior verified per handler |
| `apps/worker/src/tasks/webhook-retry.ts` | Source | Retry + DLQ | MAX_RETRIES 5, exp backoff, dead_letter |
| `apps/worker/src/tasks/public-interaction-retention.ts` | Source | 90-day PII purge | scheduled daily |
| `apps/worker/src/tasks/retention.ts`, `orphan-cleanup.ts` | Source | audit/notification purge; storage cleanup | REGISTERED BUT UNSCHEDULED — never run |
| `apps/api/src/middleware/cache.ts` | Source | Redis+memory cache, mount-scoped keys | Collision fix verified (baseUrl+path) |
| `apps/api/src/lib/circuit-breaker.ts` + `services/supabase.ts` | Source | Breaker wired into admin client global.fetch | Test-env bypass; no-breaker probe client |
| `apps/api/src/lib/health.ts` | Source | Redis health probe | Used at startup only; NOT in /health route |
| `apps/api/src/routes/health.ts` | Source | /health endpoint | DB/Stripe/JSM only — no Redis check |
| `apps/api/src/lib/ssrf-guard.ts` | Source | Webhook URL SSRF guard | API paths only; worker paths lack re-check |
| `apps/api/src/lib/webhook-dispatcher.ts` | Source | Inline dispatch fallback + idempotency keys | SSRF-guarded |
| `apps/api/src/lib/sentry.ts`, `apps/worker/src/main.ts`, `apps/web/instrumentation.ts` | Source | Sentry init all 3 services | tracesSampleRate 0.2 prod |
| `apps/api/src/lib/logger.ts`, `apps/worker/src/logger.ts` | Source | pino redaction | Extensive redact path lists |
| `apps/api/src/middleware/request-id.ts` | Source | X-Request-ID + req.log child | Correlation + metrics |
| `apps/api/src/lib/metrics.ts`, `apps/worker/src/metrics.ts` | Source | Prometheus metrics | API: HTTP totals/durations; Worker: task metrics + queue depth |
| `apps/worker/src/health-server.ts` | Source | Worker /health + /metrics | 503 while draining |

## Executive Summary

The resilience posture at HEAD is materially improved over the 2026-08-01 audit: the queue producer is wired (API + worker BullMQ producers with exponential backoff, password-auth Redis), the BullMQ consumer is the default backend, webhook-retry runs every 5 minutes with exponential backoff and a dead-letter table, retention/scan tasks are scheduled with `.unref()` intervals, the API's `unhandledRejection` handler is log-and-continue (verified at `apps/api/src/main.ts:73-75` — it does NOT exit), graceful shutdown drains connections with a 10s force-exit, the circuit breaker is genuinely wired into the Supabase admin client's `global.fetch`, and cache init is non-fatal with a memory fallback.

Two structural gaps remain: (1) **6 of 23 registered tasks never run** — `retention` (audit_logs 365d / notifications 90d purge) and `orphan-cleanup` (storage) are registered but neither scheduled nor enqueued, and `jira-sync`, `jsm-sync`, `m365-calendar-sync`, `scheduled-notifications` are likewise dead code (no enqueue call anywhere in the API); (2) **the scan "staggered offsets" are dead config** — only `scheduledScans[0].offsetMin` is honored; the other 12 offsets are never applied, so all 9 hourly scans fire on the same tick (contradicts the in-code comment). Secondary gaps: Redis is only probed at startup, not in `/health`; worker webhook dispatch/retry paths skip the SSRF re-check that the API inline path applies; the worker has no `unhandledRejection` handler; `orphan-cleanup` uses the anon key (storage removal on private buckets will likely fail).

Overall resilience score: **4/5** — production-ready with testable controls, a small set of dead-code scheduling gaps, and no failure-injection validation.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
| ---- | ------------- | ------- | ------------- | ---- | ----- |
| API shutdown | `apps/api/src/main.ts` | SIGTERM/SIGINT drain + 10s force | Implemented | Low | shutdownCache() included |
| API unhandledRejection | `apps/api/src/main.ts:73-75` | Log-and-continue | Implemented as claimed | Low | No exit(1) — verified |
| API uncaughtException | `apps/api/src/main.ts:77-80` | Exit on fatal | Implemented | Low | exit(1) intentional |
| Cache init | `apps/api/src/main.ts:44-48` + `middleware/cache.ts` | Redis cache + memory fallback | Implemented, non-fatal | Low | Mount-scoped keys (collision fixed) |
| Circuit breaker | `lib/circuit-breaker.ts` + `services/supabase.ts` | Supabase admin fetch breaker | Implemented, wired | Low | threshold 5, timeout 30s; probe client bypasses |
| Redis health probe | `lib/health.ts` | Startup probe | Implemented | Medium | Not in /health endpoint |
| BullMQ producer (API) | `lib/task-producer.ts` | Enqueue tasks | Implemented | Low | Never throws; enabled in prod |
| BullMQ producer (worker) | `src/producer.ts` | Enqueue from worker main | Implemented | Low | Same options |
| BullMQ consumer | `src/consumer-bullmq.ts` | Execute jobs | Implemented, default | Low | concurrency 10, lock 30s |
| SQS consumer | `src/consumer-sqs.ts` | Dormant path | Present | Low | QUEUE_BACKEND=sqs |
| Webhook retry + DLQ | `src/tasks/webhook-retry.ts` | Retry failed deliveries | Implemented, scheduled 5min | Low | MAX_RETRIES 5, exp backoff, dead_letter table |
| Public-interaction retention | `src/tasks/public-interaction-retention.ts` | 90-day PII purge | Implemented, scheduled daily | Low | — |
| retention / orphan-cleanup | `src/tasks/retention.ts`, `orphan-cleanup.ts` | Audit/notification purge; storage cleanup | **Registered, never scheduled** | Medium | Dead code in production |
| jira/jsm/m365-calendar/scheduled-notifications | `src/tasks/*.ts` | Integration sync tasks | **Registered, never invoked** | Medium | No enqueue call site in API |
| Scan tasks (17 handlers) | `src/tasks/module-tasks.ts` | patch/endpoint/m365/backup/dmarc/status/phishing/saas/qbr/etc. | Implemented, scheduled | Medium | Offsets mostly dead config |
| API /health | `routes/health.ts` | DB/Stripe/JSM checks | Implemented | Medium | No Redis/queue check |
| Worker /health | `src/health-server.ts` | Liveness + queue health + draining 503 | Implemented | Low | Also /metrics |
| Request timeout | `middleware/request-timeout.ts` (app.ts:128) | 30s cap | Implemented | Low | — |
| Idempotency | `middleware/idempotency.ts` + Redis dedup | Duplicate suppression | Implemented | Low | Webhook keys + request keys |
| SSRF guard | `lib/ssrf-guard.ts` | Webhook URL validation | API-only | Medium | Worker paths skip re-check |
| Sentry | api/worker/web | Error tracking | Implemented all 3 | Low | DSN-gated |
| pino redaction | api + worker logger.ts | PII redaction | Implemented | Low | Extensive path lists |
| X-Request-ID | `middleware/request-id.ts` | Correlation | Implemented | Low | req.log child + header |
| Prometheus | api `lib/metrics.ts`, worker `src/metrics.ts` | HTTP/task/queue metrics | Implemented | Low | /metrics endpoints on both |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
| -------- | ----: | -------- | --- | ------------------ |
| Timeouts | 4 | requestTimeout 30s (app.ts:128); webhook fetch 10s AbortController; health probes 5s; breaker timeout 30s; Redis 3s | No per-route granular timeouts for long queries | Add route-level overrides where known-slow |
| Retries/backoff | 4 | BullMQ attempts 3 + exp 5s; webhook-retry exp backoff 60s*2^n, 5 max; SDK retry w/ backoff | Task retries count only 3 (no DLQ for generic tasks) | Consider DLQ table for permanently failed jobs |
| Idempotency | 4 | Redis dedup middleware; webhook deterministic keys; webhook-delivery idempotency_key | Queue-path dispatcher inserts no idempotency_key column value | Add idempotency_key to worker dispatcher inserts |
| Circuit breakers | 4 | Supabase admin global.fetch breaker (5 fail / 30s); health probes bypass | No breaker for JSM/Stripe/Teams outbound in routes (timeouts only) | Extend HttpClient pattern to all outbound |
| Queue DLQ | 3 | Webhook deliveries have dead_letter + webhook_dead_letters; BullMQ failed jobs retained 500 | Generic task jobs: no explicit DLQ routing after attempts | Add failed-job DLQ handler |
| Webhook recovery | 5 | webhook-retry scheduled 5min, exp backoff, DLQ, endpoint last_error/last_success_at | — | Keep |
| Worker recovery | 4 | BullMQ consumer with failed/error handlers; main loop catch + Sentry; in-flight drain | No unhandledRejection handler | Add (RES-P3-004) |
| Graceful shutdown | 4 | API drain + 10s force; worker drain + bull close; SQS path drains | API force-exit timeout unref'd; worker no force-exit fallback | Add force-exit to worker shutdown |
| DB/Redis/API/email/file/realtime failure | 3 | Redis cache fallback to memory; queue fallback to direct run; /health DB check; email SMTP warn-only | Redis absent from /health; realtime/SSE failure not covered; no email failure alerts | Add Redis to /health; alert on email/SMTP failure |
| Offline client | 3 | Error boundaries + retry buttons; projects list degrades gracefully; SDK timeouts | No offline caching/PWA for portal data | Document; PWA already partial (manifest) |
| Transactions | 2 | No cross-table transactions in API routes; bulk ops partial-success by design (RPC per item) | Multi-write flows (ticket+notify+audit) are fire-and-forget | Document partial-write guarantees; consider RPC transactions for key flows |
| Partial writes | 3 | Graceful degradation everywhere; cache invalidation on writes; audit failure non-blocking | Worker scan updates are per-batch (no transaction) | Acceptable; document |

## Detailed Review

### Item: API startup, unhandledRejection, graceful shutdown

- Evidence: `apps/api/src/main.ts`
- What it does: list; Redis probe; `initializeCache()` (non-fatal); SIGTERM/SIGINT drain with 10s force exit; `unhandledRejection` → log-and-continue; `uncaughtException` → log + exit(1).
- How it appears to work: Verified — the current handler at lines 73-75 logs `"Unhandled promise rejection — continuing"` and does NOT exit; the comment explains the restart-loop rationale. `shutdownCache()` is called before `server.close`. The Redis probe and cache init are non-fatal (warn + continue).
- Dependencies: Redis (optional), Supabase (optional at boot).
- Current controls: graceful drain, 10s force, non-fatal cache/Redis.
- Missing controls: none significant.
- Risks: Low.
- Recommended improvement: none.
- Suggested tests: shutdown unit test exists in suite? (not verified in depth) — add a test asserting SIGTERM closes server.

### Item: Worker scheduling matrix

- Evidence: `apps/worker/src/main.ts`
- What it does: schedules 20 intervals (stripe-reconcile 24h, public-interaction-retention 24h, webhook-retry 5m, sla-log-check 1h, business-os-snapshot 24h, automation-run-check 1h, approval-overdue-check 1h, and 13 scans).
- How it appears to work: All intervals `.unref()`; `runScheduledTask` enqueues via BullMQ and falls back to direct execution when the queue is unavailable. Initial scan run fires only for the first scan after its offset.
- Missing controls: 12 of 13 `offsetMin` values are dead config — only `scheduledScans[0]` offset is honored (see RES-P3-001). `retention` and `orphan-cleanup` are never scheduled (see RES-P2-001).
- Risks: Medium (scan stampede each hour; data-hygiene tasks never run).

### Item: Queue producer/consumer

- Evidence: `apps/worker/src/producer.ts`, `apps/api/src/lib/task-producer.ts`, `apps/worker/src/consumer-bullmq.ts`, `apps/worker/src/consumer-sqs.ts`, `apps/worker/src/env.ts`
- What it does: BullMQ `mct-tasks` queue; producer never throws; consumer default (`QUEUE_BACKEND=bulmq` default in env.ts:10).
- How it appears to work: API producer returns false on Redis failure (callers fall back, e.g., `dispatchWebhook` falls back to inline dispatch, `notify.ts` falls back). Job options: removeOnComplete 100, removeOnFail 500, attempts 3, exp backoff 5s. Redis password supported via `resolveRedisUrl`.
- Missing controls: no DLQ for generic failed jobs; failed jobs retained 500 (bounded but not actionable beyond logs).
- Risks: Low-Medium.

### Item: Webhook dispatch + retry + DLQ

- Evidence: `apps/api/src/lib/webhook-dispatcher.ts`, `apps/worker/src/tasks/webhook-dispatcher.ts`, `apps/worker/src/tasks/webhook-retry.ts`
- What it does: API dispatches via queue when available, else inline (SSRF-guarded); worker dispatcher delivers queued; webhook-retry (every 5 min) retries failed deliveries with exponential backoff up to 5 attempts, then dead-letters into `webhook_dead_letters` with full payload + attempt count.
- How it appears to work: Solid design. Inactive endpoints → immediate dead-letter. Endpoint last_error/last_success_at maintained.
- Missing controls: worker dispatcher and retry paths do not re-run `assertSafeWebhookUrl` (DNS rebinding re-check only on API inline path + write-time validation in webhook-management routes). Worker dispatcher inserts deliveries without `idempotency_key` (API inline path records it).
- Risks: Low-Medium (write-time URL validation is the primary control).

### Item: Retention / hygiene tasks

- Evidence: `apps/worker/src/tasks/retention.ts`, `orphan-cleanup.ts`, `public-interaction-retention.ts`, `tasks/index.ts`
- What it does: `retention` purges audit_logs (>365d) and notifications (>90d); `orphan-cleanup` removes unreferenced storage objects; `public-interaction-retention` purges contact-form rows (>90d).
- How it appears to work: Only `public-interaction-retention` is scheduled (daily). `retention` and `orphan-cleanup` are registered but have no schedule and no enqueue call site anywhere in the repo → they never run in production.
- Missing controls: schedules for the two tasks; orphan-cleanup also uses `SUPABASE_ANON_KEY` for `storage.remove` on private buckets (service-role required — likely silent failure even if scheduled).
- Risks: Medium — unbounded audit_logs/notifications growth; storage accumulation; stale PII (audit_logs may contain user info) beyond the 90-day contact-form scope.

### Item: Integration sync tasks

- Evidence: `apps/worker/src/tasks/jira-sync.ts`, `jsm-sync.ts`, `m365-calendar-sync.ts`, `scheduled-notifications.ts`, `tasks/index.ts` (registered), `apps/api/src` (grep: no enqueue call sites)
- What it does: Jira/JSM syncs, M365 calendar sync, scheduled-notifications dispatch.
- How it appears to work: Registered handlers exist but nothing enqueues them (`grep enqueueTask\("(jira|jsm|m365|scheduled` → no matches; no scheduled intervals in main.ts). Dead code in production.
- Risks: Medium — Jira/JSM integrations are write-only (inbound webhooks ingest; sync jobs never run); notification batching never runs.

### Item: Cache layer

- Evidence: `apps/api/src/middleware/cache.ts`
- What it does: Redis-backed with in-memory Map fallback; `buildCacheKey` uses `req.baseUrl + req.path` (mount-scoped, fixes the router-relative collision that poisoned /roles /organizations /documents /projects); `responseCacheNoRenew` (TTL stored once); `invalidateCache` on mutations; `shutdown()` on exit; 5,000-entry memory cap with 60s sweep.
- How it appears to work: Verified collision fix; Redis failure falls through to memory; flushDb on invalidate without pattern.
- Missing controls: Redis `keys()` pattern scan is O(N) on large key sets (fine at this scale).
- Risks: Low.

### Item: Circuit breaker

- Evidence: `apps/api/src/lib/circuit-breaker.ts`, `services/supabase.ts`
- What it does: Breaker (5 failures → open 30s → half-open, 2 successes → closed) wraps the Supabase admin client's fetch; test env bypasses; health probes use a dedicated no-breaker client so probes never trip the breaker.
- How it appears to work: Genuinely wired (services/supabase.ts:22-27, 44). The `op.catch(() => {})` + `Promise.race` timeout pattern is sound (prevents unhandled rejection on race loss).
- Missing controls: outbound HTTP to JSM/Stripe/Teams in routes uses timeouts/retries but no breaker (HttpClient exists with timeout+retry per prior work).
- Risks: Low.

### Item: Health / readiness

- Evidence: `apps/api/src/routes/health.ts`, `apps/api/src/lib/health.ts`, `apps/worker/src/health-server.ts`
- What it does: API /health checks Supabase (no-breaker), Stripe, JSM → 200/503; worker /health reports draining 503 + queue connection; worker /metrics; API /metrics.
- How it appears to work: Redis is checked only at startup (`main.ts:28-40`); /health omits Redis even though Redis backs cache, idempotency, and the task queue.
- Missing controls: Redis in /health; queue depth in API health.
- Risks: Medium — a dead Redis makes cache misses + queue fallbacks (degraded, not down), but liveness stays green with no signal.

### Item: Observability cross-check (OBS annex)

- Evidence: `apps/api/src/lib/sentry.ts`, `apps/worker/src/main.ts:11-18`, `apps/web/instrumentation.ts` + `sentry.server/edge.config.ts`, `apps/api/src/lib/logger.ts`, `apps/worker/src/logger.ts`, `apps/api/src/middleware/request-id.ts`, `apps/api/src/lib/metrics.ts`, `apps/worker/src/metrics.ts`
- Structured logs: pino in API + worker with extensive redaction paths (password/secret/token/authorization/cookie/email/phone/to/recipient + nested variants); web has `lib/logger.ts` (server-only). ✅
- Request correlation: `requestId` middleware sets `X-Request-ID` header + `req.log` child; requestLogger emits method/path/status/duration/UA/IP per request with Prometheus counters/histograms. ✅
- Error tracking: Sentry init in all 3 services, DSN-gated, tracesSampleRate 0.2 (prod); worker captures task errors + uncaught exceptions; web uses `Sentry.captureRequestError` + error boundaries. ✅
- Metrics: API /metrics (HTTP totals + durations); worker /metrics (task executions total/duration, queue depth gauge, memory, registered tasks). ✅
- Tracing: Sentry traces only (sample 0.2); no OpenTelemetry. ➖
- Worker `unhandledRejection`: absent (API has it). ⚠️
- Golden signals: latency ✅ / traffic ✅ / errors ✅ / saturation — partial (worker memory + queue depth; no DB saturation metric). ➖
- Alerts/dashboards: documented in `docs/MONITORING_AND_ALERTING.md` (per AGENTS.md); no in-repo alert rules for Sentry metrics (unknown — docs only). ➖

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
| -- | ------------------- | -------- | --------------- | --- | -------- | -------------- |
| RES-001 | Timeouts | app.ts:128, AbortControllers, breaker timeout | 30s request cap; 10s webhook; 5s probes | Per-route overrides | P3 | Add overrides for known-slow routes |
| RES-002 | Retries/backoff | BullMQ 3 attempts exp 5s; webhook-retry 60s*2^n max 5 | Solid | Generic-task DLQ | P3 | Add failed-job DLQ handler |
| RES-003 | Idempotency | idempotency middleware + webhook keys | Solid | Worker dispatcher skips idempotency_key column | P3 | Add key to worker dispatcher inserts |
| RES-004 | Circuit breakers | services/supabase.ts global.fetch | Wired | JSM/Stripe/Teams outbound unbreakered | P3 | Extend breaker to outbound HTTP |
| RES-005 | Queue DLQ | webhook dead_letter + webhook_dead_letters | Webhook-specific only | Generic tasks | P3 | Task DLQ table |
| RES-006 | Webhook recovery | webhook-retry scheduled 5min | Complete | — | — | Keep |
| RES-007 | Worker recovery | consumer-bullmq failed/error handlers | Good | No unhandledRejection | P3 | Add handler (RES-P3-004) |
| RES-008 | Graceful shutdown | main.ts API + worker drain | Good | Worker no force-exit fallback | P3 | Add force-exit timeout |
| RES-009 | DB/Redis/API/email/file failure | cache fallback, queue fallback, health checks | Partial | Redis not in /health; email failure silent | P2 | Add Redis to /health; email alert |
| RES-010 | Offline client | error boundaries, retry buttons, degraded lists | Good | No offline data caching | P3 | Document/partial PWA |
| RES-011 | Transactions | bulk RPC partial-success by design | Documented behavior | Multi-write flows not transactional | P3 | Document guarantees |
| RES-012 | Partial writes | cache invalidation, audit non-blocking | Good | Scan batches non-transactional | P3 | Acceptable; document |
| RES-013 | Scheduled task drift | main.ts schedules | 20 intervals | retention/orphan unscheduled; 4 sync tasks dead; offsets dead | P2 | Schedule or delete (RES-P2-001/002) |
| OBS-001 | Structured logs | pino + redaction all services | Complete | — | — | Keep |
| OBS-002 | Request IDs | request-id middleware | Complete | — | — | Keep |
| OBS-003 | Error tracking | Sentry 3 services | Complete | — | — | Keep |
| OBS-004 | Metrics | /metrics api+worker | Good | No DB saturation metric | P3 | Add |
| OBS-005 | Tracing | Sentry traces 0.2 | Partial | No OTel | P3 | Evaluate |
| OBS-006 | Health/readiness | /health api+worker | Partial | Redis omitted from API /health | P2 | Add Redis check |
| OBS-007 | Client/API/worker errors | Sentry + error boundaries | Good | — | — | Keep |
| OBS-008 | Job metrics | worker_task_executions_total/duration | Good | Queue-depth gauge 2s timeout race | P3 | Fine at scale |
| OBS-009 | DB/queue/webhook/notification metrics | webhook_deliveries tables + metrics | Partial | No notification-delivery metrics | P3 | Add |
| OBS-010 | Uptime checks | health endpoints + E2E smoke | Good | No scheduled prod smoke | P3 | Add cron smoke |
| OBS-011 | Alerts | MONITORING_AND_ALERTING.md | Documented | No in-repo alert config | P3 | Review against docs |
| OBS-012 | Dashboards | docs only | Documented | No in-repo dashboards | P3 | Export Grafana JSON |

## Findings

### Finding ID: RES-P2-001 - `retention` and `orphan-cleanup` tasks are registered but never scheduled or enqueued

- Severity: P2
- Confidence: High
- Area: Resilience / Data hygiene
- Evidence:
  - `apps/worker/src/tasks/index.ts` — lines 40, 43 register `retention` and `orphan-cleanup`
  - `apps/worker/src/main.ts` — no interval for either task (only `public-interaction-retention` at lines 57-65)
  - `apps/api/src/` — grep for `enqueueTask("retention"` / `enqueueTask("orphan-cleanup"` → no call sites
- What is happening: `retention` (purges audit_logs >365d and notifications >90d) and `orphan-cleanup` (removes unreferenced storage objects) are registered handlers with tests, but nothing invokes them: no schedule in main.ts and no enqueue call in the API. They never run in production.
- Why it matters: audit_logs and notifications grow without bound; storage buckets accumulate orphaned files; multi-tenant PII in audit rows is never aged out.
- User / business impact: Storage/db bloat and slower queries over time; compliance exposure (unbounded audit history contradicts the retention policy).
- Security / privacy / reliability impact: Privacy — no age-out of audit data; reliability — unbounded table growth.
- Recommended fix: Add daily schedules in `main.ts` (e.g., `retention` daily at offset, `orphan-cleanup` daily), or enqueue them from the API admin panel; alternatively delete the handlers if intentionally abandoned.
- Suggested validation: Worker test asserting both tasks run on schedule (timer-based test); run task against a seeded DB and verify row counts shrink.
- Owner suggestion: Implementation agent.
- Effort estimate: S
- Dependencies: None.
- Status: Open

### Finding ID: RES-P2-002 - `jira-sync`, `jsm-sync`, `m365-calendar-sync`, `scheduled-notifications` are registered but never invoked

- Severity: P2
- Confidence: High
- Area: Resilience / Feature completeness
- Evidence:
  - `apps/worker/src/tasks/index.ts` — lines 35-39 register all four
  - `apps/api/src/` — grep `jira-sync|jsm-sync|m365-calendar-sync|scheduled-notifications` → no matches
  - `apps/worker/src/main.ts` — no intervals for them
- What is happening: The four integration handlers are dead code in production: nothing enqueues them and no schedule exists.
- Why it matters: Jira/JSM and M365 integrations are effectively write-only (inbound webhooks ingest); the documented sync behavior (status mapping, calendar sync, scheduled notification batching) never executes.
- User / business impact: Jira/JSM badge/status sync and calendar events silently absent for clients.
- Security / privacy / reliability impact: Low security; functional gap.
- Recommended fix: Either wire enqueue call sites (e.g., trigger jira/jsm sync on inbound webhook or a 15-min interval) or delete the dead handlers to reduce maintenance surface.
- Suggested validation: Enqueue via producer and observe handler execution in worker logs; or remove and delete tests.
- Owner suggestion: Implementation agent.
- Effort estimate: S-M
- Dependencies: None.
- Status: Open

### Finding ID: RES-P3-001 - Scan "staggered offsets" are dead config — only the first scan's offset is honored

- Severity: P3
- Confidence: High
- Area: Resilience
- Evidence:
  - `apps/worker/src/main.ts` — lines 122-136 define `offsetMin` for all 13 scans; lines 137-145 schedule each with `setInterval(…, scan.intervalMs)` ignoring `offsetMin`; lines 146-156 apply the offset only to `scheduledScans[0]`
- What is happening: The code comment claims scans are staggered, but only the first scan gets its offset (initial delayed run at 3 min). The other 12 offsets (8, 13, 18, 23, 28, 33, 38, 43, 48, 53, 58, 63) are never read. All 9 hourly scans (domain/website/vendor/patch/license/backup/phishing/status/dmarc) fire on the same tick every hour after the first interval.
- Why it matters: Hourly DB/network stampede of 9 scans; the intended jitter is absent. Contradicts AGENTS.md's "staggered schedules" claim.
- User / business impact: Minor periodic load spikes on the hosted Supabase project and worker.
- Security / privacy / reliability impact: Low reliability (bounded CPU/DB contention).
- Recommended fix: Apply per-scan initial delays: `setTimeout(run, offsetMin * 60_000)` before starting the interval, or compute a `setTimeout` chain. E.g., `const initial = setTimeout(() => { run(scan); interval = setInterval(...) }, offsetMin * 60000)`.
- Suggested validation: Unit test asserting each scan's first-run timer uses its own offset.
- Owner suggestion: Implementation agent.
- Effort estimate: S
- Dependencies: None.
- Status: Open

### Finding ID: RES-P3-002 - Redis health is only probed at startup; /health omits Redis

- Severity: P3
- Confidence: High
- Area: Resilience / Observability
- Evidence:
  - `apps/api/src/main.ts` — lines 28-40 (startup probe only)
  - `apps/api/src/routes/health.ts` — checks database, stripe, jsm; no Redis
  - `apps/api/src/lib/health.ts` — `checkRedisHealth` exists with 3s connect timeout + not_configured handling
- What is happening: Redis backs the response cache, idempotency store, and task queue, but its runtime health never appears in `/health` or `/metrics`; only a one-time startup probe logs it.
- Why it matters: A mid-flight Redis outage degrades caching/idempotency/queueing silently while liveness stays green — operators have no signal.
- User / business impact: Cache misses + queue fallbacks during outage; invisible to ops.
- Security / privacy / reliability impact: Reliability/observability gap.
- Recommended fix: Add `checkRedisHealth` to `routes/health.ts` (non-fatal → `degraded`), and add a Redis gauge to `/metrics`.
- Suggested validation: API /health shows redis unhealthy when REDIS_URL points at a dead port.
- Owner suggestion: Platform engineer.
- Effort estimate: S
- Dependencies: None.
- Status: Open

### Finding ID: RES-P3-003 - Worker webhook dispatch/retry paths skip the SSRF re-check

- Severity: P3
- Confidence: High
- Area: Resilience / Security hardening
- Evidence:
  - `apps/api/src/lib/webhook-dispatcher.ts` — line 65 `await assertSafeWebhookUrl(endpoint.url)`
  - `apps/worker/src/tasks/webhook-dispatcher.ts` — fetch at line 67, no assert
  - `apps/worker/src/tasks/webhook-retry.ts` — fetch at line 73, no assert
  - `apps/api/src/routes/webhook-management.ts` — lines 84/123/259 validate URL at create/update/test
- What is happening: URL safety is enforced at write-time (create/update/test) and on the API inline dispatch path, but the queue-routed worker dispatcher and the retry task fetch endpoint URLs without re-running `assertSafeWebhookUrl` (DNS-rebinding re-check).
- Why it matters: A webhook URL that validated earlier could be rebinding to internal addresses at dispatch time; the API path defends against this, the worker path does not — inconsistent mitigation.
- User / business impact: Low (URLs are admin-set with auth); residual SSRF risk via DNS rebinding on the worker path.
- Security / privacy / reliability impact: Security — SSRF defense asymmetry.
- Recommended fix: Port `ssrf-guard.ts` to a shared package or duplicate it in the worker; call `assertSafeWebhookUrl` in worker dispatcher + retry before fetch.
- Suggested validation: Worker test with `127.0.0.1` URL expecting guarded failure.
- Owner suggestion: Implementation agent.
- Effort estimate: S-M
- Dependencies: Shared package extraction or copy.
- Status: Open

### Finding ID: RES-P3-004 - Worker process has no `unhandledRejection` handler

- Severity: P3
- Confidence: High
- Area: Resilience
- Evidence:
  - `apps/worker/src/main.ts` — only `uncaughtException` handler (lines 27-32)
  - `apps/api/src/main.ts` — lines 73-75 log-and-continue handler
- What is happening: Any unhandled promise rejection in the worker (e.g., inside a scheduled `runScheduledTask` path not covered by `.catch`, or a metric promise) rejects silently on Node's default path (warning-only in newer Node, but in older Node it terminates the process).
- Why it matters: Asymmetric crash behavior vs the API; a single stray rejection could take the worker down (or be silently swallowed without Sentry capture).
- User / business impact: Missed scheduled jobs (scans, retries, retention).
- Security / privacy / reliability impact: Reliability.
- Recommended fix: Add the same log-and-continue handler as the API, with Sentry capture.
- Suggested validation: Unit test firing a rejected promise and asserting no exit + Sentry capture.
- Owner suggestion: Implementation agent.
- Effort estimate: S
- Dependencies: None.
- Status: Open

### Finding ID: RES-P3-005 - `orphan-cleanup` authenticates storage removal with the anon key

- Severity: P3
- Confidence: High
- Area: Resilience / Correctness
- Evidence:
  - `apps/worker/src/tasks/orphan-cleanup.ts` — line 11 `createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)` then `supabase.storage.remove(...)` (lines 40-42, 68-70)
- What is happening: Storage delete on private buckets (`documents`, `avatars`) requires service-role (or matching storage policies); anon-key removal will fail with 403 for private buckets, so even if scheduled the task would silently remove nothing.
- Why it matters: The task's purpose (orphaned-file cleanup) is defeated by the wrong credential; combined with RES-P2-001 it is doubly dead.
- User / business impact: Storage bloat persists.
- Security / privacy / reliability impact: Low; correctness.
- Recommended fix: Use `getSupabaseAdmin()` (service role) consistently; verify storage RLS policies permit service-role removal.
- Suggested validation: Unit test asserting client uses service role; manual bucket test.
- Owner suggestion: Implementation agent.
- Effort estimate: S
- Dependencies: None.
- Status: Open

### Finding ID: RES-P3-006 - Generic BullMQ tasks have no DLQ beyond retained failed jobs

- Severity: P3
- Confidence: High
- Area: Resilience
- Evidence:
  - `apps/worker/src/producer.ts` / `apps/api/src/lib/task-producer.ts` — `removeOnFail: 500, attempts: 3`
  - `apps/worker/src/consumer-bullmq.ts` — "failed" event logs only
- What is happening: After 3 failed attempts, generic task jobs stay in the failed set (bounded at 500) with only a log line; there is no persistent dead-letter record (unlike webhook deliveries which have `webhook_dead_letters`).
- Why it matters: Permanently failing tasks (e.g., a scan hitting a bad table) are invisible to operators beyond logs; no replay/diagnosis surface.
- User / business impact: Silent repeated failures for scheduled scans.
- Security / privacy / reliability impact: Reliability/observability.
- Recommended fix: Add a `failed` event handler that writes to a `task_dead_letters` table (type, payload, error, attempts).
- Suggested validation: Worker test triggering a permanently failing handler and asserting DLQ insert.
- Owner suggestion: Implementation agent.
- Effort estimate: S-M
- Dependencies: Migration for a new table (optional — JSONB in existing table).
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| ---- | -------- | ---------- | ------ | -------- | ---------- |
| Audit/notification tables grow unbounded | P2 | Certain (time) | DB bloat, slower queries, compliance | retention task unscheduled (RES-P2-001) | Schedule retention daily |
| Storage orphan accumulation | P2 | Certain (time) | Cost + clutter | orphan-cleanup unscheduled + anon key (RES-P2-001/005) | Schedule + fix credential |
| Jira/JSM/M365 sync features silently absent | P2 | Certain | Client-facing feature gap | dead handlers (RES-P2-002) | Wire or delete |
| Hourly scan stampede | P3 | Certain | Load spikes | offset dead config (RES-P3-001) | Apply per-scan offsets |
| Redis outage invisible to health | P3 | Low | Silent degradation | /health omits Redis (RES-P3-002) | Add Redis check |
| Worker crash on stray rejection | P3 | Low | Missed jobs | no unhandledRejection (RES-P3-004) | Add handler |
| DNS-rebinding SSRF via worker path | P3 | Very low | Internal access | missing worker SSRF re-check (RES-P3-003) | Port guard to worker |

## Recommendations

### Immediate / Release Blocking

None — no P0 findings at HEAD. Recommend scheduling `retention`/`orphan-cleanup` before the next release to prevent continued table growth (RES-P2-001).

### This Week

1. Schedule `retention` (daily) and `orphan-cleanup` (daily) in `main.ts`; fix anon-key in orphan-cleanup (RES-P2-001, RES-P3-005).
2. Add worker `unhandledRejection` handler mirroring the API (RES-P3-004).
3. Add Redis to API `/health` + a Redis gauge (RES-P3-002).

### This Month

4. Apply per-scan staggered initial delays (RES-P3-001).
5. Port SSRF guard into worker dispatch/retry paths (RES-P3-003).
6. Decide fate of the 4 dead integration sync tasks — wire or delete (RES-P2-002).
7. Add task DLQ table + failed-event handler (RES-P3-006).

### Later / Platform Evolution

8. Outbound circuit breakers for JSM/Stripe/Teams.
9. Scheduled prod smoke job (health + login).
10. Alert rules review against `docs/MONITORING_AND_ALERTING.md`; export dashboards as code.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --------- | ------------ | --------------------- | ---------- |
| Add `checkRedisHealth` to /health | Dead-Redis visibility | `apps/api/src/routes/health.ts` | Health shows degraded |
| Worker unhandledRejection handler | Parity with API crash behavior | `apps/worker/src/main.ts` | Fired-rejection test |
| Apply scan offsets | Removes hourly stampede | `apps/worker/src/main.ts` | Timer unit test |
| Use service role in orphan-cleanup | Task actually works when scheduled | `apps/worker/src/tasks/orphan-cleanup.ts` | Bucket test |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| ------------ | -------- | ---------------- | ------ | ---------- |
| Schedule retention + orphan-cleanup | P2 | Implementation agent | S | RES-P3-005 fix |
| Wire or delete 4 sync tasks | P2 | Implementation agent | S-M | Product decision |
| Redis in /health | P3 | Platform engineer | S | — |
| Scan offset fix | P3 | Implementation agent | S | — |
| Worker SSRF re-check | P3 | Implementation agent | S-M | Shared guard package |
| Worker unhandledRejection | P3 | Implementation agent | S | — |
| Task DLQ table | P3 | Implementation agent | S-M | Migration |
| Outbound breakers | P3 | Platform engineer | M | — |
| Prod smoke cron | P3 | Platform engineer | S | — |

## Suggested Tests

- Unit: per-scan first-run offset applied (RES-P3-001).
- Unit: `checkRedisHealth` wired into /health route (RES-P3-002).
- Worker: unhandledRejection handler logs + continues (RES-P3-004).
- Worker: orphan-cleanup uses service-role client (RES-P3-005).
- Worker: permanently failing task writes DLQ row (RES-P3-006).
- Chaos/failure injection: Redis-down (cache memory fallback + queue fallback + /health degraded), Supabase-down (breaker trips, liveness stays green via NoBreaker probe), queue-down (scheduled tasks execute directly).
- E2E: webhook endpoint with unreachable URL → delivery failed → retry scheduled → dead-lettered after 5 attempts (existing webhook E2E covers create/test; extend to retry lifecycle).

## Suggested Documentation Updates

- `AGENTS.md` — correct the "staggered schedules" claim if offsets remain dead config; note retention/orphan-cleanup scheduling when fixed.
- `docs/MONITORING_AND_ALERTING.md` — add Redis-to-/health and task-DLQ alert guidance.
- `docs/ROLLBACK_PROCEDURES.md` — already covers Docker/Supabase/Terraform; add a "worker stuck in drain" procedure.

## Open Questions

| Question | Why it matters | Evidence needed |
| -------- | -------------- | --------------- |
| Are jira/jsm/m365-calendar/scheduled-notifications intentionally dormant? | Dead handlers are maintenance surface + broken promises | Product decision / issue tracker |
| Does the hosted Redis persist through deploy restarts (removeOnComplete/removeOnFail budgets)? | Queue job retention behavior | Redis inspection on droplet |
| Is audit_logs retention (365d) the intended policy for multi-tenant compliance? | Privacy/compliance exposure while task unscheduled | Legal/product confirmation |
| Do storage buckets have service-role delete policies? | orphan-cleanup viability | Supabase storage policy review |

## Appendix

### Failure mode inventory (critical paths)

| Path | Failure | Current behavior | Verdict |
| ---- | ------- | ---------------- | ------- |
| Request handling | Supabase down | Breaker opens after 5 failures; fail-fast 503-ish errors; liveness stays green | Acceptable |
| Request handling | Redis down | Cache → memory fallback; idempotency/queue degrade; no /health signal | GAP (RES-P3-002) |
| Webhook delivery | Endpoint down | Queue path → retry 5x exp backoff → dead_letter table | Solid |
| Scheduled scans | Queue down | `runScheduledTask` executes directly | Solid |
| Task permanently fails | — | Failed job retained (500) + log; no DLG record | GAP (RES-P3-006) |
| Audit/notification tables | growth | Never purged | GAP (RES-P2-001) |
| API shutdown | SIGTERM | Drain + 10s force; cache closed | Solid |
| Worker shutdown | SIGTERM | Drain in-flight + bull close; no force fallback | Minor gap |
| Scan cadence | — | 9 hourly scans same tick | GAP (RES-P3-001) |

### Observability quick reference (verified at HEAD)

| Signal | API | Worker | Web |
| ------ | --- | ------ | --- |
| Structured logs (pino + redaction) | ✅ `lib/logger.ts` | ✅ `src/logger.ts` | ✅ `lib/logger.ts` (server-only) |
| X-Request-ID correlation | ✅ `middleware/request-id.ts` | n/a (task-level) | ✅ via API |
| Sentry | ✅ `lib/sentry.ts` | ✅ main.ts + task-registry | ✅ instrumentation + edge/server configs |
| Prometheus /metrics | ✅ HTTP totals/durations | ✅ task exec/duration/queue-depth/memory | n/a |
| Health/readiness | ✅ /health (DB/Stripe/JSM) — no Redis | ✅ /health + draining 503 | ✅ Docker HEALTHCHECK |
