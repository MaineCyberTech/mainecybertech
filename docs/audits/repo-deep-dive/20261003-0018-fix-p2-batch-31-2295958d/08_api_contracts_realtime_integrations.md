# API Contracts, Realtime, and Integrations Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20261003-0018-fix-p2-batch-31-2295958d
- Repository: C:\temp\mainecybertech
- Branch: fix/p2-batch-31
- Commit SHA: 2295958d
- Generated at: 2026-10-03
- Auditor: repo-deep-dive subagent (base profile)
- Area code: API
- Output path: docs/audits/repo-deep-dive/20261003-0018-fix-p2-batch-31-2295958d/08_api_contracts_realtime_integrations.md
- Scope limitations: Static; 500 route entries sampled by risk; no live contract testing.

## Scope

API contracts/versioning, OpenAPI generation/validation, error envelopes, idempotency, pagination, realtime (SSE), webhook verification/replay/idempotency, external integrations (Stripe/Jira/JSM/M365), outbound webhook delivery/retries.

## Evidence Reviewed

- `apps/api/src/app.ts`; `routes/{webhooks,public,analytics,search,docs,billing}.ts`.
- `apps/api/src/middleware/{idempotency,csrf}.ts`; `lib/{webhook-signature,webhook-dispatcher,idempotency,ssrf-guard,http-client}.ts`.
- `packages/sdk/src/client.ts` (retry + idempotency key), `scripts/openapi-audit.js`, `src/scripts/validate-openapi.ts`.
- `supabase/migrations/5302050_webhook_retry_dlq.sql`, `5302053_webhook_idempotency.sql`.

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| read `webhooks.ts` | source | inbound integration auth | Stripe constructEvent; Jira/JSM HMAC + timestamp; M365 clientState |
| read `idempotency.ts`/`webhooks.ts:40-49` | source | replay safety | atomic claim `SET NX EX` |
| read `search.ts` | source | tenant scoping | unscoped fallthrough when `adminOrgIds` empty |
| read `docs.ts`/`security-headers.ts` | source | OpenAPI exposure | public + CSP-blocked UI |
| read `client.ts` diff | source | SDK retry/idempotency | key minted once per call |
| read `openapi-audit.js` invocation | CI | contract gate | runs in test/validate |

## Executive Summary

The API is contract-conscious: runtime route extraction + OpenAPI validation + coverage audit are CI gates, responses use a consistent envelope, mutations carry `logAuditEvent` and often `requirePermission`, and this branch adds per-call `Idempotency-Key` to unsafe SDK requests. Inbound webhooks are well-handled: Stripe signature via SDK, Jira/JSM HMAC-SHA256 with timestamp tolerance and atomic dedup, M365 clientState, and claim-release-on-failure so provider retries can reprocess. Residual issues: `search.ts` has a fail-open unscoped query path when an admin resolves to zero orgs; the OpenAPI docs surface is public and its UI is broken under the API CSP; and API keys (a contract the SDK exposes) cannot authenticate (cross-ref FEAT-P2-001).

## Inventory

| Surface | Path | State | Risk |
|---|---|---|---|
| REST `/api/v1/*` | `app.ts` | implemented | Medium |
| OpenAPI | `routes/docs.ts`, `openapi/spec.ts` | generated/validated | Medium |
| SDK client | `packages/sdk/src/client.ts` | retry + idempotency | Low |
| Idempotency middleware | `middleware/idempotency.ts` | Redis/in-memory | Low |
| Stripe webhook | `routes/webhooks.ts:69-222` | signed | Low |
| Jira/JSM webhooks | `routes/webhooks.ts:224-417` | HMAC + timestamp | Low |
| M365 webhook | `routes/webhooks.ts:419-508` | clientState | Low |
| Outbound webhooks | `lib/webhook-dispatcher.ts` + DLQ | retry/DLQ | Low |
| Realtime | `routes/notifications.ts /stream` (SSE) | implemented | Medium |
| Search | `routes/search.ts` | scoped | Medium |
| Analytics | `routes/analytics.ts` | public track | Medium |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Contract consistency | 4 | envelope, Zod, OpenAPI gate | — | keep |
| Versioning | 4 | `/api/v1` prefix | — | keep |
| Error handling | 4 | `errorHandler`, `failure()` | — | keep |
| Idempotency | 4 | middleware + SDK key | — | keep |
| Webhooks | 4 | signature + dedup + DLQ | M365 timing (SEC-P3-002) | low |
| External integrations | 3 | Stripe/Jira/JSM/M365 | config-gated | keep |
| Realtime | 3 | SSE | single instance | ARCH-P2-001 |
| Search | 2 | `search.ts` | unscoped fallthrough | API-P2-001 |
| Docs | 2 | public + CSP-blocked | — | API-P2-002 |

## Detailed Review

### Item: Search tenant scoping

- Evidence: `apps/api/src/routes/search.ts:12` mounts `requireAuth, requireAdmin, requireOrgAccess`; `:33` builds `adminOrgIds` from approved memberships; `:43-56` and `:63-83` apply `.in(...)` **only if `adminOrgIds.length > 0`**, else the service-role query is unscoped.
- Risks: a platform admin with no explicit org (by design sees all tenants) is fine, but any path where an admin’s membership query returns empty (status drift, transient) silently broadens the search to every tenant.

### Item: SDK retry + idempotency

- Evidence: `packages/sdk/src/client.ts` diff — `newIdempotencyKey()` minted once before `executeFetch` for unsafe methods and for uploads.
- Verified: the key is generated outside the retry loop, so retries replay rather than duplicate. `middleware/idempotency.ts` requires ≤256 chars; UUID = 36.

## Findings

