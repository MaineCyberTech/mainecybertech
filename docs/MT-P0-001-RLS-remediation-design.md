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
