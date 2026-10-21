# Supabase RLS Policy Deep-Dive — re-audit verification

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / Commit: `origin/main` @ `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097`
- Generated at: 2026-10-14 (UTC)
- Auditor: subagent (re-audit of `mainecybertech-20261011-0426-full-main-8d299b8`)
- Area code: RLS
- Scope limitations: static verification only — no hosted Supabase or local Postgres replay was run. The behavioral matrix script was read and its CI wiring confirmed, not executed (no local Supabase stack started).

## Scope

Re-verified all 16 previous RLS findings at `7dd0402`, plus a full effective-policy scan through the repo's own guard (`verify-rls.mjs`), which surfaced one new low-severity residual (four legacy role-gate policies).

## Verification performed

| Evidence | Type | Notes |
|---|---|---|
| `node scripts/verify-rls.mjs` | Executed | 140 tables, 140 RLS-enabled, 1031 policies, **0 failures**, 1 baseline warning |
| `node scripts/check-rls-predicate.mjs` | Executed | PASS — 30 migrations newer than `5302430` |
| `node scripts/check-permission-catalog.mjs` | Executed | PASS — 198 route + 46 policy references resolve against 338 catalog keys |
| `sh scripts/ci/check-permission-catalog.sh` | Executed | PASS incl. negative fixture |
| `supabase/migrations/5302435/5302436/5302439/5302441/5302447/5302448/5302451/5302452/5302459` | Read | Current policy state |
| `apps/api/src/lib/rls-startup-check.ts`, `services/supabase.ts`, `routes/auth.ts`, `lib/roles.ts` | Read | Client/gate behaviour |
| `scripts/ci/rls-matrix.sql`, `scripts/ci/check-rls-matrix.sh`, `.github/workflows/e2e.yml:101` | Read | Behavioral matrix wiring |

## Executive Summary

RLS is the strongest-remediated domain in this re-audit: 12 of 16 previous findings are verified fixed with executed guards, including the two P1s (runtime tenant-isolation detection is metric+rule+promtool-CI complete; the approved-membership predicate guard passes) and all seven P2s except the service-role default. The four partials are the same deliberate, documented residuals as before (service-role default posture, no anon-grant lint, name-derived storage org helper, duplicate tests/stale matrix). One new P3 was surfaced by the repo's own role-gate scan: four pre-baseline live policies still hardcode partial platform-role lists (the `document_shares` trio omits `super_admin`; the notifications INSERT gate omits six platform keys).

## Findings

| ID | Sev | Status | Title | Re-verification note (short) |
|---|---|---|---|---|
| RLS-P1-001 | P1 | verified-fixed | No runtime detection/alerting for tenant-isolation regressions | `portal_rls_bypass_total` metric + rules (`prometheus.rules.yml:126-186`) + unit tests; promtool wired (`validate.yml:50`, `test.yml:52`) and both commands pass locally. Alert *delivery* tracked under OBS/NOTIF |
| RLS-P1-002 | P1 | verified-fixed | Approved-membership predicate reintroduced six times | `check-rls-predicate.mjs` PASS; guard wired (`action.yml:125`). One pre-baseline exception carried in DATA-P1-001 |
| RLS-P2-001 | P2 | verified-fixed | MSP platform-admin keys missing from admin gates | `5302436` restores all five gates via `user_has_role` + assertion; verify-rls 0 failures |
| RLS-P2-002 | P2 | verified-fixed | `webhook_dead_letters` has no DELETE policy | `5302452` manage-scoped DELETE + assertion |
| RLS-P2-003 | P2 | verified-fixed | Definer RPCs trust caller-supplied user id | `5302435` binds `p_user_id` to `auth.uid()` for end users |
| RLS-P2-004 | P2 | partially-fixed | API defaults to the service-role client | Prod boot gate `rls-startup-check.ts:31-58`; `getScopedClient` still falls back to service role and the allow-list lives in GitHub secrets (`RLS-rollout.md:93-94`) |
| RLS-P2-005 | P2 | verified-fixed | `document_versions` UPDATE raw predicate | `5302447` approved-aware `dv_update` |
| RLS-P2-006 | P2 | verified-fixed | `store_quotes` public INSERT arbitrary org | `5302448` anon null-org / authenticated null-org-or-approved-member |
| RLS-P2-007 | P2 | verified-fixed | GoTrue admin calls through RLS-scoped client | `auth.ts:319,399,716,725` use `getSupabaseAdmin()` |
| RLS-P3-001 | P3 | partially-fixed | `5302116` anon grants + no RLS-off × anon-write lint | Blanket/default grants removed (`5302434`); no anon-grant lint exists (verify-rls rule 1 covers only RLS-off) |
| RLS-P3-002 | P3 | verified-fixed | No behavioral RLS allow/deny matrix | `scripts/ci/rls-matrix.sql` + runner wired in `e2e.yml:101` |
| RLS-P3-003 | P3 | partially-fixed | `storage_path_org_id` trusts object name | Helper unchanged (`5302026:799-829`); authenticated writes removed (`5302439`) + API path-org checks; SELECT/DELETE policies still name-derived |
| RLS-P3-004 | P3 | partially-fixed | Duplicate scoped-client tests / stale matrix | Both suites remain; matrix labelled a snapshot but its counts are unguarded |
| RLS-P3-005 | P3 | verified-fixed | Dead `manage` permission predicates | `5302459` completes the catalog; catalog guard PASS |
| RLS-P3-006 | P3 | verified-fixed | No static role-gate/catalog drift lint | `verify-rls.mjs` rules wired (`action.yml:101,109`); executed 0 failures |
| RLS-P3-007 | P3 | verified-fixed | Scoped-client adoption partial | `getScopedClient` at 417 route call sites |
| RLS-P3-008 | P3 | open (new) | Four live policies hardcode partial platform-role lists | `verify-rls.mjs` warning: `notifications_insert_system_or_admin` (`5302057:41`) + `document_shares_{delete,insert,update}_own_org` (`5302129:1136,1150,1164`) |

