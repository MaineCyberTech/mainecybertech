# Admin Console Abuse Case Audit

## Audit Metadata

- Audit name: repo-deep-dive (mainecybertech)
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `github.com/MaineCyberTech/mainecybertech`
- Branch: `main`
- Commit SHA: `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03
- Auditor: OpenCode subagent (read-only)
- Area code: ADMIN
- Output path: `docs/audits/repo-deep-dive/mainecybertech-20261103-0748-full-main-6b7aa1a/26_admin_console_abuse_case_audit.md`
- Scope limitations: repository-only verification; no production database or GitHub environment secrets were read. Prior-run claims were re-checked against this commit, not assumed.

## Scope

Re-verified 16 prior ADMIN findings and reviewed the Nov 3 admin-adjacent changes: proposal client decisions, organization provisioning, export auditing, bulk/destructive operations and billing portal access.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `apps/api/src/routes/proposals.ts:797-868` | route | new client-decision | Read at 6b7aa1a5 |
| `apps/api/src/routes/organizations.ts:64,329` | route | provisioning | Read at 6b7aa1a5 |
| `apps/api/src/lib/delete-confirm.ts` | lib | typed confirm | Read at 6b7aa1a5 |
| `apps/api/src/routes/audit.ts:174-195` | route | unaudited export | Read at 6b7aa1a5 |
| `apps/api/src/services/approvals.ts:80-84` | service | self-approval block | Read at 6b7aa1a5 |
| `docs/ADMIN_BULK_OPERATIONS.md:76` | docs | super-admin claim | Read at 6b7aa1a5 |

## Verification Performed

| Evidence / claim | Method | Result |
|---|---|---|
| All 16 prior ADMIN findings | Read the cited symbols/routes at `6b7aa1a5` | 15 verified-fixed, 1 partially-fixed, 0 open, 0 regressed |
| Nov 3 diff (`7dd0402..6b7aa1a5`) | `git diff --stat` plus targeted review of area files | 137 commits / 414 files changed overall; only area-relevant files were read line-by-line |
| New ADMIN issues | Attack-path/static review of changed routes and migrations | 2 new findings |
| Build/CI claims | File inspection only (dependencies not installed in the read-only worktree) | Marked `not run` where execution was impossible |

## Executive Summary

Admin controls remain largely mature: destructive deletes require typed confirmation, bulk operations have dry-run/confirmation and rate limits, approvals block self-approval, and billing portal access is restricted. One new P2 abuse case was found: the new proposal client-decision endpoint can be used by internal staff to record and overwrite a client acceptance/decline. A new P3 records that organization provisioning is weaker than its documented super-admin gate and the plain create route is unthrottled. Export auditing remains partial (four un-audited exports, including onboarding).

Counts: **18** findings total - 15 verified-fixed, 1 partially-fixed, 2 open (all new), 0 regressed, **2 new**. Severity: P0 0, P1 3, P2 10, P3 5.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|---|---|---|---|---|---|
| Proposal client decision | routes/proposals.ts:797-868 | record accept/decline | staff can forge/overwrite | P2 | ADMIN-P2-010 |
| Organization onboard/create | routes/organizations.ts:64,329 | tenant provisioning | weaker than docs; create unthrottled | P3 | ADMIN-P3-005 |
| Exports | audit/satisfaction/forms/onboarding | data egress | unaudited | P2 | ADMIN-P2-001 |
| Approvals | services/approvals.ts | decision flow | self-approval blocked | Low | ADMIN-P2-007 |
| Billing portal | routes/billing.ts:683-740 | payment settings | contact/permission | Low | ADMIN-P2-009 |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Admin gate | 3 | `requireAdmin + admin-scope` | multi-org variant MT-P1-005 | Scope admin orgs |
| Impersonation review | 4 | `audit.ts + metrics` | reviewable/alerted | No action |
| Role assignment | 4 | `assertCanAssignRole` | strong | No action |
| Sensitive exports | 2 | `4 of 13 exports unaudited` | partial | ADMIN-P2-001 |
| Destructive deletes | 4 | `delete-confirm + audit` | strong | No action |
| Bulk operations | 4 | `dry-run + confirm + rate limit` | strong | No action |
| Approvals | 4 | `separation of duties` | strong | No action |
| Billing portal | 4 | `billing contact/permission` | strong | No action |
| Proposal decisions | 2 | `client-decision endpoint` | forgeable/overwritable | ADMIN-P2-010 |

## Detailed Review

### Item: Admin gate

- Evidence: `requireAdmin + admin-scope`
- What it does: Admin gate control/implementation.
- Current controls: score 3/5 at this commit.
- Missing controls / gap: multi-org variant MT-P1-005.
- Recommended improvement: Scope admin orgs.

### Item: Impersonation review

- Evidence: `audit.ts + metrics`
- What it does: Impersonation review control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: reviewable/alerted.
- Recommended improvement: No action.

### Item: Role assignment

- Evidence: `assertCanAssignRole`
- What it does: Role assignment control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: strong.
- Recommended improvement: No action.

### Item: Sensitive exports

- Evidence: `4 of 13 exports unaudited`
- What it does: Sensitive exports control/implementation.
- Current controls: score 2/5 at this commit.
- Missing controls / gap: partial.
- Recommended improvement: ADMIN-P2-001.

### Item: Destructive deletes

- Evidence: `delete-confirm + audit`
- What it does: Destructive deletes control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: strong.
- Recommended improvement: No action.

### Item: Bulk operations

- Evidence: `dry-run + confirm + rate limit`
- What it does: Bulk operations control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: strong.
- Recommended improvement: No action.

### Item: Approvals

- Evidence: `separation of duties`
- What it does: Approvals control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: strong.
- Recommended improvement: No action.

### Item: Billing portal

- Evidence: `billing contact/permission`
- What it does: Billing portal control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: strong.
- Recommended improvement: No action.

### Item: Proposal decisions

- Evidence: `client-decision endpoint`
- What it does: Proposal decisions control/implementation.
- Current controls: score 2/5 at this commit.
- Missing controls / gap: forgeable/overwritable.
- Recommended improvement: ADMIN-P2-010.

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|---|---|---|---|---|---|---|
| ADMIN-001 | Admin gate | `requireAdmin + admin-scope` | score 3/5 | multi-org variant MT-P1-005 | P3 | Scope admin orgs |
| ADMIN-002 | Impersonation review | `audit.ts + metrics` | score 4/5 | reviewable/alerted | P3 | No action |
| ADMIN-003 | Role assignment | `assertCanAssignRole` | score 4/5 | strong | P3 | No action |
| ADMIN-004 | Sensitive exports | `4 of 13 exports unaudited` | score 2/5 | partial | P2 | ADMIN-P2-001 |
| ADMIN-005 | Destructive deletes | `delete-confirm + audit` | score 4/5 | strong | P3 | No action |
| ADMIN-006 | Bulk operations | `dry-run + confirm + rate limit` | score 4/5 | strong | P3 | No action |
| ADMIN-007 | Approvals | `separation of duties` | score 4/5 | strong | P3 | No action |
| ADMIN-008 | Billing portal | `billing contact/permission` | score 4/5 | strong | P3 | No action |
| ADMIN-009 | Proposal decisions | `client-decision endpoint` | score 2/5 | forgeable/overwritable | P2 | ADMIN-P2-010 |

## Findings

### Finding ID: ADMIN-P1-001 - Org-agnostic `requireAdmin` lets a tenant admin read other tenants' admin data

- Severity: P1
- Confidence: High
- Area: ADMIN
- Evidence:
  - `middleware/admin.ts`
  - `lib/admin-scope.ts`
  - Symbols / routes: Org-agnostic `requireAdmin` lets a tenant admin read other tenants' admin data
- What is happening: re-verified at 6b7aa1a5: middleware/admin.ts:22-64 pins a non-super admin when orgScope.explicit; lib/admin-scope.ts:29-75 gates allTenants on is_super_admin + cross-tenant membership; audit/dashboard/search/store consumers apply the scope predicate. The multi-org membership variant is tracked separately as MT-P1-005.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ADMIN-P1-001` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ADMIN-P1-002 - Impersonation/cross-tenant access is logged but not reviewable or alerted

