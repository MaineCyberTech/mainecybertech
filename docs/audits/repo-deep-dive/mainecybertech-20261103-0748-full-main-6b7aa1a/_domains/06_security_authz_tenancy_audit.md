# Security, Authorization, and Tenancy Audit

## Audit Metadata

- Audit name: repo-deep-dive (mainecybertech)
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `github.com/MaineCyberTech/mainecybertech`
- Branch: `main`
- Commit SHA: `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03
- Auditor: OpenCode subagent (read-only)
- Area code: SEC
- Output path: `docs/audits/repo-deep-dive/mainecybertech-20261103-0748-full-main-6b7aa1a/06_security_authz_tenancy_audit.md`
- Scope limitations: repository-only verification; no production database or GitHub environment secrets were read. Prior-run claims were re-checked against this commit, not assumed.

## Scope

Re-verified all 41 prior SEC findings at 6b7aa1a, reviewed the Nov 3 changes (client-visibility helper, AI triage grant, password re-auth, CSRF unsubscribe exemption, final/* gates, rate-limit envelope), and ran targeted attack-path analysis on the new portal visibility code. No production systems were contacted.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `apps/api/src/middleware/` | middleware | authn/authz gates | Read at 6b7aa1a5 |
| `apps/api/src/lib/client-visibility.ts` | helper | new portal visibility control | Read at 6b7aa1a5 |
| `supabase/migrations/5302463_client_portal_ai_and_visibility.sql` | migration | AI grant + normalization | Read at 6b7aa1a5 |
| `apps/api/src/routes/{approvals,assets,findings,proposals,file-requests,ai}.ts` | routes | new gaps | Read at 6b7aa1a5 |
| `apps/api/src/config/env.ts` | config | CORS/Turnstile/field key | Read at 6b7aa1a5 |
| `scripts/scan-secrets.sh` | scanner | no secret echo | Read at 6b7aa1a5 |

## Verification Performed

| Evidence / claim | Method | Result |
|---|---|---|
| All 41 prior SEC findings | Read the cited symbols/routes at `6b7aa1a5` | 38 verified-fixed, 3 partially-fixed, 0 open, 0 regressed |
| Nov 3 diff (`7dd0402..6b7aa1a5`) | `git diff --stat` plus targeted review of area files | 137 commits / 414 files changed overall; only area-relevant files were read line-by-line |
| New SEC issues | Attack-path/static review of changed routes and migrations | 5 new findings |
| Build/CI claims | File inspection only (dependencies not installed in the read-only worktree) | Marked `not run` where execution was impossible |

## Executive Summary

The security baseline is strong and stable: 38 of 41 prior findings are still fixed, including role assignment, PII encryption fail-closed, admin scoping, redirect allowlisting, API-key scoping/expiry, SSRF pinning, MFA, CORS and RLS startup checks. Three priors remain partial by design (plaintext profile mirror, per-module RLS rollout, web UX gate). The new client-visibility work introduced a P1 confidentiality gap: detail endpoints hide internal comments but the sibling comments/timeline endpoints do not. Four further gaps are new: file-request upload subroutes skip parent visibility, the AI grant opens all AI drafts to client roles, the visibility helper fails open, and GET /ai/triage remains ungated.

Counts: **46** findings total - 38 verified-fixed, 3 partially-fixed, 5 open (all new), 0 regressed, **5 new**. Severity: P0 0, P1 11, P2 20, P3 15.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|---|---|---|---|---|---|
| Client visibility helper | apps/api/src/lib/client-visibility.ts | filter internal rows for client roles | new, partial coverage | P1 | SEC-P1-011 |
| Comments/timeline side endpoints | approvals/assets/findings/proposals routes | internal notes | not visibility-filtered | P1 | SEC-P1-011 |
| File-request uploads | routes/file-requests.ts:351-415 | download internal attachments | org-only check | P2 | SEC-P2-019 |
| AI drafts | routes/ai.ts:537-576 + 5302463 | AI output store | clients granted ai:view | P2 | SEC-P2-020 |
| AI triage list | routes/ai.ts:320-341 | raw triage descriptions | no ai:view gate | P3 | SEC-P3-015 |
| Visibility failure mode | client-visibility.ts:64,94-99 | fail-open + key exemption | P3 | SEC-P3-014 |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Auth provider | 4 | `auth middleware + Supabase fallback` | strong | No action |
| Session tokens/cookies | 4 | `JWT verify, cookie flags` | strong | No action |
| JWT validation | 4 | `middleware/auth.ts` | pinned HS256 + Supabase fallback | No action |
| CSRF/CORS | 4 | `csrf.ts/app.ts` | allowlist; unsubscribe token exemption | No action |
| Rate limits | 4 | `middleware/rate-limit.ts` | account/IP keys | No action |
| Security headers | 4 | `security-headers.ts` | tight CSP; Caddy cosmetic residual | Optional cleanup |
| Input/output validation | 4 | `zod + sanitizers` | strong | No action |
| File handling | 3 | `file-requests.ts` | visibility gap on nested uploads | SEC-P2-019 |
| API permissions | 3 | `requirePermission + catalog` | read-routes gap (ACM-P2-009) | Gate reads |
| Admin permissions | 4 | `requireAdmin + admin-scope` | multi-org variant (MT-P1-005) | Scope admin orgs |
| Tenant isolation | 4 | `requireOrgAccess + scope helpers` | multi-org variant | MT-P1-005 |
| RLS policies | 3 | `5302461/5302463 + rollout` | per-module allowlist unverifiable | Operator evidence |

## Detailed Review

### Item: Auth provider

- Evidence: `auth middleware + Supabase fallback`
- What it does: Auth provider control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: strong.
- Recommended improvement: No action.

### Item: Session tokens/cookies

- Evidence: `JWT verify, cookie flags`
- What it does: Session tokens/cookies control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: strong.
- Recommended improvement: No action.

### Item: JWT validation

- Evidence: `middleware/auth.ts`
- What it does: JWT validation control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: pinned HS256 + Supabase fallback.
- Recommended improvement: No action.

### Item: CSRF/CORS

- Evidence: `csrf.ts/app.ts`
- What it does: CSRF/CORS control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: allowlist; unsubscribe token exemption.
- Recommended improvement: No action.

### Item: Rate limits

- Evidence: `middleware/rate-limit.ts`
- What it does: Rate limits control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: account/IP keys.
- Recommended improvement: No action.

### Item: Security headers

- Evidence: `security-headers.ts`
- What it does: Security headers control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: tight CSP; Caddy cosmetic residual.
- Recommended improvement: Optional cleanup.

### Item: Input/output validation

- Evidence: `zod + sanitizers`
- What it does: Input/output validation control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: strong.
- Recommended improvement: No action.

### Item: File handling

- Evidence: `file-requests.ts`
- What it does: File handling control/implementation.
- Current controls: score 3/5 at this commit.
- Missing controls / gap: visibility gap on nested uploads.
- Recommended improvement: SEC-P2-019.

### Item: API permissions

- Evidence: `requirePermission + catalog`
- What it does: API permissions control/implementation.
- Current controls: score 3/5 at this commit.
- Missing controls / gap: read-routes gap (ACM-P2-009).
- Recommended improvement: Gate reads.

### Item: Admin permissions

- Evidence: `requireAdmin + admin-scope`
- What it does: Admin permissions control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: multi-org variant (MT-P1-005).
- Recommended improvement: Scope admin orgs.

### Item: Tenant isolation

- Evidence: `requireOrgAccess + scope helpers`
- What it does: Tenant isolation control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: multi-org variant.
- Recommended improvement: MT-P1-005.

### Item: RLS policies

- Evidence: `5302461/5302463 + rollout`
- What it does: RLS policies control/implementation.
- Current controls: score 3/5 at this commit.
- Missing controls / gap: per-module allowlist unverifiable.
- Recommended improvement: Operator evidence.

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|---|---|---|---|---|---|---|
| SEC-001 | Auth provider | `auth middleware + Supabase fallback` | score 4/5 | strong | P3 | No action |
| SEC-002 | Session tokens/cookies | `JWT verify, cookie flags` | score 4/5 | strong | P3 | No action |
| SEC-003 | JWT validation | `middleware/auth.ts` | score 4/5 | pinned HS256 + Supabase fallback | P3 | No action |
| SEC-004 | CSRF/CORS | `csrf.ts/app.ts` | score 4/5 | allowlist; unsubscribe token exemption | P3 | No action |
| SEC-005 | Rate limits | `middleware/rate-limit.ts` | score 4/5 | account/IP keys | P3 | No action |
| SEC-006 | Security headers | `security-headers.ts` | score 4/5 | tight CSP; Caddy cosmetic residual | P3 | Optional cleanup |
| SEC-007 | Input/output validation | `zod + sanitizers` | score 4/5 | strong | P3 | No action |
| SEC-008 | File handling | `file-requests.ts` | score 3/5 | visibility gap on nested uploads | P3 | SEC-P2-019 |
| SEC-009 | API permissions | `requirePermission + catalog` | score 3/5 | read-routes gap (ACM-P2-009) | P3 | Gate reads |
| SEC-010 | Admin permissions | `requireAdmin + admin-scope` | score 4/5 | multi-org variant (MT-P1-005) | P3 | Scope admin orgs |
| SEC-011 | Tenant isolation | `requireOrgAccess + scope helpers` | score 4/5 | multi-org variant | P3 | MT-P1-005 |
| SEC-012 | RLS policies | `5302461/5302463 + rollout` | score 3/5 | per-module allowlist unverifiable | P3 | Operator evidence |

## Findings

### Finding ID: SEC-P1-001 - super_admin role can be granted through membership/onboarding/bulk-invite APIs without the /users/:id/role guard

- Severity: P1
- Confidence: High
- Area: SEC
- Evidence:
  - `apps/api/src/lib/role-assignment.ts`
  - `routes/memberships.ts`
  - `routes/bulk.ts`
  - `routes/organizations.ts`
  - `routes/users.ts`
  - Symbols / routes: super_admin role can be granted through membership/onboarding/bulk-invite APIs without the /users/:id/role guard
- What is happening: re-verified at 6b7aa1a5: shared apps/api/src/lib/role-assignment.ts:20-42 (assertCanAssignRole) and :80-89 (resolveRoleKey) gate all four paths - routes/memberships.ts:90-91,150-161, routes/bulk.ts:65-66, routes/organizations.ts:93, routes/users.ts:491-492; the role-assignment test suite covers the matrix.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P1-001` at `6b7aa1a5`.
- Owner suggestion: API principal engineer / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P1-002 - PII field encryption silently degrades to reversible plaintext

