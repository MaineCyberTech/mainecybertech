# Performance, Scalability, and Cost Audit

## Audit Metadata

- **Audit name:** repo-deep-dive
- **Run:** 20260730-0650-develop-62da92c
- **Repository:** C:\temp\mainecybertech-portal
- **Branch:** develop
- **Commit SHA:** 62da92c
- **Generated at:** 2026-07-30T06:50:00Z
- **Auditor:** principal-level repository auditor
- **Area code:** PERF
- **Scope limitations:** Code analysis only; no load testing, profiling, or production traffic data available.

## Scope

Full audit of performance characteristics: caching strategy, N+1 query patterns, database indexes, bundle size, streaming/SSR optimization, rate limiting, response compression, docker build speed, concurrent middleware patterns, and cost optimization for the single-droplet deployment.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |
| `apps/api/src/middleware/cache.ts` | Response caching | responseCacheNoRenew logic | Cache store, TTL, invalidation pattern |
| `apps/api/src/routes/notifications.ts` | SSE endpoint | Notification stream | GET /api/v1/notifications/stream |
| `apps/api/src/lib/rate-limiter.ts` | Rate limiting | RateLimit middleware | 300 req/15min global, auth stricter |
| `apps/api/src/middleware/error.ts` | Error handler | Global error handler | Returns immediately on error |
| `apps/api/src/lib/supabase.ts` | DB performance | Connection pooling via undici | No explicit pool config |
| `apps/web/app/(portal)/portal/dashboard/page.tsx` | Parallel data | Promise.all for 4 fetches | Example of concurrency pattern |
| `apps/web/app/(portal)/portal/layout.tsx` | Layout performance | Parallel data with dependent calls | 4 parallel, then 2 dependent |
| `apps/api/src/middleware/auth.ts` | Auth overhead | requireAuth + requireAdmin | Single JOIN query for admin check |
| `apps/api/src/routes/roles.ts` | Compound endpoint | GET /roles/with-permissions | 2 queries instead of N+1 |
| `apps/web/next.config.mjs` | Web build | output: standalone, outputFileTracingRoot | Docker build optimization |
| `apps/web/Dockerfile` | Docker build | Multi-stage, .next/cache cleanup | pnpm workspace copy |
| `apps/api/Dockerfile` | Docker build | Multi-stage, no --dts flag | Avoids TS2742 |
| `apps/worker/Dockerfile` | Docker build | Multi-stage | Health server included |
| `infra/digitalocean/docker-compose.yml` | Resource allocation | Defined ports, healthchecks | No mem_limit/cpus |
| `.github/workflows/deploy-do.yml` | Deploy performance | Image piping over SSH | 5x speed improvement |
| `docs/MONITORING_AND_ALERTING.md` | Performance monitoring | RUM insights, error budgets | No synthetic monitoring |

## Executive Summary

**Performance score: 3.5/5.** The platform shows good awareness of performance patterns: response caching with `responseCacheNoRenew`, compound endpoints to avoid N+1, parallel data fetching in portal layouts, SSE for real-time notifications, rate limiting, and optimized Docker builds with fast deploy via image piping. Key gaps: no database indexes review in migrations, no bundle analysis for web chunks, no explicit pool configuration for database connections, and no container resource limits leading to known OOM issues (Web was bumped from 128MB→256MB).

### Strengths

- **Response caching** — `responseCacheNoRenew()` middleware with TTL-on-miss semantics for orgs (60s), documents/projects (30s), roles. Invalidation on mutation.
- **Compound endpoints** — `GET /roles/with-permissions` eliminates N+1 for roles list. Similar pattern for users and orgs.
- **Parallel data fetching** — Portal layout (`layout.tsx`) runs 4 fetches in parallel, then 2 dependent. Dashboard similar pattern.
- **SSE notifications** — Real-time notification stream at `GET /api/v1/notifications/stream` avoids 30s polling.
- **Rate limiting** — Global 300 req/15min, auth routes stricter. RateLimit middleware with Redis store.
- **Fast deploys** — Image piping over SSH (5x faster than GHCR pull), targeted old-image cleanup, builder prune in post-deploy.
- **Docker build optimization** — Multi-stage builds, `.next/cache` cleanup in builder stage, `--dts` removed to avoid TS2742, corepack for pnpm.

### Major Risks