- Severity: P1
- Confidence: High
- Area: ADMIN
- Evidence:
  - `routes/audit.ts`
  - `services/impersonation.ts`
  - `prometheus.rules.yml`
  - Symbols / routes: Impersonation/cross-tenant access is logged but not reviewable or alerted
- What is happening: re-verified at 6b7aa1a5: routes/audit.ts:126-158 review API + :174-195 export behind allTenants; services/impersonation.ts records every cross-tenant entry; metric + Prometheus alerts remain (prometheus.rules.yml:102-120). Residual (separate row): the impersonation export is still un-audited - ADMIN-P2-001.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ADMIN-P1-002` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ADMIN-P1-003 - Role assignment paths let a delegated user-manager grant cross-tenant admin roles (self-escalation)

- Severity: P1
- Confidence: High
- Area: ADMIN
- Evidence:
  - `lib/role-assignment.ts`
  - `memberships.ts`
  - `bulk.ts`
  - `organizations.ts`
  - `users.ts`
  - `role-assignment.test.ts`
  - Symbols / routes: Role assignment paths let a delegated user-manager grant cross-tenant admin roles (self-escalation)
- What is happening: re-verified at 6b7aa1a5: shared assertCanAssignRole (lib/role-assignment.ts:20-42) blocks cross-tenant role grants and self-role changes on all four paths (memberships.ts:90-91,150-161; bulk.ts:65-66; organizations.ts:93; users.ts:491-492); role-assignment.test.ts.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ADMIN-P1-003` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ADMIN-P2-001 - Sensitive admin exports are not audit-logged