- Severity: P1
- Confidence: High
- Area: SEC
- Evidence:
  - `apps/api/src/config/env.ts`
  - `apps/api/src/lib/field-encryption.ts`
  - Symbols / routes: PII field encryption silently degrades to reversible plaintext
- What is happening: re-verified at 6b7aa1a5: apps/api/src/config/env.ts:175-184 refuses production boot without a 32-byte FIELD_ENCRYPTION_KEY (wired at :194-196), and apps/api/src/lib/field-encryption.ts:40-52 throws instead of falling back to `plain:` in production.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P1-002` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P1-003 - Org-agnostic `requireAdmin` lets a tenant admin read other tenants' admin data

- Severity: P1
- Confidence: High
- Area: SEC
- Evidence:
  - `middleware/admin.ts`
  - `lib/admin-scope.ts`
  - Symbols / routes: Org-agnostic `requireAdmin` lets a tenant admin read other tenants' admin data
- What is happening: re-verified at 6b7aa1a5: middleware/admin.ts:22-64 pins a non-super admin to req.orgId when orgScope.explicit, and lib/admin-scope.ts:29-75 only grants the all-tenant view to `is_super_admin` plus a cross-tenant role. The residual multi-org-membership variant is recorded separately as MT-P1-005.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P1-003` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P1-004 - Impersonation/cross-tenant access is logged but not reviewable or alerted