### Finding ID: API-P2-001 - Search falls through to an unscoped cross-tenant query

- Severity: P2
- Confidence: High
- Area: API
- Evidence:
  - `apps/api/src/routes/search.ts:33` — `adminOrgIds = memberships?.map(...) ?? []`
  - `apps/api/src/routes/search.ts:43-56` — users scoped only when `adminOrgIds.length > 0`, else `userFinal = userQuery`
  - `apps/api/src/routes/search.ts:63-83` — tickets/projects/documents apply `.in("organization_id", adminOrgIds)` only when non-empty
  - `apps/api/src/routes/search.ts:22` — `getSupabaseAdmin()` (service-role; RLS bypassed)
- What is happening: the org predicate is conditional; an empty resolved org set degrades to “search everything” rather than denying.
- Why it matters: cross-tenant data exposure (user PII, tickets, documents) if an admin ever resolves to zero orgs.
- User / business impact: tenant confidentiality breach.
- Security / privacy / reliability impact: high-if-triggered; fail-open design.
- Recommended fix: fail closed — if the caller is not a platform admin and `adminOrgIds` is empty, return an empty result/403; use `assertOrgScopeMatches`/`req.orgScope` rather than re-deriving orgs. For platform admins, require an explicit target org or an explicit “all tenants” flag that is audited.
- Suggested validation: integration test admin with no approved memberships → expect empty/403, never cross-tenant rows; test with status-drift membership.
- Owner suggestion: API
- Effort estimate: S
- Dependencies: none
- Status: open
- Endpoint / data path: `GET /api/v1/search` → `profiles/tickets/projects/documents` via service-role

### Finding ID: API-P2-002 - OpenAPI schema is public and the Swagger UI is blocked by CSP

- Severity: P2
- Confidence: High
- Area: API
- Evidence:
  - `apps/api/src/routes/docs.ts:8-34` — `/api/v1/openapi.json` and `/api/v1/docs` unauthenticated; inline `SwaggerUIBundle({...})` script has no `nonce`
  - `apps/api/src/middleware/security-headers.ts:20-26` — docs CSP `script-src 'self' 'nonce-…' unpkg.com` (no `unsafe-inline`)
- What is happening: the full API schema is world-readable while the page that renders it does not execute under the API’s own CSP.
- Why it matters: aids reconnaissance; docs broken for developers.
- User / business impact: developer friction; attacker recon.
- Security / privacy / reliability impact: low/medium.
- Recommended fix: gate `/docs` and `/openapi.json` behind auth or non-prod, and pass the nonce into the inline script (or self-host Swagger assets).
- Suggested validation: unauthenticated fetch returns 401/404 in prod; browser console has no CSP errors on `/docs`.
- Owner suggestion: API/docs
- Effort estimate: S
- Dependencies: none
- Status: open
- Endpoint / data path: `GET /api/v1/docs`, `GET /api/v1/openapi.json`

### Finding ID: API-P3-001 - `/metrics` is fully public when `METRICS_TOKEN` is unset

- Severity: P3
- Confidence: Medium
- Area: API
- Evidence:
  - `apps/api/src/app.ts:154-176` — the token check is skipped when `METRICS_TOKEN` is falsy, so the handler returns metrics
  - `apps/api/src/config/env.ts:45` — `METRICS_TOKEN: z.string().optional()`
  - `infra/digitalocean/prometheus.yml` — scrapes `api:4000/metrics` internally
- What is happening: if the optional token is not configured, `/metrics` is open to anyone who can reach the port.
- Why it matters: metric labels can reveal route names, tenant IDs, error counts.
- Recommended fix: default to denying public access (bind metrics to the internal network / require the token when set; document that Caddy must not expose `/metrics`).
- Suggested validation: check `Caddyfile` does not route `/metrics`; unauthenticated request from outside returns 404.
- Owner suggestion: API/infra
- Effort estimate: S
- Dependencies: `METRICS_TOKEN`
- Status: open
- Endpoint / data path: `GET /metrics`

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Unscoped search | P2 | Low | Tenant leak | API-P2-001 | fail closed |
| Public schema/docs | P2 | High | Recon | API-P2-002 | gate |
| Public metrics | P3 | Medium | Info | API-P3-001 | token/internal |

## Recommendations

### Immediate / Release Blocking
None (search requires a trigger condition; still fix this week).

### This Week
- Make `search.ts` fail closed (API-P2-001); gate docs (API-P2-002).

### This Month
- Deny `/metrics` by default (API-P3-001); add contract tests for mutation idempotency keys.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| `if (!platformAdmin && !adminOrgIds.length) return 403` | closes leak | `routes/search.ts` | unit |
| CSP nonce in Swagger script | docs work | `routes/docs.ts` | browser |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| Fail-closed search | P2 | API | S | none |
| Docs auth | P2 | API | S | none |
| Metrics posture | P3 | API/infra | S | token |

## Suggested Tests

- Cross-tenant search regression suite.
- Webhook replay: same Stripe/Jira event twice → single effect.
- Contract: SDK retry of a POST with the same `Idempotency-Key` → one row.

## Suggested Documentation Updates

- Document the API-key auth gap (FEAT-P2-001) and the public/internal endpoint inventory.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Does Caddy expose `/metrics` publicly? | API-P3-001 impact | `Caddyfile*` |
| Are M365 change notifications configured? | live webhook surface | environment |

## Appendix

- Webhook dedup keys: Stripe `stripe-<event.id>`; Jira/JSM `<provider>-<event>-<key>-<sha256(rawBody)[:16]>`; M365 resource+changeType+expiry+digest.
- SSE realtime at `/api/v1/notifications/stream`.
