# Patch plan

## DATA-P0-001 - Orphan cleanup can recursively delete a bucket’s contents

TBD

## DR-P0-001 - Scheduled backup and restore-test workflows never run because they are absent from the default branch

TBD

## DR-P0-002 - The restore test never asserts integrity and therefore cannot fail on a bad backup

TBD

## IR-P0-001 - No platform-level incident response plan, roles, or postmortem process

TBD

## IR-P0-002 - No data breach response / notification process

TBD

## IR-P0-003 - Total loss of the monitoring/alerting path has no independent dead-man's-switch receiver

TBD

## ACM-P1-001 - Client-onboarding mutations run without any `requirePermission` gate

TBD

## ADMIN-P1-001 - Org-agnostic `requireAdmin` lets a tenant admin read other tenants' admin data

TBD

## ADMIN-P1-002 - Impersonation/cross-tenant access is logged but not reviewable or alerted

TBD

## AI-P1-001 - Vendored audit prompt packs are stale and the run manifest references a prompt the pack does not contain

TBD

## AI-P1-002 - `AGENTS.md` names a stale repository path and three developer docs state a stale accessibility gate size that no guard covers

TBD

## BILL-P1-001 - Module entitlements are derived but not enforced server-side

TBD

## BILL-P1-002 - `payments` table is never populated; payment history is silently empty

TBD

## BILL-P1-003 - Missing Stripe webhook events leave refunds, void, and payment lifecycle unrecorded

TBD

## BP-P1-001 - `main` requires a context (`Dependency Review`) that no job emits

TBD

## BP-P1-002 - `enforce_admins:false` lets administrators bypass all required checks and reviews

TBD

## BP-P1-003 - Production deploy path uses the unguarded `prod` environment, not `prod-approval`

TBD

## CHAIN-P1-001 - Low-trust MSP role key composes into a cross-tenant read pivot

TBD

## CHAIN-P1-002 - Caller-controlled reset redirect composes into an account-takeover assist

TBD

## CHAIN-P1-003 - Branch-protection bypass + missing prod gate compose into unattended production change

TBD

## CI-P1-001 - Production application deploys have no working manual-approval gate

TBD

## CI-P1-002 - Branch-protection-as-code has a likely-mismatched required check and permits admin bypass

TBD

## CI-P1-003 - Production deploy path cannot run; prod environment lacks secrets and protection rules

TBD

## CTR-P1-001 - No Container Image Vulnerability Scan in CI

TBD

## CTR-P1-002 - SBOM Is Lockfile-Only, Not an Image SBOM or Attestation

TBD

## CTR-P1-003 - Unsigned Images With No Provenance/Attestation

TBD

## DATA-P1-001 - Approved-membership RLS predicate reintroduced six times; pending/suspended members could access tenant data

TBD

## DATA-P1-002 - `retention` worker task performs unbounded deletes and reports success on partial failure

TBD

## DATA-P1-003 - Soft-delete columns remain dead schema; DELETE endpoints hard-delete

TBD

## DR-P1-001 - No backup or restore path exists for uploaded files in Supabase Storage

TBD

## DR-P1-002 - Restore-test backup location contract (`S3_BACKUP_BUCKET`) is undocumented and can silently mismatch the backup script

TBD

## DR-P1-003 - Database backups are unencrypted and stored in a single location with no offsite copy

TBD

## DR-P1-004 - The restore test has no failure alert

TBD

## DR-P1-005 - No automated migration reverse/rollback and no bad-migration drill

TBD

## DR-P1-006 - RPO/RTO targets are documented but unvalidated, and the Postgres RPO conflates PITR with the daily dump

TBD

## FILE-P1-001 - Public file-request upload is permission-gated and unreachable for anonymous uploaders

TBD

## FILE-P1-002 - File-request uploads have no tenant-scoped path and no download path; orphan cleanup will delete them

TBD

## FILE-P1-003 - Document version history objects are deleted at replace and by orphan cleanup

TBD

## FINAL-P1-001 - P0 data-loss path and unverified "fixed" claim block a clean release

TBD

## INFRA-P1-001 - SSH is open to the internet on both droplets (admin_ip_ranges default 0.0.0.0/0 and CI never overrides it)

TBD

## INFRA-P1-002 - Terraform state-locking fix is incompatible with the pinned Terraform version (use_lockfile requires >= 1.10, workflows pin 1.9)

TBD

## IR-P1-001 - Rollback documentation contradicts itself on SHA-targeted rollback

TBD

## IR-P1-002 - Bad-migration recovery is manual-only with no automated reverse or staging proof

TBD

## IR-P1-003 - Worker health failure during deploy is non-fatal

TBD

## IR-P1-004 - Backups are not verified deeply enough to prove the documented RPO/RTO

TBD

## IR-P1-005 - Backup bucket configuration is inconsistent between the script, the backup workflow, and the restore test