- Severity: P2
- Confidence: High
- Area: ADMIN
- Evidence:
  - `routes/audit.ts`
  - `routes/satisfaction-pulse-widget.ts`
  - `routes/dynamic-client-forms-builder.ts`
  - `routes/client-onboarding-command-center.ts`
  - Symbols / routes: Sensitive admin exports are not audit-logged
- What is happening: re-verified at 6b7aa1a5: approvals, assets, audit, domain-monitors, findings, projects, proposals, tickets and users exports still write an export audit event. Residual grew to four un-audited sensitive exports: routes/audit.ts:174-195 (/audit/impersonation/export, the most sensitive), routes/satisfaction-pulse-widget.ts:87-112, routes/dynamic-client-forms-builder.ts:86-108, and routes/client-onboarding-command-center.ts:72-107 (client names/domains).
- Why it matters: Part of the prior fix is present, but the residual described in the verification note is still reproducible.
- User / business impact: A material hardening or correctness gap that should be scheduled this month.
- Security / privacy / reliability impact: A material hardening or correctness gap that should be scheduled this month.
- Recommended fix: Close the residual described in the verification note and add a regression test that fails on the prior behavior.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ADMIN-P2-001` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: partially-fixed
- Endpoint / data path: see evidence
- Attack path: none identified beyond the documented control gap.

### Finding ID: ADMIN-P2-002 - Destructive deletes are inconsistently confirmation-gated and org delete is unrecoverable

- Severity: P2
- Confidence: High
- Area: ADMIN
- Evidence:
  - `lib/delete-confirm.ts`
  - `routes/organizations.ts`
  - Symbols / routes: Destructive deletes are inconsistently confirmation-gated and org delete is unrecoverable
- What is happening: re-verified at 6b7aa1a5: lib/delete-confirm.ts:6-60 assertDeleteConfirmed + assertOrgDeleteConfirmed (typed slug); routes/organizations.ts:452 requires the slug on DELETE and records a cascade summary; domain deletes require confirm (:606).
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ADMIN-P2-002` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ADMIN-P2-003 - Bulk document operations apply without a per-row preview or elevation guardrail

- Severity: P2
- Confidence: High
- Area: ADMIN
- Evidence:
  - `routes/documents.ts`
  - Symbols / routes: Bulk document operations apply without a per-row preview or elevation guardrail
