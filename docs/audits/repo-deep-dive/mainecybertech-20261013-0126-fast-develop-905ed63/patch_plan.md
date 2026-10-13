# Patch plan

## CI-P1-001 — Production application deploys have no working manual-approval gate

TBD

## CI-P1-002 — Branch-protection-as-code has a likely-mismatched required check and permits admin bypass

TBD

## CI-P1-003 — Production deploy path cannot run; prod environment lacks secrets and protection rules

TBD

## SC-P1-001 — Critical/high advisories persist in the dev dependency tree; `next` override is mis-scoped

TBD

## SEC-P1-001 — super_admin role can be granted through membership/onboarding/bulk-invite APIs without the /users/:id/role guard

TBD

## SEC-P1-002 — PII field encryption silently degrades to reversible plaintext

TBD

## SEC-P1-003 — Org-agnostic `requireAdmin` lets a tenant admin read other tenants' admin data

TBD

## SEC-P1-004 — Impersonation/cross-tenant access is logged but not reviewable or alerted

TBD

## SEC-P1-005 — Low-trust MSP role key composes into a cross-tenant read pivot

TBD

## SEC-P1-006 — Caller-controlled reset redirect composes into an account-takeover assist

TBD

## SEC-P1-007 — Client-onboarding mutations run without any `requirePermission` gate

TBD

## SEC-P1-008 — M365 webhook secret is dead config while the real M365 auth value is undocumented and undeployed

TBD

## SEC-P1-009 — Deploy pipeline does not write several secret-class env vars the API schema and compose reference

TBD

## SEC-P1-010 — Public file-request upload authorizes with a permission unioned across all orgs

TBD

## CI-P2-001 — World-open DigitalOcean firewall mutation with no approval and unvalidated udp_port

TBD

## CI-P2-002 — Deploy-gate secret scan is a no-op on pushes to main

TBD

## CI-P2-003 — Production approval environment documented as having no required reviewers

TBD

## CI-P2-004 — DB restore test reports success without asserting restore integrity

TBD

## CI-P2-005 — Infrastructure changes are no longer gated in CI (terraform-do is manual-dispatch only)

TBD

## CI-P2-006 — Chromatic visual-regression job is permanently non-blocking

TBD

## CI-P2-007 — Branch protection permits admin bypass and ignores CODEOWNERS

TBD

## CI-P2-008 — Terraform apply is manual and drift detection is not automated

TBD

## CI-P2-009 — E2E is a required check on main but path-filtered, so PRs that miss its paths can never satisfy branch protection

TBD

## CI-P2-010 — Backup dispatcher duplicates the backup workflows now that they exist on the default branch

TBD

## SC-P2-001 — No image-level container scanning; Trivy scans filesystem only

TBD

## SC-P2-002 — No artifact provenance, attestation, or signing; `id-token: write` requested but unused

TBD

## SC-P2-003 — License policy not enforced in CI; non-OSI and LGPL licenses present

TBD

## SC-P2-004 — SBOM is generated but not bound to a commit or attached to releases/images

TBD

## SC-P2-005 — Dependabot PR backlog is large and not triaged; one stale update conflicts with resolved versions

TBD

## SC-P2-006 — `licenses.json` is committed but unenforced and unverified

TBD

## SC-P2-007 — Swagger UI loads an unpinned third-party script without SRI

TBD

## SC-P2-008 — Deploy-gate secret scan is a no-op on pushes to main

TBD

## SC-P2-009 — Secret scanning is diff-scoped only; no full-history scan artifact

TBD

## SC-P2-010 — Produced Terraform `prod.tfvars` is tracked despite `.gitignore` intending to exclude it

TBD

## SC-P2-011 — Scheduled full-history secret scan has no failure notification

TBD

## SEC-P2-001 — Worker monitoring checks are guard-then-fetch (DNS-rebinding TOCTOU); webhook path is pinned but uptime/website checks and SSL probe are not

TBD

## SEC-P2-002 — PII field encryption is additive: plaintext profile columns remain the source of truth and are still returned

TBD

## SEC-P2-003 — Global role catalog is mutable by any org's roles:manage holder (roles are not org-scoped)

TBD

## SEC-P2-004 — API-key scopes are stored but never enforced; keys act with the creating user's full permissions and always bypass RLS

TBD

## SEC-P2-005 — MFA enforcement is opt-in and the deployed default is false

TBD

## SEC-P2-006 — Secret scanner echoes the matched secret value into CI logs

TBD

## SEC-P2-007 — Webhook SSRF guard has a DNS-rebinding TOCTOU window

TBD

## SEC-P2-008 — Client-onboarding mutations run without `requirePermission` (authorization outlier)

TBD

## SEC-P2-009 — MSP platform roles are cross-tenant for org access but not for permissions (inconsistent trust model)

TBD

## SEC-P2-010 — Forgot-password email redirect still uses attacker-controlled `Origin` header

TBD

## SEC-P2-011 — `GET /analytics/summary` calls a `get_analytics_summary` RPC that no migration defines

TBD

## SEC-P2-012 — RLS is bypassed on API requests by default (service-role is the default client)

