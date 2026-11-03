# Access Control Matrix Audit

## Audit Metadata

- Audit name: repo-deep-dive (mainecybertech)
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `github.com/MaineCyberTech/mainecybertech`
- Branch: `main`
- Commit SHA: `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03
- Auditor: OpenCode subagent (read-only)
- Area code: ACM
- Output path: `docs/audits/repo-deep-dive/mainecybertech-20261103-0748-full-main-6b7aa1a/24_access_control_matrix_audit.md`
- Scope limitations: repository-only verification; no production database or GitHub environment secrets were read. Prior-run claims were re-checked against this commit, not assumed.

## Scope

Rebuilt the role/permission/route matrix for the current commit, re-verified all 18 prior ACM findings, and inspected read versus write gating across every module router. Authz tests and catalog-lint were reviewed.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `apps/api/src/routes/` | routes | read/write gates | Read at 6b7aa1a5 |
| `supabase/migrations/5302118_permission_matrix_full_catalog.sql` | catalog | view pairs | Read at 6b7aa1a5 |
| `apps/api/src/__tests__/final-view-gates.test.ts` | test | final gates | Read at 6b7aa1a5 |
| `apps/api/src/middleware/permissions.ts` | middleware | enforcement | Read at 6b7aa1a5 |
| `apps/api/src/routes/training-hub.ts` | route | view-gated writes | Read at 6b7aa1a5 |
| `apps/api/src/__tests__/route-authorization-guard.test.ts` | test | mount guard | Read at 6b7aa1a5 |

## Verification Performed

| Evidence / claim | Method | Result |
|---|---|---|
| All 18 prior ACM findings | Read the cited symbols/routes at `6b7aa1a5` | 14 verified-fixed, 4 partially-fixed, 0 open, 0 regressed |
| Nov 3 diff (`7dd0402..6b7aa1a5`) | `git diff --stat` plus targeted review of area files | 137 commits / 414 files changed overall; only area-relevant files were read line-by-line |
| New ACM issues | Attack-path/static review of changed routes and migrations | 1 new findings |
| Build/CI claims | File inspection only (dependencies not installed in the read-only worktree) | Marked `not run` where execution was impossible |

## Executive Summary

The matrix is mostly enforced server-side: all mutating routers mount requireAuth/requireOrgAccess, writes carry create/edit/delete gates, and the final/* read gap from the last run is fixed with tests. The remaining systemic gap is on reads: nine module list/detail routes are org-scoped but not permission-gated, so the catalog's view grants are UI-only. The training self-service writes now use view, broadening the known action-mismatch residual. Thirteen prior findings remain fixed and five remain partial.

Counts: **19** findings total - 14 verified-fixed, 4 partially-fixed, 1 open (all new), 0 regressed, **1 new**. Severity: P0 0, P1 2, P2 9, P3 8.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|---|---|---|---|---|---|
| Read routes | assets/approvals/findings/proposals/qbr/vendors/service-catalog/file-requests/domain-monitors | module lists | org-only | P2 | ACM-P2-009 |
| Final module reads | routes/final/* + sla.ts | module views | now gated | Low | ACM-P3-008 |
| Training enroll/progress | training-hub.ts:227-272 | self-service writes | view gate | P3 | ACM-P2-003 |
| AI triage analyze | ai.ts:217 | compute write | view gate | P3 | ACM-P2-003 |
| Client hiding | web module actions | UI only for reads | server not gated | P2 | ACM-P3-001 |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Roles | 4 | `packages/sdk/src/role-keys.ts` | split trust tiers | No action |
| Permissions | 3 | `permissions table + requirePermission` | read gaps | ACM-P2-009 |
| Org/tenant membership | 4 | `requireOrgAccess` | pinned/explicit | Multi-org in MT-P1-005 |
| Project/document/billing/API key/webhook perms | 3 | `module routes` | reads ungated | Gate reads |
| Admin console | 4 | `requireAdmin + admin-scope` | strong | No action |
| Public/authenticated/internal routes | 4 | `PUBLIC_ROUTES.md + CI` | inventory current | No action |
| Server actions | 4 | `apps/web/lib/module-actions.ts` | server API calls | No action |
| API endpoints | 3 | `read routes` | view gates missing | ACM-P2-009 |
| Background jobs | 4 | `worker tasks` | scoped | No action |
| DB helpers | 4 | `applyOrgScope/applyResolvedOrg` | strong | No action |
| Middleware | 4 | `auth/org/permission` | strong | No action |
| Client-side hiding | 2 | `web UI` | reads still rely on hiding | Gate server-side |

## Detailed Review

### Item: Roles

- Evidence: `packages/sdk/src/role-keys.ts`
- What it does: Roles control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: split trust tiers.
- Recommended improvement: No action.

### Item: Permissions

- Evidence: `permissions table + requirePermission`
- What it does: Permissions control/implementation.
- Current controls: score 3/5 at this commit.
- Missing controls / gap: read gaps.
- Recommended improvement: ACM-P2-009.

### Item: Org/tenant membership

- Evidence: `requireOrgAccess`
- What it does: Org/tenant membership control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: pinned/explicit.
- Recommended improvement: Multi-org in MT-P1-005.

### Item: Project/document/billing/API key/webhook perms

- Evidence: `module routes`
- What it does: Project/document/billing/API key/webhook perms control/implementation.
- Current controls: score 3/5 at this commit.
- Missing controls / gap: reads ungated.
- Recommended improvement: Gate reads.

### Item: Admin console

- Evidence: `requireAdmin + admin-scope`
- What it does: Admin console control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: strong.
- Recommended improvement: No action.

### Item: Public/authenticated/internal routes

- Evidence: `PUBLIC_ROUTES.md + CI`
- What it does: Public/authenticated/internal routes control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: inventory current.
- Recommended improvement: No action.

### Item: Server actions

- Evidence: `apps/web/lib/module-actions.ts`
- What it does: Server actions control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: server API calls.
- Recommended improvement: No action.

### Item: API endpoints

- Evidence: `read routes`
- What it does: API endpoints control/implementation.
- Current controls: score 3/5 at this commit.
- Missing controls / gap: view gates missing.
- Recommended improvement: ACM-P2-009.

### Item: Background jobs

- Evidence: `worker tasks`
- What it does: Background jobs control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: scoped.
- Recommended improvement: No action.

### Item: DB helpers

- Evidence: `applyOrgScope/applyResolvedOrg`
- What it does: DB helpers control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: strong.
- Recommended improvement: No action.

### Item: Middleware

- Evidence: `auth/org/permission`
- What it does: Middleware control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: strong.
- Recommended improvement: No action.

### Item: Client-side hiding

- Evidence: `web UI`
- What it does: Client-side hiding control/implementation.
- Current controls: score 2/5 at this commit.
- Missing controls / gap: reads still rely on hiding.
- Recommended improvement: Gate server-side.

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|---|---|---|---|---|---|---|
| ACM-001 | Roles | `packages/sdk/src/role-keys.ts` | score 4/5 | split trust tiers | P3 | No action |
| ACM-002 | Permissions | `permissions table + requirePermission` | score 3/5 | read gaps | P3 | ACM-P2-009 |
| ACM-003 | Org/tenant membership | `requireOrgAccess` | score 4/5 | pinned/explicit | P3 | Multi-org in MT-P1-005 |
| ACM-004 | Project/document/billing/API key/webhook perms | `module routes` | score 3/5 | reads ungated | P3 | Gate reads |
| ACM-005 | Admin console | `requireAdmin + admin-scope` | score 4/5 | strong | P3 | No action |
| ACM-006 | Public/authenticated/internal routes | `PUBLIC_ROUTES.md + CI` | score 4/5 | inventory current | P3 | No action |
| ACM-007 | Server actions | `apps/web/lib/module-actions.ts` | score 4/5 | server API calls | P3 | No action |
| ACM-008 | API endpoints | `read routes` | score 3/5 | view gates missing | P3 | ACM-P2-009 |
| ACM-009 | Background jobs | `worker tasks` | score 4/5 | scoped | P3 | No action |
| ACM-010 | DB helpers | `applyOrgScope/applyResolvedOrg` | score 4/5 | strong | P3 | No action |
| ACM-011 | Middleware | `auth/org/permission` | score 4/5 | strong | P3 | No action |
| ACM-012 | Client-side hiding | `web UI` | score 2/5 | reads still rely on hiding | P2 | Gate server-side |

## Findings

### Finding ID: ACM-P1-001 - Client-onboarding mutations run without any `requirePermission` gate

- Severity: P1
- Confidence: High
- Area: ACM
- Evidence:
  - `routes/client-onboarding-command-center.ts`
  - Symbols / routes: Client-onboarding mutations run without any `requirePermission` gate
- What is happening: re-verified at 6b7aa1a5: routes/client-onboarding-command-center.ts requirePermission on every mutation (:137 create, :154/:200/:247 edit, :177 delete); 403 regression coverage remains in the route suite.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ACM-P1-001` at `6b7aa1a5`.
- Owner suggestion: API platform
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ACM-P1-002 - `profiles.is_super_admin` is user-writable under the RLS self-update policy (forgeable super-admin flag)