- Severity: P1
- Confidence: High
- Area: SEC
- Evidence:
  - `routes/audit.ts`
  - `services/impersonation.ts`
  - `lib/metrics.ts`
  - `infra/digitalocean/prometheus.rules.yml`
  - Symbols / routes: Impersonation/cross-tenant access is logged but not reviewable or alerted
- What is happening: re-verified at 6b7aa1a5: routes/audit.ts:126-158 (impersonation list) and :174-195 (export) gate on resolveAdminTenantScope().allTenants; services/impersonation.ts records every cross-tenant entry, and lib/metrics.ts:137-140 increments portal_impersonation_events_total (Prometheus rules at infra/digitalocean/prometheus.rules.yml:102-120).
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P1-004` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P1-005 - Low-trust MSP role key composes into a cross-tenant read pivot

- Severity: P1
- Confidence: High
- Area: SEC
- Evidence:
  - `packages/sdk/src/role-keys.ts`
  - `apps/api/src/lib/roles.ts`
  - `middleware/admin.ts`
  - `org-access.ts`
  - `catalog-parity.test.ts`
  - Symbols / routes: Low-trust MSP role key composes into a cross-tenant read pivot
- What is happening: re-verified at 6b7aa1a5: packages/sdk/src/role-keys.ts splits CROSS_TENANT_KEYS [super_admin, admin] from ELEVATED_TENANT_KEYS (six MSP roles); apps/api/src/lib/roles.ts re-exports the split, and middleware/admin.ts / org-access.ts consume isCrossTenantKey. catalog-parity.test.ts asserts catalog parity.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P1-005` at `6b7aa1a5`.
- Owner suggestion: CTO/security lead + API team
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P1-006 - Caller-controlled reset redirect composes into an account-takeover assist

- Severity: P1
- Confidence: High
- Area: SEC
- Evidence:
  - `apps/api/src/routes/auth.ts`
  - Symbols / routes: Caller-controlled reset redirect composes into an account-takeover assist
- What is happening: re-verified at 6b7aa1a5: apps/api/src/routes/auth.ts:34-61 resolveTrustedRedirectOrigin only allows CORS_ORIGIN/APP_BASE_URL; it is used for reset (:347) and sign-up (:193).
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P1-006` at `6b7aa1a5`.
- Owner suggestion: CTO/security lead + API team
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P1-007 - Client-onboarding mutations run without any `requirePermission` gate

- Severity: P1
- Confidence: High
- Area: SEC
- Evidence:
  - `routes/client-onboarding-command-center.ts`
  - Symbols / routes: Client-onboarding mutations run without any `requirePermission` gate
- What is happening: re-verified at 6b7aa1a5: routes/client-onboarding-command-center.ts mounts requireAuth+requireOrgAccess (:32-33) and every handler carries requirePermission: view :50,74,115,232; create :137; edit :154,200,247; delete :177.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P1-007` at `6b7aa1a5`.
- Owner suggestion: API platform
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P1-008 - M365 webhook secret is dead config while the real M365 auth value is undocumented and undeployed

- Severity: P1
- Confidence: High
- Area: SEC
- Evidence:
  - `config/env.ts`
  - `deploy-do.yml`
  - `docs/ENVIRONMENT_VARIABLES.md`
  - Symbols / routes: M365 webhook secret is dead config while the real M365 auth value is undocumented and undeployed
- What is happening: re-verified at 6b7aa1a5: M365_WEBHOOK_SECRET exists only as an explanatory comment in config/env.ts:104-105; M365_CLIENT_STATE is in the schema at :105, written by deploy-do.yml:688/787, and documented at docs/ENVIRONMENT_VARIABLES.md:92.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P1-008` at `6b7aa1a5`.
- Owner suggestion: platform/security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P1-009 - Deploy pipeline does not write several secret-class env vars the API schema and compose reference

- Severity: P1
- Confidence: High
- Area: SEC
- Evidence:
  - `scripts/check-env-parity.mjs`
  - `github/actions/unit-tests/action.yml`
  - `deploy-do.yml`
  - Symbols / routes: Deploy pipeline does not write several secret-class env vars the API schema and compose reference
- What is happening: re-verified at 6b7aa1a5: scripts/check-env-parity.mjs runs (with self-test) in .github/actions/unit-tests/action.yml:99-100; deploy-do.yml:740 lists the secret set and :787-804 printf-writes M365_CLIENT_STATE/FIELD_ENCRYPTION_KEY/TURNSTILE_SECRET_KEY.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P1-009` at `6b7aa1a5`.
- Owner suggestion: platform/security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P1-010 - Public file-request upload authorizes with a permission unioned across all orgs

- Severity: P1
- Confidence: High
- Area: SEC
- Evidence:
  - `routes/file-requests.ts`
  - Symbols / routes: Public file-request upload authorizes with a permission unioned across all orgs
- What is happening: re-verified at 6b7aa1a5: routes/file-requests.ts:114-160 authorizes the public upload on the request token row and derives every write from data.organization_id (:161,197-275); the claim RPC is org-bound. No cross-org permission union remains.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P1-010` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P2-001 - Worker monitoring checks are guard-then-fetch (DNS-rebinding TOCTOU); webhook path is pinned but uptime/website checks and SSL probe are not

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `apps/worker/src/tasks/module-tasks.ts`
  - Symbols / routes: Worker monitoring checks are guard-then-fetch (DNS-rebinding TOCTOU); webhook path is pinned but uptime/website checks and SSL probe are not
- What is happening: re-verified at 6b7aa1a5: apps/worker/src/tasks/module-tasks.ts:606-624 and :656-681 call pinnedFetch after assertSafeUrl; fetchSslExpiry resolves once via resolvePinnedAddress and sets servername (:34-80).
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P2-001` at `6b7aa1a5`.
- Owner suggestion: API/worker platform engineer
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P2-002 - PII field encryption is additive: plaintext profile columns remain the source of truth and are still returned

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `lib/profile-pii.ts`
  - `routes/profiles.ts`
  - Symbols / routes: PII field encryption is additive: plaintext profile columns remain the source of truth and are still returned