TBD

## SEC-P2-013 — CAPTCHA/Turnstile is bypassed when the secret is unset

TBD

## SEC-P2-014 — `/health` publicly discloses provider configuration and Redis errors

TBD

## SEC-P2-015 — Bulk invite creates pre-confirmed auth accounts (and org onboarding auto-approves admin)

TBD

## SEC-P2-016 — `PLATFORM_ADMIN_KEYS` (org traversal) and `ADMIN_BYPASS_KEYS` (permission bypass) are inconsistent trust sets

TBD

## SEC-P2-017 — API keys store `expires_at` but nothing enforces or prunes expiry

TBD

## SEC-P2-018 — API keys cannot authenticate; the feature is dead

TBD

## CI-P3-001 — actionlint/shellcheck workflow lint issues (SC2086/SC2129/SC2002/SC2015)

TBD

## CI-P3-002 — Over-broad workflow token permissions (unused write scopes)

TBD

## CI-P3-003 — StrictHostKeyChecking=no in the deploy health check

TBD

## CI-P3-004 — `main` is far behind `develop`; scheduled jobs fire only from the default branch

TBD

## CI-P3-005 — Secret scanner misses the platform's own token formats and scans diffs only

TBD

## CI-P3-006 — Unused permission grants across deploy/test workflows

TBD

## CI-P3-007 — DB restore test uses an unpinned `postgres:16-alpine` image

TBD

## CI-P3-008 — No release/tagging workflow and no post-merge release artifact

TBD

## CI-P3-009 — e2e is required on `main` but the documented flakiness makes it an unstable hard gate

TBD

## CI-P3-010 — Missing per-job timeouts and minor workflow hygiene gaps

TBD

## CI-P3-011 — Workflow documentation drift: docs list a removed workflow, omit a live one, and misstate gate behavior

TBD

## CI-P3-012 — Badge/report generation is a stub and is not wired into CI

TBD

## CI-P3-013 — workflow_dispatch inputs are interpolated directly into run: scripts (rollback_sha/deploy_target)

TBD

## DET-P3-001 — [SEC] gitleaks not installed (secret scan skipped)

Install gitleaks in CI to enable the secret scan.

## DET-P3-002 — [SUPPLY] 3 container image(s) without a digest pin

Pin images by digest (`image@sha256:...`) for reproducible, tamper-evident deploys.

## SC-P3-001 — Root package license remains "ISC"

TBD

## SC-P3-002 — e2e Docker image is not digest-pinned

TBD

## SC-P3-003 — Secret-scanner pattern sets diverge between `.sh` and `.ps1`

TBD

## SC-P3-004 — Unpinned container images (test/local only); production app images tag-based by design

TBD

## SC-P3-005 — Dockerfile lint: missing WORKDIR in web runner stage and shell-form HEALTHCHECK

TBD

## SC-P3-006 — SBOM is produced as a transient artifact, not bound to a release

TBD

## SC-P3-007 — A secrets file exists on disk outside git (should never be committed)

TBD

## SC-P3-008 — gitleaks generic-api-key/jwt hits are false positives (no tracked secret)

TBD

## SC-P3-009 — Secret scanner misses the platform's own token formats and scans diffs only

TBD

## SC-P3-010 — Dependabot has no security-update separation or triage SLA, and PR template has no enforced link to required checks

TBD

## SC-P3-011 — Dependency and license policy `expires` dates are not enforced by the gates

TBD

## SC-P3-012 — Docs instruct the broken `pnpm licenses list --json` workflow while CI uses collect-licenses.mjs

TBD

## SC-P3-013 — SECURITY.md says neither SBOM is signed or attested, contradicting the attested image-SBOM process

TBD

## SC-P3-014 — No automated unused/duplicate dependency check; lockfile carries 55 multi-version packages

TBD

## SEC-P3-001 — Sign-up confirmation redirect is built from the caller-controlled Host header and targets a non-existent API route

TBD

## SEC-P3-002 — Analytics admin reads are not tenant-scoped and expose platform-wide event data including visitor IPs

TBD

## SEC-P3-003 — Auth rate-limit key uses the raw email string without normalization

TBD

## SEC-P3-004 — gitleaks generic-api-key/jwt hits are false positives (no tracked secret)

TBD

## SEC-P3-005 — `5302116` grants anon/authenticated full DML on every public table (RLS is the only gate)

TBD

## SEC-P3-006 — CORS reflects any origin with credentials when `CORS_ORIGIN="*"`

TBD

## SEC-P3-007 — `notification-preferences` PUT accepts a body `organizationId` without `assertOrgScopeMatches`

TBD

## SEC-P3-008 — `resolveEffectivePermissions` is uncached and fans out 4–6 queries per gated request

TBD

## SEC-P3-009 — Deprecated header and broad API CSP style directive

TBD

## SEC-P3-010 — M365 webhook `clientState` is compared non-constant-time

TBD

## SEC-P3-011 — Active-org cookie setter performs no server-side authorization

TBD

## SEC-P3-012 — Web middleware gates routes on an unverified JWT `exp`

TBD