- Severity: P1
- Confidence: High
- Area: ACM
- Evidence:
  - `supabase/migrations/5302437_protect_is_super_admin.sql`
  - Symbols / routes: `profiles.is_super_admin` is user-writable under the RLS self-update policy (forgeable super-admin flag)
- What is happening: re-verified at 6b7aa1a5: supabase/migrations/5302437_protect_is_super_admin.sql installs a BEFORE UPDATE trigger (:14-35) on public.profiles that raises for authenticated/anon JWT roles when is_super_admin changes.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ACM-P1-002` at `6b7aa1a5`.
- Owner suggestion: API platform + DBA
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ACM-P2-001 - `PLATFORM_ADMIN_KEYS` (org traversal) and `ADMIN_BYPASS_KEYS` (permission bypass) are inconsistent trust sets

- Severity: P2
- Confidence: High
- Area: ACM
- Evidence:
  - `packages/sdk/src/role-keys.ts`
  - `lib/roles.ts`
  - `catalog-parity.test.ts`
  - Symbols / routes: `PLATFORM_ADMIN_KEYS` (org traversal) and `ADMIN_BYPASS_KEYS` (permission bypass) are inconsistent trust sets
- What is happening: re-verified at 6b7aa1a5: CROSS_TENANT_KEYS vs ELEVATED_TENANT_KEYS split in packages/sdk/src/role-keys.ts; the API re-exports via lib/roles.ts, and catalog-parity.test.ts asserts parity with 5302128.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ACM-P2-001` at `6b7aa1a5`.
- Owner suggestion: API platform
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ACM-P2-002 - RLS is not a database backstop on API requests (service-role is the default client)