- What is happening: re-verified at 6b7aa1a5: reads decrypt via decryptProfileRow (lib/profile-pii.ts:39-58; routes/profiles.ts:85,92,119,210) with plaintext fallback. Residual unchanged: routes/profiles.ts:165-187 still writes the plaintext duplicate columns (full_name/phone) alongside encrypted_pii, and no migration drops or blanks the legacy columns; the backfill script remains additive-only.
- Why it matters: Part of the prior fix is present, but the residual described in the verification note is still reproducible.
- User / business impact: A material hardening or correctness gap that should be scheduled this month.
- Security / privacy / reliability impact: A material hardening or correctness gap that should be scheduled this month.
- Recommended fix: Close the residual described in the verification note and add a regression test that fails on the prior behavior.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P2-002` at `6b7aa1a5`.
- Owner suggestion: API/backend + data governance
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: partially-fixed
- Endpoint / data path: see evidence
- Attack path: none identified beyond the documented control gap.

### Finding ID: SEC-P2-003 - Global role catalog is mutable by any org's roles:manage holder (roles are not org-scoped)

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `lib/role-assignment.ts`
  - `routes/roles.ts`
  - Symbols / routes: Global role catalog is mutable by any org's roles:manage holder (roles are not org-scoped)
- What is happening: re-verified at 6b7aa1a5: assertCanManageRoleCatalog (lib/role-assignment.ts:47-63) gates every catalog mutation (routes/roles.ts:103,149,197,273) to platform super admins.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P2-003` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P2-004 - API-key scopes are stored but never enforced; keys act with the creating user's full permissions and always bypass RLS

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `middleware/permissions.ts`
  - Symbols / routes: API-key scopes are stored but never enforced; keys act with the creating user's full permissions and always bypass RLS
- What is happening: re-verified at 6b7aa1a5: middleware/permissions.ts:73-80 denies a key request whose stored scope list lacks the requested permission before any creator-side resolution or admin bypass; empty scope lists deny every gated permission.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P2-004` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P2-005 - MFA enforcement is opt-in and the deployed default is false

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `lib/mfa.ts`
  - Symbols / routes: MFA enforcement is opt-in and the deployed default is false
- What is happening: re-verified at 6b7aa1a5: lib/mfa.ts:121-155 enforces a verified second factor unconditionally for privileged (admin/super_admin) sessions via userHasPrivilegedRole (:47-79), while the opt-in flag remains for other users.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P2-005` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P2-006 - Secret scanner echoes the matched secret value into CI logs

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `scripts/scan-secrets.sh`
  - `scripts/ci/verify-gitleaks-config.sh`
  - Symbols / routes: Secret scanner echoes the matched secret value into CI logs
- What is happening: re-verified at 6b7aa1a5: scripts/scan-secrets.sh:27-38 prints only affected file names via an awk filter and never the matched line/value; scripts/ci/verify-gitleaks-config.sh covers the gitleaks config.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P2-006` at `6b7aa1a5`.
- Owner suggestion: security tooling
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P2-007 - Webhook SSRF guard has a DNS-rebinding TOCTOU window

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `worker/lib/pinned-fetch.ts`
  - `worker/tasks/webhook-dispatcher.ts`
  - `webhook-retry.ts`
  - `api/lib/webhook-dispatcher.ts`
  - Symbols / routes: Webhook SSRF guard has a DNS-rebinding TOCTOU window
- What is happening: re-verified at 6b7aa1a5: webhook dispatch/retry/test use pinnedFetch - worker/lib/pinned-fetch.ts:85, worker/tasks/webhook-dispatcher.ts:209, webhook-retry.ts:199, api/lib/webhook-dispatcher.ts:84 (redirects not followed, response capped).
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P2-007` at `6b7aa1a5`.
- Owner suggestion: API/worker platform
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P2-008 - Client-onboarding mutations run without `requirePermission` (authorization outlier)

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `routes/client-onboarding-command-center.ts`
  - Symbols / routes: Client-onboarding mutations run without `requirePermission` (authorization outlier)
- What is happening: re-verified at 6b7aa1a5: same gate as SEC-P1-007 - every route in routes/client-onboarding-command-center.ts carries a requirePermission handler.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P2-008` at `6b7aa1a5`.
- Owner suggestion: API team / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P2-009 - MSP platform roles are cross-tenant for org access but not for permissions (inconsistent trust model)

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `packages/sdk/src/role-keys.ts`
  - `routes/tickets.ts`
  - `catalog-parity.test.ts`
  - Symbols / routes: MSP platform roles are cross-tenant for org access but not for permissions (inconsistent trust model)
- What is happening: re-verified at 6b7aa1a5: packages/sdk/src/role-keys.ts keeps the cross-tenant and elevated sets separate; remaining isPlatformAdminKey uses are in-org (e.g. routes/tickets.ts:201,506), and catalog-parity.test.ts pins the sets.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P2-009` at `6b7aa1a5`.
- Owner suggestion: API team / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P2-010 - Forgot-password email redirect still uses attacker-controlled `Origin` header

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `routes/auth.ts`
  - Symbols / routes: Forgot-password email redirect still uses attacker-controlled `Origin` header
- What is happening: re-verified at 6b7aa1a5: routes/auth.ts:341-348 forgot-password uses resolveTrustedRedirectOrigin + the web /auth/callback path; the caller's Origin is never echoed.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P2-010` at `6b7aa1a5`.
- Owner suggestion: API team / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P2-011 - `GET /analytics/summary` calls a `get_analytics_summary` RPC that no migration defines

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `supabase/migrations/5302440_search_analytics_summary.sql`
  - `routes/analytics.ts`
  - `analytics-summary-rpc.test.ts`
  - Symbols / routes: `GET /analytics/summary` calls a `get_analytics_summary` RPC that no migration defines
