# Multi-Tenant Isolation Attack Simulation

## Audit Metadata

- Audit name: repo-deep-dive (mainecybertech)
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `github.com/MaineCyberTech/mainecybertech`
- Branch: `main`
- Commit SHA: `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03
- Auditor: OpenCode subagent (read-only)
- Area code: MT
- Output path: `docs/audits/repo-deep-dive/mainecybertech-20261103-0748-full-main-6b7aa1a/25_multi_tenant_isolation_attack_simulation.md`
- Scope limitations: repository-only verification; no production database or GitHub environment secrets were read. Prior-run claims were re-checked against this commit, not assumed.

## Scope

Ran a read-only tabletop/static attack simulation against the current scoping helpers and re-verified 14 prior MT findings. Focus areas: audit/dashboard/search cache scope, multi-org membership, nested resources, storage paths, SSE and bulk writes.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `apps/api/src/middleware/org-access.ts:140-146` | scope | unpinned platform admin | Read at 6b7aa1a5 |
| `apps/api/src/lib/admin-scope.ts:63-74` | scope | all memberships | Read at 6b7aa1a5 |
| `apps/api/src/middleware/admin.ts:49-58` | gate | explicit-only pin | Read at 6b7aa1a5 |
| `apps/api/src/routes/audit.ts:28-37` | route | applyOrgScope | Read at 6b7aa1a5 |
| `apps/api/src/routes/search.ts:80-108` | route | adminOrgIds | Read at 6b7aa1a5 |
| `apps/api/src/routes/tickets.ts:613-623` | route | bulk scope | Read at 6b7aa1a5 |

## Verification Performed

| Evidence / claim | Method | Result |
|---|---|---|
| All 14 prior MT findings | Read the cited symbols/routes at `6b7aa1a5` | 11 verified-fixed, 3 partially-fixed, 0 open, 0 regressed |
| Nov 3 diff (`7dd0402..6b7aa1a5`) | `git diff --stat` plus targeted review of area files | 137 commits / 414 files changed overall; only area-relevant files were read line-by-line |
| New MT issues | Attack-path/static review of changed routes and migrations | 1 new findings |
| Build/CI claims | File inspection only (dependencies not installed in the read-only worktree) | Marked `not run` where execution was impossible |

## Executive Summary

The prior all-tenant leaks remain fixed: audit/dashboard/search/store/report paths apply mandatory org scope, cache keys are scoped, storage paths are org-prefixed and SSE is org-checked. A new P1 attack path survives: a user with a cross-tenant admin role in org A and an ordinary client membership in org B can omit the org selector and receive B's admin data (audit logs, dashboard counts, search results) and bulk-update B tickets. Ten priors remain fixed and four remain partial (conditional filters, impersonation audit durability, isolation suite coverage).

Counts: **15** findings total - 11 verified-fixed, 3 partially-fixed, 1 open (all new), 0 regressed, **1 new**. Severity: P0 0, P1 5, P2 8, P3 2.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|---|---|---|---|---|---|
| Default org resolution | middleware/org-access.ts:128-152 | pick active/first org | cross-tenant role -> null/platformAdmin | P1 | MT-P1-005 |
| Admin scope | lib/admin-scope.ts:49-74 | orgIds/allTenants | all approved memberships | P1 | MT-P1-005 |
| Audit list/export | routes/audit.ts | tenant trail | multi-org overreach | P1 | MT-P1-005 |
| Search | routes/search.ts | global search | multi-org overreach | P1 | MT-P1-005 |
| Tickets bulk | routes/tickets.ts | mass updates | multi-org overreach | P1 | MT-P1-005 |
| Conditional filters | ai/api-keys/approvals/assets/documents | legacy scoping | partial | P2 | MT-P2-002 |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Audit log scope | 3 | `audit.ts:24-50` | explicit org fixed; multi-org default gap | MT-P1-005 |
| Dashboard aggregates | 3 | `dashboard.ts/business-os.ts` | same | MT-P1-005 |
| Cache isolation | 4 | `middleware/cache.ts:204-260` | scope fingerprint | No action |
| Storage paths | 4 | `documents.ts:387, file-requests.ts:161` | UUID prefix | No action |
| SSE notifications | 4 | `notifications.ts:181-303` | org predicate | No action |
| Search | 3 | `search.ts:78-260` | multi-org gap | MT-P1-005 |
| Admin cross-tenant access | 2 | `org-access.ts:140-146` | unpinned platformAdmin | MT-P1-005 |
| Report generators | 4 | `worker/tasks/module-tasks.ts` | org from row | No action |
| Isolation tests | 3 | `tenant-scoping-guard.test.ts` | 11-module allowlist | MT-P3-001 |

## Detailed Review

### Item: Audit log scope

- Evidence: `audit.ts:24-50`
- What it does: Audit log scope control/implementation.
- Current controls: score 3/5 at this commit.
- Missing controls / gap: explicit org fixed; multi-org default gap.
- Recommended improvement: MT-P1-005.

### Item: Dashboard aggregates

- Evidence: `dashboard.ts/business-os.ts`
- What it does: Dashboard aggregates control/implementation.
- Current controls: score 3/5 at this commit.
- Missing controls / gap: same.
- Recommended improvement: MT-P1-005.

### Item: Cache isolation

- Evidence: `middleware/cache.ts:204-260`
- What it does: Cache isolation control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: scope fingerprint.
- Recommended improvement: No action.

### Item: Storage paths

- Evidence: `documents.ts:387, file-requests.ts:161`
- What it does: Storage paths control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: UUID prefix.
- Recommended improvement: No action.

### Item: SSE notifications

- Evidence: `notifications.ts:181-303`
- What it does: SSE notifications control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: org predicate.
- Recommended improvement: No action.

### Item: Search

- Evidence: `search.ts:78-260`
- What it does: Search control/implementation.
- Current controls: score 3/5 at this commit.
- Missing controls / gap: multi-org gap.
- Recommended improvement: MT-P1-005.

### Item: Admin cross-tenant access

- Evidence: `org-access.ts:140-146`
- What it does: Admin cross-tenant access control/implementation.
- Current controls: score 2/5 at this commit.
- Missing controls / gap: unpinned platformAdmin.
- Recommended improvement: MT-P1-005.

### Item: Report generators

- Evidence: `worker/tasks/module-tasks.ts`
- What it does: Report generators control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: org from row.
- Recommended improvement: No action.

### Item: Isolation tests

- Evidence: `tenant-scoping-guard.test.ts`
- What it does: Isolation tests control/implementation.
- Current controls: score 3/5 at this commit.
- Missing controls / gap: 11-module allowlist.
- Recommended improvement: MT-P3-001.

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|---|---|---|---|---|---|---|
| MT-001 | Audit log scope | `audit.ts:24-50` | score 3/5 | explicit org fixed; multi-org default gap | P3 | MT-P1-005 |
| MT-002 | Dashboard aggregates | `dashboard.ts/business-os.ts` | score 3/5 | same | P3 | MT-P1-005 |
| MT-003 | Cache isolation | `middleware/cache.ts:204-260` | score 4/5 | scope fingerprint | P3 | No action |
| MT-004 | Storage paths | `documents.ts:387, file-requests.ts:161` | score 4/5 | UUID prefix | P3 | No action |
| MT-005 | SSE notifications | `notifications.ts:181-303` | score 4/5 | org predicate | P3 | No action |
| MT-006 | Search | `search.ts:78-260` | score 3/5 | multi-org gap | P3 | MT-P1-005 |
| MT-007 | Admin cross-tenant access | `org-access.ts:140-146` | score 2/5 | unpinned platformAdmin | P2 | MT-P1-005 |
| MT-008 | Report generators | `worker/tasks/module-tasks.ts` | score 4/5 | org from row | P3 | No action |
| MT-009 | Isolation tests | `tenant-scoping-guard.test.ts` | score 3/5 | 11-module allowlist | P3 | MT-P3-001 |

## Findings

### Finding ID: MT-P1-001 - Audit log list and export are not org-scoped by default

- Severity: P1
- Confidence: High
- Area: MT
- Evidence:
  - `routes/audit.ts`
  - `lib/admin-scope.ts`
  - Symbols / routes: Audit log list and export are not org-scoped by default
- What is happening: re-verified at 6b7aa1a5: routes/audit.ts:24-50 applies requireOrgAccess+requireAdmin, applyRequestedOrg and applyOrgScope (mandatory org predicate) to list and export; lib/admin-scope.ts:70-140 fails closed for non-cross-tenant admins. The multi-org membership variant is tracked separately as MT-P1-005.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `MT-P1-001` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: MT-P1-002 - Platform dashboards expose all-tenant aggregates to any single-org admin

- Severity: P1
- Confidence: High
- Area: MT
- Evidence:
  - `routes/dashboard.ts`
  - `business-os.ts`
  - Symbols / routes: Platform dashboards expose all-tenant aggregates to any single-org admin
- What is happening: re-verified at 6b7aa1a5: routes/dashboard.ts:16-50 and business-os.ts:35-62 scope every aggregate with resolveAdminTenantScope + applyOrgScope; single-org admins see only their resolved org list. The multi-org membership variant is tracked as MT-P1-005.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `MT-P1-002` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: MT-P1-003 - Public file-request upload authorizes with a permission unioned across all orgs

- Severity: P1
- Confidence: High
- Area: MT
- Evidence:
  - `routes/file-requests.ts`
  - Symbols / routes: Public file-request upload authorizes with a permission unioned across all orgs
- What is happening: re-verified at 6b7aa1a5: routes/file-requests.ts:114-160 authorizes on the request token row and binds every write to data.organization_id (:161,197-275); the claim RPC is org-bound.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `MT-P1-003` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: MT-P1-004 - Response cache keys omit the caller's tenant scope, so all-tenant responses can be served to single-org members

- Severity: P1
- Confidence: High
- Area: MT
- Evidence:
  - `middleware/cache.ts`
  - `routes/documents.ts`
  - Symbols / routes: Response cache keys omit the caller's tenant scope, so all-tenant responses can be served to single-org members
- What is happening: re-verified at 6b7aa1a5: middleware/cache.ts:204-260 folds a scopeFingerprint (allTenants + sorted orgIds hash) into the key, and documents list now opts into userScoped at routes/documents.ts:227; scope-dependent routes pass resolveAdminTenantScope.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `MT-P1-004` at `6b7aa1a5`.
- Owner suggestion: API principal engineer
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: MT-P2-001 - Admin global search lists all organizations and can fall through unscoped

- Severity: P2
- Confidence: High
- Area: MT
- Evidence:
  - `routes/search.ts`
  - `search-tenant-scope.test.ts`
  - `search-org-pin.test.ts`
  - Symbols / routes: Admin global search lists all organizations and can fall through unscoped
- What is happening: re-verified at 6b7aa1a5: routes/search.ts:78-260 resolves canSeeAllTenants/requestedOrg, applies scopedOrgIds to users/tickets/projects/documents/organizations, and only unscopes for genuine super-admin cross-tenant callers; search-tenant-scope.test.ts + search-org-pin.test.ts cover it.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `MT-P2-001` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: MT-P2-002 - By-id org filters are conditional, so they fail open if the org gate is not reached

- Severity: P2
- Confidence: High
- Area: MT
- Evidence:
  - `lib/admin-scope.ts`
  - `ai.ts`
  - `api-keys.ts`
  - `approvals.ts`
  - `assets.ts`
  - `documents.ts`
  - Symbols / routes: By-id org filters are conditional, so they fail open if the org gate is not reached
- What is happening: re-verified at 6b7aa1a5: the mandatory applyResolvedOrg helper (lib/admin-scope.ts:141-165, throws 403 when no scope resolves) is used in findings/tickets/qbr/documents and notifications list, and the tenant-scoping-guard allowlist no longer lists findings/tickets/qbr. Residual unchanged: conditional `if (orgId)` filters remain in ai.ts:329,546, api-keys.ts:53, approvals.ts:101,132,174, assets.ts:84,113,148, documents.ts:413,434,540,578,616,626,655, and others; they are safe only because requireOrgAccess injects organization_id for non-platform admins.
- Why it matters: Part of the prior fix is present, but the residual described in the verification note is still reproducible.
- User / business impact: A material hardening or correctness gap that should be scheduled this month.
- Security / privacy / reliability impact: A material hardening or correctness gap that should be scheduled this month.
- Recommended fix: Close the residual described in the verification note and add a regression test that fails on the prior behavior.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `MT-P2-002` at `6b7aa1a5`.
- Owner suggestion: API principal engineer
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: partially-fixed
- Endpoint / data path: see evidence
- Attack path: none identified beyond the documented control gap.

### Finding ID: MT-P2-003 - Storage writer path and RLS org-derivation disagree (`orgs/<uuid>/` vs `<uuid>/`)

- Severity: P2
- Confidence: High
- Area: MT
- Evidence:
  - `documents.ts`
  - `file-requests.ts`
  - Symbols / routes: Storage writer path and RLS org-derivation disagree (`orgs/<uuid>/` vs `<uuid>/`)
- What is happening: re-verified at 6b7aa1a5: storage writers prefix objects with the org UUID - documents.ts:387 `${organizationId}/...`, file-requests.ts:161 `${data.organization_id}/requests/...`; storage_path_org_id (5302026:799-825) parses that UUID prefix and no `orgs/`-prefixed writer remains.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `MT-P2-003` at `6b7aa1a5`.
- Owner suggestion: API platform / DB owner
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: MT-P2-004 - Realtime/SSE notification channel is scoped by user only, with no org assertion

- Severity: P2
- Confidence: High
- Area: MT
- Evidence:
  - `routes/notifications.ts`
  - `notifications-sse-scope.test.ts`
  - Symbols / routes: Realtime/SSE notification channel is scoped by user only, with no org assertion
- What is happening: re-verified at 6b7aa1a5: routes/notifications.ts:181-196 notificationInScope drops non-matching orgs, and :231,285,302-303 apply the resolved org to the stream and initial query; notifications-sse-scope.test.ts covers it.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `MT-P2-004` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: MT-P2-005 - Platform-admin cross-tenant access is role-key based, broad, and unalerted

- Severity: P2
- Confidence: High
- Area: MT
- Evidence:
  - `services/impersonation.ts`
  - `lib/metrics.ts`
  - `prometheus.rules.yml`
  - `middleware/org-access.ts`
  - `lib/tenant.ts`
  - Symbols / routes: Platform-admin cross-tenant access is role-key based, broad, and unalerted
- What is happening: re-verified at 6b7aa1a5: the role-key split narrows the tier; cross-tenant entries are written to impersonation_log (services/impersonation.ts) and incremented in lib/metrics.ts:137-140 with Prometheus alerts MCTImpersonationBurst/MCTImpersonationActivity (prometheus.rules.yml:102-120). Residual unchanged: the audit write is still fire-and-forget (void logImpersonation in middleware/org-access.ts:52,197 and lib/tenant.ts:48), so an insert failure drops the record, and the metric carries no organization label.
- Why it matters: Part of the prior fix is present, but the residual described in the verification note is still reproducible.
- User / business impact: A material hardening or correctness gap that should be scheduled this month.
- Security / privacy / reliability impact: A material hardening or correctness gap that should be scheduled this month.
- Recommended fix: Close the residual described in the verification note and add a regression test that fails on the prior behavior.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `MT-P2-005` at `6b7aa1a5`.
- Owner suggestion: Platform lead + security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: partially-fixed
- Endpoint / data path: see evidence
- Attack path: none identified beyond the documented control gap.

### Finding ID: MT-P2-006 - Platform-wide report generators run as service role with no tenant guard on scope inputs

- Severity: P2
- Confidence: High
- Area: MT
- Evidence:
  - `worker/tasks/module-tasks.ts`
  - `api/lib/task-producer.ts`
  - Symbols / routes: Platform-wide report generators run as service role with no tenant guard on scope inputs
- What is happening: re-verified at 6b7aa1a5: scheduled report generators derive the org from the DB row and scope every read - worker/tasks/module-tasks.ts qbrScheduledGenerate (:1062-1124) and saas-audit-scan (:1300-1345) use `.eq('organization_id', orgId)`; api/lib/task-producer.ts:76-104 refuses scheduled-only tasks and fails closed on queue-backend mismatch.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `MT-P2-006` at `6b7aa1a5`.
- Owner suggestion: Worker/queue owner
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: MT-P2-007 - Client-portal entitlement routes order requireAdmin before requireOrgAccess, bypassing the org-pinned admin check

- Severity: P2
- Confidence: High
- Area: MT
- Evidence:
  - `routes/client-portal.ts`
  - `client-portal-entitlements-org-pin.test.ts`
  - Symbols / routes: Client-portal entitlement routes order requireAdmin before requireOrgAccess, bypassing the org-pinned admin check
- What is happening: re-verified at 6b7aa1a5: routes/client-portal.ts:121,145 order requireOrgAccess before requireAdmin on both entitlement routes, so the org-pinned admin check applies; client-portal-entitlements-org-pin.test.ts covers it.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `MT-P2-007` at `6b7aa1a5`.
- Owner suggestion: API principal engineer
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: MT-P2-008 - Platform-wide store intake and analytics endpoints are readable by any tenant admin with no cross-tenant gate

- Severity: P2
- Confidence: High
- Area: MT
- Evidence:
  - `routes/store/quotes.ts`
  - `analytics.ts`
  - `store-tenant-isolation.test.ts`
  - Symbols / routes: Platform-wide store intake and analytics endpoints are readable by any tenant admin with no cross-tenant gate
- What is happening: re-verified at 6b7aa1a5: routes/store/quotes.ts:36-37 requirePlatformAdmin (allTenants) on platform surfaces and :216-224 applies applyOrgScope on the quote list; analytics.ts:78-110 gates admin reads on allTenants; store-tenant-isolation.test.ts covers it.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `MT-P2-008` at `6b7aa1a5`.
- Owner suggestion: API platform / product
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: MT-P3-001 - No automated cross-tenant isolation regression suite for application-layer scoping

- Severity: P3
- Confidence: High
- Area: MT
- Evidence:
  - `tenant-scoping-guard.test.ts`
  - Symbols / routes: No automated cross-tenant isolation regression suite for application-layer scoping
- What is happening: re-verified at 6b7aa1a5: isolation coverage includes tenant-scoping-guard.test.ts, search-tenant-scope, store-tenant-isolation, notifications-sse-scope, admin-scope-resolved-org, client-portal-entitlements-org-pin and final-view-gates. Residual unchanged: the static guard's KNOWN_UNSCOPED allowlist still lists 11 unremediated modules (tenant-scoping-guard.test.ts:49-64), and there is no per-module org-A->org-B matrix test.
- Why it matters: Part of the prior fix is present, but the residual described in the verification note is still reproducible.
- User / business impact: A low-risk cleanup, consistency or documentation gap.
- Security / privacy / reliability impact: A low-risk cleanup, consistency or documentation gap.
- Recommended fix: Close the residual described in the verification note and add a regression test that fails on the prior behavior.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `MT-P3-001` at `6b7aa1a5`.
- Owner suggestion: QA / API team
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: partially-fixed
- Endpoint / data path: see evidence
- Attack path: none identified beyond the documented control gap.

### Finding ID: MT-P3-002 - Admin notification create accepts an arbitrary recipient and org-less rows bypass the SSE scope assertion

- Severity: P3
- Confidence: High
- Area: MT
- Evidence:
  - `routes/notifications.ts`
  - Symbols / routes: Admin notification create accepts an arbitrary recipient and org-less rows bypass the SSE scope assertion
- What is happening: re-verified at 6b7aa1a5: routes/notifications.ts:449-470 admin create requires requireAdmin plus assertSharesActiveOrg on the recipient and assertOrgScopeMatches on a supplied org, and stamps the resolved org; list/SSE paths apply applyResolvedOrg.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `MT-P3-002` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: MT-P1-005 - A cross-tenant admin membership widens admin scope to orgs where the user is only a client/member

- Severity: P1
- Confidence: High
- Area: MT
- Evidence:
  - `apps/api/src/middleware/org-access.ts`
  - `apps/api/src/middleware/admin.ts`
  - `apps/api/src/lib/admin-scope.ts`
  - `apps/api/src/routes/audit.ts`
  - `apps/api/src/routes/search.ts`
  - `apps/api/src/routes/tickets.ts`
  - `apps/api/src/routes/dashboard.ts`
  - Symbols / routes: A cross-tenant admin membership widens admin scope to orgs where the user is only a client/member
- What is happening: NEW at 6b7aa1a5: requireOrgAccess treats any approved cross-tenant role as org-agnostic and leaves req.orgId null when no active/query org is supplied (middleware/org-access.ts:140-146). requireAdmin only pins the request when orgScope.explicit is true (middleware/admin.ts:49-58), and resolveAdminTenantScope then builds orgIds from EVERY approved membership (lib/admin-scope.ts:63-74), not only admin orgs. A user who is `admin` in org A and `client_user` in org B therefore passes requireAdmin with no explicit org and gets orgIds=[A,B]; audit list/export (routes/audit.ts:28-37), dashboard/business-os aggregates, global search (routes/search.ts:80-108) and tickets bulk (routes/tickets.ts:613-623) all operate on B as well. Reproduce by omitting ?organization_id and the mct_active_org cookie for such a two-org user.
- Why it matters: This is a new issue at this commit; the verification note gives the exact code path and reachability.
- User / business impact: A serious authorization, confidentiality or release-integrity issue that should be fixed before broad rollout.
- Security / privacy / reliability impact: A serious authorization, confidentiality or release-integrity issue that should be fixed before broad rollout.
- Recommended fix: Compute admin orgIds from memberships whose role key is in CROSS_TENANT_KEYS (or require is_super_admin for unpinned admin surfaces), and deny unpinned admin requests for non-super admins when the org list is empty. Add a two-org regression test for audit/search/dashboard/tickets bulk.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `MT-P1-005` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: open
- Endpoint / data path: GET /api/v1/audit, /dashboard/summary, /search, POST /api/v1/tickets/bulk
- Attack path: User has admin in org A and client_user in org B -> omits ?organization_id and the mct_active_org cookie -> requireOrgAccess returns platformAdmin with orgId=null -> audit/dashboard/search/tickets-bulk include B.

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Admin-in-A/client-in-B reads B audit + search data | P1 | Medium | High | MT-P1-005 | Scope to admin orgs |
| Bulk ticket write across client-role org | P1 | Medium | High | MT-P1-005 | Same |
| Impersonation log lost on insert failure | P2 | Low | High | MT-P2-005 | Durable outbox |
| Conditional filters fail open if gate skipped | P2 | Low | High | MT-P2-002 | Mandatory helper |

## Recommendations

### Immediate / Release Blocking

- Fix MT-P1-005 before broad rollout; add a two-org regression test.

### This Week

- Make resolveAdminTenantScope return only orgs where the caller holds an admin role, or require is_super_admin for unpinned admin surfaces.
- Make impersonation logging durable.

### This Month

- Continue migrating conditional filters to applyResolvedOrg.

### Later / Platform Evolution

- Grow the isolation matrix tests.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Filter admin-scope orgIds by role key | Stops B data exposure | lib/admin-scope.ts:63-74 | Two-org unit test |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| MT-P2-002: By-id org filters are conditional, so they fail open if the org gate is not reached | P2 | API principal engineer | M | none |
| MT-P2-005: Platform-admin cross-tenant access is role-key based, broad, and unalerted | P2 | Platform lead + security | M | none |
| MT-P3-001: No automated cross-tenant isolation regression suite for application-layer scoping | P3 | QA / API team | S | none |
| MT-P1-005: A cross-tenant admin membership widens admin scope to orgs where the user is only a client/member | P1 | API platform / security | M | none |

## Suggested Tests

- User admin in A + client_user in B, no org selector: GET /audit must not include B rows.
- Same user POST /tickets/bulk with a B ticket id: must be skipped/403.
- Same user GET /search must not return B tickets/projects/users.
- User admin in A + no B membership: must not see B (already passes).

## Suggested Documentation Updates

- Document the multi-org rule: admin scope equals admin-role orgs, not all memberships.
- Add the two-org case to the isolation test matrix.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Are cross-tenant admins expected to see client-membership orgs? | Determines intended scope | Security/product decision |
| Can memberships hold different roles per org in production? | Attack feasibility | Membership model / data sample |

## Appendix

- Prior run: `mainecybertech-20261014-0033-full-main-7dd0402` (findings re-verified by area).
- Worktree: `/tmp/opencode/mct-nov-g1` at `origin/main` (6b7aa1a5505d4f75b334b36e9e87737cd98e589c).
- Commands: `git diff --stat 7dd0402..6b7aa1a5`, `git diff --name-only`, targeted `rg`/`sed` over the cited paths.
- Counts: 15 findings; 11 verified-fixed, 3 partially-fixed, 1 open, 0 regressed, 1 new.
- Execution limitation: application dependencies were not installed in the read-only worktree; runtime tests and database migrations were **not run** (marked not reproducible in this environment).