## New finding detail

### RLS-P3-008 — Four live policies still hardcode partial platform-role lists

- Evidence: `node scripts/verify-rls.mjs` prints `[role-gate:baseline] 4 live policies created before 5302436 hardcode a partial platform-role list`; the debug listing (temporary instrumented copy of the same script) names `notifications_insert_system_or_admin` (`5302057_fix_bootstrap_rls_fk_indexes.sql:41`, omits engineer/dispatcher/security-analyst/project-manager/finance/onboarding-specialist) and `document_shares_delete_own_org` / `_insert_own_org` / `_update_own_org` (`5302129_supabase_rls_audit_fixes.sql:1136,1150,1164`, omit `super_admin`).
- Impact: functional drift between the DB gate and the API's `PLATFORM_ADMIN_KEYS` — a platform `super_admin` cannot manage document shares through the user-scoped path, and six platform roles cannot use the notifications insert gate; the notifications policy also underpins the DATA-P1-001 status-filter residual.
- Fix: recreate the four policies with `public.user_has_role(...)` + `is_super_admin()` as appropriate (a single follow-up migration), then consider raising the role-gate baseline.
- Validation: extend `scripts/ci/rls-matrix.sql` with allow/deny assertions for `super_admin` on `document_shares` and for a platform engineer on `notifications`.

## Recommendations

1. **Rewrite the four legacy gates (RLS-P3-008)** and the notifications INSERT policy's approved filter in one migration (closes DATA-P1-001 too).
2. **RLS write rollout (RLS-P2-004)** — record the deployed `RLS_READS_ENABLED`/`RLS_WRITES_ENABLED` values in `docs/RLS-rollout.md` after each change so the posture is reproducible; make empty writes fatal once modules are onboarded.
3. **Anon-grant lint (RLS-P3-001)** — add a guard that fails any `grant ... to anon` without a matching public-write policy justification.
4. **Harden `storage_path_org_id` (RLS-P3-003)** — derive the org from the `documents` row instead of the object name in the SELECT/DELETE storage policies (or document the residual as accepted).
5. **Deduplicate scoped-client tests and guard the matrix counts (RLS-P3-004)**.

## Suggested tests

- Behavioral matrix additions: notifications INSERT by a pending admin (deny), document_shares write by `super_admin` (allow), storage delete with a forged prefix (deny).
- Static: an anon-grant lint plus a `pg_policies` assertion for the rewritten gates.
- CI: run `promtool` rule tests (already wired) and keep `verify-rls` at 0 failures with the baseline warning trended to zero.

## Open questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Which modules are currently in the deployed RLS allow-lists? | Determines how much of the API actually runs under RLS | Environment secret values (operator) |
| Is the name-derived storage org helper an accepted residual? | Cross-tenant delete defence | Owner decision / policy rewrite |