- What is happening: re-verified at 6b7aa1a5: routes/documents.ts bulk endpoints support dryRun previews with per-field diffs (:771-775, :842-844) and visibility changes require an explicit confirm:true (:849-858); bulk operations remain rate-limited + audited.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ADMIN-P2-003` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ADMIN-P2-004 - Bulk invite creates pre-confirmed auth accounts (and org onboarding auto-approves admin)

- Severity: P2
- Confidence: High
- Area: ADMIN
- Evidence:
  - `routes/bulk.ts`
  - `routes/organizations.ts`
  - Symbols / routes: Bulk invite creates pre-confirmed auth accounts (and org onboarding auto-approves admin)
- What is happening: re-verified at 6b7aa1a5: routes/bulk.ts:163 uses inviteUserByEmail (no pre-confirmed accounts); routes/organizations.ts:127-140 creates the first admin membership as pending for platform approval.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ADMIN-P2-004` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ADMIN-P2-005 - No rate limiting specific to expensive/destructive admin operations

- Severity: P2
- Confidence: High
- Area: ADMIN
- Evidence:
  - `middleware/rate-limit.ts`
  - `bulk.ts`
  - `documents.ts`
  - `organizations.ts`
  - `tickets.ts`
  - Symbols / routes: No rate limiting specific to expensive/destructive admin operations
- What is happening: re-verified at 6b7aa1a5: rateLimitAdminOps (middleware/rate-limit.ts:101-118) is applied to audit exports (:74,174), bulk invite (bulk.ts:44), documents bulk (documents.ts:761,822), org onboard (organizations.ts:64), org delete (organizations.ts:429) and tickets bulk (tickets.ts:613). The plain POST /organizations create is still unthrottled; that is recorded in ADMIN-P3-005 rather than reopening this row.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ADMIN-P2-005` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ADMIN-P2-006 - No undo/soft-delete is exercised despite the schema supporting it

- Severity: P2
- Confidence: High
- Area: ADMIN
- Evidence:
  - `5302432_drop_unused_soft_delete_columns.sql`
  - `docs/ADMIN_FEATURES.md`
  - `docs/ROLLBACK_PROCEDURES.md`
  - Symbols / routes: No undo/soft-delete is exercised despite the schema supporting it
- What is happening: re-verified at 6b7aa1a5: migration 5302432_drop_unused_soft_delete_columns.sql removes the unhonoured deleted_at/deleted_by columns; docs/ADMIN_FEATURES.md:451-452 and docs/ROLLBACK_PROCEDURES.md:66-82 document the hard-delete decision and operator-only recovery.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ADMIN-P2-006` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ADMIN-P2-007 - Approval flows allow self-approval and cancellation of already-approved requests

- Severity: P2
- Confidence: High
- Area: ADMIN
- Evidence:
  - `services/approvals.ts`
  - Symbols / routes: Approval flows allow self-approval and cancellation of already-approved requests
- What is happening: re-verified at 6b7aa1a5: services/approvals.ts:80-84 rejects self-approval and :139-142 self-rejection; :195-202 only allows cancelling pending requests.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ADMIN-P2-007` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ADMIN-P2-008 - Destructive deletes are not consistently audit-logged

- Severity: P2
- Confidence: High
- Area: ADMIN
- Evidence:
  - `services/client-onboarding-command-center.ts`
  - `services/dynamic-client-forms-builder.ts`
  - `destructive-delete-guard.test.ts`
  - Symbols / routes: Destructive deletes are not consistently audit-logged
- What is happening: re-verified at 6b7aa1a5: the previously un-audited DELETE handlers route through audited services (services/client-onboarding-command-center.ts, services/dynamic-client-forms-builder.ts) or log inline; destructive-delete-guard.test.ts fails new deletes without confirm/audit.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ADMIN-P2-008` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ADMIN-P2-009 - Any org member can open the Stripe billing portal for their org (no billing-contact check)

- Severity: P2
- Confidence: High
- Area: ADMIN
- Evidence:
  - `routes/billing.ts`
  - Symbols / routes: Any org member can open the Stripe billing portal for their org (no billing-contact check)
- What is happening: re-verified at 6b7aa1a5: routes/billing.ts:683-720 assertBillingPortalAccess requires an approved is_billing_contact membership or billing:manage (admin/super_admin bypass); enforced on POST /billing/create-portal-session (:722-740).
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ADMIN-P2-009` at `6b7aa1a5`.
- Owner suggestion: Billing / API platform
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ADMIN-P3-001 - Web admin gate accepts a broader role set than the API `requireAdmin` (guard/API divergence)

- Severity: P3
- Confidence: High
- Area: ADMIN
- Evidence:
  - `apps/web/lib/auth/admin.ts`
  - `apps/web/lib/roles.ts`
  - Symbols / routes: Web admin gate accepts a broader role set than the API `requireAdmin` (guard/API divergence)
- What is happening: re-verified at 6b7aa1a5: apps/web/lib/auth/admin.ts uses isCrossTenantKey from the shared @mct/sdk/role-keys module (apps/web/lib/roles.ts mirror), so the web gate and API requireAdmin accept the same role set.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ADMIN-P3-001` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ADMIN-P3-002 - Active-org cookie setter performs no server-side authorization