- Severity: P2
- Confidence: High
- Area: ACM
- Evidence:
  - `rls-startup-check.ts`
  - `services/supabase.ts`
  - Symbols / routes: RLS is not a database backstop on API requests (service-role is the default client)
- What is happening: re-verified at 6b7aa1a5: rls-startup-check.ts:40-55 refuses prod boot on an empty read allow-list; getScopedClient (services/supabase.ts:197-225) still returns the service-role client for modules not listed in RLS_READS/WRITES_ENABLED and meters the bypass. Residual: deployed allow-list values and write coverage remain operator-side.
- Why it matters: Part of the prior fix is present, but the residual described in the verification note is still reproducible.
- User / business impact: A material hardening or correctness gap that should be scheduled this month.
- Security / privacy / reliability impact: A material hardening or correctness gap that should be scheduled this month.
- Recommended fix: Close the residual described in the verification note and add a regression test that fails on the prior behavior.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ACM-P2-002` at `6b7aa1a5`.
- Owner suggestion: API platform + DBA
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: partially-fixed
- Endpoint / data path: see evidence
- Attack path: none identified beyond the documented control gap.

### Finding ID: ACM-P2-003 - Write and state-transition actions gated by `view` permissions (action mismatch)

- Severity: P2
- Confidence: High
- Area: ACM
- Evidence:
  - `routes/ai.ts`
  - `routes/training-hub.ts`
  - Symbols / routes: Write and state-transition actions gated by `view` permissions (action mismatch)
- What is happening: re-verified at 6b7aa1a5: the prior single exception remains at routes/ai.ts:217 (POST /triage/analyze uses ai:view), and the training self-service writes were changed to view in this commit - routes/training-hub.ts:227-232 (POST /courses/:id/enroll) and :269-272 (POST /courses/:id/progress) now use requirePermission('training-hub','view'). Both handlers only mutate the caller's own enrollment, so impact is limited, but the write/view mismatch class is broader than before.
- Why it matters: Part of the prior fix is present, but the residual described in the verification note is still reproducible.
- User / business impact: A material hardening or correctness gap that should be scheduled this month.
- Security / privacy / reliability impact: A material hardening or correctness gap that should be scheduled this month.
- Recommended fix: Close the residual described in the verification note and add a regression test that fails on the prior behavior.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ACM-P2-003` at `6b7aa1a5`.
- Owner suggestion: API platform
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: partially-fixed
- Endpoint / data path: see evidence
- Attack path: none identified beyond the documented control gap.