TBD

## IR-P1-006 - No runtime detection or alerting for tenant-isolation (RLS) regressions

TBD

## MT-P1-001 - Audit log list and export are not org-scoped by default

TBD

## MT-P1-002 - Platform dashboards expose all-tenant aggregates to any single-org admin

TBD

## MT-P1-003 - Public file-request upload authorizes with a permission unioned across all orgs

TBD

## NOTIF-P1-001 - Notification preferences are stored and displayed but never enforced on any send path

TBD

## NOTIF-P1-002 - API-originated notifications bypass the dedup unique index

TBD

## NOTIF-P1-003 - No delivery observability: email/notification failures are silent and unalerted

TBD

## REL-P1-001 - No version identity: no tags, no product version, no commit binding in generated artifacts

TBD

## REL-P1-002 - Documented production deploy path is stated as non-functional and the approval gate claim is false

TBD

## SBOM-P1-001 - No license allow/deny policy in dependency review or any CI gate

TBD

## SBOM-P1-002 - SBOM carries no license data and no dependency graph, limiting triage and license review

TBD

## SC-P1-001 - Critical/high advisories persist in the dev dependency tree; `next` override is mis-scoped

TBD

## SEARCH-P1-001 - `sanitizeSearchTerm` does not strip PostgREST `.` operator separators

TBD

## SEARCH-P1-002 - Admin global search exposes profile PII and never tenant-scopes the organizations query

TBD

## SEC-P1-001 - PII field encryption silently degrades to reversible plaintext

TBD

## SECRET-P1-001 - M365 webhook secret is dead config while the real M365 auth value is undocumented and undeployed

TBD

## SECRET-P1-002 - Deploy pipeline does not write several secret-class env vars the API schema and compose reference

TBD

## WH-P1-001 - Outbound webhook idempotency is non-atomic in the API and absent in the worker dispatcher

TBD

## WH-P1-002 - M365 webhook auth depends on `M365_CLIENT_STATE` which the deploy pipeline does not write, while `M365_WEBHOOK_SECRET` is dead config

TBD

## ACM-P2-001 - `PLATFORM_ADMIN_KEYS` (org traversal) and `ADMIN_BYPASS_KEYS` (permission bypass) are inconsistent trust sets

TBD

## ACM-P2-002 - RLS is not a database backstop on API requests (service-role is the default client)

TBD

## ACM-P2-003 - Write and state-transition actions gated by `view` permissions (action mismatch)

TBD

## ACM-P2-004 - Webhook endpoint and delivery reads are available to any org member (not manage-gated)

TBD

## ACM-P2-005 - API keys store `expires_at` but nothing enforces or prunes expiry

TBD

## ACM-P2-006 - Webhook signing secrets are stored plaintext with no rotation or expiry

TBD

## ACM-P2-007 - Profiles are enumerable by email/id for any authenticated user

TBD

## ADMIN-P2-001 - Sensitive admin exports are not audit-logged

TBD

## ADMIN-P2-002 - Destructive deletes are inconsistently confirmation-gated and org delete is unrecoverable

TBD

## ADMIN-P2-003 - Bulk document operations apply without a per-row preview or elevation guardrail

TBD

## ADMIN-P2-004 - Bulk invite creates pre-confirmed auth accounts (and org onboarding auto-approves admin)

TBD

## ADMIN-P2-005 - No rate limiting specific to expensive/destructive admin operations

TBD

## ADMIN-P2-006 - No undo/soft-delete is exercised despite the schema supporting it

TBD

## AI-P2-001 - No machine-enforced agent guardrails: allowed paths, human-approval actions, and small-batch PR limits exist only as prose

TBD

## AI-P2-002 - Prompt packs embed generated outputs alongside instructions without a machine-detectable "not instructions" marker

TBD

## AI-P2-003 - `.continue/` agent configuration defines models only and does not surface project rules or boundaries

TBD

## API-P2-001 - Mutations remain unguarded by `requirePermission` in several routers (including a governance state transition)

TBD

## API-P2-002 - External integration syncs report success while dropping items, and `jsm-sync` has no HTTP retry

TBD

## API-P2-003 - Published error-handling contract contradicts the implementation (codes, 422, and `request_id`)

TBD

## API-P2-004 - SDK retries unsafe requests without an `Idempotency-Key` (duplicate creates on transient failure)

TBD

## API-P2-005 - Outbound webhook dispatcher uses a non-atomic idempotency check (duplicate deliveries under concurrency)

TBD

## API-P2-006 - Search falls through to an unscoped cross-tenant query

TBD

## API-P2-007 - OpenAPI schema is public and the Swagger UI is blocked by CSP

TBD

## ARCH-P2-001 - Single-droplet, single-instance runtime is a hard SPOF

TBD

## ARCH-P2-002 - API defaults to the service-role DB client (RLS bypass)

TBD

