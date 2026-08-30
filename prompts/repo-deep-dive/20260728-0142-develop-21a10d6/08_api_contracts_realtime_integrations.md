# API Contracts, Realtime, and Integrations Audit

**Run ID:** `20260728-0142-develop-21a10d6`
**Finding Area Code:** API

## Executive Summary

Strong API architecture: 52 routes mounted consistently, dual-path JWT auth, robust idempotency, SSE streaming, circuit-breaker-protected HTTP clients, Zod validation on all mutations. Key gaps: entity-level org verification missing, rate limit error format is plain text, SSE lacks keepalive, cache key uses userId instead of orgId.

**23 findings** (1 HIGH, 5 MODERATE, 12 LOW, 1 informational)

## Key Findings

### API-05 (HIGH): Entity-Level Org Access Not Verified After Middleware

**Evidence:** `GET /api/v1/tickets/:id` fetches by ID without `.eq("organization_id", orgId)`. API uses `service_role` key, bypassing RLS. User in Org A can request ticket ID from Org B if they pass the initial org check.
**Risk:** Cross-org data access despite `requireOrgAccess` passing.
**Recommendation:** Add `.eq("organization_id", orgId)` to all entity-by-ID fetches.

### API-03 (MODERATE): Rate Limit Error Format Is Plain Text

**Evidence:** `express-rate-limit` returns plain text "Too many requests" instead of structured JSON `{ success: false, error: {...} }`. SDK's `ApiError` parsing expects JSON.
**Recommendation:** Configure rate limiter to return JSON envelope.

### API-09 (MODERATE): SSE Stream Lacks Periodic Keepalive

**Evidence:** SSE endpoint sends heartbeat on connect only. Proxies may close idle connections after 30-120s.
**Recommendation:** Add `setInterval` sending `: keepalive\n\n` every 30s.

### API-17 (MODERATE): Cache Key Uses User ID Instead of Org ID

**Evidence:** `req.authUser.orgId` is never populated. Cache key falls back to `userId`, causing cross-org cache inconsistency for multi-org admin users.
**Recommendation:** Populate `orgId` in auth or org-access middleware.

### API-23 (MODERATE): Production CSP Allows `unsafe-inline` for Styles

**Evidence:** `style-src 'self' 'unsafe-inline' 'nonce-${nonce}'` — the `unsafe-inline` weakens the nonce protection.
**Recommendation:** Remove `'unsafe-inline'` from production CSP.

## External Integrations

**HttpClient** with circuit breaker: Stripe (15s, 2 retries), JSM (15s, 2 retries), Teams (10s, 1 retry), Geo (5s, 1 retry). Geo circuit breaker shares state with Supabase CB — should be isolated.