### Finding ID: ACM-P2-004 - Webhook endpoint and delivery reads are available to any org member (not manage-gated)

- Severity: P2
- Confidence: High
- Area: ACM
- Evidence:
  - `routes/webhook-management.ts`
  - Symbols / routes: Webhook endpoint and delivery reads are available to any org member (not manage-gated)
- What is happening: re-verified at 6b7aa1a5: routes/webhook-management.ts gates reads with requirePermission('webhooks','view') (:103 list, :125 dead-letters, :348 by-id, :508 deliveries) and mutations with 'webhooks','manage'.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ACM-P2-004` at `6b7aa1a5`.
- Owner suggestion: API platform
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ACM-P2-005 - API keys store `expires_at` but nothing enforces or prunes expiry

- Severity: P2
- Confidence: High
- Area: ACM
- Evidence:
  - `middleware/api-key.ts`
  - `worker/tasks/index.ts`
  - `schedule-config.ts`
  - Symbols / routes: API keys store `expires_at` but nothing enforces or prunes expiry
- What is happening: re-verified at 6b7aa1a5: expired keys fail closed in middleware/api-key.ts:82-91 and are pruned by the scheduled api-key-prune task (worker/tasks/index.ts:51, schedule-config.ts:50).
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ACM-P2-005` at `6b7aa1a5`.
- Owner suggestion: API platform + ops
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ACM-P2-006 - Webhook signing secrets are stored plaintext with no rotation or expiry

- Severity: P2
- Confidence: High
- Area: ACM
- Evidence:
  - `routes/webhook-management.ts`
  - Symbols / routes: Webhook signing secrets are stored plaintext with no rotation or expiry
- What is happening: re-verified at 6b7aa1a5: routes/webhook-management.ts:35-52 encrypts signing secrets at rest (AES-256-GCM via lib/field-encryption), masks them on read (:28-31,75-78) and records secret_expires_at rotation metadata (:379,441-448; migration 5302441).
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ACM-P2-006` at `6b7aa1a5`.
- Owner suggestion: API platform + security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ACM-P2-007 - Profiles are enumerable by email/id for any authenticated user

- Severity: P2
- Confidence: High
- Area: ACM
- Evidence:
  - `routes/profiles.ts`
  - Symbols / routes: Profiles are enumerable by email/id for any authenticated user
- What is happening: re-verified at 6b7aa1a5: GET /profiles?email=/?ids= still enumerates profiles for any authenticated user (routes/profiles.ts:61-96) but RLS restricts selects to self/same-org/super-admin (5302026:1005-1020) and decryptProfileRow strips ciphertext from responses. Residual: the directory query remains ungated by a users/profiles permission.
- Why it matters: Part of the prior fix is present, but the residual described in the verification note is still reproducible.
- User / business impact: A material hardening or correctness gap that should be scheduled this month.
- Security / privacy / reliability impact: A material hardening or correctness gap that should be scheduled this month.
- Recommended fix: Close the residual described in the verification note and add a regression test that fails on the prior behavior.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ACM-P2-007` at `6b7aa1a5`.
- Owner suggestion: API platform
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: partially-fixed
- Endpoint / data path: see evidence
- Attack path: none identified beyond the documented control gap.