## ARCH-P2-003 - Prometheus loads rules but has no alert routing

TBD

## BILL-P2-001 - No refund and incomplete trial/cancel state handling

TBD

## BILL-P2-002 - `POST /billing/sync` does not paginate Stripe results

TBD

## BILL-P2-003 - Reconciliation job has no drift detection, alerting, or tests

TBD

## BILL-P2-004 - Failed payments produce no notification or dunning visibility

TBD

## BILL-P2-005 - Subscription/invoice schema lacks trial, interval, and void-lifecycle fields

TBD

## BP-P2-001 - `require_code_owner_reviews:false` makes the committed CODEOWNERS advisory only

TBD

## BP-P2-002 - No break-glass / bypass process for branch protection, and no bypass audit trail

TBD

## BP-P2-003 - No drift detection between committed branch-protection JSON and live GitHub settings

TBD

## BP-P2-004 - Path-filtered required checks can leave `main`/`develop` protected by checks that never run

TBD

## CHAIN-P2-001 - Intra-tenant capability escalation via unguarded mutations

TBD

## CHAIN-P2-002 - Definer RPC identity trust composes into forged approvals/comments

TBD

## CHAIN-P2-003 - RLS admin-gate regression composes with the API trust model into MSP admin denials

TBD

## CHAIN-P2-004 - Retention + cascade compose into silent destruction of audit evidence

TBD

## CHAIN-P2-005 - Internet-open SSH composes into service-role exfiltration and tenant takeover

TBD

## CHAIN-P2-006 - Terraform version/lockfile conflict composes into un-gated infrastructure change

TBD

## CHAIN-P2-007 - Silent worker failures + in-stack monitoring compose into undetected degradation

TBD

## CI-P2-001 - World-open DigitalOcean firewall mutation with no approval and unvalidated udp_port

Add an environment approval (prod-approval or a dedicated firewall-approval), restrict droplet to an explicit choice allow-list, validate udp_port (^[0-9]{1,5}$, documented allow-list), build the JSON with jq -n --argjson instead of interpolation, narrow sources to known lab/VPN CIDRs, and add an expiry/removal + audit step. Consider a separate least-privilege token/workflow for firewall changes.

## CI-P2-002 - Deploy-gate secret scan is a no-op on pushes to main

For push events, diff against github.event.before (fall back to HEAD~1 when it is all-zeros), not git merge-base with origin/main. Add a regression test that a synthetic secret on the push path fails the scan.

## CI-P2-003 - Production approval environment documented as having no required reviewers

Configure prod-approval with 1+ required reviewers in GitHub Settings -> Environments, move prod migrations under prod-approval, and update the matrix/runbooks. Add a runbook verification step and, if possible, a check that the environment has protection rules.

## CI-P2-004 - DB restore test reports success without asserting restore integrity

TBD

## CI-P2-005 - Infrastructure changes are no longer gated in CI (terraform-do is manual-dispatch only)

TBD

## CI-P2-006 - Chromatic visual-regression job is permanently non-blocking

TBD

## CI-P2-007 - Branch protection permits admin bypass and ignores CODEOWNERS

TBD

## CI-P2-008 - Terraform apply is manual and drift detection is not automated

TBD

## CONF-P2-001 - Workflow-scope PAT SCHEDULE_DISPATCH_TOKEN omitted from secret inventory and rotation policy

Add SCHEDULE_DISPATCH_TOKEN to the secrets matrix and SECRETS_ROTATION.md with an owner and 90-day rotation; prefer a repository-scoped GitHub App installation token with short expiry over a classic PAT.

## CTR-P2-001 - Pinned Base-Image Digests Have No Automated Refresh

TBD

## CTR-P2-002 - Local Compose Ships Default Credentials and Repo-Wide Bind Mount

TBD

## CTR-P2-003 - Redis Password Exposed on Process Argument Vector

TBD

## CTR-P2-004 - Deploy Health Gate Ignores Worker Health

TBD

## CTR-P2-005 - No Container Resource/PID Limits Beyond Memory

TBD

## DATA-P2-001 - Blanket `anon` DML grant + default privileges make every future table anon-writable unless RLS happens to stop it

TBD

## DATA-P2-002 - Destructive table-replacement migrations are not transaction-wrapped

TBD

## DATA-P2-003 - `orphan-cleanup` deletes storage objects based on a truncated listing

TBD

## DATA-P2-004 - Migration CI dry-run diff is non-blocking; drift is never gated

TBD

## DATA-P2-005 - `audit_logs` org-delete cascade destroys compliance history; 365-day purge has no archive

TBD

## DATA-P2-006 - Several stores lack a retention policy and owner

TBD

## DATA-P2-007 - Generated DB types / schema can drift from migration intent

TBD

## DATA-P2-008 - Orphan cleanup reference query is unbounded in the object list

TBD

## DR-P2-001 - Backup-failure alerting is present but cannot be trusted to deliver