- What is happening: re-verified at 6b7aa1a5: supabase/migrations/5302440_search_analytics_summary.sql:19-36 defines get_analytics_summary and revokes it from public/anon/authenticated; routes/analytics.ts:100-110 calls it; analytics-summary-rpc.test.ts asserts the definition.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P2-011` at `6b7aa1a5`.
- Owner suggestion: API team / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P2-012 - RLS is bypassed on API requests by default (service-role is the default client)

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `lib/rls-startup-check.ts`
  - `main.ts`
  - `services/supabase.ts`
  - Symbols / routes: RLS is bypassed on API requests by default (service-role is the default client)
- What is happening: re-verified at 6b7aa1a5: lib/rls-startup-check.ts:29-64 refuses production boot with an empty RLS_READS_ENABLED allow-list (called from main.ts:19), and services/supabase.ts:197-225 still returns the service-role client for modules not listed in RLS_READS/WRITES_ENABLED. Residual unchanged: the deployed allow-list values are GitHub secrets and cannot be verified read-only; unlisted modules still run as service_role.
- Why it matters: Part of the prior fix is present, but the residual described in the verification note is still reproducible.
- User / business impact: A material hardening or correctness gap that should be scheduled this month.
- Security / privacy / reliability impact: A material hardening or correctness gap that should be scheduled this month.
- Recommended fix: Close the residual described in the verification note and add a regression test that fails on the prior behavior.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P2-012` at `6b7aa1a5`.
- Owner suggestion: API team / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: partially-fixed
- Endpoint / data path: see evidence
- Attack path: none identified beyond the documented control gap.

### Finding ID: SEC-P2-013 - CAPTCHA/Turnstile is bypassed when the secret is unset

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `config/env.ts`
  - `routes/public.ts`
  - Symbols / routes: CAPTCHA/Turnstile is bypassed when the secret is unset
- What is happening: re-verified at 6b7aa1a5: config/env.ts:141-147 requires TURNSTILE_SECRET_KEY in production; routes/public.ts:71,185-188 fails closed when the key is configured or when running in production.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P2-013` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P2-014 - `/health` publicly discloses provider configuration and Redis errors

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `routes/health.ts`
  - Symbols / routes: `/health` publicly discloses provider configuration and Redis errors
- What is happening: re-verified at 6b7aa1a5: routes/health.ts:153-170 serves /health/detail only behind authorizeInternalRequest(req, METRICS_TOKEN); the public /health response (:136-150) exposes only service/status/uptime.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P2-014` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P2-015 - Bulk invite creates pre-confirmed auth accounts (and org onboarding auto-approves admin)

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `routes/bulk.ts`
  - `routes/organizations.ts`
  - Symbols / routes: Bulk invite creates pre-confirmed auth accounts (and org onboarding auto-approves admin)
- What is happening: re-verified at 6b7aa1a5: routes/bulk.ts:163 uses inviteUserByEmail (no pre-confirmed accounts); routes/organizations.ts:127-140 creates the first admin membership with status 'pending'.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P2-015` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P2-016 - `PLATFORM_ADMIN_KEYS` (org traversal) and `ADMIN_BYPASS_KEYS` (permission bypass) are inconsistent trust sets

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `lib/permissions.ts`
  - `middleware/permissions.ts`
  - Symbols / routes: `PLATFORM_ADMIN_KEYS` (org traversal) and `ADMIN_BYPASS_KEYS` (permission bypass) are inconsistent trust sets
- What is happening: re-verified at 6b7aa1a5: ADMIN_BYPASS_KEYS is the cross-tenant-only set [super_admin, admin] (lib/permissions.ts:71), distinct from PLATFORM_ADMIN_KEYS; middleware/permissions.ts:93-110 consumes the bypass set, and the remaining isPlatformAdminKey uses are in-org.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P2-016` at `6b7aa1a5`.
- Owner suggestion: API team / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P2-017 - API keys store `expires_at` but nothing enforces or prunes expiry

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `worker/tasks/index.ts`
  - `worker/schedule-config.ts`
  - `middleware/api-key.ts`
  - Symbols / routes: API keys store `expires_at` but nothing enforces or prunes expiry
- What is happening: re-verified at 6b7aa1a5: api-key-prune is registered (worker/tasks/index.ts:51) and scheduled daily (worker/schedule-config.ts:50); middleware/api-key.ts:82-91 fails closed on revoked/expired/malformed keys.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P2-017` at `6b7aa1a5`.
- Owner suggestion: API platform
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P2-018 - API keys cannot authenticate; the feature is dead

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `middleware/auth.ts`
  - `middleware/api-key.ts`
  - Symbols / routes: API keys cannot authenticate; the feature is dead
- What is happening: re-verified at 6b7aa1a5: middleware/auth.ts:66-90 authenticates mct_* keys via authenticateApiKey and pins req.orgId/req.orgScope to the key's org; middleware/api-key.ts hashes and timing-safe-compares; the api-key auth suite exists.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P2-018` at `6b7aa1a5`.
- Owner suggestion: API platform
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P3-001 - Sign-up confirmation redirect is built from the caller-controlled Host header and targets a non-existent API route

- Severity: P3
- Confidence: High
- Area: SEC
- Evidence:
  - `routes/auth.ts`
  - Symbols / routes: Sign-up confirmation redirect is built from the caller-controlled Host header and targets a non-existent API route
- What is happening: re-verified at 6b7aa1a5: routes/auth.ts:193 emailRedirectTo uses resolveTrustedRedirectOrigin + the web /auth/callback path; no Host-header construction remains.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P3-001` at `6b7aa1a5`.
- Owner suggestion: API team / security
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P3-002 - Analytics admin reads are not tenant-scoped and expose platform-wide event data including visitor IPs

- Severity: P3
- Confidence: High
- Area: SEC
- Evidence:
  - `routes/analytics.ts`
  - Symbols / routes: Analytics admin reads are not tenant-scoped and expose platform-wide event data including visitor IPs
- What is happening: re-verified at 6b7aa1a5: routes/analytics.ts:78-110 requires resolveAdminTenantScope().allTenants for both admin reads; migration 5302446 removed the analytics PII columns.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P3-002` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P3-003 - Auth rate-limit key uses the raw email string without normalization

- Severity: P3
- Confidence: High
- Area: SEC
- Evidence:
  - `middleware/rate-limit.ts`
  - Symbols / routes: Auth rate-limit key uses the raw email string without normalization
