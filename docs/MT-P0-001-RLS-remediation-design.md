# MT-P0-001 — Making Row-Level Security a Live Data-Layer Backstop (RLS Remediation Design)

**Status:** DRAFT / DESIGN PROPOSAL — RESEARCH ONLY. No source code was modified.
**Audience:** Human security/architecture decision-maker (requires explicit sign-off — see §3 and §6).
**Repo:** `C:\temp\mainecybertech-portal` (branch `develop`).
**Companion to:** `AGENTS.md` "Known Open Issues" (P0-7), and the deleted `agent/mig-guards` branch decision (blanket policy recreation was deliberately rejected).

---

## 0. TL;DR

Tenant isolation currently rests **entirely on Express middleware**. The API reaches Supabase almost exclusively through a **service-role** client (`getSupabaseAdmin`, `apps/api/src/services/supabase.ts:30`), which bypasses Row-Level Security (RLS). Middleware-layer isolation (the `req.orgScope` / `req.orgId` authoritative scope, plus `lib/tenant.ts` `assertResourceOrg`/`loadOwned` fail-closed 404 guards) is **done and correct**, but RLS remains a *dead backstop*.

This proposal does **not** implement the client swap. It documents the blocking design question that must be human-signed-off (how the 8 platform-admin roles keep cross-tenant access once RLS is live), the safe prerequisites that can and should land first, and a reversible, shadow-probe-driven migration plan.

---

## 1. Problem Statement

- `apps/api/src/services/supabase.ts:30` `getSupabaseAdmin()` creates a Supabase client with `SUPABASE_SERVICE_ROLE_KEY`. The service role **circumvents all RLS** by design (Postgres `bypassrls` / Supabase behavior).
- **833** call sites in `apps/api/src` use `getSupabaseAdmin` (measured via `grep` across `apps/api/src/**/*.ts`), spanning essentially every entity query in all 55 route files.
- Middleware is therefore the **only** thing standing between a bug/typo and a cross-tenant data leak. If a route forgets `requireOrgAccess`, or a `loadOwned` guard is skipped, the service-role query will happily return any tenant's rows.
- RLS policies **do exist** (see §2/§4) and are correctly keyed on org-membership helpers, but they are **never exercised** because no request path uses a role-restricted client.

Tenant isolation must be *defense-in-depth*: middleware for authorization intent **and** RLS as a hard data-layer backstop. Today only the first leg exists.

---

## 2. Current State (with Evidence)

### 2.1 Client call-site counts (grep, 2026-08-28)

| Client | Call sites | Where |
| ------ | --------- | ----- |
| `getSupabaseAdmin` (service role, **bypasses RLS**) | **833** | ~55 route files; also `middleware/org-access.ts:25,88` |
| `getSupabaseUser` (anon key + caller JWT, **honors RLS**) | **17** | `apps/api/src/routes/profiles.ts` (13), `profiles.test.ts`, `services/supabase.ts` definition |

Heaviest `getSupabaseAdmin` route categories (call count in parentheses): `projects.ts` (31), `edu-automation.ts` (22), `proposals.ts` (18), `documents.ts` (17), `store.ts` (15), `approvals.ts` (14), `governance.ts` (14), `training-hub.ts` (14), `findings.ts` (13), `organizations.ts` (13), `assets.ts` (11), `tickets.ts` (11), `field-services.ts` (9), `roles.ts` (9), `users.ts` (9), `billing.ts` (9) — full per-file list captured during research.

### 2.2 Middleware layer (DONE — prior remediation)