TBD

## DR-P2-002 - Terraform state bucket versioning is claimed but not backed by any resource

TBD

## DR-P2-003 - The backup/DR runbook and module docs describe a client-facing product, not the platform's own recovery, and the module doc is stale

TBD

## DR-P2-004 - Manual restore has no environment guardrail and the transient dump is written unencrypted to `/tmp`

TBD

## DR-P2-005 - The product `backup_status` module is not wired to any real platform backup heartbeat

TBD

## FEAT-P2-001 - API keys cannot authenticate; the feature is dead

TBD

## FEAT-P2-002 - Demo/test data can be seeded into a fresh production database

TBD

## FILE-P2-001 - `avatars` bucket is used by code but declared nowhere with no storage RLS policy

TBD

## FILE-P2-002 - Free-form `storageBucket`/`storagePath` on create/update allows signing arbitrary in-bucket objects

TBD

## FILE-P2-003 - No content/AV scanning and no bucket-level MIME/size limits on the documents bucket

TBD

## FILE-P2-004 - No backup or restore path for uploaded objects (durability for files)

TBD

## FILE-P2-005 - Content sniffing does not cover Office, archive, text/JSON, or polyglot payloads

TBD

## FILE-P2-006 - CSV exports do not neutralize formula injection and default to all rows when `organization_id` is omitted

TBD

## FINAL-P2-001 - Governance and observability gaps mean the platform cannot yet detect or control production failure

TBD

## FINAL-P2-002 - Residual authorization/secret defaults need explicit decisions

TBD

## HYG-P2-001 - Committed prompt/audit corpus bloats the repo and review surface

TBD

## HYG-P2-002 - Duplicate product catalogs have diverged

TBD

## INFRA-P2-001 - Prometheus alert rules have no delivery path (no Alertmanager)

TBD

## INFRA-P2-002 - Dev droplet capacity is under-provisioned and the CI value drifts from dev.tfvars.example

TBD

## INFRA-P2-003 - Operations documentation contradicts the current pipeline and configuration

TBD

## INFRA-P2-004 - Integration/security env vars referenced by the app schema are not delivered by the deploy pipeline

TBD

## INFRA-P2-005 - Redis container hardening was weakened and its password remains in process arguments

TBD

## INV-P2-001 - Committed generated artifacts drift without a gate

TBD

## INV-P2-002 - Duplicate schema bootstrap SQL can be mistaken for the source of truth

TBD

## IR-P2-001 - Several Prometheus metrics are declared but not wired, limiting incident diagnosis

TBD

## IR-P2-002 - No alerting on audit-trail gaps or privileged (impersonation/admin) abuse

TBD

## IR-P2-003 - No alerting when webhook dead-letters accumulate or payment reconciliation drifts

TBD

## IR-P2-004 - Secrets rotation is documented but has no exercised evidence

TBD

## IR-P2-005 - No platform status/communication surface for MCT's own outages

TBD

## IR-P2-006 - Migration dry-run result is discarded in CI

TBD

## MT-P2-001 - Admin global search lists all organizations and can fall through unscoped

TBD

## MT-P2-002 - By-id org filters are conditional, so they fail open if the org gate is not reached

TBD

## MT-P2-003 - Storage writer path and RLS org-derivation disagree (`orgs/<uuid>/` vs `<uuid>/`)

TBD

## MT-P2-004 - Realtime/SSE notification channel is scoped by user only, with no org assertion

TBD

## MT-P2-005 - Platform-admin cross-tenant access is role-key based, broad, and unalerted

TBD

## MT-P2-006 - Platform-wide report generators run as service role with no tenant guard on scope inputs

TBD

## NOTIF-P2-001 - Web Push channel is entirely absent (no subscriptions, no VAPID, no service worker)

TBD

## NOTIF-P2-002 - SMTP remains optional; email silently degrades to no-op in production

TBD

## NOTIF-P2-003 - Worker lacks an `unhandledRejection` handler (independently verified)

TBD

## NOTIF-P2-004 - Scheduled reminder inserts and email sends are not atomic; retries can double-send

TBD

## NOTIF-P2-005 - Sensitive ticket content is stored and emailed verbatim with no sensitivity filter

TBD

## NOTIF-P2-006 - API inline email fallback has no retry and ignores the send result

TBD

## OBS-P2-001 - Prometheus alert rules are not routed anywhere

TBD

## OBS-P2-002 - No committed dashboards or SLO/error-budget definitions

TBD

## OBS-P2-003 - Backup/restore is scheduled but not verified on the deployed branch

TBD

## PORT-P2-001 - 17 tracked shell scripts lack the exec bit; documented ./scripts/... commands fail

git update-index --chmod=+x the 17 scripts and commit; add a CI check that no tracked *.sh is mode 100644.

## PRIV-P2-001 - Google Analytics and Tawk.to load on public pages with no cookie-consent or opt-out gate