- Severity: P3
- Confidence: High
- Area: ADMIN
- Evidence:
  - `apps/web/lib/org-actions.ts`
  - Symbols / routes: Active-org cookie setter performs no server-side authorization
- What is happening: re-verified at 6b7aa1a5: apps/web/lib/org-actions.ts:22-40 setActiveOrg verifies an approved membership (or platform admin) before writing the cookie.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ADMIN-P3-002` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ADMIN-P3-003 - Admin global search and dashboard expose global resource names/counts to any admin

- Severity: P3
- Confidence: High
- Area: ADMIN
- Evidence:
  - `routes/search.ts`
  - `routes/dashboard.ts`
  - Symbols / routes: Admin global search and dashboard expose global resource names/counts to any admin
- What is happening: re-verified at 6b7aa1a5: routes/search.ts:78-260 scopes global results to the caller's orgs for non-cross-tenant admins; routes/dashboard.ts:16-50 applies applyOrgScope to every count.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ADMIN-P3-003` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ADMIN-P3-004 - Global store catalog is mutable by any tenant admin

- Severity: P3
- Confidence: High
- Area: ADMIN
- Evidence:
  - `routes/store/catalog.ts`
  - Symbols / routes: Global store catalog is mutable by any tenant admin
- What is happening: re-verified at 6b7aa1a5: routes/store/catalog.ts:175-200 pins a single-org admin's catalog writes to their org (global organization_id NULL rows require a genuine cross-tenant admin, gated by resolveAdminTenantScope); reads are org-filtered (:54-60).
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ADMIN-P3-004` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ADMIN-P2-010 - Proposal client decisions can be recorded or overwritten by internal staff (no client-role or immutability check)

- Severity: P2
- Confidence: High
- Area: ADMIN
- Evidence:
  - `apps/api/src/routes/proposals.ts`
  - `apps/api/src/validators/proposals.ts`
  - Symbols / routes: Proposal client decisions can be recorded or overwritten by internal staff (no client-role or immutability check)
- What is happening: NEW at 6b7aa1a5: POST /proposals/:id/client-decision (apps/api/src/routes/proposals.ts:797-868) is gated only by requirePermission('proposals','edit'). It never checks isClientMember or otherwise requires a client identity, does not use the required `organizationId` body field, and unconditionally overwrites metadata.clientDecision/clientDecidedBy/clientDecisionNotes on every call while status stays 'approved'. Any internal role holding proposals:edit (admin, project-manager, technician) can therefore record a client acceptance/decline, and a second caller can flip an existing decision.
- Why it matters: This is a new issue at this commit; the verification note gives the exact code path and reachability.
- User / business impact: A material hardening or correctness gap that should be scheduled this month.
- Security / privacy / reliability impact: A material hardening or correctness gap that should be scheduled this month.
- Recommended fix: Require a client-role membership (or a dedicated client decision token) for POST /proposals/:id/client-decision, enforce a one-time decision (reject if metadata.clientDecision exists), and use the body organizationId in the scope assertion. Add staff-forgery and double-decision tests.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ADMIN-P2-010` at `6b7aa1a5`.
- Owner suggestion: API platform / product
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: open
- Endpoint / data path: POST /api/v1/proposals/:id/client-decision
- Attack path: Internal staff with proposals:edit -> POST /proposals/:id/client-decision -> metadata records an acceptance/decline the client never made (and can overwrite a prior decision).

### Finding ID: ADMIN-P3-005 - Organization create/onboard authorization is weaker than its documented super-admin gate, and plain create is unthrottled