### Finding ID: ACM-P2-008 - API-key `permissions` are decorative: keys act with the creator's full permissions and the column is never enforced

- Severity: P2
- Confidence: High
- Area: ACM
- Evidence:
  - `middleware/permissions.ts`
  - `routes/api-keys.ts`
  - Symbols / routes: API-key `permissions` are decorative: keys act with the creator's full permissions and the column is never enforced
- What is happening: re-verified at 6b7aa1a5: middleware/permissions.ts:73-80 caps every key request to the stored scope list before creator-side resolution; routes/api-keys.ts:43 gates the list route with api-keys:view.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ACM-P2-008` at `6b7aa1a5`.
- Owner suggestion: API platform
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ACM-P3-001 - Client-side permission hiding is UI-only for several module actions

- Severity: P3
- Confidence: High
- Area: ACM
- Evidence:
  - Prior-run report and current code inspection (see verification note).
  - Symbols / routes: Client-side permission hiding is UI-only for several module actions
- What is happening: re-verified at 6b7aa1a5: server enforcement is broad and catalog-linted, but there is still no per-route permission-guard coverage gate; the new ACM-P2-009 records nine module read endpoints that remain org-scoped only, and ACM-P2-003 records the remaining write/view mismatches.
- Why it matters: Part of the prior fix is present, but the residual described in the verification note is still reproducible.
- User / business impact: A low-risk cleanup, consistency or documentation gap.
- Security / privacy / reliability impact: A low-risk cleanup, consistency or documentation gap.
- Recommended fix: Close the residual described in the verification note and add a regression test that fails on the prior behavior.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ACM-P3-001` at `6b7aa1a5`.
- Owner suggestion: Web + API platform
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: partially-fixed
- Endpoint / data path: see evidence
- Attack path: none identified beyond the documented control gap.

### Finding ID: ACM-P3-002 - No catalog-lint: referenced permission keys are not checked against the `permissions` table

- Severity: P3
- Confidence: High
- Area: ACM
- Evidence:
  - `scripts/ci/check-permission-catalog.sh`
  - `scripts/check-permission-catalog.mjs`
  - `github/actions/unit-tests/action.yml`
  - Symbols / routes: No catalog-lint: referenced permission keys are not checked against the `permissions` table
- What is happening: re-verified at 6b7aa1a5: scripts/ci/check-permission-catalog.sh runs scripts/check-permission-catalog.mjs over requirePermission literals, live RLS user_has_permission predicates and registerCrud module keys, with a negative fixture; wired in .github/actions/unit-tests/action.yml:121-128.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ACM-P3-002` at `6b7aa1a5`.
- Owner suggestion: API platform
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ACM-P3-003 - Public route surface is broad and has no single documented inventory

- Severity: P3
- Confidence: High
- Area: ACM
- Evidence:
  - `docs/PUBLIC_ROUTES.md`
  - `scripts/public-route-inventory.mjs`
  - `github/actions/unit-tests/action.yml`
  - Symbols / routes: Public route surface is broad and has no single documented inventory
- What is happening: re-verified at 6b7aa1a5: docs/PUBLIC_ROUTES.md is generated from the auth:false OpenAPI RouteDefs and CI runs `node scripts/public-route-inventory.mjs --check` (.github/actions/unit-tests/action.yml:133).
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ACM-P3-003` at `6b7aa1a5`.
- Owner suggestion: API platform + docs
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ACM-P3-004 - `GET /roles/:id` and `GET /me/permissions` are readable without an admin gate

- Severity: P3
- Confidence: High
- Area: ACM
- Evidence:
  - `routes/roles.ts`
  - `routes/me.ts`
  - Symbols / routes: `GET /roles/:id` and `GET /me/permissions` are readable without an admin gate