- **No database index strategy documented** — 47 migrations but no index review. Missing indexes on `audit_logs(entity_type, entity_id)`, `notifications(user_id, read)`, `ticket_comments(ticket_id, created_at)` would cause table scans at scale.
- **Bundle size analysis not tracked** — `@next/bundle-analyzer` installed but no budget or CI gate. Large client bundles degrade initial load.
- **DB connection pooling unconfigured** — `supabase.ts` uses undici global.fetch but no explicit pool min/max/acquire timeout.
- **Web container OOM history** — Known issue (128MB→256MB fix documented). Still no `mem_limit` in docker-compose.
- **Rate limiting is global only** — No per-route granularity (e.g., auth rate limit at 5/min vs search at 100/min).

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
| ---- | ------------- | ------- | ------------- | ---- | ----- |
| Response cache | `apps/api/src/middleware/cache.ts` | TTL-based caching with no-renew | ✅ | Low | 60s orgs, 30s docs/projects, invalidate on mutation |
| SSE notifications | `apps/api/src/routes/notifications.ts` | Real-time notification stream | ✅ | Low | GET /api/v1/notifications/stream |
| Rate limiter | `apps/api/src/lib/rate-limiter.ts` | Global + auth rate limiting | ✅ | Low | 300 req/15min global |
| Compound roles endpoint | `apps/api/src/routes/roles.ts` | Roles + permission counts in 2 queries | ✅ | Low | Eliminates N+1 |
| Parallel data fetching | `apps/web/app/(portal)/portal/layout.tsx` | Concurrent data loading | ✅ | Low | 4 parallel, then 2 dependent |
| SSG/ISR | — | Static generation | ❌ Absent | Medium | Force-dynamic on admin/portal |
| DB indexes | — | Query performance | ❌ Not reviewed | High | 47 migrations, no index audit |
| Bundle analysis | `apps/web/next.config.mjs:12-14` | Bundle analyzer config | ⚠️ Configured, not gated | Medium | No CI budget check |
| DB pool config | `apps/api/src/lib/supabase.ts` | Connection pooling | ⚠️ Present, unconfigured | Medium | No min/max/acquire timeout |
| Web OOM prevention | `infra/digitalocean/docker-compose.yml` | Container memory | ❌ No limits | Medium | Known OOM fixed via 256MB image but no mem_limit |
| Rate limit granularity | `apps/api/src/lib/rate-limiter.ts` | Global only | ⚠️ Partial | Medium | No per-route configs |
| Docker build cache | 3 Dockerfiles | Multi-stage builds | ✅ | Low | .next/cache cleanup, corepack |
| Deploy speed | `deploy-do.yml` | Image piping over SSH | ✅ | Low | ~8 min deploy, 5x faster |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
| -------- | ----: | -------- | --- | ------------------ |
| Response caching | 4 | responseCacheNoRenew + invalidation | No cache on tickets list, users list | Add cache to remaining list endpoints |
| SSE / real-time | 4 | Notification stream endpoint | Client still uses 30s polling fallback | Migrate client to SSE |
| Rate limiting | 4 | Global + auth rate limiter | No per-route granularity | Add route-specific rate limit configs |
| N+1 prevention | 4 | Compound endpoints (roles, users, orgs) | No compound for tickets detail (5 calls) | Review remaining admin pages for N+1 |
| DB query performance | 2 | No index audit | 47 migrations, no index review | Audit and index key query patterns |
| Docker build speed | 4 | Multi-stage, cache cleanup, corepack | Web build still slow (~10 min) | Evaluate pnpm deploy files |
| Network latency | 3 | Single droplet, Caddy reverse proxy | Single point of network failure | Accept single-droplet limitation |
| Bundle size | 2 | analyzer configured, no budget | No CI gate for bundle size increase | Add bundle-budget to CI |
| CDN/caching | 3 | Cloudflare proxy, Docker build cache | No Cloudflare cache rules in repo | Add Cloudflare page rules configs |
| Resource allocation | 2 | No container limits | Known Web OOM, no mem_limit/cpus | Add resource limits to docker-compose |
| Image registry | 4 | GHCR with SHA-tagged, immutable images | 1.4GB image size (Web) | Optimize base image (alpine?) |

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
| -- | ------------------- | -------- | --------------- | --- | -------- | -------------- |
| PERF-001 | User requests org list | cache.ts | 60s cached with no-renew | None | ✅ Satisfied |
| PERF-002 | User requests documents list | cache.ts | 30s cached with no-renew | None | ✅ Satisfied |
| PERF-003 | Admin loads roles with permissions | roles.ts | Compound endpoint, 2 queries | None | ✅ Satisfied |
| PERF-004 | Portal dashboard loads | layout.tsx | 4 parallel + 2 dependent | None | ✅ Satisfied |
| PERF-005 | Rate limit exceeded | rate-limiter.ts | 429 Too Many Requests | No per-route limits | P2 |
| PERF-006 | Audit log search (large table) | migrations | No index on entity_type + entity_id | Table scan for audit filter | P1 |
| PERF-007 | Notification query | migrations | No index on user_id + read | Table scan for unread count | P1 |
| PERF-008 | Web OOM on high traffic | docker-compose.yml | No mem_limit | Container killed without limits | P1 |
| PERF-009 | Large bundle sent to client | next.config.mjs | analyzer configured, no budget | Bloat undetected in CI | P2 |
| PERF-010 | DB connection spike | supabase.ts | No explicit pool limits | Potential connection exhaustion | P2 |

