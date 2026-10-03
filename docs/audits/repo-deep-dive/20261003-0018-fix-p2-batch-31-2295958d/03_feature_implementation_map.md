# Feature Implementation and Gap Map

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20261003-0018-fix-p2-batch-31-2295958d
- Repository: C:\temp\mainecybertech
- Branch: fix/p2-batch-31
- Commit SHA: 2295958d
- Generated at: 2026-10-03
- Auditor: repo-deep-dive subagent (base profile)
- Area code: FEAT
- Output path: docs/audits/repo-deep-dive/20261003-0018-fix-p2-batch-31-2295958d/03_feature_implementation_map.md
- Scope limitations: Breadth over depth; module inventory from routes/pages/worker tasks; per-feature UX not executed.

## Scope

Pages/routes, API endpoints, server actions, workers/jobs, DB entities, permissions, audit logs, workflow/failure states, mobile behaviour, observability hooks. Emphasis: UI-without-backend, backend-without-UI, orphaned modules, missing tests/docs, and claimed-status verification.

## Evidence Reviewed

- `apps/api/src/app.ts` — 60+ mounted routers; `inventory.json` — 500 route entries.
- `apps/worker/src/tasks/index.ts` + 12 task files.
- `packages/sdk/src/*` (60 modules), `packages/sdk/src/database.types.ts` (136 tables / 12 enums per review.md).
- `supabase/migrations/5302119…5302126_*` (demo data), `5302118_permission_matrix_full_catalog.sql`.
- `review.md` feature/test/fix claims; `apps/api/src/__tests__/*`.

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| grep `key_hash`/`mct_` in `apps/api/src` | command | API-key feature | only creation; **no verification middleware** |
| grep `-demo` migrations | command | prod data feature | 5 demo migrations in normal path |
| read `apps/api/src/app.ts` | source | route mount map | 60+ routers |
| read `docs.ts`, `packages/sdk/src/api-keys.ts` | source | docs/keys features | docs public; keys unused |
| inventory routes | artifact | route count | 500 entries |

## Executive Summary

The platform is feature-rich: CRM/helpdesk (tickets, projects, assets, findings), documents with versions/shares, billing/Stripe, store/e-commerce, security-suite modules, governance/CAB, edu-automation, compliance, QBR, and more. Most modules are genuinely implemented with API + UI + migrations. Two completeness gaps stand out: (1) **API keys are a dead feature** — created, hashed, and listed, but never accepted for authentication; and (2) **demo/test data ships through the production migration path**, gated only by a domain heuristic. The OpenAPI/Swagger surface is public and (under the API CSP) its inline bootstrap script is blocked.

## Inventory

| Feature area | UI | API | Data | Worker | Permissions | Tests | Docs | State |
|---|---|---|---|---|---|---|---|---|
| Auth/MFA | yes | yes | yes | no | yes | yes | `MFA.md` | implemented |
| Tickets/projects | yes | yes | yes | partial | yes | yes | yes | implemented |
| Documents/uploads | yes | yes | yes | orphan-cleanup | yes | yes | yes | implemented |
| Billing/Stripe | yes | yes | yes | stripe-reconcile | partial | partial | yes | implemented |
| Store/e-commerce | yes | yes | yes | no | yes | partial | yes | implemented |
| Security suite/ops | yes | yes | yes | scans | yes | partial | yes | implemented |
| Governance/CAB/compliance | yes | yes | yes | no | yes | partial | yes | implemented |
| API keys | yes | manage | yes | no | manage | yes | no authz doc | **non-functional** |
| Public lead intake | yes | yes | yes | retention | public | yes | yes | implemented |
| Demo/test data | demo | — | migrations | no | — | — | — | **prod path** |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Pages/routes | 4 | 500 routes, 319 pages | — | keep |
| Components | 4 | `packages/ui` + web components | UI consistency debt closed | keep |
| API endpoints | 4 | 60+ routers | a few authz gaps | SEC/API |
| Server actions | 4 | web `actions.ts` | — | keep |
| Workers/jobs | 3 | 12 tasks | orphan-cleanup data loss | DATA-P0-001 |
| Database entities | 4 | 136 tables | demo rows in prod path | FEAT-P2-002 |
| Permissions | 3 | catalog + `requirePermission` | API keys not enforced as auth | FEAT-P2-001 |
| Audit logs | 4 | `logAuditEvent` widespread | — | keep |
| Tests | 4 | 487 files | route authz stubs | TEST |
| Docs | 3 | extensive | API-key authz undocumented | FEAT-P2-001 |
| Workflow states | 3 | ticket/project/approval states | — | keep |
| Failure states | 3 | error boundaries/toasts | e2e flaky | TEST-P2-001 |