- Severity: P3
- Confidence: Medium
- Area: ADMIN
- Evidence:
  - `apps/api/src/routes/organizations.ts`
  - `apps/api/src/validators/organization.ts`
  - `apps/api/src/lib/role-assignment.ts`
  - `docs/ADMIN_BULK_OPERATIONS.md`
  - Symbols / routes: Organization create/onboard authorization is weaker than its documented super-admin gate, and plain create is unthrottled
- What is happening: NEW at 6b7aa1a5: routes/organizations.ts:64 mounts only requireAdmin for onboarding, and the role check at :93 delegates to assertCanAssignRole, which returns early for every non-cross-tenant role (lib/role-assignment.ts:26-28). onboardSchema defaults adminRoleKey to 'client_admin' (validators/organization.ts:42), so the documented 'requires a platform super admin' claim at docs/ADMIN_BULK_OPERATIONS.md:76 holds only when the caller supplies a cross-tenant role. POST /organizations (organizations.ts:329) is also requireAdmin-only and has no rateLimitAdminOps, unlike /onboard.
- Why it matters: This is a new issue at this commit; the verification note gives the exact code path and reachability.
- User / business impact: A low-risk cleanup, consistency or documentation gap.
- Security / privacy / reliability impact: A low-risk cleanup, consistency or documentation gap.
- Recommended fix: Either require profiles.is_super_admin for both provisioning routes, or correct the docs and add rateLimitAdminOps to POST /organizations; add negative tests for a plain admin caller.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ADMIN-P3-005` at `6b7aa1a5`.
- Owner suggestion: Platform admin / API platform
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: open
- Endpoint / data path: POST /api/v1/organizations/onboard and POST /api/v1/organizations
- Attack path: none identified beyond the documented control gap.

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Forged client acceptance/decline on proposals | P2 | Medium | High | ADMIN-P2-010 | Client-role check + immutable decision |
| Sensitive exports leave no audit trail | P2 | Medium | Medium | ADMIN-P2-001 | Log every export |
| Tenant provisioning weaker than documented | P3 | Low | Medium | ADMIN-P3-005 | Super-admin gate |

## Recommendations

### Immediate / Release Blocking

- None beyond the P1 findings listed above.

### This Week

- Require a client identity (or a client-issued token) and one-time immutability for client decisions.
- Audit all exports, including onboarding.

### This Month

- Require super-admin for organization provisioning or fix the docs; rate-limit POST /organizations.

### Later / Platform Evolution

- Keep typed-delete and billing controls.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Add logAuditEvent to the four un-audited exports | Closes ADMIN-P2-001 residual | routes/*.ts | Audit row exists |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| ADMIN-P2-001: Sensitive admin exports are not audit-logged | P2 | API platform / security | M | none |
| ADMIN-P2-010: Proposal client decisions can be recorded or overwritten by internal staff (no client-role or immutability check) | P2 | API platform / product | M | none |
| ADMIN-P3-005: Organization create/onboard authorization is weaker than its documented super-admin gate, and plain create is unthrottled | P3 | Platform admin / API platform | S | none |

## Suggested Tests

- Internal staff (technician/admin) POST client-decision must be rejected or require explicit client confirmation.
- A second client-decision call must return 409 once decided.
- Every export route writes an audit event.
- POST /organizations without super-admin (if policy is super-admin) returns 403; rate limit applies.

## Suggested Documentation Updates

- Reconcile ADMIN_BULK_OPERATIONS.md:76 with the code; document who may provision tenants.
- Document proposal decision authority and immutability.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Should internal staff ever record a client decision? | Scope of ADMIN-P2-010 | Product/legal |
| Is tenant creation a platform-super-admin action? | ADMIN-P3-005 remediation | Product/security |

## Appendix

- Prior run: `mainecybertech-20261014-0033-full-main-7dd0402` (findings re-verified by area).
- Worktree: `/tmp/opencode/mct-nov-g1` at `origin/main` (6b7aa1a5505d4f75b334b36e9e87737cd98e589c).
- Commands: `git diff --stat 7dd0402..6b7aa1a5`, `git diff --name-only`, targeted `rg`/`sed` over the cited paths.
- Counts: 18 findings; 15 verified-fixed, 1 partially-fixed, 2 open, 0 regressed, 2 new.
- Execution limitation: application dependencies were not installed in the read-only worktree; runtime tests and database migrations were **not run** (marked not reproducible in this environment).

