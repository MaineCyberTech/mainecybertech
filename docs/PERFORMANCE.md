# Performance

How the portal avoids unnecessary work — response caching, rate limiting,
database indexes and the web/app settings that shape latency. Everything below
is sourced from the code; change the code first, then this page.

## API response cache

[`apps/api/src/middleware/cache.ts`](../apps/api/src/middleware/cache.ts) is a
Redis-backed response cache with an in-memory fallback:

- **Backend:** Redis when `REDIS_URL`/`REDIS_PASSWORD` is set (required for
  multiple API replicas); otherwise a `Map` capped at 5,000 entries and swept
  every 60s. Redis errors degrade to memory.
- **Key:** full mount path + path + `JSON.stringify(query)`, suffixed with
  `:org=<id>` (or `:user=<id>`) so tenant/user responses never collide.
- **Middleware:** `responseCache(ttlSeconds = 60)` caches only successful
  (2xx) `GET` responses and overwrites on a miss;
  `responseCacheNoRenew(ttlSeconds = 60)` fills a missing key but never renews
  an existing one (hot entries expire instead of being refreshed forever).
  Responses expose `X-Cache: HIT|MISS`.
- **Invalidation:** `invalidateCache("/api/v1/...")` is called after mutations
  — the organization, role and store-catalog mutation handlers (14 call sites).
  Redis invalidation uses batched `SCAN` + `DEL` (never `KEYS`); it is
  best-effort and the TTL is the backstop.

## Permission resolution cache

[`apps/api/src/lib/permissions.ts`](../apps/api/src/lib/permissions.ts)
resolves effective permissions (profile → approved memberships →
role_permissions → overrides → permission catalog) behind a short-TTL
per-process cache:

- **Key:** `userId:orgId` (`*` for the org-agnostic scope), TTL **15s**;
  in-flight promises are shared so concurrent requests dedupe, and failures
  are never cached.
- **Effect:** a gated request that also runs `requireEntitlement` resolves the
  caller once instead of twice, and repeated requests inside the TTL skip the
  4–6 Supabase reads.
- **Invalidation:** `clearPermissionCache(userId)` runs after role, membership
  and permission-override writes (and account erasure); global role-catalog
  changes clear the whole map. The TTL bounds staleness on other replicas.

## SSE notification streams

[`apps/api/src/routes/notifications.ts`](../apps/api/src/routes/notifications.ts):

- A per-process cap (`SSE_MAX_STREAMS = 200`) rejects further streams with
  `503` + `Retry-After: 10`; the bell client falls back to polling on error.
- All streams for the same user share one Supabase Realtime channel
  (refcounted, removed with the last subscriber), so subscriptions scale with
  distinct users rather than open tabs or reconnect storms.
- Streams re-validate the session JWT every 5 minutes and send a 30s
  keepalive.

## Rate limits

Verified in [`apps/api/src/app.ts`](../apps/api/src/app.ts) and
[`middleware/rate-limit.ts`](../apps/api/src/middleware/rate-limit.ts):

| Limiter       | Bucket                                | Window | Max | Skips / notes                                                                        |
| ------------- | ------------------------------------- | ------ | --- | ------------------------------------------------------------------------------------ |
| Global        | client IP                             | 15 min | 300 | `/health`, localhost, `/api/v1/webhooks/*`; authoritative ceiling (`trust proxy: 1`) |
| Per user      | SHA-256 of Bearer token → IP fallback | 15 min | 600 | `/health`, `/api/v1/docs`, `/api/v1/openapi.json`, localhost                         |
| Auth          | email → IP fallback                   | 15 min | 10  | Applies to sign-in/sign-up/password endpoints                                        |
| Email actions | email                                 | 1 hour | 5   | Invites/resets                                                                       |
| Metrics       | IP                                    | 1 min  | 5   | Plus optional `METRICS_TOKEN` bearer gate (404 when wrong)                           |

The user key is a hash of the whole token (claims are not trusted before auth
runs); the IP limiter is the real ceiling. express-rate-limit's default store
is per-process, so horizontally scaled replicas each keep their own counters.

## Request limits

- JSON bodies up to **10 MB** (`express.json`, also captures `rawBody` for
  webhook signature checks).
- **30s request timeout** (`requestTimeout(30000)`) returns
  `REQUEST_TIMEOUT`.
- Idempotency middleware, CSRF double-submit and `X-Request-ID` correlation
  run on every request.

## Database

- **136 live tables**, all with RLS enabled (`scripts/verify-rls.mjs`); access
  goes through the API (service-role or user-scoped client, per
  `RLS_*_ENABLED`), never from the web app.
- **313 `create index` statements** across `supabase/migrations/`. Migration
  `5302419` added the missing foreign-key indexes (satisfaction pulses,
  time entries, project milestones/dependencies, training enrollments, KB
  generations, ticket triage drafts) that were causing sequential scans on
  joins and cascades.
- Partial indexes are used where a hot predicate exists, e.g.
  `mfa_recovery_codes_user_idx ... where used_at is null`.
- Admin list endpoints are server-side paginated
  (`apps/api/src/lib/pagination.ts`) so no page pulls whole tables.

## Web app

- Next.js `output: "standalone"` with `outputFileTracingRoot` pointing at the
  monorepo root (`apps/web/next.config.mjs`) — the Docker image traces exactly
  the workspace files it needs.
- Admin (`(admin)/admin/layout.tsx`) and portal
  (`(portal)/portal/layout.tsx`) layouts set `export const dynamic =
"force-dynamic"` so authenticated shells are never statically prerendered
  with stale data.
- Public storefront pages stay `force-dynamic` but their catalog reads are
  cached: the API response-caches `/store/products` and `/store/categories`
  (60s, evicted by catalog admin writes), and
  [`lib/catalog/catalog-source.ts`](../apps/web/lib/catalog/catalog-source.ts)
  keeps the assembled snapshot in-process for 60s so layout + page +
  `generateMetadata` share one read. Admin catalog edits surface within the
  web cache TTL.
- The browser talks only to the API (no direct Supabase client), and
  notifications use the server-sent-events stream rather than 30s polling.
- Theme is pinned dark-only (no half-rendered light mode / flash).

## Container resource limits

From `infra/digitalocean/docker-compose.yml`: API 256 MB, web 512 MB (Next
standalone), worker 256 MB, redis 48 MB, prometheus 256 MB, caddy 64 MB, all
with 10 MB × 3 rotating logs. The prod droplet is `s-2vcpu-2gb` because the
stack reserves ~1.4 GB.

## Known hotspots

- The API is the single database client; hosted Supabase latency dominates
  request time for uncached reads.
- The response cache's in-memory fallback is single-instance only — set
  `REDIS_URL` before scaling the API horizontally.
- Data-dependent E2E tests flake under CI API/Supabase contention (known
  debt); `visibleWithin` in `apps/web/e2e/fixtures.ts` is the mitigation.
- Scans (domain monitors, website monitors, backups, patches) run in the
  worker behind a Redis scan lock so replicas do not duplicate work.