- What is happening: re-verified at 6b7aa1a5: routes/roles.ts:67 GET /roles/:id now requires requireAdmin; GET /me/permissions remains self-scoped by design (routes/me.ts resolves only req.authUser.userId).
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ACM-P3-004` at `6b7aa1a5`.
- Owner suggestion: API platform
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ACM-P3-005 - RLS policies reference `manage` permissions that no role holds (dead predicates)

- Severity: P3
- Confidence: High
- Area: ACM
- Evidence:
  - `supabase/migrations/5302459_dead_rls_permission_predicates.sql`
  - Symbols / routes: RLS policies reference `manage` permissions that no role holds (dead predicates)
- What is happening: re-verified at 6b7aa1a5: supabase/migrations/5302459_dead_rls_permission_predicates.sql adds catalog rows for every historical predicate key (tickets:comment/manage, documents:manage/upload, projects:manage, contracts:*, appointments:*, onboarding:update) and the catalog guard is clean.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ACM-P3-005` at `6b7aa1a5`.
- Owner suggestion: DBA + API platform
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ACM-P3-006 - `GET /api-keys` lists org keys for any org member (no `api-keys:view` gate)

- Severity: P3
- Confidence: High
- Area: ACM
- Evidence:
  - `routes/api-keys.ts`
  - `api-keys-list-gate.test.ts`
  - Symbols / routes: `GET /api-keys` lists org keys for any org member (no `api-keys:view` gate)