Gate GA/Tawk behind a consent manager (or use Google Consent Mode v2 with analytics_storage denied by default), record consent, and add a visible opt-out; document subprocessors and DPAs.

## REL-P2-001 - `CHANGELOG.md` is stale relative to HEAD for the final commits in the delta

TBD

## REL-P2-002 - No explicit Breaking Changes or upgrade manifest despite 34 migrations and RLS/entitlement behavior changes

TBD

## REL-P2-003 - No release-notes or GitHub Release body template; release body must be authored ad hoc

TBD

## REL-P2-004 - Rollback documentation is stale (Terraform push flow) and repeats the false approval claim

TBD

## RES-P2-001 - Worker process has no `unhandledRejection` handler

TBD

## RES-P2-002 - `WORKER_TIMEOUT` is not a real task timeout; generic task failures have no DLQ

TBD

## RES-P2-003 - `QUEUE_BACKEND` default `inline` diverges from production and can silently stall all queued work

TBD

## RES-P2-004 - External `fetch` calls without `AbortController` in `public.ts` and `auth.ts`

TBD

## RES-P2-005 - Availability detection lives inside the failed domain; no external dead-man's switch or alert delivery

TBD

## RES-P2-006 - Backup/restore recovery is configured but not evidenced as exercised, and the restore test verifies only table counts

TBD

## RLS-P2-001 - MSP platform-admin role keys missing from post-5302129 admin-gate RLS policies

TBD

## RLS-P2-002 - webhook_dead_letters has no user-scoped DELETE policy while the API deletes via the RLS client

TBD

## RLS-P2-003 - approve_project_task / add_project_task_comment trust a caller-supplied user id and are granted to authenticated

TBD

## SBOM-P2-001 - SBOM is artifact-only: not release-bound, not commit-bound, not attested

TBD

## SBOM-P2-002 - No container/image SBOM; base-image OS packages untracked

TBD

## SBOM-P2-003 - `docs/CI.md` documents the SBOM workflow as "Blocking" but it gates nothing

TBD

## SC-P2-001 - No image-level container scanning; Trivy scans filesystem only

TBD

## SC-P2-002 - No artifact provenance, attestation, or signing; `id-token: write` requested but unused

TBD

## SC-P2-003 - License policy not enforced in CI; non-OSI and LGPL licenses present

TBD

## SC-P2-004 - SBOM is generated but not bound to a commit or attached to releases/images

TBD

## SC-P2-005 - Dependabot PR backlog is large and not triaged; one stale update conflicts with resolved versions

TBD

## SEARCH-P2-001 - Raw search terms persisted in plaintext `audit_logs.metadata`

TBD

## SEARCH-P2-002 - Portal search omits documents despite SDK and documentation contract

TBD

## SEARCH-P2-003 - Admin search UI silently discards the documents result set

TBD

## SEARCH-P2-004 - No search pagination or result counts; hard 5-result ceiling

TBD

## SEARCH-P2-005 - Search query analytics metric is dead and the analytics summary RPC is missing

TBD

## SEARCH-P2-006 - Prefix/wildcard mismatch: no btree on prefix columns and no full-text (`tsvector`) search

TBD

## SEARCH-P2-007 - Typeahead calls full search endpoints without rate limiting or a dedicated autocomplete surface

TBD

## SEC-P2-001 - Secret scanner echoes the matched secret value into CI logs

Print only file, line number and rule name; never echo the diff or matched value; call ::add-mask:: before any echo. Apply the same change to scripts/scan-secrets.sh. Add a test asserting no matched value appears in output.

## SEC-P2-002 - Webhook SSRF guard has a DNS-rebinding TOCTOU window

Resolve once and connect to the validated IP while preserving the Host header (custom undici lookup / ssrf-req-filter), or re-validate the connected peer IP and abort on change; explicitly block link-local/metadata ranges. Apply the same pattern in webhook-management.ts.

## SEC-P2-003 - Client-onboarding mutations run without `requirePermission` (authorization outlier)

TBD

## SEC-P2-004 - MSP platform roles are cross-tenant for org access but not for permissions (inconsistent trust model)

TBD

## SEC-P2-005 - Forgot-password email redirect still uses attacker-controlled `Origin` header

TBD

## SEC-P2-006 - `GET /analytics/summary` calls a `get_analytics_summary` RPC that no migration defines

TBD

## SEC-P2-007 - RLS is bypassed on API requests by default (service-role is the default client)

TBD

## SEC-P2-008 - CAPTCHA/Turnstile is bypassed when the secret is unset

TBD

## SEC-P2-009 - `/health` publicly discloses provider configuration and Redis errors

TBD

## SECRET-P2-001 - Secret rotation inventory and GitHub matrix lag the schema/compose; seven keys uncovered

TBD