## Findings

### Finding ID: PERF-P1-001 - No database index audit in 47 migrations

- **Severity:** P1
- **Confidence:** High
- **Area:** Performance
- **Evidence:**
  - 47 migration files in `supabase/migrations/`
  - No index-related migration found (grep for `CREATE INDEX` or `CREATE UNIQUE INDEX` across all migrations)
  - Query patterns identified: `audit_logs` filtered by `entity_type + entity_id`, `notifications` filtered by `user_id + read`, `ticket_comments` filtered by `ticket_id`
- **What is happening:** No explicit database indexes have been defined. The platform relies on Postgres default indexes (primary keys, unique constraints). Filter queries on large tables will perform table scans at scale.
- **Why it matters:** Table scans on `audit_logs` (every mutation logs here) and `notifications` (polled every 30s per user) will cause significant query slowdown as data grows.
- **Recommended fix:** Create a new migration that adds indexes: `audit_logs(entity_type, entity_id)`, `audit_logs(organization_id, created_at)`, `notifications(user_id, read)`, `ticket_comments(ticket_id, created_at)`, `notifications(organization_id)`.
- **Status:** Open

### Finding ID: PERF-P1-002 - No container memory limits in production docker-compose

- **Severity:** P1
- **Confidence:** High
- **Area:** Performance/Resilience
- **Evidence:**
  - `infra/digitalocean/docker-compose.yml` — no `mem_limit` or `cpus` on any service
  - Known Web OOM issue documented in AGENTS.md: "Fixed Web container OOM kills (128MB→256MB)"
  - The OOM was "fixed" by rebuilding with more memory in the image, but docker-compose still allows unbounded memory growth
- **What is happening:** A container with a memory leak or traffic spike can consume all droplet memory, causing the kernel OOM killer to target the largest process. The previous fix addressed the symptom (Web needed more memory) but not the root cause (no memory limit).
- **Recommended fix:** Add `mem_limit: 256m` for web, `mem_limit: 512m` for api, `mem_limit: 256m` for worker, `mem_limit: 128m` for redis to docker-compose.yml. Monitor for OOM kills.
- **Status:** Open

### Finding ID: PERF-P1-003 - No per-route rate limiting granularity

- **Severity:** P2
- **Confidence:** Medium
- **Area:** Performance/Security
- **Evidence:**
  - `apps/api/src/lib/rate-limiter.ts:10-16` — global rate limit: 300 requests per 15 minutes
  - `apps/api/src/routes/auth.ts` — auth rate limit applied, but grep shows only 3 calls to `rateLimiter` across all routes
- **What is happening:** Every route shares the same global rate limit (300/15min). Auth endpoints at 5 req/min, search at 100/min, and bulk import at 10/min should have different limits. A burst on one route can exhaust the global limit for all others.
- **Recommended fix:** Implement per-route rate limiters (keyed by path prefix) with route-specific limits. Auth: 20/15min, Search: 200/15min, Bulk: 30/15min, Default: 300/15min.
- **Status:** Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| ---- | -------- | ---------- | ------ | -------- | ---------- |
| Audit log table scan | P1 | Medium | High | No index on entity_type + entity_id | Create index migration |
| Notification table scan | P1 | Medium | Medium | No index on user_id + read | Create index migration |
| OOM kill on traffic spike | P1 | Medium | High | No mem_limit in docker-compose | Add container memory limits |
| Rate limit exhaustion by single route | P2 | Medium | Medium | Global rate limit only | Add per-route rate limit configs |
| Bundle bloat undetected | P2 | Low | Medium | Analyzer not gated in CI | Add bundle-budget CI check |
| DB connection exhaustion | P2 | Low | High | No explicit pool limits | Add pool config |

## Recommendations

### Immediate / Release Blocking