- What is happening: re-verified at 6b7aa1a5: routes/api-keys.ts:43 GET / requires requirePermission('api-keys','view'); api-keys-list-gate.test.ts covers the denial.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ACM-P3-006` at `6b7aa1a5`.
- Owner suggestion: API platform
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ACM-P3-007 - AI copilot endpoints have no permission gate (any org member can run summarization and reply drafts)

- Severity: P3
- Confidence: High
- Area: ACM
- Evidence:
  - `routes/ai.ts`
  - `ai-copilot-permission-gate.test.ts`
  - Symbols / routes: AI copilot endpoints have no permission gate (any org member can run summarization and reply drafts)
- What is happening: re-verified at 6b7aa1a5: routes/ai.ts gates copilot routes - ai:view on triage list (:346-348), drafts list/detail (:537,562); ai:create on generate/drafts (:418-420,515); ai:edit on review (:578); ai-copilot-permission-gate.test.ts remains.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ACM-P3-007` at `6b7aa1a5`.
- Owner suggestion: API platform
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ACM-P3-008 - registerCrud reads and final/* module routes have no requirePermission gate

- Severity: P3
- Confidence: High
- Area: ACM
- Evidence:
  - `apps/api/src/routes/final/crud.ts`
  - `final/sharepoint.ts`
  - `backups.ts`
  - `budgets.ts`
  - `procurement.ts`
  - `time-entries.ts`
  - `routes/sla.ts`
  - `final-view-gates.test.ts`
  - Symbols / routes: registerCrud reads and final/* module routes have no requirePermission gate
- What is happening: re-verified at 6b7aa1a5: apps/api/src/routes/final/crud.ts:31,89 adds requirePermission(permissionModule,'view') to both read routes, and final/sharepoint.ts:9, backups.ts:9,24, budgets.ts:9, procurement.ts:11, time-entries.ts:13 plus routes/sla.ts:17 carry module view gates; final-view-gates.test.ts covers the denials.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ACM-P3-008` at `6b7aa1a5`.
- Owner suggestion: API platform
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ACM-P2-009 - Module read endpoints are org-scoped but not permission-gated (catalog view grants are UI-only)

- Severity: P2
- Confidence: High
- Area: ACM
- Evidence:
  - `apps/api/src/routes/assets.ts`
  - `apps/api/src/routes/approvals.ts`
  - `apps/api/src/routes/findings.ts`
  - `apps/api/src/routes/proposals.ts`
  - `apps/api/src/routes/qbr.ts`
  - `apps/api/src/routes/vendors.ts`
  - `apps/api/src/routes/service-catalog.ts`
  - `apps/api/src/routes/file-requests.ts`
  - `apps/api/src/routes/domain-monitors.ts`
  - Symbols / routes: Module read endpoints are org-scoped but not permission-gated (catalog view grants are UI-only)
- What is happening: NEW at 6b7aa1a5: the primary module list/detail routes are mounted with requireAuth+requireOrgAccess only: assets.ts:75, approvals.ts:122, findings.ts:84, proposals.ts:80, qbr.ts:22, vendors.ts:29, service-catalog.ts:20, file-requests.ts:299, domain-monitors.ts:70. Their writes carry create/edit/delete gates, and the catalog defines matching view pairs (5302118:42,134,138,142,256,323,327,331,340), so a role without the view grant can still read by calling the API directly. The clearest over-permission is vendors: catalog scope is 'admin' (:340) yet client-visible vendor contracts are served to client roles through applyClientVisibility (vendors.ts:47-50).
- Why it matters: This is a new issue at this commit; the verification note gives the exact code path and reachability.
- User / business impact: A material hardening or correctness gap that should be scheduled this month.
- Security / privacy / reliability impact: A material hardening or correctness gap that should be scheduled this month.
- Recommended fix: Add requirePermission(module,'view') to each module read route listed, then extend route-authorization-guard to assert a permission middleware on module reads. Reconcile the vendors catalog scope with the client-visible contract behavior.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ACM-P2-009` at `6b7aa1a5`.
- Owner suggestion: API platform
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: open
- Endpoint / data path: module list/detail routes for assets, approvals, findings, proposals, qbr, vendors, service-catalog, file-requests, domain-monitors
- Attack path: none identified beyond the documented control gap.

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Role without view grant reads module data via direct API | P2 | High | Medium | ACM-P2-009 | Gate reads |
| Vendor contracts exposed despite admin-scope catalog | P2 | Medium | Medium | vendors.ts:47-50 | Align gate/catalog |
| Action vocabulary diluted by view-gated writes | P3 | Medium | Low | ACM-P2-003 | Use create/edit |

## Recommendations

### Immediate / Release Blocking

- None beyond the P1 findings listed above.

### This Week

- Add requirePermission(module,'view') to the nine read route groups.

### This Month

- Extend the route guard to assert a permission middleware on module reads.
- Reclassify training self-service writes under a self-service action.

### Later / Platform Evolution

- Keep the catalog-lint gate.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Add view gates to assets/approvals/findings/proposals lists | Closes the broadest read gap | routes/*.ts | 403 test without view |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| ACM-P2-002: RLS is not a database backstop on API requests (service-role is the default client) | P2 | API platform + DBA | M | none |
| ACM-P2-003: Write and state-transition actions gated by `view` permissions (action mismatch) | P2 | API platform | M | none |
| ACM-P2-007: Profiles are enumerable by email/id for any authenticated user | P2 | API platform | M | none |
| ACM-P3-001: Client-side permission hiding is UI-only for several module actions | P3 | Web + API platform | S | none |
| ACM-P2-009: Module read endpoints are org-scoped but not permission-gated (catalog view grants are UI-only) | P2 | API platform | M | none |

## Suggested Tests

- For each module, a role without <module>:view gets 403 on list and detail.
- Vendor contract list as client role without vendors:view returns 403.
- Assert every module read route has requirePermission by static scan.

## Suggested Documentation Updates

- Publish an access-control matrix that marks reads as enforced or deliberately open; remove the UI-only assumption.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Are module reads intentionally open to all org members? | Determines whether ACM-P2-009 is a defect or a doc gap | Product/security decision |
| Should client roles see client-visible vendor contracts? | Resolves vendors mismatch | Product |

## Appendix

- Prior run: `mainecybertech-20261014-0033-full-main-7dd0402` (findings re-verified by area).
- Worktree: `/tmp/opencode/mct-nov-g1` at `origin/main` (6b7aa1a5505d4f75b334b36e9e87737cd98e589c).
- Commands: `git diff --stat 7dd0402..6b7aa1a5`, `git diff --name-only`, targeted `rg`/`sed` over the cited paths.
- Counts: 19 findings; 14 verified-fixed, 4 partially-fixed, 1 open, 0 regressed, 1 new.
- Execution limitation: application dependencies were not installed in the read-only worktree; runtime tests and database migrations were **not run** (marked not reproducible in this environment).