## SECRET-P2-002 - Rotation reminder workflow referenced in docs does not exist; rotation log shows no real rotation

TBD

## SECRET-P2-003 - Secret scanning is diff-scoped only; no full-history scan artifact

TBD

## SECRET-P2-004 - Produced Terraform `prod.tfvars` is tracked despite `.gitignore` intending to exclude it

TBD

## SUPPLY-P2-001 - `licenses.json` is committed but unenforced and unverified

TBD

## SUPPLY-P2-002 - Swagger UI loads an unpinned third-party script without SRI

TBD

## TEST-P2-001 - Accessibility gate width contradicts the code (docs say 19 pages, code scans 25)

TBD

## TEST-P2-002 - Worker data-mutating scan tasks still lack a dedicated test suite; branch threshold is a no-op

TBD

## TEST-P2-003 - E2E flakiness is documented but unresolved, and the prod-only gate masks it

TBD

## TEST-P2-004 - Load tests exist but are manual-only with no enforced thresholds or failure injection

TBD

## TEST-P2-005 - Orphan-cleanup tests model `storage.list` incorrectly, masking the data-loss bug

TBD

## TEST-P2-006 - Route suites stub authorization middleware, so new routes can regress silently

TBD

## WH-P2-001 - M365 inbound notifications have no enforced timestamp/replay window

TBD

## WH-P2-002 - Inline dispatcher records a fixed `retry_count` and duplicates the worker's retry logic

TBD

## WH-P2-003 - Outbound and DLQ delivery outcomes are not metered; only inbound success increments the counter

TBD

## WH-P2-004 - Inbound Jira/JSM signature falls back to re-serialized JSON when `req.rawBody` is absent

TBD

## WH-P2-005 - `webhook_dead_letters` has no DELETE policy while the API deletes via the RLS client

TBD

## WH-P2-006 - No per-provider payload schema or size cap on webhook ingress (global 10mb JSON limit)

TBD

## ACM-P3-001 - Client-side permission hiding is UI-only for several module actions

TBD

## ACM-P3-002 - No catalog-lint: referenced permission keys are not checked against the `permissions` table

TBD

## ACM-P3-003 - Public route surface is broad and has no single documented inventory

TBD

## ACM-P3-004 - `GET /roles/:id` and `GET /me/permissions` are readable without an admin gate

TBD

## ACM-P3-005 - RLS policies reference `manage` permissions that no role holds (dead predicates)

TBD

## ADMIN-P3-001 - Web admin gate accepts a broader role set than the API `requireAdmin` (guard/API divergence)

TBD

## ADMIN-P3-002 - Active-org cookie setter performs no server-side authorization

TBD

## ADMIN-P3-003 - Admin global search and dashboard expose global resource names/counts to any admin

TBD

## ADMIN-P3-004 - Global store catalog is mutable by any tenant admin

TBD

## AI-P3-001 - Embedded repo maps and historical pack outputs still reference the pre-rename repository path

TBD

## AI-P3-002 - `AGENTS.md` retains a large self-contradicting "snapshot" history that an agent must disambiguate

TBD

## AI-P3-003 - Secrets guidance is spread across instructions without a linked canonical runbook

TBD

## AN-P3-001 - Analytics has no consent-mode signalling and no documented event/retention governance

Adopt a consent-state contract, document each event's purpose and retention, and add the event schema to the data-governance docs.

## API-P3-001 - Minor contract inconsistencies (`rateLimitByUser` non-enveloped 429, capped raw-array lists, no `request_id`)

TBD

## API-P3-002 - OpenAPI artifact is not bound to a commit and the CI audit warns (not fails) on documented-but-missing routes

TBD

## API-P3-003 - Realtime client has no reconnect path; server emits `auth_expired` with no documented client handling

TBD

## API-P3-004 - `/metrics` is fully public when `METRICS_TOKEN` is unset

TBD

## ARCH-P3-001 - Web middleware gates routes on an unverified JWT `exp`

TBD

## BILL-P3-001 - Webhook raw body typed as `string` but consumed as `Buffer`

TBD

## BILL-P3-002 - Billing email stored in plaintext and raw Stripe payment-method id rendered to users

TBD

## BP-P3-001 - Hotfix and emergency-deploy documentation is a stub and partially stale

TBD

## BP-P3-002 - Dependabot has no security-update separation or triage SLA, and PR template has no enforced link to required checks

TBD

## CI-P3-001 - actionlint/shellcheck workflow lint issues (SC2086/SC2129/SC2002/SC2015)

Quote GITHUB_ENV/GITHUB_OUTPUT/GITHUB_STEP_SUMMARY and expression-derived variables; add an actionlint CI job (and optionally zizmor for security-specific checks).

## CI-P3-002 - Over-broad workflow token permissions (unused write scopes)

Remove unused actions: write / pull-requests: write; scope any genuinely needed write permission to the specific job (deploy-do.yml already job-scopes verify-attestations). Re-run actionlint/zizmor to confirm.