- What is happening: re-verified at 6b7aa1a5: middleware/rate-limit.ts:66-71 emailRateLimitKey normalizes (trim/lowercase) and SHA-256-hashes the address before it becomes a bucket key.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P3-003` at `6b7aa1a5`.
- Owner suggestion: API platform engineer
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P3-004 - gitleaks generic-api-key/jwt hits are false positives (no tracked secret)

- Severity: P3
- Confidence: High
- Area: SEC
- Evidence:
  - `scripts/ci/verify-gitleaks-config.sh`
  - Symbols / routes: gitleaks generic-api-key/jwt hits are false positives (no tracked secret)
- What is happening: re-verified at 6b7aa1a5: .gitleaks.toml scopes every allowlist to a reviewed value/file and scripts/ci/verify-gitleaks-config.sh proves a negative fixture is still detected.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P3-004` at `6b7aa1a5`.
- Owner suggestion: security tooling
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P3-005 - `5302116` grants anon/authenticated full DML on every public table (RLS is the only gate)

- Severity: P3
- Confidence: High
- Area: SEC
- Evidence:
  - `supabase/migrations/5302434_anon_privilege_least_privilege.sql`
  - Symbols / routes: `5302116` grants anon/authenticated full DML on every public table (RLS is the only gate)
- What is happening: re-verified at 6b7aa1a5: supabase/migrations/5302434_anon_privilege_least_privilege.sql revokes the blanket anon/authenticated grants and default privileges, and 5302458 narrows analytics anon insert further.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P3-005` at `6b7aa1a5`.
- Owner suggestion: API team / security
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P3-006 - CORS reflects any origin with credentials when `CORS_ORIGIN="*"`

- Severity: P3
- Confidence: High
- Area: SEC
- Evidence:
  - `config/env.ts`
  - `app.ts`
  - Symbols / routes: CORS reflects any origin with credentials when `CORS_ORIGIN="*"`
- What is happening: re-verified at 6b7aa1a5: config/env.ts:49-59 rejects CORS_ORIGIN='*'; app.ts:94-110 fails closed on a wildcard instead of reflecting the origin with credentials.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P3-006` at `6b7aa1a5`.
- Owner suggestion: API team / security
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P3-007 - `notification-preferences` PUT accepts a body `organizationId` without `assertOrgScopeMatches`

- Severity: P3
- Confidence: High
- Area: SEC
- Evidence:
  - `middleware/org-access.ts`
  - `routes/notification-preferences.ts`
  - Symbols / routes: `notification-preferences` PUT accepts a body `organizationId` without `assertOrgScopeMatches`
- What is happening: re-verified at 6b7aa1a5: middleware/org-access.ts:162-175 assertBodyOrgMatches runs on both requireOrgAccess branches (:228,249); routes/notification-preferences.ts defaults to the pinned req.orgId and rejects an unresolvable org.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P3-007` at `6b7aa1a5`.
- Owner suggestion: API team / security
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P3-008 - `resolveEffectivePermissions` is uncached and fans out 4-6 queries per gated request

- Severity: P3
- Confidence: High
- Area: SEC
- Evidence:
  - `lib/permissions.ts`
  - Symbols / routes: `resolveEffectivePermissions` is uncached and fans out 4-6 queries per gated request
- What is happening: re-verified at 6b7aa1a5: lib/permissions.ts:94-123 keeps a 15s per-process cache keyed userId:orgId with in-flight promise sharing; clearPermissionCache on grant/catalog writes; failures are not cached.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P3-008` at `6b7aa1a5`.
- Owner suggestion: API team / security
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P3-009 - Deprecated header and broad API CSP style directive

- Severity: P3
- Confidence: High
- Area: SEC
- Evidence:
  - `middleware/security-headers.ts`
  - Symbols / routes: Deprecated header and broad API CSP style directive
- What is happening: re-verified at 6b7aa1a5: middleware/security-headers.ts:7-8 drops X-XSS-Protection and :29-36 tightens style-src. Residual (cosmetic, unchanged): infra/digitalocean/Caddyfile.prod:12,35 still emits X-XSS-Protection for the Caddy-served hosts.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P3-009` at `6b7aa1a5`.
- Owner suggestion: API security
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P3-010 - M365 webhook `clientState` is compared non-constant-time

- Severity: P3
- Confidence: High
- Area: SEC
- Evidence:
  - `routes/webhooks.ts`
  - Symbols / routes: M365 webhook `clientState` is compared non-constant-time
- What is happening: re-verified at 6b7aa1a5: routes/webhooks.ts:886-912 uses timingSafeCompare on the M365 clientState; missing/mismatched clientState fails closed with 401.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P3-010` at `6b7aa1a5`.
- Owner suggestion: API team / security
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P3-011 - Active-org cookie setter performs no server-side authorization

- Severity: P3
- Confidence: High
- Area: SEC
- Evidence:
  - `apps/web/lib/org-actions.ts`
  - Symbols / routes: Active-org cookie setter performs no server-side authorization
- What is happening: re-verified at 6b7aa1a5: apps/web/lib/org-actions.ts:22-40 setActiveOrg verifies an approved membership (or platform admin) before writing the cookie.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P3-011` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P3-012 - Web middleware gates routes on an unverified JWT `exp`

- Severity: P3
- Confidence: High
- Area: SEC
- Evidence:
  - `apps/web/middleware.ts`
  - Symbols / routes: Web middleware gates routes on an unverified JWT `exp`
- What is happening: re-verified at 6b7aa1a5: apps/web/middleware.ts:1-24 still gates on an unverified JWT exp and documents the gate as non-authoritative UX only; the API remains the verification control, so behavior is unchanged by design.
- Why it matters: Part of the prior fix is present, but the residual described in the verification note is still reproducible.
- User / business impact: A low-risk cleanup, consistency or documentation gap.
- Security / privacy / reliability impact: A low-risk cleanup, consistency or documentation gap.
- Recommended fix: Close the residual described in the verification note and add a regression test that fails on the prior behavior.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P3-012` at `6b7aa1a5`.
- Owner suggestion: web platform
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: partially-fixed
- Endpoint / data path: see evidence
- Attack path: none identified beyond the documented control gap.