## Detailed Review

### Item: API key management

- Evidence: `apps/api/src/routes/api-keys.ts:23-31` (generate/hash), `:56` create, `packages/sdk/src/api-keys.ts`.
- What it does: creates `mct_<hex>` keys, stores `key_hash` (SHA-256) + `key_prefix`, lists/revokes.
- How it appears to work: intended as programmatic auth.
- Missing controls: **no middleware/route verifies `key_hash`**. `middleware/auth.ts` only tries HS256 JWT then `supabase.auth.getUser`; an `mct_…` token fails both.
- Risks: users believe they have machine credentials; integrations cannot authenticate.
- Recommended improvement: add an API-key auth middleware (prefix lookup → constant-time hash compare → attach org/permissions) or remove the feature until implemented.

### Item: Demo/test data migrations

- Evidence: `supabase/migrations/5302119_demo_test_data.sql` header (“Also present in HOSTED databases… migrations run everywhere via `supabase db push`”), plus `5302120/5302121/5302123/5302126`; guard skips only when an org with a non-`*.example`/`*.local` `primary_domain` exists.
- Risks: a freshly provisioned database applies migrations in order, so the guard passes and demo orgs/users (documented password `1`) are inserted before any real org exists.

## Findings

### Finding ID: FEAT-P2-001 - API keys cannot authenticate; the feature is dead

- Severity: P2
- Confidence: High
- Area: FEAT
- Evidence:
  - `apps/api/src/routes/api-keys.ts:23-31` — `generateApiKey()` returns `mct_<hex>`, stores `key_hash`
  - `apps/api/src/middleware/auth.ts:43-139` — accepts only HS256 JWT or `supabase.auth.getUser`; no `api_keys` lookup
  - repo-wide grep for `key_hash` in `apps/api/src` — only `api-keys.ts` writes it; no reader
  - `packages/sdk/src/api-keys.ts` — client only manages keys
- What is happening: keys can be minted/listed but there is no code path that accepts an `mct_` bearer token; such a request is rejected 401 by `requireAuth`.
- Why it matters: the UI advertises machine credentials that do not work; customers may build integrations that fail in production.
- User / business impact: broken integrations, support load, false security expectation.
- Security / privacy / reliability impact: medium (misleading capability; no direct exposure).
- Recommended fix: implement API-key auth (hash lookup with constant-time compare, active/expiry checks, org + permission scoping, `last_used_at`) or hide/disable the feature and document it as not-yet-supported.
- Suggested validation: integration test `Authorization: Bearer mct_<key>` reaches a scoped endpoint; revoked/expired keys 401.
- Owner suggestion: API
- Effort estimate: M
- Dependencies: permission model
- Status: open
- Endpoint / data path: `POST/GET/PATCH/DELETE /api/v1/api-keys`; intended `Authorization: Bearer mct_*`

### Finding ID: FEAT-P2-002 - Demo/test data can be seeded into a fresh production database

