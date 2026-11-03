# Supabase RLS Policy Deep-Dive — re-audit verification

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / Commit: `origin/main` @ `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03 (UTC)
- Auditor: subagent (re-audit of `mainecybertech-20261014-0033-full-main-7dd0402`)
- Area code: RLS
- Scope limitations: read-only static review plus the repo's dependency-free guards; no hosted-Supabase or local-Postgres replay, no live policy introspection. The behavioural matrix is read, not executed (requires `supabase db reset`).

## Scope

Re-verified all 17 previous RLS findings at `6b7aa1a`, including the new `5302461` platform-role/approved-predicate migration and the `5302452`/`5302447`/`5302448` policy fixes, then reviewed the new `5302461`/`5302463` policies for drift. Storage-policy and service-role usage are included because they are part of the RLS boundary.

## Verification performed

| Evidence | Type | Notes |
|---|---|---|
| `node scripts/verify-rls.mjs` | Executed | PASS — 140/140 tables RLS-enabled, 1035 policies, 0 failures, 0 warnings |
| `node scripts/check-rls-predicate.mjs` | Executed | PASS — 34 migrations newer than 5302430 clean |
| `node scripts/check-permission-catalog.mjs` | Executed | PASS — 206 route + 46 live-policy references vs 338 catalog keys |
| `promtool check rules` / `test rules` (`prom/prometheus:v3.5.1`) | Executed | SUCCESS — 26 rules; rule tests SUCCESS |
| `supabase/migrations/5302461_full_platform_role_gates_and_approved_predicates.sql` | Read | Recreates notifications + document_shares policies |
| `supabase/migrations/5302452/5302447/5302448/5302435/5302436/5302441` | Read | Current policy state |
| `apps/api/src/services/supabase.ts`, `lib/rls-startup-check.ts`, `middleware/permissions.ts` | Read | Service-role fallback and permission resolution |
| `scripts/ci/rls-matrix.sql`, `.github/workflows/e2e.yml` | Read | Behavioural matrix still wired |

## Executive Summary

The RLS surface is materially stronger than at `7dd0402`: `5302461` closes the last pre-baseline role-gate/approved-predicate exceptions, so `verify-rls` now reports **zero warnings**, and `check-rls-predicate` is clean across 34 newer migrations. Thirteen of seventeen prior findings are verified fixed; the four partials are the same honest residuals (service-role default with secret-defined allow-lists, no anon-grant lint, name-derived storage org helper, unguarded matrix counts).

One new low-severity issue was found: the recreated `notifications_insert_system_or_admin` self branch still authorizes only `user_id = auth.uid()`, without constraining `organization_id`. A user with the anon key + JWT can write a self-addressed notification row into another tenant's organization. The impact is bounded (only the same user can select it; no org-wide read path), but it is a cross-tenant write and an integrity gap in the new policy.

## Findings

| ID | Sev | Status | Title | Re-verification note (short) |
|---|---|---|---|---|
| RLS-P1-001 | P1 | verified-fixed | No runtime RLS regression alerting | Prometheus rules `:165-205`; promtool 26 rules + tests SUCCESS |
| RLS-P1-002 | P1 | verified-fixed | Approved-membership predicate reintroduced | Guard PASS (34 migrations); `5302461` removes the last live exception |
| RLS-P2-001 | P2 | verified-fixed | MSP platform-admin keys missing from admin gates | `5302436`; verify-rls 0 warnings |
| RLS-P2-002 | P2 | verified-fixed | webhook_dead_letters no DELETE policy | `5302452:23-36` + assertion |
| RLS-P2-003 | P2 | verified-fixed | Definer RPC trusts caller user id | `5302435` binds to `auth.uid()` |
| RLS-P2-004 | P2 | partially-fixed | API defaults to service-role client | Startup guard exists; fallback + secret allow-lists remain |
| RLS-P2-005 | P2 | verified-fixed | document_versions raw predicate | `5302447` approved-aware USING/WITH CHECK |
| RLS-P2-006 | P2 | verified-fixed | store_quotes arbitrary org insert | `5302448` anon null-org / member policies |
| RLS-P2-007 | P2 | verified-fixed | Auth admin calls via scoped client | `auth.ts:316-322,340,436-437,753,762` use admin client |
| RLS-P3-001 | P3 | partially-fixed | No anon-grant lint | Blanket grant removed; no lint for new `grant ... to anon` |
| RLS-P3-002 | P3 | verified-fixed | No behavioural RLS matrix | `rls-matrix.sql` wired at `e2e.yml:148` |
| RLS-P3-003 | P3 | partially-fixed | storage_path_org_id name-derived | Writes removed (`5302439`); SELECT/DELETE still name-derived |
| RLS-P3-004 | P3 | partially-fixed | Duplicate tests / stale matrix | Duplicate suite removed; counts still unguarded |
| RLS-P3-005 | P3 | verified-fixed | Dead `manage` predicates | Catalog check PASS |
| RLS-P3-006 | P3 | verified-fixed | No role-gate/catalog lint | `verify-rls.mjs` 0 failures/0 warnings |
| RLS-P3-007 | P3 | verified-fixed | Scoped-client adoption partial | 373 scoped call sites; no tenant-module regression |
| RLS-P3-008 | P3 | verified-fixed | Four partial platform-role policies | `5302461:29-70`; baseline warning gone |
| RLS-P3-009 | P3 | open (new) | notifications self-insert can name any org | `5302461:29-37`; no org check on the self branch |

Counts: 13 verified-fixed, 4 partially-fixed, 0 regressed, 1 new/open.

## New finding detail

### RLS-P3-009 — Self-addressed notifications can target another tenant

- Evidence: `supabase/migrations/5302461_full_platform_role_gates_and_approved_predicates.sql:29-37`.
- What is happening: the policy is `user_id = auth.uid() OR public.user_has_role(organization_id, [full platform keys])`. The second branch checks approved membership; the first checks only the recipient id and never constrains `notifications.organization_id`.
- Why it matters: the table is reachable through PostgREST with the anon key + a user JWT (the path RLS exists for), and `authenticated` retains INSERT on `notifications` (`5302116`, not revoked by `5302434`). A client/tenant user can therefore insert a notification row carrying another organization's UUID; the row is selectable only by that same user, but it is written into the other tenant's dataset and will pollute any future org-scoped reporting or admin query (no current org-wide notification read path was found).
- Fix: make the self branch `user_id = auth.uid() AND (organization_id IS NULL OR public.is_org_member(organization_id))`; keep the platform branch unchanged. Add the corresponding allow/deny assertion to `scripts/ci/rls-matrix.sql`.
- Validation: as a member of org A, insert `{user_id: self, organization_id: orgB}` via the user client -> expect RLS denial; insert with org A or NULL -> expect success.
- Confidence: High (policy text); exploitability is Medium because the anon key is not shipped to the browser in this repo and no API route offers this shape.

## Residuals carried forward

- **RLS-P2-004** — `getScopedClient` still returns `getSupabaseAdmin()` for every module absent from `RLS_READS_ENABLED`/`RLS_WRITES_ENABLED`; those values come from GitHub environment secrets, so the deployed posture cannot be reproduced from the repo.
- **RLS-P3-001** — no static check fails a new `grant ... to anon`; the allowlist is only enforced by migration review.
- **RLS-P3-003** — `storage_path_org_id` still derives the org from the client-controlled object name; only authenticated INSERT/UPDATE were removed, SELECT/DELETE remain name-derived.
- **RLS-P3-004** — `docs/RLS-coverage-matrix.md` remains a snapshot whose counts are not checked by `check-docs-counts.mjs`.

## Recommendations

1. **Fix RLS-P3-009** — add the org predicate to the self branch and extend the RLS matrix.
2. **Make the deployed RLS posture reproducible (RLS-P2-004)** — commit the per-environment allow-list or a checked-in desired-state file and have the startup check compare against it.
3. **Add the anon-grant lint (RLS-P3-001)** — fail any migration containing `grant ... to anon` unless the table/policy pair is in a reviewed allowlist.
4. **Replace the storage org helper (RLS-P3-003)** — write the org id into object metadata or a side table on upload and have policies read that, rather than parsing the name.
5. **Guard matrix counts (RLS-P3-004)** — derive the coverage counts in CI or remove the numeric table.

## Suggested tests

- RLS matrix: client user inserts a notification for org B -> denied; for org A/NULL -> allowed.
- RLS matrix: pending/suspended admin inserts an org notification -> denied (covers the 5302461 fix).
- Static: a migration containing `grant ... to anon` outside the allowlist fails CI.
- Storage: a user-scoped DELETE/SELECT of an object whose name claims org A but whose metadata/membership is org B is denied.
- Startup: production boot with empty `RLS_READS_ENABLED` fails; with a module listed, `getScopedClient` returns the user client and increments `portal_rls_enforced_total`.

## Open questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Which modules are in `RLS_READS_ENABLED`/`RLS_WRITES_ENABLED` in production? | The service-role fallback is the real enforcement boundary | Environment secret values / a checked-in manifest |
| Is the anon key ever exposed to browsers or third parties? | Sets the exploitability of RLS-only findings such as RLS-P3-009 | Web bundle/env scan, Supabase key policy |
| Are the four partials accepted as permanent? | Residual risk ownership | Owner sign-off in the risk register |