- `apps/api/src/middleware/org-access.ts` populates an authoritative `req.orgScope` (`{ orgId, explicit, platformAdmin, impersonation }`) and `req.orgId` (lines 189-195, 208-214, 241-247).
- `apps/api/src/lib/tenant.ts` provides `assertResourceOrg(req, resourceOrgId)` (fail-closed 404) and `loadOwned(req, supabase, table, id)` (verifies org ownership, 404 on miss).
- **87** `loadOwned`/`assertResourceOrg` call sites across **19** by-id route files (`ai.ts`, `api-keys.ts`, `approvals.ts`, `assets.ts`, `cab.ts`, `client-onboarding-command-center.ts`, `compliance.ts`, `device-profiles.ts`, `domain-monitors.ts`, `findings.ts`, `knowledge-base.ts`, `memberships.ts`, `network-diagrams.ts`, `projects.ts`, `proposals.ts`, `security-suite.ts`, `staging.ts`, `webhook-management.ts`). The fail-closed posture is in place.

### 2.3 Proven pattern: `profiles.ts` already uses `getSupabaseUser` successfully

`apps/api/src/routes/profiles.ts` is the reference implementation of the *target* state:

- `GET /` → `getSupabaseUser(req.userJwt)` (`profiles.ts:56`)
- `GET /:id` → `getSupabaseUser(req.userJwt)` (`profiles.ts:104`)
- `POST /:id/avatar` → `getSupabaseUser(req.userJwt)` for both storage upload and the `profiles` update (`profiles.ts:214, 227`)
- The caller JWT is attached by `apps/api/src/middleware/auth.ts:59` (`req.userJwt = token`), so it is available on every authenticated request.

Caveat / partial: `profiles.ts` `PATCH /:id` still drops to `getSupabaseAdmin` (`profiles.ts:141`) for the read-modify-write and the `encrypted_pii` write. This is exactly the kind of **write path that must be explicitly decided** (service-role escape hatch vs RLS-scoped write) — see §3 design (b).

This proves the user-scoped client works end-to-end (auth, RLS enforcement, storage) and is the template for the migration.

---

## 3. BLOCKING DESIGN QUESTION — Requires Human Sign-Off

### 3.0 The conflict

RLS policies are keyed on org-membership / permission helpers (`public.is_org_member(organization_id)`, `public.is_org_approved_member(organization_id)`, `public.is_super_admin()`, `public.user_has_permission(organization_id, module, action)` — see `supabase/migrations/5302026_...v3.sql:653, 668, 1034` and across migrations). These predicates will **deny** any row whose `organization_id` the caller is not an approved member of.

But **8 platform-admin roles are org-agnostic by design** (`apps/api/src/lib/roles.ts:9-18`):

```
super_admin, admin, dispatcher, engineer, security-analyst,
project-manager, finance, onboarding-specialist
```

Today those roles reach every tenant through the service-role client (P0-7 in `AGENTS.md` documents that this cross-tenant access is **audited** via `impersonation_log`, migration `5302133` + `apps/api/src/services/impersonation.ts`, but is otherwise unrestricted). If we simply route entity queries through `getSupabaseUser`, RLS will **block** these 8 roles from every cross-tenant row they currently legitimately touch — breaking impersonation/support/ops workflows.

This is the decision point. Two viable designs:

### 3.1 Design (a) — `is_platform_admin()` widened into every RLS policy