1. Create index migration for audit_logs, notifications, ticket_comments
2. Add `mem_limit` to all services in docker-compose.yml

### This Week

3. Add per-route rate limit configuration (auth, search, bulk)
4. Add bundle-budget check to web CI (e.g., `ANALYZE=true` threshold)

### This Month

5. Add DB connection pool config (min/max/acquire timeout) to Supabase client
6. Implement per-route cache coverage for remaining list endpoints (tickets, users, notifications)
7. Migrate notification client from 30s polling to SSE

### Later / Platform Evolution

8. Consider read replica for Supabase (higher plan) to scale DB reads
9. Evaluate CDN cache rules for Cloudflare (static assets, API responses)
10. Investigate Web image size optimization (1.4GB → alpine-based Node?)

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --------- | ------------ | --------------------- | ---------- |
| Add mem_limit to docker-compose | Prevents OOM kills | `docker-compose.yml` | Container stays within limit |
| Create index migration | Speeds up audit/notification queries | New migration file | EXPLAIN ANALYZE shows index scan |
| Add per-route rate limits | Protects routes from global exhaustion | `rate-limiter.ts` + route files | Different routes have different limits |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| ------------ | -------- | ---------------- | ------ | ---------- |
| Index migration | P1 | API/Database | 1 day | Migration review |
| Container mem_limit | P1 | Infrastructure | 0.5 day | docker-compose update |
| Per-route rate limits | P2 | API | 1 day | Rate limiter refactor |
| Bundle budget in CI | P2 | Web | 0.5 day | next.config.mjs + CI |
| DB connection pool config | P2 | API | 0.5 day | env var + pool setup |
| SSE migration for client | P2 | Web | 2 days | EventSource wrapper |

## Suggested Tests

- **Performance:** k6 or artillery test for audit log query before/after index
- **Performance:** Monitor memory usage before/after mem_limit
- **Load:** Global rate limit hit returns 429 for subsequent requests
- **Load:** Per-route rate limit lets other routes continue when one is throttled
- **CI:** Bundle size increase > 10KB fails CI check

## Suggested Documentation Updates

1. Create `docs/DATABASE_INDEX_STRATEGY.md` documenting index decisions
2. Add performance budget values to `docs/PERFORMANCE_BUDGET.md`
3. Document rate limit tiers in `docs/API_RATE_LIMITING.md`

## Open Questions

| Question | Why it matters | Evidence needed |
| -------- | -------------- | --------------- |
| What is the approximate row count for audit_logs? | Determines urgency of index | Production query |
| Are there any slow queries in production? | Validates index priority | pg_stat_statements |
| What is the droplet's total RAM? | Determines safe mem_limit values | DO dashboard |
| What is the Web image's current size? | Context for bundle optimization | docker image ls |

## Appendix

### Caching Coverage

| Endpoint | Cached | TTL | Invalidation |
| -------- | ------ | --- | ------------ |
| GET /api/v1/organizations | ✅ | 60s | Create/update/delete org |
| GET /api/v1/documents | ✅ | 30s | Create/update/delete document |
| GET /api/v1/projects | ✅ | 30s | Create/update/delete project |
| GET /api/v1/roles/with-permissions | ✅ | 60s | Update permissions |
| GET /api/v1/roles | ✅ | 60s | Update permissions |
| GET /api/v1/tickets | ❌ | — | — |
| GET /api/v1/users | ❌ | — | — |
| GET /api/v1/notifications | ❌ | — | — |
| GET /api/v1/audit | ❌ | — | — |

### DB Transactions and Query Patterns

| Entity | Table | Common filter | Missing index | Impact |
| ------ | ----- | ------------- | ------------- | ------ |
| Audit logs | audit_logs | entity_type, entity_id, created_at | (entity_type, entity_id), (organization_id, created_at) | Table scan on audit search |
| Notifications | notifications | user_id, read, organization_id | (user_id, read), (organization_id) | Table scan on 30s poll |
| Ticket comments | ticket_comments | ticket_id, created_at | (ticket_id, created_at) | Full scan per ticket detail |
| Documents | documents | organization_id | (organization_id) — likely indexed via FK | Partial |

### Build Performance

| Image | Build time (approx) | Size | Notes |
| ----- | ------------------ | ---- | ----- |
| mct-api | ~3 min | ~400MB | Multi-stage, no --dts |
| mct-worker | ~2 min | ~300MB | Multi-stage |
| mct-web | ~10 min | ~1.4GB | output: standalone, large Next.js |
| Deploy total | ~8 min | — | Image piping + SSH, 5x faster than GHCR pull |