## CI-P3-003 - StrictHostKeyChecking=no in the deploy health check

Pin the droplet host key via a secret and use StrictHostKeyChecking=yes with a known_hosts file (or the host-key configuration used by the appleboy/ssh-action steps).

## CI-P3-004 - `main` is far behind `develop`; scheduled jobs fire only from the default branch

TBD

## CI-P3-005 - Secret scanner misses the platform's own token formats and scans diffs only

TBD

## CI-P3-006 - Unused permission grants across deploy/test workflows

TBD

## CI-P3-007 - DB restore test uses an unpinned `postgres:16-alpine` image

TBD

## CI-P3-008 - No release/tagging workflow and no post-merge release artifact

TBD

## CI-P3-009 - e2e is required on `main` but the documented flakiness makes it an unstable hard gate

TBD

## CI-P3-010 - Missing per-job timeouts and minor workflow hygiene gaps

TBD

## CONF-P3-001 - Secret rotation policy has no evidence any secret was ever rotated

Populate the Rotation Log on the next cycle with date, operator, environment and the gh secret set / deploy run URL; have the secret-rotation-reminder issue require a reviewer to confirm the log entry.

## CTR-P3-001 - Missing `--start-period` on API and Worker Healthchecks

TBD

## CTR-P3-002 - Broad `.dockerignore` `*.md`/`*.txt`/`*.log` Could Mask Needed Build Files

TBD

## DATA-P3-001 - Pre-baseline policies created without a preceding `drop policy if exists`

TBD

## DATA-P3-002 - Migration version gaps undocumented; brief states 141 migrations, tree has 127

TBD

## DET-P3-001 - [SUPPLY] 3 container image(s) without a digest pin

TBD

## DOC-P3-001 - Dated point-in-time audit reports are mixed with current runbooks with no archive/staleness marker

Move historical audits under docs/audits/ or docs/archive/ with a banner, and have docs/INDEX.md separate 'current' from 'historical'.

## DR-P3-001 - Duplicate backup-script logic in bash and PowerShell risks drift

TBD

## DR-P3-002 - Unpinned Postgres image in the restore test; no explicit jq/aws tool pinning in the backup job

TBD

## DR-P3-003 - Documented backup/DR export endpoints do not exist

TBD

## EVOL-P3-001 - Feature flags are a hardcoded static map with no managed service, change log, or targeting

Move flags to a managed store or a versioned config with an audit log, and support tenant/percentage targeting with a kill switch.

## FEAT-P3-001 - OpenAPI/Swagger surface is public and its UI is blocked by the API CSP

TBD

## FILE-P3-001 - Share endpoint has no per-token rate limit

TBD

## FILE-P3-002 - Client logo accept list still advertises SVG that the server rejects

TBD

## FILE-P3-003 - Documentation drift on file types and size limits; no documents/upload runbook

TBD

## HYG-P3-001 - Stale and machine-specific generated documentation

TBD

## HYG-P3-002 - Generated artifacts are inconsistently tracked

TBD

## INFRA-P3-001 - `env/prod.tfvars` is tracked despite an ignore rule that names it

TBD

## INFRA-P3-002 - Restore test uses a different Postgres major than the backup script and verifies only table counts

TBD

## INFRA-P3-003 - `docs/RTO_RPO.md` claims Redis AOF persistence that compose does not enable

TBD

## INFRA-P3-004 - `infra/terraform/README.md` references an `aws/` directory that does not exist

TBD

## INFRA-P3-005 - Terraform is manual-dispatch only, so the "push to trigger apply" rollback runbook step is a no-op

TBD

## INV-P3-001 - Large committed prompt/audit corpus inflates the application repository

TBD

## INV-P3-002 - Stale, machine-specific repo path in the agent reference

TBD

## IR-P3-001 - Terraform state restore guidance lacks a tested procedure

TBD

## IR-P3-002 - Monitoring doc and health endpoint disagree on check semantics; Redis severity undocumented in alerts

TBD

## MOB-P3-001 - PWA manifest ships only an SVG icon and is duplicated across three sources

Keep one manifest source (the Next metadata route), add 192/512 PNG and maskable icons, and delete the duplicate public manifests.

## MT-P3-001 - No automated cross-tenant isolation regression suite for application-layer scoping

TBD

## NOTIF-P3-001 - No email template system; repetitive inline HTML diverges between senders

TBD

## NOTIF-P3-002 - `sms` channel is a dead preference option; UI copy misstates enforcement

TBD

## NOTIF-P3-003 - SSE polling fallback interval is not cleared on unmount

TBD

## OBS-P3-001 - Incident runbooks/tabletop evidence is partial

TBD

## PERF-P3-001 - No bundle-size or performance budget gate; the analyzer is opt-in only

Add a size-limit or Lighthouse-CI/bundle budget to the web CI and fail on threshold, or publish a bundle report on PRs.