### Finding ID: SEC-P3-013 - Final/* module and registerCrud reads have no requirePermission gate

- Severity: P3
- Confidence: High
- Area: SEC
- Evidence:
  - `apps/api/src/routes/final/crud.ts`
  - `final/backups.ts`
  - `budgets.ts`
  - `procurement.ts`
  - `sharepoint.ts`
  - `time-entries.ts`
  - `routes/sla.ts`
  - `apps/api/src/__tests__/final-view-gates.test.ts`
  - Symbols / routes: Final/* module and registerCrud reads have no requirePermission gate
- What is happening: re-verified at 6b7aa1a5: the registerCrud read routes now carry requirePermission (apps/api/src/routes/final/crud.ts:31,89), and final/backups.ts:9,24, budgets.ts:9, procurement.ts:11, sharepoint.ts:9, time-entries.ts:13 and routes/sla.ts:17 all carry module view gates; apps/api/src/__tests__/final-view-gates.test.ts covers them.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P3-013` at `6b7aa1a5`.
- Owner suggestion: API platform
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: SEC-P1-011 - Client-visibility filtering is bypassed on comments/timeline side-channel endpoints

- Severity: P1
- Confidence: High
- Area: SEC
- Evidence:
  - `apps/api/src/routes/approvals.ts`
  - `apps/api/src/routes/assets.ts`
  - `apps/api/src/routes/findings.ts`
  - `apps/api/src/routes/proposals.ts`
  - `apps/api/src/lib/client-visibility.ts`
  - Symbols / routes: Client-visibility filtering is bypassed on comments/timeline side-channel endpoints
- What is happening: NEW at 6b7aa1a5: the detail endpoints now hide client-internal comments (approvals.ts:178-190, assets.ts:151-162, findings.ts:153-164; proposals comments at :934-960), but the sibling endpoints return every row with only an org/ownership check: GET /:id/comments and /:id/timeline at approvals.ts:455-478/524-547, assets.ts:351-374/416-439, findings.ts:454-476/522-544, and proposals.ts:1008-1031 do not check `is_internal` or the row's visibility. A client role can read internal notes/timeline for any record in its org, including a client-visible record whose comment thread was meant to be internal-only.
- Why it matters: This is a new issue at this commit; the verification note gives the exact code path and reachability.
- User / business impact: A serious authorization, confidentiality or release-integrity issue that should be fixed before broad rollout.
- Security / privacy / reliability impact: A serious authorization, confidentiality or release-integrity issue that should be fixed before broad rollout.
- Recommended fix: Centralize a `assertClientReadableRecord(req, table, id)` helper and apply it to every comments/timeline endpoint; for comments always add `.eq('is_internal', false)` when the caller is a client member. Add route tests that a client cannot read an internal comment even on a client-visible parent.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P1-011` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: open
- Endpoint / data path: GET /api/v1/{approvals,assets,findings}/:id/comments|timeline; GET /api/v1/proposals/:id/timeline
- Attack path: Authenticated client role -> opens a client-visible approval/asset/finding -> GET /:id/comments (no visibility or is_internal predicate) -> reads internal staff notes.

### Finding ID: SEC-P2-019 - File-request upload listing and signed URLs skip the parent request's visibility check

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `apps/api/src/routes/file-requests.ts`
  - Symbols / routes: File-request upload listing and signed URLs skip the parent request's visibility check
- What is happening: NEW at 6b7aa1a5: GET /file-requests/:id applies isClientVisible (:334-338), but the nested GET /:id/uploads (:351-374) and GET /:id/uploads/:uploadId/signed-url (:376-415) only check organization_id. A client role that knows an internal file-request UUID can list its upload ids and mint a download URL for attachments that the parent detail now hides.
- Why it matters: This is a new issue at this commit; the verification note gives the exact code path and reachability.
- User / business impact: A material hardening or correctness gap that should be scheduled this month.
- Security / privacy / reliability impact: A material hardening or correctness gap that should be scheduled this month.
- Recommended fix: Load the parent file_request with the same isClientVisible check before listing uploads or signing a URL; return 404 when hidden. Add tests for internal vs client_visible parents.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P2-019` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: open
- Endpoint / data path: GET /api/v1/file-requests/:id/uploads and /:id/uploads/:uploadId/signed-url
- Attack path: Authenticated client role -> knows an internal file-request id -> GET /:id/uploads -> lists upload ids -> signed-url -> downloads the attachment.

### Finding ID: SEC-P2-020 - Client roles granted ai:view can read every AI draft output in the organization

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `supabase/migrations/5302463_client_portal_ai_and_visibility.sql`
  - `apps/api/src/routes/ai.ts`
  - Symbols / routes: Client roles granted ai:view can read every AI draft output in the organization
- What is happening: NEW at 6b7aa1a5: supabase/migrations/5302463_client_portal_ai_and_visibility.sql:22-33 widens ai:view to scope 'both' and grants it to client_admin/client_user/client-viewer/client-billing. The same permission now unlocks GET /ai/drafts (apps/api/src/routes/ai.ts:537-560) and GET /ai/drafts/:id (:562-576), which return every ai_draft_outputs row for the org with no visibility or creator filter. The migration intended to open triage only; it also exposes internal AI drafts/prompts to client roles.
- Why it matters: This is a new issue at this commit; the verification note gives the exact code path and reachability.
- User / business impact: A material hardening or correctness gap that should be scheduled this month.
- Security / privacy / reliability impact: A material hardening or correctness gap that should be scheduled this month.
- Recommended fix: Split the permission keys (e.g. ai-triage:view vs ai-drafts:view) or filter ai_draft_outputs by visibility/creator/status for client roles; do not grant the broad ai:view to client roles without scoping the drafts routes.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P2-020` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: open
- Endpoint / data path: GET /api/v1/ai/drafts and /api/v1/ai/drafts/:id
- Attack path: Client role granted ai:view by 5302463 -> GET /ai/drafts -> reads every internal AI draft in the org.

### Finding ID: SEC-P3-014 - Client-visibility helper fails open and exempts API-key requests

- Severity: P3
- Confidence: High
- Area: SEC
- Evidence:
  - `apps/api/src/lib/client-visibility.ts`
  - Symbols / routes: Client-visibility helper fails open and exempts API-key requests
- What is happening: NEW at 6b7aa1a5: apps/api/src/lib/client-visibility.ts:64 treats any request carrying req.apiKey as staff (no visibility filter), and :94-99 catches a membership-lookup error, logs it, and returns false (staff view). A transient DB error or an API key minted by a client-capable custom role therefore serves internal rows to a client. The key path is latent today because api-keys:manage is catalogued as admin-scope (5302118:306-307) and client roles do not receive it by default.
- Why it matters: This is a new issue at this commit; the verification note gives the exact code path and reachability.
- User / business impact: A low-risk cleanup, consistency or documentation gap.
- Security / privacy / reliability impact: A low-risk cleanup, consistency or documentation gap.
- Recommended fix: Fail closed: on membership lookup failure return client-scoped=true (or deny), and scope API-key principals by the creator's role instead of treating every key as staff. Add a failure-injection test.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P3-014` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: open
- Endpoint / data path: all routes using lib/client-visibility.ts
- Attack path: none identified beyond the documented control gap.

### Finding ID: SEC-P3-015 - GET /ai/triage is the only AI route without an ai:view gate

- Severity: P3
- Confidence: High
- Area: SEC
- Evidence:
  - `apps/api/src/routes/ai.ts`
  - Symbols / routes: GET /ai/triage is the only AI route without an ai:view gate
- What is happening: NEW at 6b7aa1a5: every other AI route carries requirePermission (triage POST :217, copilot :346-348, drafts :537,562,578), but GET /ai/triage at apps/api/src/routes/ai.ts:320-341 has only router-level requireAuth+requireOrgAccess and lists ticket_triage_drafts (raw descriptions) for any approved org member.
- Why it matters: This is a new issue at this commit; the verification note gives the exact code path and reachability.
- User / business impact: A low-risk cleanup, consistency or documentation gap.
- Security / privacy / reliability impact: A low-risk cleanup, consistency or documentation gap.
- Recommended fix: Add requirePermission('ai','view') to GET /ai/triage (and keep the route in the catalog-lint coverage).
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `SEC-P3-015` at `6b7aa1a5`.
- Owner suggestion: API platform / security
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: open
- Endpoint / data path: GET /api/v1/ai/triage
- Attack path: none identified beyond the documented control gap.

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Client users read internal comments/timeline | P1 | High | High | SEC-P1-011 | Filter all side endpoints |
| Client downloads internal file-request attachments | P2 | Medium | High | SEC-P2-019 | Parent visibility check |
| Client reads internal AI drafts | P2 | Medium | Medium | SEC-P2-020 | Split AI permissions |
| Visibility fails open on DB error | P3 | Low | High | SEC-P3-014 | Fail closed |

## Recommendations

### Immediate / Release Blocking

- Fix SEC-P1-011 and MT-P1-005 before broad rollout; close SEC-P2-019/020 this week.

### This Week

- Add visibility + is_internal predicates to every comments/timeline endpoint and nested file-request route.
- Scope ai:view or split ai-triage from ai-drafts.

### This Month

- Make the visibility helper fail closed and apply it to API-key principals.
- Gate GET /ai/triage.

### Later / Platform Evolution

- Continue the documented RLS rollout.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Add `requirePermission('ai','view')` to GET /ai/triage | Closes a one-line gate gap | apps/api/src/routes/ai.ts:320 | Unit test 403 |
| Check parent visibility in file-request uploads | Stops attachment enumeration | routes/file-requests.ts:351-415 | Route test |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| SEC-P2-002: PII field encryption is additive: plaintext profile columns remain the source of truth and are still returned | P2 | API/backend + data governance | M | none |
| SEC-P2-012: RLS is bypassed on API requests by default (service-role is the default client) | P2 | API team / security | M | none |
| SEC-P3-012: Web middleware gates routes on an unverified JWT `exp` | P3 | web platform | S | none |
| SEC-P1-011: Client-visibility filtering is bypassed on comments/timeline side-channel endpoints | P1 | API platform / security | M | none |
| SEC-P2-019: File-request upload listing and signed URLs skip the parent request's visibility check | P2 | API platform / security | M | none |
| SEC-P2-020: Client roles granted ai:view can read every AI draft output in the organization | P2 | API platform / security | M | none |
| SEC-P3-014: Client-visibility helper fails open and exempts API-key requests | P3 | API platform / security | S | none |
| SEC-P3-015: GET /ai/triage is the only AI route without an ai:view gate | P3 | API platform / security | S | none |

## Suggested Tests

- Client-role request to /approvals/:id/comments must not contain any is_internal=true row.
- Client-role request to /file-requests/:id/uploads on an internal request returns 404.
- Client role GET /ai/drafts returns 403 unless a dedicated ai-drafts grant exists.
- Force the membership query to throw; assert the visibility helper denies (fail closed).
- GET /ai/triage without ai:view returns 403.

## Suggested Documentation Updates

- Document the client-visibility contract: which tables have visibility, which routes enforce it, and the is_internal rule for comments.
- Update the AI permission matrix to separate triage from draft review.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Can a client role hold a custom role key not in CLIENT_ROLE_KEYS? | Determines visibility bypass breadth | roles catalog + custom role policy |
| Are internal comments ever safe to expose? | Scope of SEC-P1-011 | Product policy |

## Appendix

- Prior run: `mainecybertech-20261014-0033-full-main-7dd0402` (findings re-verified by area).
- Worktree: `/tmp/opencode/mct-nov-g1` at `origin/main` (6b7aa1a5505d4f75b334b36e9e87737cd98e589c).
- Commands: `git diff --stat 7dd0402..6b7aa1a5`, `git diff --name-only`, targeted `rg`/`sed` over the cited paths.
- Counts: 46 findings; 38 verified-fixed, 3 partially-fixed, 5 open, 0 regressed, 5 new.
- Execution limitation: application dependencies were not installed in the read-only worktree; runtime tests and database migrations were **not run** (marked not reproducible in this environment).