- Severity: P2
- Confidence: Medium
- Area: FEAT
- Evidence:
  - `supabase/migrations/5302119_demo_test_data.sql` header — “migrations run everywhere via `supabase db push`”; guard returns only if an org with a real domain exists
  - `supabase/migrations/5302120_demo_module_data.sql`, `5302121_demo_permission_edge_cases.sql`, `5302123_demo_expanded_test_data.sql`, `5302126_demo_worker_admin_coverage.sql`
  - `.github/workflows/supabase-migrations.yml` — `supabase db push --include-all` on `main`/`develop`
- What is happening: demo orgs/users (comment says “password: 1”) run as ordinary migrations; on a brand-new prod project the domain guard is not satisfied, so they are inserted.
- Why it matters: production may contain demo tenants and known-weak accounts, and demo rows can skew metrics/searches.
- User / business impact: security exposure and data pollution on first deploy.
- Security / privacy / reliability impact: high if the demo account can log in on prod.
- Recommended fix: move demo data to `supabase/seeds/` only, or gate on an explicit `APP_ENV`/`SEED_DEMO` flag that defaults off, and assert in CI that no demo login is possible in prod.
- Suggested validation: apply migrations to an empty database and assert zero demo orgs; attempt login with the demo account on prod and expect failure.
- Owner suggestion: data/platform
- Effort estimate: M
- Dependencies: migration ordering
- Status: open

### Finding ID: FEAT-P3-001 - OpenAPI/Swagger surface is public and its UI is blocked by the API CSP

- Severity: P3
- Confidence: High
- Area: FEAT
- Evidence:
  - `apps/api/src/routes/docs.ts:8-34` — `/api/v1/openapi.json` and `/api/v1/docs` have no auth; Swagger UI loads from `unpkg.com` and runs an inline `<script>` with no nonce
  - `apps/api/src/middleware/security-headers.ts:20-26` — docs CSP is `script-src 'self' 'nonce-<uuid>' unpkg.com` (no `unsafe-inline`), while the embedded script has no nonce attribute
- What is happening: the API schema is world-readable, and the docs page’s inline bootstrap is blocked by CSP (page renders empty with console errors).
- Why it matters: information disclosure of the full API surface; broken developer docs.
- User / business impact: reconnaissance aid for attackers; developer friction.
- Security / privacy / reliability impact: low/medium.
- Recommended fix: gate `/docs`+`/openapi.json` behind auth or a build flag; pass the CSP nonce into the inline script or serve Swagger assets locally.
- Suggested validation: load `/api/v1/docs` and confirm UI initialises with no CSP violation; unauthenticated `/openapi.json` returns 401/404.
- Owner suggestion: API/docs
- Effort estimate: S
- Dependencies: none
- Status: open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Broken API-key integrations | P2 | High | Support/failed integrations | FEAT-P2-001 | implement or hide |
| Demo creds in prod | P2 | Medium | Account compromise | FEAT-P2-002 | seed-only gating |
| API surface disclosure | P3 | High | Recon | FEAT-P3-001 | gate docs |

## Recommendations

### Immediate / Release Blocking
- Confirm prod has no demo tenants and no `password: 1` account (FEAT-P2-002).

### This Week
- Implement/hide API keys (FEAT-P2-001); gate docs (FEAT-P3-001).

### This Month
- Demo-data gating in CI (FEAT-P2-002).

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Hide API-keys UI until auth lands | removes false capability | web settings page | manual |
| Add `init` nonce to Swagger script | docs work | `routes/docs.ts` | browser load |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| API-key auth middleware | P2 | API | M | permissions |
| Demo seed isolation | P2 | data | M | migration policy |
| Docs auth | P3 | API | S | none |

## Suggested Tests

- Integration: `mct_` bearer key path; revoked/expired.
- Migration test on empty DB asserting no demo orgs.
- CSP test asserting Swagger UI initialises.

## Suggested Documentation Updates

- Document API-key status honestly; mark OpenAPI as internal.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Is the hosted prod DB already seeded with demo data? | live risk | read-only DB query |
| Is `mct_` key auth planned? | roadmap | product decision |

## Appendix

- 500 route entries; 60+ routers; 12 worker tasks; 136 DB tables (per `review.md`).