## PERF-P3-002 - API routes broadly select all columns (`select("*")`) and pagination is ad hoc

Project only needed columns, add a shared pagination/limit helper to list endpoints, and add a lint check for bare select("*") on large tables.

## REL-P3-001 - Commit history contains non-conventional noise commits and a single author, reducing automated-notes quality

TBD

## REL-P3-002 - PR template lacks changelog and versioned-artifact checkboxes

TBD

## RES-P3-001 - Worker graceful shutdown has no force-exit fallback

TBD

## RES-P3-002 - Worker queued webhook dispatcher inserts deliveries without an idempotency key

TBD

## RES-P3-003 - `AGENTS.md` documents the worker consumer incorrectly and omits the queue backend divergence

TBD

## RES-P3-004 - Deploy health gate treats worker unhealthiness as non-fatal

TBD

## RES-P3-005 - Orphan cleanup lists at most 1000 objects per bucket and cannot verify the purge shrank anything

TBD

## RLS-P3-001 - 5302116 grants anon UPDATE/DELETE on every table, amplified by no RLS-off × anon-write lint

TBD

## RLS-P3-002 - No behavioral RLS allow/deny matrix test (static gate only)

TBD

## RLS-P3-003 - storage_path_org_id trusts a client-controlled object name

TBD

## RLS-P3-004 - Duplicate scoped-client tests and stale coverage-matrix snapshot

TBD

## SBOM-P3-001 - Root license is ISC with no documented rationale

TBD

## SBOM-P3-002 - SBOM format/count not validated before upload; no regression guard

TBD

## SC-P3-001 - Root package license remains "ISC"

TBD

## SC-P3-002 - e2e Docker image is not digest-pinned

TBD

## SC-P3-003 - Secret-scanner pattern sets diverge between `.sh` and `.ps1`

TBD

## SEARCH-P3-001 - Soft-delete columns are defined but never used by queries or deletes

TBD

## SEARCH-P3-002 - Search module documentation is stale relative to the code

TBD

## SEC-P3-001 - gitleaks generic-api-key/jwt hits are false positives (no tracked secret)

Commit a .gitleaks.toml allowlisting prompts/manifest.json (hashes), the m365-hardening key and test fixtures; optionally run gitleaks in CI with high-confidence rules only. Do not allowlist broad path globs that could hide real secrets.

## SEC-P3-002 - `5302116` grants anon/authenticated full DML on every public table (RLS is the only gate)

TBD

## SEC-P3-003 - CORS reflects any origin with credentials when `CORS_ORIGIN="*"`

TBD

## SEC-P3-004 - `notification-preferences` PUT accepts a body `organizationId` without `assertOrgScopeMatches`

TBD

## SEC-P3-005 - `resolveEffectivePermissions` is uncached and fans out 4–6 queries per gated request

TBD

## SEC-P3-006 - Deprecated header and broad API CSP style directive

TBD

## SEC-P3-007 - M365 webhook `clientState` is compared non-constant-time

TBD

## SECRET-P3-001 - Worker `.env.example` omits `APP_BASE_URL`

TBD

## SECRET-P3-002 - Web runtime validator can silently fall back to a localhost API URL

TBD

## SECRET-P3-003 - No IT-level break-glass / emergency credential revocation runbook, and no revocation drill evidence

TBD

## SUPPLY-P3-001 - Unpinned container images (test/local only); production app images tag-based by design

Pin the playwright and postgres test images by digest and consider pinning the Supabase local image set; document that app images are intentionally tag-addressed and attestation-verified.

## SUPPLY-P3-002 - Dockerfile lint: missing WORKDIR in web runner stage and shell-form HEALTHCHECK

Add WORKDIR /app to the web runner stage before the COPYs; optionally use exec-form HEALTHCHECK arrays. Add hadolint to CI with documented ignores if needed.

## SUPPLY-P3-003 - SBOM is produced as a transient artifact, not bound to a release

TBD

## SUPPLY-P3-004 - A secrets file exists on disk outside git (should never be committed)

TBD

## TEST-P3-001 - Visual regression is still non-blocking with a known-broken Storybook build

TBD

## TEST-P3-002 - No scheduled production smoke check (health + login + critical read)

TBD

## TEST-P3-003 - Coverage thresholds remain modest and cannot be confirmed met at this SHA

TBD

## TEST-P3-004 - Coverage thresholds are low and E2E stability is unproven on `main`

TBD

## UX-P3-001 - Full accessibility breadth scan (68 routes) is triage-only and not a required check

Ratchet the breadth set into the default gate in batches (start with the currently-green pages), record a violation baseline, and make new violations fail the E2E gate.

## WH-P3-001 - Test endpoint generates a random idempotency key and never dedups

TBD

## WH-P3-002 - No committed event catalog or webhook documentation for consumers

TBD