Add an `is_platform_admin()` SQL helper (resolves the caller's role keys from `memberships`/`roles` and returns true for the 8 keys) and prepend `or public.is_platform_admin()` to the `USING`/`WITH CHECK` clause of **every** tenant-scoped policy.

- **Pros:** One-time DB change; cross-tenant admin access "just works" with no API refactor beyond the client swap; no per-request escape-hatch bookkeeping.
- **Cons:**
  - Widens data access at the **DB layer** for 8 roles on **every** RLS-enabled table — the backstop becomes "*admins can read/write anything*." Any future bug in `is_platform_admin()` or a mis-scoped policy silently grants org-agnostic access.
  - Bleeds authorization semantics into SQL; RLS stops being a pure tenant-isolation control and becomes a role-aware gateway. Harder to reason about; easy to get wrong across 133 policy tables.
  - Conflicts with the prior `agent/mig-guards` decision (blanket policy recreation was **rejected** as unsafe — see §8). Editing 133 policies' `USING` clauses is exactly the kind of broad, high-blast-radius change that branch was meant to avoid.
  - Undermines the audit story: `impersonation_log` records *intent* at the middleware, but a DB-level `is_platform_admin()` bypass is invisible to RLS and only observable through the existing `logImpersonation` calls — which would still need to fire.

### 3.2 Design (b) — Keep service-role ONLY inside an audited `withServiceRole(reason, req, fn)` escape hatch; user-scoped client everywhere else

- Route **all** normal entity traffic through `getSupabaseUser(req.userJwt)` (the `profiles.ts` pattern).
- The 8 platform-admin cross-tenant operations continue to use a **service-role client**, but only through an explicit, centrally audited helper:
  `withServiceRole(reason: string, req, fn)` — which (1) asserts the caller actually holds a platform-admin key, (2) calls `logImpersonation({...reason, organizationId})` for the target org, and (3) executes `fn(adminClient)`. Every cross-tenant query is therefore *visible, grep-able, and centralized*.
- **Pros:**
  - RLS stays a **pure tenant-isolation backstop** — it never encodes role exceptions, so a policy bug can only ever leak within the caller's own org, never cross-tenant.
  - All cross-tenant access funnels through one audited chokepoint (`withServiceRole`), preserving and strengthening the P0-7 `impersonation_log` trail.
  - No mass edit of 133 policies; consistent with the `agent/mig-guards` rejection (no blanket policy recreation).
  - Keeps the fail-closed middleware posture as the primary gate and RLS as secondary — both aligned.
- **Cons:**
  - Requires identifying and migrating every cross-tenant admin code path to `withServiceRole` (more API work than (a)).
  - Slightly more boilerplate at each legitimate bypass; risk that a developer reaches for `getSupabaseAdmin` directly instead of `withServiceRole` (mitigated by lint rule / removing the bare `getSupabaseAdmin` export over time).

### 3.3 Recommendation

**Recommend design (b)** — it preserves RLS as a true isolation backstop, keeps all cross-tenant access auditable and centralized, and avoids the blast radius that already caused `agent/mig-guards` to be rejected. Design (a) is acceptable *only* if the business explicitly accepts org-agnostic DB access for 8 roles and owns the ongoing correctness burden of 133 policy edits. **This is the sign-off gate — do not proceed to any client swap until §3 is decided.**

---

## 4. Prerequisites That Must Land BEFORE Any Client Swap (safe, do first)

These are low-risk and do not change runtime behavior; they unblock and de-risk the later swap.

1. **Harden `getSupabaseUser`** (`apps/api/src/services/supabase.ts:73`):
   - **Memoize per request** — currently it constructs a *new* client on every call (`createClient(...)` each invocation). Cache one instance on `req` (e.g. `req.supabaseUser`) keyed by `req.userJwt` to avoid socket/connection churn.
   - **Route through the circuit breaker** — `getSupabaseAdmin` uses `circuitBreakingFetch` (`supabase.ts:21`); `getSupabaseUser` currently uses a *bare* `fetch` (`supabase.ts:84`). User-scoped traffic must also be breaker-protected, reusing `createSupabaseCircuitBreaker()` already created at `supabase.ts:13`.
   - **Type it** — return `SupabaseClient<Database>` (the worker already does this; the API types are the `docs/database-types-api-adoption.md` backlog). Typing surfaces column drift at compile time before the swap.

2. **Generate the per-table RLS coverage matrix** (script over `supabase/migrations/*.sql`). Measured baseline (2026-08-28):
   - **139** tables have RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
   - **133** of those have >=1 policy.
   - **7** have RLS enabled but **NO policy** (see §4.3) — these would *deny all access* the moment RLS is exercised. They are release-blockers for any module that touches them.
   - The matrix must additionally classify, per table: `SELECT`/`INSERT`/`UPDATE`/`DELETE` present?, admin-only delete?, and whether the policy is keyed on `is_org_member`/`is_org_approved_member`/`is_super_admin`/`user_has_permission`. (`super_admin`-gated `DELETE` policies appear ~47 times — these become the model for "admin-only delete" once RLS is live.)

3. **Fix the 7 policy-less tables** (RLS ON, zero policies -> would 403/deny everything under a user-scoped client). Confirmed gap set:
   - `document_shares`
   - `notifications`
   - `project_dependencies`
   - `project_milestones`
   - `project_phases`
   - `webhook_dead_letters`
   - `webhook_endpoints`

   Each needs org-scoped `SELECT`/`INSERT`/`UPDATE` policies (mirroring the `is_org_approved_member(organization_id)` pattern used elsewhere in `5302026_...v3.sql`). Delete scope per §4.2. **Do not** recreate policies en masse (see `agent/mig-guards` rejection, §8) — only add the 7 missing ones, each reviewed.

---

## 5. Phased, Reversible Migration Plan

Guiding principle: **reads first, behind a default-off dual-read shadow probe; then read-only GETs module-by-module; then writes; service-role retained only via `withServiceRole`.** Every phase is individually revertible by config flag.

### Phase 0 — Prereqs (§4)
Land hardening of `getSupabaseUser`, the RLS coverage matrix, and the 7 missing policies. No client swap yet. **Reversible:** pure additions.

### Phase 1 — Default-off dual-read shadow probe (READS ONLY)
- Introduce a config flag `RLS_SHADOW_PROBE_ENABLED=false` (default off).
- For a chosen module, after the existing `getSupabaseAdmin` read, also issue the same query via `getSupabaseUser(req.userJwt)` and **compare**. On divergence (row present in admin result but absent/extra in user result), **log only** (structured pino warning + counter), never change the response.
- Goal: measure real-world RLS vs middleware divergence, surface org-predicate bugs, and find hidden cross-tenant admin traffic **without user impact**.
- **Reversible:** flag off -> zero behavior change. No production query path altered.

### Phase 2 — Migrate read-only GETs module-by-module
- Flip the *actual* read path for one module from `getSupabaseAdmin` to `getSupabaseUser(req.userJwt)`, gated by `RLS_READS_ENABLED=<module>` allow-list.
- **First modules to migrate** (policies complete, platform-admin cross-tenant traffic rare): any module backed by a table in the 133-with-policies set *and* not on the 7-gap list, where reads are org-scoped and admin cross-tenant reads are uncommon. Concrete candidates from the call-site survey: `assets.ts` reads, `findings.ts` reads, `domain-monitors.ts` reads, `network-diagrams.ts` reads, `device-profiles.ts` reads, `knowledge-base.ts` reads, `sla.ts`, `status-page.ts`, `public.ts` (3 admin calls — small surface). Start with the smallest, best-tested modules; keep `profiles.ts` as the reference.
- Keep `loadOwned`/`assertResourceOrg` (already present) as defense-in-depth; RLS is now the *second* check, not the only one.
- **Reversible:** remove module from allow-list -> falls back to `getSupabaseAdmin`.

### Phase 3 — Migrate writes
- Migrate `INSERT`/`UPDATE`/`DELETE` for the same modules to `getSupabaseUser`, again allow-list gated.
- For the 8 platform-admin cross-tenant write paths, use `withServiceRole(reason, req, fn)` (design §3.2). `profiles.ts PATCH` (`profiles.ts:141`) is the first such write to convert.
- Admin-only `DELETE` policies (the ~47 `super_admin`-gated deletes) become the enforced model — delete scope must NOT be widened (see §6).

### Phase 4 — Long-term
- Once all modules migrated, consider **removing the bare `getSupabaseAdmin` export** from app request paths (keep it only for `getSupabaseAdminNoBreaker` health probes, `supabase.ts:55`, and `withServiceRole`).

---

## 6. What MUST NOT Be Done Without Sign-Off

- **Do NOT swap any client to `getSupabaseUser` until §3 (platform-admin model) is signed off.** A blind swap will break all 8 platform-admin cross-tenant workflows.
- **Do NOT edit `is_org_member` / `is_org_approved_member` / `is_super_admin` semantics** or add platform-admin RLS predicates (design §3.1) without the §3 decision. This is the exact blast-radius change `agent/mig-guards` rejected.
- **Do NOT seed `users:manage` / `organizations:manage` / `roles:manage` permission overrides** before org predicates land — granting those without RLS predicates would widen cross-tenant write access with no backstop.
- **Do NOT change RLS `DELETE` scope** (e.g. making deletes org-agnostic). Deletes must remain the most restrictive; admin-only delete is the intended model.
- **Do NOT run blanket `DROP POLICY` + `CREATE POLICY` recreation** (the `agent/mig-guards` approach) — it clobbers the security fixes in `5302132` (`store_*`) and `5302135` (`profiles.encrypted_pii`) and was deleted for that reason (`AGENTS.md`, Completed Work 2026-08-28).

---

## 7. Open Questions for the Human

1. **§3 decision:** adopt design (a) `is_platform_admin()` in policies, or design (b) `withServiceRole` escape hatch? (Recommend (b).)
2. **Shadow-probe risk tolerance:** acceptable to run `RLS_SHADOW_PROBE_ENABLED=true` in production for N days? What divergence rate (logged rows) is acceptable before Phase 2? Any uptime/downtime concern for the extra parallel query?
3. **Platform-admin long-term intent:** should the 8 roles keep *any* cross-tenant DB access long-term, or should cross-tenant admin move fully to an explicit support/impersonation workflow (already audited via `impersonation_log`)? This determines whether `withServiceRole` is permanent or a migration stepping-stone.
4. **Retention of service role:** keep `getSupabaseAdmin` permanently for `withServiceRole` + health probes, or aim to eliminate it from request paths entirely (Phase 4)?
5. **Latency budget:** `getSupabaseUser` currently lacks the circuit breaker (`supabase.ts:84`); is the added breaker overhead acceptable on the hot path once memoized + protected?

---

## 8. Consistency With Prior Decisions

- **`AGENTS.md` "Known Open Issues" (P0-7):** the 8 platform-admin roles bypass tenant isolation but are *audited* via `impersonation_log` (`5302133`) + `apps/api/src/services/impersonation.ts`. This proposal **preserves and strengthens** that audit trail via `withServiceRole` (§3.2); it does not weaken it.
- **Deleted `agent/mig-guards` branch:** `5302201` (blanket `DROP POLICY` + `CREATE POLICY` for 349 policies / 15 triggers + delete of GAP migrations `5302402`–`5302407`) was **never applied to prod and was deleted** because it would have clobbered the `5302132` (`store_*`) and `5302135` (`profiles.encrypted_pii`) security fixes (`AGENTS.md`, Completed Work 2026-08-28). This proposal therefore mandates **surgical, per-table** policy work only (the 7 missing policies, §4.3) — never mass recreation.

---

## 9. Evidence Index (file:line)

| Claim | Reference |
| ----- | --------- |
| Service-role client bypasses RLS | `apps/api/src/services/supabase.ts:30` (`getSupabaseAdmin`, `SUPABASE_SERVICE_ROLE_KEY`) |
| User-scoped client honors RLS | `apps/api/src/services/supabase.ts:73` (`getSupabaseUser`, anon key + `Authorization: Bearer ${jwt}`) |
| User client lacks circuit breaker | `apps/api/src/services/supabase.ts:84` (bare `fetch`) |
| Org scope populated by middleware | `apps/api/src/middleware/org-access.ts:189-195, 208-214, 241-247` |
| Middleware uses service-role (bypasses RLS) | `apps/api/src/middleware/org-access.ts:25, 88` |
| 8 platform-admin keys | `apps/api/src/lib/roles.ts:9-18` |
| Fail-closed tenant helpers | `apps/api/src/lib/tenant.ts` (`assertResourceOrg`, `loadOwned`) |
| Proven user-scoped pattern (reads) | `apps/api/src/routes/profiles.ts:56, 104, 214, 227` |
| Proven pattern still uses admin for write | `apps/api/src/routes/profiles.ts:141` |
| Caller JWT available on request | `apps/api/src/middleware/auth.ts:59` (`req.userJwt = token`) |
| `getSupabaseAdmin` 833 / `getSupabaseUser` 17 call sites | grep of `apps/api/src/**/*.ts` (2026-08-28) |
| 139 RLS tables / 133 with policies / 7 without | scan of `supabase/migrations/*.sql` (2026-08-28) |
| 7 policy-less tables | `document_shares`, `notifications`, `project_dependencies`, `project_milestones`, `project_phases`, `webhook_dead_letters`, `webhook_endpoints` |
| Policy predicates (`is_org_member` etc.) | `supabase/migrations/5302026_...v3.sql:653, 668, 1034` |
| P0-7 platform-admin audit | `AGENTS.md` Known Open Issues; `supabase/migrations/5302133`; `apps/api/src/services/impersonation.ts` |
| `agent/mig-guards` rejection | `AGENTS.md` Completed Work 2026-08-28 (branch deleted local+remote) |

---

## 10. Implementation Log (Phase 2/3 progress)

**Status flip:** design accepted for incremental execution; Phase 0 infra + first Phase-2 slice landed (2026-08-29).

### Phase 0 — done
- `getSupabaseUser(req, jwt)` hardened: per-request memoized `WeakMap` client + routed through the shared circuit breaker (`apps/api/src/services/supabase.ts`).
- `withServiceRole(reason, req, fn)` audited wrapper (`apps/api/src/lib/service-role.ts`) — the only sanctioned service-role path for platform-admin cross-tenant work.
- `docs/RLS-coverage-matrix.md` + this design doc.

### Phase 2 — reversible client-swap enabler + first slice
- **Enabler:** `getScopedClient(req, moduleKey, kind="read"|"write")` in `apps/api/src/services/supabase.ts`. Returns the user-scoped (RLS-enforced) client when `moduleKey` is present in `RLS_READS_ENABLED` / `RLS_WRITES_ENABLED` (comma-separated), else falls back to `getSupabaseAdmin()`. Both env vars are **empty by default** → every caller stays on the admin client until a module is explicitly opted in. Zero production behavior change until a flag is set.
- **First migrated module — `knowledge-base` reads:** `apps/api/src/routes/knowledge-base.ts` GET `/` (list) and GET `/:id` now call `getScopedClient(req, "knowledge-base", "read")`. Writes (POST/PATCH/DELETE) remain on `getSupabaseAdmin` (Phase 3). `knowledge-base` is **not** in `RLS_READS_ENABLED`, so it is currently inactive.
  - To activate (in staging first): set `RLS_READS_ENABLED=knowledge-base` and confirm the `knowledge_base_articles` SELECT policy (member-scoped) is applied to the hosted DB. Then promote to prod.
- Unit tests: `knowledge-base.test.ts` updated to mock `getScopedClient` (delegates to admin client) — 12/12 pass. API typecheck clean.

### Additional modules migrated (reads only, all inactive by default)
| Module | File | Read handler(s) converted | Notes |
| ------ | ---- | ------------------------- | ----- |
| `sla` | `routes/sla.ts` | `/metrics` | Single SELECT; member/org scoped. |
| `status-page` | `routes/status-page.ts` | authed GET list + GET `/:id` in `crudTable` | **Public** `/public/:orgId` (line 13) intentionally left on admin (no auth → would break public status pages). Writes stay on admin (Phase 3). |
| `client-portal` | `routes/client-portal.ts` | `/bootstrap` | Queries by `userId` (user-scoped by nature). No test file; typecheck clean. |

### Explicitly excluded (do NOT convert — platform-admin / cross-tenant)
- `dashboard.ts` — `requireAdmin` cross-tenant summary counts (all orgs); stays on admin (or `withServiceRole` for audit).
- `bulk.ts` `/invite` — `requireAdmin` platform-admin WRITE; stays on admin (or `withServiceRole`).

### Enablement gate (mandatory before flipping any module's flag)
For each module, before setting `RLS_READS_ENABLED=<module>` (staging first):
1. Confirm the relevant tables have member/org-scoped **SELECT** policies applied to the *hosted* DB (no local Docker/Supabase here to test RLS).
2. Confirm the route's read query is correctly org-scoped (uses `requireOrgAccess` + filters by `organization_id`, or queries by `userId`). Routes without `requireOrgAccess` (e.g. `client-portal` bootstrap) must be verified to still return the intended rows under RLS.
3. Watch for 403s / empty results in staging; roll back by clearing the flag (zero code change).

### Phase 2 bulk mechanical pass (2026-08-08-29)
A conservative script converted **authed GET read handlers** across the `routes/` tree to `getScopedClient(req, "<module>", "read")`, then reverted any conversion that was unsafe:

- **Reverted:** public routes (no `requireAuth`/`requireOrgAccess` applied), `requireAdmin` platform-admin routes, writes (POST/PATCH/PUT/DELETE), and any call site where `req` was not in scope (module-level helpers, `_req`-only handlers).
- **Excluded globally:** routers with `router.use(requireAdmin)` (e.g. `admin.ts`, `dashboard.ts`, `bulk.ts`) — platform-admin cross-tenant, stay on admin/`withServiceRole`.

Result: **135 read call sites** are now gated (inactive by default — `RLS_READS_ENABLED` is empty, so `getScopedClient` returns the same admin client; production behavior is byte-identical until a module is enabled). Full API suite (987 tests, 90 suites) passes; `tsc --noEmit` clean. Remaining `getSupabaseAdmin()` (274) are writes + the explicitly excluded routes.

This completes the *code* side of Phase 2 (reads). Remaining work before "RLS is live" is per-module:
1. Verify SELECT policies on the hosted DB for each module's tables.
2. Enable `RLS_READS_ENABLED=<module>` in staging, watch, then prod.
3. Phase 3 (writes): repeat the same pattern with `kind: "write"` + `RLS_WRITES_ENABLED`, after verifying INSERT/UPDATE/DELETE policies.
4. Ultimately remove the fallback (make `getScopedClient` default to user-scoped) once every module is verified.

### Phase 3 bulk mechanical pass (writes) — 2026-08-29
Same pattern applied to **authed write handlers** (`post`/`patch`/`put`/`delete`) across the `routes/` tree, gated by `getScopedClient(req, "<module>", "write")` (controlled by `RLS_WRITES_ENABLED`, empty by default → admin client → no behavior change). Exclusions identical to Phase 2: `router.use(requireAdmin)` routers, `requireAdmin` routes, public routes, and call sites without `req` in scope (auto-reverted via a typecheck loop).

Result: **329 read+write call sites** are now gated and inactive by default. 80 `getSupabaseAdmin()` remain — only in `router.use(requireAdmin)` platform-admin routers (`admin.ts`, `dashboard.ts`, `bulk.ts`, …), module-level helpers without `req`, and genuinely public routes. Full API suite (987 tests, 90 suites) passes; `tsc --noEmit` clean.

Remaining to make RLS *live*:
1. Per module: verify SELECT (reads) **and** INSERT/UPDATE/DELETE (writes) policies on the hosted DB.
2. Enable `RLS_READS_ENABLED=<module>` then `RLS_WRITES_ENABLED=<module>` in staging → watch → prod.
3. Drop the admin fallback (make `getScopedClient` default to the user-scoped client) once every module is verified — at which point `getSupabaseAdmin` is only reached via `withServiceRole` for the audited platform-admin paths.

### Remaining scope (incremental, same pattern)
- Migrate remaining read paths module-by-module behind `RLS_READS_ENABLED`; then writes behind `RLS_WRITES_ENABLED`.
- 822 `getSupabaseAdmin` call sites remain; the 7 design-doc "policy-less" tables (`document_shares`, `notifications`, `project_dependencies`, `project_milestones`, `project_phases`, `webhook_endpoints`, `webhook_dead_letters`) were **verified to already have public-prefixed policies** (counts 13/8/5/5/5/4/4), clearing the §4.3 hard blocker. The 3 `store_*` + `impersonation_log` tables are GLOBAL (no org columns) → service-role-only by design, excluded from the swap.
- Activate each module only after RLS policy verification on the hosted DB (no local Docker/Supabase available to test RLS here).

### Static readiness verification (2026-08-29)
Cross-referenced every gated module's tables (from `routes/*.ts` `.from("…")`) against `docs/RLS-coverage-matrix.md` risk sets:

- **service_role-ONLY tables** (`impersonation_log`, `store_leads`, `store_proposal_drafts`, `store_visual_assets`) — a user-scoped client returns 0 rows / cannot write. Global/admin sinks; correctly excluded (stay on `withServiceRole`/admin). None are touched by any gated module.
- **"OPEN"-policy tables** (`permissions`, `role_permissions`, `roles`, `store_categories`, `store_promotions`, `store_quotes`) — all SIX are **global reference/catalog tables with no `organization_id`**. Their `using (true)` / `to anon, authenticated` policies are intentional (global RBAC definitions + public storefront catalog) and hold **no tenant data to leak**. `is_org_member` does NOT apply (no org column) — do NOT add it. `store_quotes`' anon *write* was already removed in `5302132` (now `anon_insert` + `service_role_all`).

Result across 44 gated modules:

- **All 44 SAFE to enable for READS.** The 4 previously-flagged modules are false positives:
  - `roles` — *manages* RBAC and is **already pinned to the admin client** (never gated); correct.
  - `memberships`, `organizations`, `projects` — only *read* the global `roles`/`permissions`/`role_permissions` reference data; safe for reads.
  - `store` tables are global catalog (no org); reads are safe. (`store.ts` itself is currently fully on the admin client — its public storefront handlers use `_req` — so it is not in the gated set; gating its admin CRUD reads is optional and safe whenever desired.)
- **Writes caveat:** enabling `RLS_WRITES_ENABLED` per module requires the module's writes to be user-performed *and* the table to have a member-scoped write policy. Tables whose writes are `service_role`-only (e.g. `store_products`/`store_categories` admin CRUD, most `admin-only DELETE` tables per matrix §5) must stay on the admin client — leave `RLS_WRITES_ENABLED` unset for those modules.

**Enabling procedure (operator, not code):**
1. Set `RLS_READS_ENABLED=<module>` (and `RLS_WRITES_ENABLED=<module>` for writes) in the deployment env (droplet `.env`; flags documented in `apps/api/.env.example`, read by `getScopedClient` from `process.env`).
2. Staging first; watch for 403s / empty results / unexpected cross-tenant rows. Roll back by clearing the flag (zero code change).
3. Caveat: even "safe" modules may have **admin-only DELETE** policies (per matrix §5) that will 403 on delete once writes are enabled — test DELETE paths in staging.
4. Repeat per module; only then drop the admin fallback.

> If per-org (tenant-scoped) store catalog data is ever desired, that is a **schema change** (add `organization_id` + backfill + per-org policies on `store_*`), not an `is_org_member` tweak — track separately.
