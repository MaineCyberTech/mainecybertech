# Patch plan

## DATA-P0-001 — Orphan cleanup can recursively delete a bucket's contents

TBD

## DR-P0-001 — No successful backup has ever run: every db-backup, storage-backup and db-restore-test CI run fails

TBD

## DR-P0-002 — Scheduled backup and restore-test workflows never run because they are absent from the default branch

TBD

## DR-P0-003 — The restore test never asserts integrity and therefore cannot fail on a bad backup

TBD

## IR-P0-001 — No platform-level incident response plan, roles, or postmortem process

TBD

## IR-P0-002 — No data breach response / notification process

TBD

## IR-P0-003 — Total loss of the monitoring/alerting path has no independent dead-man's-switch receiver

TBD

## OBS-P0-001 — Total loss of the monitoring/alerting path has no independent dead-man's-switch receiver

TBD

## ACM-P1-001 — Client-onboarding mutations run without any `requirePermission` gate

TBD

## ACM-P1-002 — `profiles.is_super_admin` is user-writable under the RLS self-update policy (forgeable super-admin flag)

TBD

## ADMIN-P1-001 — Org-agnostic `requireAdmin` lets a tenant admin read other tenants' admin data

TBD

## ADMIN-P1-002 — Impersonation/cross-tenant access is logged but not reviewable or alerted

TBD

## ADMIN-P1-003 — Role assignment paths let a delegated user-manager grant cross-tenant admin roles (self-escalation)

TBD

## AI-P1-001 — Vendored audit prompt packs are stale and the run manifest references a prompt the pack does not contain

TBD

## AI-P1-002 — `AGENTS.md` names a stale repository path and three developer docs state a stale accessibility gate size that no guard covers

TBD

## BILL-P1-001 — Module entitlements are derived but not enforced server-side

TBD

## BILL-P1-002 — `payments` table is never populated; payment history is silently empty

TBD

## BILL-P1-003 — Missing Stripe webhook events leave refunds, void, and payment lifecycle unrecorded

TBD

## BP-P1-001 — `main` requires a context (`Dependency Review`) that no job emits

TBD

## BP-P1-002 — `enforce_admins:false` lets administrators bypass all required checks and reviews

TBD

## BP-P1-003 — Production deploy path uses the unguarded `prod` environment, not `prod-approval`

TBD

## BP-P1-004 — PR #279 merged into main with required checks pending and zero reviews - live protection does not match the committed payloads (or an unrecorded bypass)

TBD

## CHAIN-P1-001 — Low-trust MSP role key composes into a cross-tenant read pivot

TBD

## CHAIN-P1-002 — Caller-controlled reset redirect composes into an account-takeover assist

TBD

## CHAIN-P1-003 — Branch-protection bypass + missing prod gate compose into unattended production change

TBD

## CHAIN-P1-004 — Delegated user-manager self-escalation to cross-tenant admin (role-assignment policy gap)

TBD

## CHAIN-P1-005 — Forgeable `profiles.is_super_admin` composes into full permission bypass and all-tenant RLS reads

TBD

## CHAIN-P1-006 — Tenant-blind response cache keys compose into cross-tenant aggregate disclosure

TBD

## CI-P1-001 — Production application deploys have no working manual-approval gate

TBD

## CI-P1-002 — Branch-protection-as-code has a likely-mismatched required check and permits admin bypass

TBD

## CI-P1-003 — Production deploy path cannot run; prod environment lacks secrets and protection rules

TBD

## CI-P1-004 — NEW: published fast-mode audit run fails the docs-links gate on main (required check + deploy gate red)

TBD

## CTR-P1-001 — No Container Image Vulnerability Scan in CI

TBD

## CTR-P1-002 — SBOM Is Lockfile-Only, Not an Image SBOM or Attestation

TBD

## CTR-P1-003 — Unsigned Images With No Provenance/Attestation

TBD

## DATA-P1-001 — Approved-membership RLS predicate reintroduced six times; pending/suspended members could access tenant data

TBD

## DATA-P1-002 — `retention` worker task performs unbounded deletes and reports success on partial failure

TBD

## DATA-P1-003 — Soft-delete columns remain dead schema; DELETE endpoints hard-delete

TBD

## DR-P1-001 — The weekly restore test fails at baseline load (invalid GITHUB_ENV format) so no restore verification ever executes

TBD

## DR-P1-002 — No backup or restore path exists for uploaded files in Supabase Storage

TBD

## DR-P1-003 — Restore-test backup location contract (`S3_BACKUP_BUCKET`) is undocumented and can silently mismatch the backup script

TBD

## DR-P1-004 — Database backups are unencrypted and stored in a single location with no offsite copy

TBD

## DR-P1-005 — The restore test has no failure alert

TBD

## DR-P1-006 — No automated migration reverse/rollback and no bad-migration drill

TBD

## DR-P1-007 — RPO/RTO targets are documented but unvalidated, and the Postgres RPO conflates PITR with the daily dump

TBD

## FILE-P1-001 — Public file-request upload is permission-gated and unreachable for anonymous uploaders

TBD

## FILE-P1-002 — File-request uploads have no tenant-scoped path and no download path; orphan cleanup will delete them

TBD

## FILE-P1-003 — Document version history objects are deleted at replace and by orphan cleanup

TBD

## INFRA-P1-001 — SSH is open to the internet on both droplets (admin_ip_ranges default 0.0.0.0/0 and CI never overrides it)

TBD

## INFRA-P1-002 — Terraform state-locking fix is incompatible with the pinned Terraform version (use_lockfile requires >= 1.10, workflows pin 1.9)

TBD

## IR-P1-001 — Rollback documentation contradicts itself on SHA-targeted rollback

TBD

## IR-P1-002 — Bad-migration recovery is manual-only with no automated reverse or staging proof

TBD

## IR-P1-003 — Worker health failure during deploy is non-fatal

TBD

## IR-P1-004 — Backups are not verified deeply enough to prove the documented RPO/RTO

TBD

## IR-P1-005 — Backup bucket configuration is inconsistent between the script, the backup workflow, and the restore test

TBD

## IR-P1-006 — No runtime detection or alerting for tenant-isolation (RLS) regressions

TBD

## MT-P1-001 — Audit log list and export are not org-scoped by default

TBD

## MT-P1-002 — Platform dashboards expose all-tenant aggregates to any single-org admin

TBD

## MT-P1-003 — Public file-request upload authorizes with a permission unioned across all orgs

TBD

## MT-P1-004 — Response cache keys omit the caller's tenant scope, so all-tenant responses can be served to single-org members

TBD

## NOTIF-P1-001 — Notification preferences are stored and displayed but never enforced on any send path

TBD

## NOTIF-P1-002 — API-originated notifications bypass the dedup unique index

TBD

## NOTIF-P1-003 — No delivery observability: email/notification failures are silent and unalerted

TBD

## NOTIF-P1-004 — Notification preference writes from the web UI omit organization_id (NOT NULL) so toggles cannot persist

TBD

## OBS-P1-001 — No runtime detection or alerting for tenant-isolation (RLS) regressions

TBD

## ORCH-P1-001 — Published main audit run is internally inconsistent (report/register ID divergence; full-domain metadata over a one-report inventory)

TBD

## REL-P1-001 — No version identity: no tags, no product version, no commit binding in generated artifacts

TBD

## REL-P1-002 — Documented production deploy path is stated as non-functional and the approval gate claim is false

TBD

## RLS-P1-001 — No runtime detection or alerting for tenant-isolation (RLS) regressions

TBD

## RLS-P1-002 — Approved-membership RLS predicate reintroduced six times; pending/suspended members could access tenant data

TBD

## SBOM-P1-001 — SBOM Is Lockfile-Only, Not an Image SBOM or Attestation

TBD

## SBOM-P1-002 — Unsigned Images With No Provenance/Attestation

TBD

## SBOM-P1-003 — No version identity: no tags, no product version, no commit binding in generated artifacts

TBD

## SBOM-P1-004 — No license allow/deny policy in dependency review or any CI gate

TBD

## SBOM-P1-005 — SBOM carries no license data and no dependency graph, limiting triage and license review

TBD

## SC-P1-001 — Critical/high advisories persist in the dev dependency tree; `next` override is mis-scoped

TBD

## SEARCH-P1-001 — `sanitizeSearchTerm` does not strip PostgREST `.` operator separators

TBD

## SEARCH-P1-002 — Admin global search exposes profile PII and never tenant-scopes the organizations query

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

## SECRET-P1-001 — M365 webhook secret is dead config while the real M365 auth value is undocumented and undeployed

TBD

## SECRET-P1-002 — Deploy pipeline does not write several secret-class env vars the API schema and compose reference

TBD

## SECRET-P1-003 — Rotation and emergency procedures target the wrong GitHub environment for the prod deploy and backup workflows

TBD

## USE-P1-001 — Self-service password reset dead-ends: the email link lands on a page that cannot complete the reset

TBD

## USE-P1-002 — Signup email-confirmation link points at the API host and 404s, blocking first login

TBD

## USE-P1-003 — Admin approval queue cannot approve or reject memberships (roleId sent as empty string)

TBD

## USE-P1-004 — Every SDK delete reports failure after succeeding because the client cannot parse empty 204 bodies

TBD

## WH-P1-001 — Outbound webhook idempotency is non-atomic in the API and absent in the worker dispatcher

TBD

## WH-P1-002 — M365 webhook auth depends on `M365_CLIENT_STATE` which the deploy pipeline does not write, while `M365_WEBHOOK_SECRET` is dead config

TBD

## ACM-P2-001 — `PLATFORM_ADMIN_KEYS` (org traversal) and `ADMIN_BYPASS_KEYS` (permission bypass) are inconsistent trust sets

TBD

## ACM-P2-002 — RLS is not a database backstop on API requests (service-role is the default client)

TBD

## ACM-P2-003 — Write and state-transition actions gated by `view` permissions (action mismatch)

TBD

## ACM-P2-004 — Webhook endpoint and delivery reads are available to any org member (not manage-gated)

TBD

## ACM-P2-005 — API keys store `expires_at` but nothing enforces or prunes expiry

TBD

## ACM-P2-006 — Webhook signing secrets are stored plaintext with no rotation or expiry

TBD

## ACM-P2-007 — Profiles are enumerable by email/id for any authenticated user

TBD

## ACM-P2-008 — API-key `permissions` are decorative: keys act with the creator's full permissions and the column is never enforced

TBD

## ADMIN-P2-001 — Sensitive admin exports are not audit-logged

TBD

## ADMIN-P2-002 — Destructive deletes are inconsistently confirmation-gated and org delete is unrecoverable

TBD

## ADMIN-P2-003 — Bulk document operations apply without a per-row preview or elevation guardrail

TBD

## ADMIN-P2-004 — Bulk invite creates pre-confirmed auth accounts (and org onboarding auto-approves admin)

TBD

## ADMIN-P2-005 — No rate limiting specific to expensive/destructive admin operations

TBD

## ADMIN-P2-006 — No undo/soft-delete is exercised despite the schema supporting it

TBD

## ADMIN-P2-007 — Approval flows allow self-approval and cancellation of already-approved requests

TBD

## ADMIN-P2-008 — Destructive deletes are not consistently audit-logged

TBD

## ADMIN-P2-009 — Any org member can open the Stripe billing portal for their org (no billing-contact check)

TBD

## AI-P2-001 — No machine-enforced agent guardrails: allowed paths, human-approval actions, and small-batch PR limits exist only as prose

TBD

## AI-P2-002 — Prompt packs embed generated outputs alongside instructions without a machine-detectable not-instructions marker

TBD

## AI-P2-003 — `.continue/` agent configuration defines models only and does not surface project rules or boundaries

TBD

## AN-P2-001 — Google Analytics and Tawk.to load on public pages with no cookie-consent or opt-out gate

TBD

## AN-P2-002 — Analytics API stores visitor IP and user-agent in plaintext despite the documented no-PII contract

TBD

## AN-P2-003 — Storefront analytics capture is dead: the browser helper is never called and cannot pass the CSRF gate

TBD

## AN-P2-004 — First-party analytics events have no retention or purge path

TBD

## AN-P2-005 — Visitor-alert tracking collects IP/geo before consent and sends the visitor IP to ip-api.com over plaintext HTTP

TBD

## API-P2-001 — Mutations remain unguarded by `requirePermission` in several routers (including a governance state transition)

TBD

## API-P2-002 — External integration syncs report success while dropping items, and `jsm-sync` has no HTTP retry

TBD

## API-P2-003 — Published error-handling contract contradicts the implementation (codes, 422, and `request_id`)

TBD

## API-P2-004 — SDK retries unsafe requests without an `Idempotency-Key` (duplicate creates on transient failure)

TBD

## API-P2-005 — Outbound webhook dispatcher uses a non-atomic idempotency check (duplicate deliveries under concurrency)

TBD

## API-P2-006 — Search falls through to an unscoped cross-tenant query

TBD

## API-P2-007 — OpenAPI schema is public and the Swagger UI is blocked by CSP

TBD

## ARCH-P2-001 — Single-droplet, single-instance runtime is a hard SPOF

TBD

## ARCH-P2-002 — API defaults to the service-role DB client (RLS bypass)

TBD

## ARCH-P2-003 — Prometheus loads rules but has no alert routing

TBD

## ARCH-P2-004 — API always enqueues to BullMQ while the worker backend is a separate setting with no parity check

TBD

## ARCH-P2-005 — One non-replicated Redis backs queue, cache, idempotency and scan locks; failure degrades silently

TBD

## BILL-P2-001 — No refund and incomplete trial/cancel state handling

TBD

## BILL-P2-002 — `POST /billing/sync` does not paginate Stripe results

TBD

## BILL-P2-003 — Reconciliation job has no drift detection, alerting, or tests

TBD

## BILL-P2-004 — Failed payments produce no notification or dunning visibility

TBD

## BILL-P2-005 — Subscription/invoice schema lacks trial, interval, and void-lifecycle fields

TBD

## BILL-P2-006 — Stripe webhook DB writes ignore errors and still mark the event processed

TBD

## BILL-P2-007 — Out-of-order or late-retried Stripe events can overwrite terminal payment states

TBD

## BILL-P2-008 — Billing read endpoints fall back to all-tenant scope for cross-tenant roles without an admin-scope guard or audit

TBD

## BP-P2-001 — `require_code_owner_reviews:false` makes the committed CODEOWNERS advisory only

TBD

## BP-P2-002 — No break-glass / bypass process for branch protection, and no bypass audit trail

TBD

## BP-P2-003 — No drift detection between committed branch-protection JSON and live GitHub settings

TBD

## BP-P2-004 — Path-filtered required checks can leave `main`/`develop` protected by checks that never run

TBD

## BP-P2-005 — Required-check guard is not run on pull requests or on branch-protection-only changes

TBD

## BP-P2-006 — `deploy-do` manual dispatch can target prod from an arbitrary ref, bypassing the develop->main promotion model

TBD

## BP-P2-007 — Security scan jobs are not required checks, so failing scans do not block merges

TBD

## CHAIN-P2-001 — Intra-tenant capability escalation via unguarded mutations

TBD

## CHAIN-P2-002 — Definer RPC identity trust composes into forged approvals/comments

TBD

## CHAIN-P2-003 — RLS admin-gate regression composes with the API trust model into MSP admin denials

TBD

## CHAIN-P2-004 — Retention + cascade compose into silent destruction of audit evidence

TBD

## CHAIN-P2-005 — Internet-open SSH composes into service-role exfiltration and tenant takeover

TBD

## CHAIN-P2-006 — Terraform version/lockfile conflict composes into un-gated infrastructure change

TBD

## CHAIN-P2-007 — Silent worker failures + in-stack monitoring compose into undetected degradation

TBD

## CHAIN-P2-008 — Decorative API-key permissions compose into over-privileged, RLS-bypassing machine credentials

TBD

## CHAIN-P2-009 — Unclaimed webhook retries and dedup gaps compose into duplicate outbound deliveries

TBD

## CHAIN-P2-010 — Guard-then-fetch worker monitoring composes into droplet-internal SSRF

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

## CI-P2-011 — release.yml fails on every promotion (SIGPIPE exit 141), so no tag/release/SBOM attachment is produced

TBD

## CTR-P2-001 — Pinned Base-Image Digests Have No Automated Refresh

TBD

## CTR-P2-002 — Local Compose Ships Default Credentials and Repo-Wide Bind Mount

TBD

## CTR-P2-003 — Redis Password Exposed on Process Argument Vector

TBD

## CTR-P2-004 — Deploy Health Gate Ignores Worker Health

TBD

## CTR-P2-005 — No Container Resource/PID Limits Beyond Memory

TBD

## CTR-P2-006 — Deploy verifies attestations by digest but pulls and runs images by tag (TOCTOU)

TBD

## DATA-P2-001 — Blanket `anon` DML grant + default privileges make every future table anon-writable unless RLS happens to stop it

TBD

## DATA-P2-002 — Destructive table-replacement migrations are not transaction-wrapped

TBD

## DATA-P2-003 — `orphan-cleanup` deletes storage objects based on a truncated listing

TBD

## DATA-P2-004 — Migration CI dry-run diff is non-blocking; drift is never gated

TBD

## DATA-P2-005 — `audit_logs` org-delete cascade destroys compliance history; 365-day purge has no archive

TBD

## DATA-P2-006 — Several stores lack a retention policy and owner

TBD

## DATA-P2-007 — Generated DB types / schema can drift from migration intent

TBD

## DATA-P2-008 — Orphan cleanup reference query is unbounded in the object list

TBD

## DATA-P2-009 — `updated_at` is frozen on 69 module tables (no trigger; generic PATCH drops it)

TBD

## DATA-P2-010 — Scheduled database dump and restore test target the dev environment only; production long-term backup is unproven

TBD

## DOC-P2-001 — Operations documentation contradicts the current pipeline and configuration

TBD

## DOC-P2-002 — Rollback documentation is stale (Terraform push flow) and repeats the false approval claim

TBD

## DOC-P2-003 — `docs/CI.md` documents the SBOM workflow as "Blocking" but it gates nothing

TBD

## DOC-P2-004 — Incident-response and breach docs still describe the alerting dead-man's switch as undeployed and list closed gaps

TBD

## DOC-P2-005 — docs/RELEASE_GATE.md is a stale status artifact contradicting the current verified-fixed register

TBD

## DOC-P2-006 — Alert-delivery secrets (NTFY_ALERTS_*, ALERTMANAGER_*) are missing from the canonical secret docs, which still name Slack as the only channel

TBD

## DOC-P2-007 — docs/GAP_ANALYSIS.md is an AWS-era historical draft presented as current

TBD

## DOC-P2-008 — docs/technical-writing/migration-guide.md documents commands and a release process that do not exist

TBD

## DOC-P2-009 — docs/audits/README.md omits the committed 905ed63 re-audit run, so the required Test check's docs-links guard fails at 7dd0402

TBD

## DR-P2-001 — Storage backups can be silently partial or empty: listings are truncated at 1000 objects and a zero-object archive is accepted

TBD

## DR-P2-002 — Storage backups are never restore-tested and the restore script asserts nothing

TBD

## DR-P2-003 — No independent backup-staleness alarm; notifier delivery failures are swallowed

TBD

## DR-P2-004 — Backup-failure alerting is present but cannot be trusted to deliver

TBD

## DR-P2-005 — Terraform state bucket versioning is claimed but not backed by any resource

TBD

## DR-P2-006 — The backup/DR runbook and module docs describe a client-facing product, not the platform's own recovery, and the module doc is stale

TBD

## DR-P2-007 — Manual restore has no environment guardrail and the transient dump is written unencrypted to `/tmp`

TBD

## DR-P2-008 — The product `backup_status` module is not wired to any real platform backup heartbeat

TBD

## DR-P2-009 — Production uploaded files have no backup or restore target: storage workflows attach the dev environment only

TBD

## EVOL-P2-001 — No module registry: module metadata is duplicated across six disconnected catalogs with no drift guard

TBD

## EVOL-P2-002 — Webhook UI advertises 11 event types but only 2 are ever dispatched; no event catalog exists

TBD

## FEAT-P2-001 — API keys cannot authenticate; the feature is dead

TBD

## FEAT-P2-002 — Demo/test data can be seeded into a fresh production database

TBD

## FEAT-P2-003 — Store analytics is unwired end-to-end: no client call sites, no admin UI consumer, and the summary RPC is undefined

TBD

## FEAT-P2-004 — Feature docs promise AI draft review gates, but `ai_draft_outputs` has no write path

TBD

## FEAT-P2-005 — Three tables are served by two divergent API surfaces (sop_library, insurance_evidence, satisfaction_pulses)

TBD

## FILE-P2-001 — `avatars` bucket is used by code but declared nowhere with no storage RLS policy

TBD

## FILE-P2-002 — Free-form `storageBucket`/`storagePath` on create/update allows signing arbitrary in-bucket objects

TBD

## FILE-P2-003 — No content/AV scanning and no bucket-level MIME/size limits on the documents bucket

TBD

## FILE-P2-004 — No backup or restore path for uploaded objects (durability for files)

TBD

## FILE-P2-005 — Content sniffing does not cover Office, archive, text/JSON, or polyglot payloads

TBD

## FILE-P2-006 — CSV exports do not neutralize formula injection and default to all rows when `organization_id` is omitted

TBD

## FILE-P2-007 — Document download authorization bypasses the `can_read_document` visibility model

TBD

## FILE-P2-008 — Members with `documents:create` can write objects straight to the documents bucket, bypassing upload validation

TBD

## HYGIENE-P2-001 — Committed prompt/audit corpus bloats the repo and review surface

TBD

## HYGIENE-P2-002 — Duplicate product catalogs have diverged

TBD

## HYGIENE-P2-003 — 17 tracked shell scripts lack the exec bit; documented ./scripts/... commands fail

TBD

## HYGIENE-P2-004 — AdminDocumentsCenterClient.tsx is a 2,322-line single component

TBD

## INFRA-P2-001 — Prometheus alert rules have no delivery path (no Alertmanager)

TBD

## INFRA-P2-002 — Dev droplet capacity is under-provisioned and the CI value drifts from dev.tfvars.example

TBD

## INFRA-P2-003 — Operations documentation contradicts the current pipeline and configuration

TBD

## INFRA-P2-004 — Integration/security env vars referenced by the app schema are not delivered by the deploy pipeline

TBD

## INFRA-P2-005 — Redis container hardening was weakened and its password remains in process arguments

TBD

## INFRA-P2-006 — Manual rollback script cannot authenticate to GHCR and defaults to the wrong image prefix

TBD

## INFRA-P2-007 — Deploy health gate ignores the monitoring and reverse-proxy containers

TBD

## INV-P2-001 — Committed generated artifacts drift without a gate

TBD

## INV-P2-002 — Duplicate schema bootstrap SQL can be mistaken for the source of truth

TBD

## IR-P2-001 — Several Prometheus metrics are declared but not wired, limiting incident diagnosis

TBD

## IR-P2-002 — No alerting on audit-trail gaps or privileged (impersonation/admin) abuse

TBD

## IR-P2-003 — No alerting when webhook dead-letters accumulate or payment reconciliation drifts

TBD

## IR-P2-004 — Secrets rotation is documented but has no exercised evidence

TBD

## IR-P2-005 — No platform status/communication surface for MCT's own outages

TBD

## IR-P2-006 — Migration dry-run result is discarded in CI

TBD

## IR-P2-007 — Platform IR and breach plans are stale on the deployed alerting path and reference template files that do not exist in docs/

TBD

## IR-P2-008 — On-call rota and escalation contacts are unassigned, so the incident plan is not operational

TBD

## IR-P2-009 — No tabletop exercise has been run and the scenario catalog is stale

TBD

## IR-P2-010 — Prometheus alert-rule unit tests are not wired into CI

TBD

## MOB-P2-001 — Service worker apps/web/public/sw.js is never registered, so PWA/offline support is inert

TBD

## MOB-P2-002 — sw.js cache strategy would persist authenticated API responses and all GET 200s if registered as-is

TBD

## MOB-P2-003 — No mobile-viewport E2E or accessibility coverage (Desktop Chrome only)

TBD

## MOB-P2-004 — About 41% of form controls render below 16px and trigger iOS Safari focus zoom

TBD

## MOB-P2-005 — Several modal dialogs have no max-height or vertical scroll and clip on small screens

TBD

## MT-P2-001 — Admin global search lists all organizations and can fall through unscoped

TBD

## MT-P2-002 — By-id org filters are conditional, so they fail open if the org gate is not reached

TBD

## MT-P2-003 — Storage writer path and RLS org-derivation disagree (`orgs/<uuid>/` vs `<uuid>/`)

TBD

## MT-P2-004 — Realtime/SSE notification channel is scoped by user only, with no org assertion

TBD

## MT-P2-005 — Platform-admin cross-tenant access is role-key based, broad, and unalerted

TBD

## MT-P2-006 — Platform-wide report generators run as service role with no tenant guard on scope inputs

TBD

## MT-P2-007 — Client-portal entitlement routes order requireAdmin before requireOrgAccess, bypassing the org-pinned admin check

TBD

## MT-P2-008 — Platform-wide store intake and analytics endpoints are readable by any tenant admin with no cross-tenant gate

TBD

## NOTIF-P2-001 — Web Push channel is entirely absent (no subscriptions, no VAPID, no service worker)

TBD

## NOTIF-P2-002 — SMTP remains optional; email silently degrades to no-op in production

TBD

## NOTIF-P2-003 — Worker lacks an `unhandledRejection` handler

TBD

## NOTIF-P2-004 — Scheduled reminder inserts and email sends are not atomic; retries can double-send

TBD

## NOTIF-P2-005 — Sensitive ticket content is stored and emailed verbatim with no sensitivity filter

TBD

## NOTIF-P2-006 — API inline email fallback has no retry and ignores the send result

TBD

## NOTIF-P2-007 — Realtime/SSE notification channel is scoped by user only, with no org assertion

TBD

## NOTIF-P2-008 — Backup-failure alerting is present but cannot be trusted to deliver

TBD

## NOTIF-P2-009 — notifyAndEmail enqueues email even when the in-app notification was deduped

TBD

## NOTIF-P2-010 — Notification delivery SLO counts a queued email hand-off as success and excludes worker send outcomes

TBD

## NOTIF-P2-011 — Alertmanager→ntfy critical alert delivery is optional in production and has no in-repo exercise evidence

TBD

## NOTIF-P2-012 — One-click unsubscribe is an unauthenticated GET with no expiry or confirmation; mail-security link scanners can silently opt users out

TBD

## OBS-P2-001 — Prometheus alert rules are not routed anywhere

TBD

## OBS-P2-002 — No committed dashboards or SLO/error-budget definitions

TBD

## OBS-P2-003 — Backup/restore is scheduled but not verified on the deployed branch

TBD

## OBS-P2-004 — Several Prometheus metrics are declared but not wired, limiting incident diagnosis

TBD

## OBS-P2-005 — No alerting on audit-trail gaps or privileged (impersonation/admin) abuse

TBD

## OBS-P2-006 — No alerting when webhook dead-letters accumulate or payment reconciliation drifts

TBD

## OBS-P2-007 — `/health` publicly discloses provider configuration and Redis errors

TBD

## OBS-P2-008 — Availability detection lives inside the failed domain; no external dead-man's switch or alert delivery

TBD

## OBS-P2-009 — Most golden-signal and SLO metrics have no alert rules (latency, circuit breaker, auth failures, notification/webhook failures, worker jobs, queue depth)

TBD

## OBS-P2-010 — HTTP metric labels use the raw request path, creating unbounded Prometheus series cardinality

TBD

## OBS-P2-011 — Web error tracking is silently disabled in production (code reads NEXT_PUBLIC_SENTRY_DSN; deploy provides SENTRY_DSN)

TBD

## OBS-P2-012 — Alerting configuration is not validated in CI and the deploy health gate ignores Prometheus/Alertmanager

TBD

## OBS-P2-013 — Empty METRICS_TOKEN has no deploy guard and is documented as optional; it breaks the API scrape and fires a false service-down alert

TBD

## OBS-P2-014 — Alert delivery and the dead-man's switch are configured but never exercised end-to-end; no monitoring-of-monitoring rules

TBD

## OBS-P2-015 — Container logs are not persisted off-box and are destroyed by the deploy's `compose down`

TBD

## OBS-P2-016 — No repository evidence of external uptime checks for platform endpoints; an edge/proxy failure is undetected in-stack

TBD

## OBS-P2-017 — External uptime probe is permanently red on api.mainecybertech.com while the API answers on app.mainecybertech.com/api, and the docs disagree on why

TBD

## ORCH-P2-001 — docs/audits/README.md documents a run contract that contradicts the pack and the actual runs, and its Runs table omits all three repo-deep-dive runs

TBD

## PERF-P2-001 — Request metrics label uses the raw URL path, so Prometheus cardinality grows with every resource ID

TBD

## PERF-P2-002 — Public storefront pages are force-dynamic and uncached; each page view costs two Supabase reads

TBD

## PERF-P2-003 — resolveEffectivePermissions is uncached and fans out 4-6 queries per gated request

TBD

## PERF-P2-004 — Bulk invite performs 4 sequential Supabase calls per invite and cannot finish 500 invites inside the 30s request timeout

TBD

## PERF-P2-005 — Each SSE notification stream opens its own Supabase Realtime channel with no connection cap

TBD

## PERF-P2-006 — POST /billing/sync does not paginate Stripe results

TBD

## PRIV-P2-001 — Google Analytics and Tawk.to load on public pages with no cookie-consent or opt-out gate

TBD

## PRIV-P2-002 — Consent is captured only in the browser and never recorded or enforced server-side; the store quote form collects PII with no consent at all

TBD

## PRIV-P2-003 — Published retention statement (three years) contradicts the 90-day contact-form PII purge

TBD

## PRIV-P2-004 — Audit-log PII redaction is a shallow key-name filter; person names and job titles are persisted for 365 days

TBD

## PRIV-P2-005 — No data-subject access/export/erasure path or DSAR runbook; offboarding never removes profile or auth records

TBD

## PRIV-P2-006 — Visitor IP addresses are sent to ip-api.com over plaintext HTTP for geolocation

TBD

## PRIV-P2-007 — Privacy governance documentation set is missing and the published vendor list omits processors used in code

TBD

## PRIV-P2-008 — Public store quote/lead PII has no automated retention or purge path and is excluded from the published retention statement

TBD

## REL-P2-001 — `CHANGELOG.md` is stale relative to HEAD for the final commits in the delta

TBD

## REL-P2-002 — No explicit Breaking Changes or upgrade manifest despite 34 migrations and RLS/entitlement behavior changes

TBD

## REL-P2-003 — No release-notes or GitHub Release body template; release body must be authored ad hoc

TBD

## REL-P2-004 — Rollback documentation is stale (Terraform push flow) and repeats the false approval claim

TBD

## REL-P2-005 — Release docs claim `main` is far behind `develop`; the repo state is the opposite

TBD

## REL-P2-006 — Release workflow fails on every promotion push, so no tag or GitHub Release is ever created

TBD

## RES-P2-001 — Worker process has no `unhandledRejection` handler

TBD

## RES-P2-002 — `WORKER_TIMEOUT` is not a real task timeout; generic task failures have no DLQ

TBD

## RES-P2-003 — `QUEUE_BACKEND` default `inline` diverges from production and can silently stall all queued work

TBD

## RES-P2-004 — External `fetch` calls without `AbortController` in `public.ts` and `auth.ts`

TBD

## RES-P2-005 — Availability detection lives inside the failed domain; no external dead-man's switch or alert delivery

TBD

## RES-P2-006 — Backup/restore recovery is configured but not evidenced as exercised, and the restore test verifies only table counts

TBD

## RES-P2-007 — Inbound webhook handlers ACK 200 while ignoring persistence errors, dropping events during DB degradation

TBD

## RES-P2-008 — Worker queue degradation is invisible to health checks and alerting

TBD

## RES-P2-009 — Graceful shutdown is not effective in production: Redis handles are never closed and Docker's 10s stop timeout kills the worker before its 30s drain budget

TBD

## RES-P2-010 — Deploys are stop-the-world: `docker compose down` before `up` takes the whole stack offline with no rolling replace

TBD

## RLS-P2-001 — MSP platform-admin role keys missing from post-5302129 admin-gate RLS policies

TBD

## RLS-P2-002 — webhook_dead_letters has no user-scoped DELETE policy while the API deletes via the RLS client

TBD

## RLS-P2-003 — approve_project_task / add_project_task_comment trust a caller-supplied user id and are granted to authenticated

TBD

## RLS-P2-004 — API defaults to the service-role DB client (RLS bypass)

TBD

## RLS-P2-005 — document_versions UPDATE policy still uses the raw unfiltered membership predicate

TBD

## RLS-P2-006 — store_quotes public INSERT policy allows arbitrary organization_id after tenant scoping

TBD

## RLS-P2-007 — Auth write endpoints call GoTrue admin APIs through the RLS-scoped client

TBD

## SBOM-P2-001 — SBOM is artifact-only: not release-bound, not commit-bound, not attested

TBD

## SBOM-P2-002 — No container/image SBOM; base-image OS packages untracked

TBD

## SBOM-P2-003 — `docs/CI.md` documents the SBOM workflow as "Blocking" but it gates nothing

TBD

## SBOM-P2-004 — No artifact provenance, attestation, or signing; `id-token: write` requested but unused

TBD

## SBOM-P2-005 — License policy not enforced in CI; non-OSI and LGPL licenses present

TBD

## SBOM-P2-006 — SBOM is generated but not bound to a commit or attached to releases/images

TBD

## SBOM-P2-007 — Dependabot PR backlog is large and not triaged; one stale update conflicts with resolved versions

TBD

## SBOM-P2-008 — `licenses.json` is committed but unenforced and unverified

TBD

## SBOM-P2-009 — License exceptions are matched by license string only - documented package scope and UNKNOWN fail open

TBD

## SBOM-P2-010 — Exception `expires` dates are documentation-only and never enforced by the gates

TBD

## SBOM-P2-011 — Deploy verifies the tag's attestation but pulls by mutable tag; the SBOM predicate is never verified

TBD

## SBOM-P2-012 — No scheduled dependency vulnerability re-scan - advisories are only evaluated on PRs and deploys

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

## SEARCH-P2-001 — Raw search terms persisted in plaintext `audit_logs.metadata`

TBD

## SEARCH-P2-002 — Portal search omits documents despite SDK and documentation contract

TBD

## SEARCH-P2-003 — Admin search UI silently discards the documents result set

TBD

## SEARCH-P2-004 — No search pagination or result counts; hard 5-result ceiling

TBD

## SEARCH-P2-005 — Search query analytics metric is dead and the analytics summary RPC is missing

TBD

## SEARCH-P2-006 — Prefix/wildcard mismatch: no btree on prefix columns and no full-text (`tsvector`) search

TBD

## SEARCH-P2-007 — Typeahead calls full search endpoints without rate limiting or a dedicated autocomplete surface

TBD

## SEARCH-P2-008 — Admin global search returns private/internal documents without applying the `can_read_document` visibility filter

TBD

## SEARCH-P2-009 — Search router bypasses the org-pinned admin check, so a tenant admin can read another tenant's search results

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

## SECRET-P2-001 — Secret rotation inventory and GitHub matrix lag the schema/compose; seven keys uncovered

TBD

## SECRET-P2-002 — Rotation reminder workflow referenced in docs does not exist; rotation log shows no real rotation

TBD

## SECRET-P2-003 — Secret scanning is diff-scoped only; no full-history scan artifact

TBD

## SECRET-P2-004 — Produced Terraform `prod.tfvars` is tracked despite `.gitignore` intending to exclude it

TBD

## SECRET-P2-005 — Workflow-scope PAT SCHEDULE_DISPATCH_TOKEN omitted from secret inventory and rotation policy

TBD

## SECRET-P2-006 — Secrets rotation is documented but has no exercised evidence

TBD

## SECRET-P2-007 — Incident response points at a secret-rotation runbook that is not in docs/

TBD

## SECRET-P2-008 — Terraform plan artifacts carry sensitive variable values off the runner

TBD

## SECRET-P2-009 — JWT rotation runbook rotates the API verification copy, not the Supabase signing secret, and references a nonexistent JWT_EXPIRY

TBD

## TEST-P2-001 — Accessibility gate width contradicts the code (docs say 19 pages, code scans 25)

TBD

## TEST-P2-002 — Worker data-mutating scan tasks still lack a dedicated test suite; branch threshold is a no-op

TBD

## TEST-P2-003 — E2E flakiness is documented but unresolved, and the prod-only gate masks it

TBD

## TEST-P2-004 — Load tests exist but are manual-only with no enforced thresholds or failure injection

TBD

## TEST-P2-005 — Orphan-cleanup tests model `storage.list` incorrectly, masking the data-loss bug

TBD

## TEST-P2-006 — Route suites stub authorization middleware, so new routes can regress silently

TBD

## TEST-P2-007 — docs/testing.md coverage-threshold table contradicts the ratcheted jest configs

TBD

## TEST-P2-008 — Test/suite totals in AGENTS.md and README are stale and never verified against the tree

TBD

## TEST-P2-009 — E2E is a required check on `main` but its PR path filter can leave it unreported

TBD

## TEST-P2-010 — The promoted commit has no green Test artifact: PR #281 merged before any required check completed and its Test run is red

TBD

## USE-P2-001 — Bulk document operations report success without per-item results (false success on partial failure)

TBD

## USE-P2-002 — Ticket lists and dashboard counts silently stop at 25 rows (no pagination) in portal and admin

TBD

## USE-P2-003 — Admin 'Delete Ticket' only closes the ticket; copy promises a restorable soft-delete and Restore is unreachable

TBD

## USE-P2-004 — Ticket notification deep links 404 in the portal (/portal/tickets/* does not exist)

TBD

## USE-P2-005 — Notification surfaces swallow failures: preferences save silently fails and a failed list load renders a false empty state

TBD

## USE-P2-006 — NotificationBell SSE fallback leaks a 30-second polling interval per component instance

TBD

## USE-P2-007 — Client-onboarding create swallows the redirect: success shows a cryptic error and invites duplicate records

TBD

## USE-P2-008 — Onboarding checklist items cannot be completed anywhere in the web app

TBD

## USE-P2-009 — Session/MFA expiry has no user-facing explanation and the ?mfa=required step-up redirect is ignored

TBD

## USE-P2-010 — Privileged membership/approval actions lack confirmation and success feedback (suspend/reject are one click)

TBD

## USE-P2-011 — Change Password form collects a Current Password it never checks and advertises a weaker rule than the API enforces

TBD

## UX-P2-001 — Ticket-card bulk selection nests a checkbox and a status button inside a Link, so ticking a ticket also navigates

TBD

## UX-P2-002 — Inline async action errors are not announced by assistive tech in ~44 components, contradicting the documented convention

TBD

## UX-P2-003 — Several dialogs have no max-height or internal scroll, so tall forms are clipped on small viewports

TBD

## UX-P2-004 — 89 of 319 pages have no page-specific title (79 dynamic detail pages + 10 static), so browser and AT titles are generic

TBD

## UX-P2-005 — @mct/ui primitives are largely bypassed: 6 files import Button, 1 uses Input/Dialog/Badge, while the app hand-rolls 234 raw cyber-button* usages and four Chip copies

TBD

## WH-P2-001 — M365 inbound notifications have no enforced timestamp/replay window

TBD

## WH-P2-002 — Inline dispatcher records a fixed `retry_count` and duplicates the worker's retry logic

TBD

## WH-P2-003 — Outbound and DLQ delivery outcomes are not metered; only inbound success increments the counter

TBD

## WH-P2-004 — Inbound Jira/JSM signature falls back to re-serialized JSON when `req.rawBody` is absent

TBD

## WH-P2-005 — `webhook_dead_letters` has no DELETE policy while the API deletes via the RLS client

TBD

## WH-P2-006 — No per-provider payload schema or size cap on webhook ingress (global 10mb JSON limit)

TBD

## WH-P2-007 — Webhook endpoint and delivery reads are available to any org member (not manage-gated)

TBD

## WH-P2-008 — Webhook signing secrets are stored plaintext with no rotation or expiry

TBD

## WH-P2-009 — Webhook SSRF guard has a DNS-rebinding TOCTOU window

TBD

## WH-P2-010 — No alerting when webhook dead-letters accumulate or payment reconciliation drifts

TBD

## WH-P2-011 — Admin dead-letter retry of inline-dispatched failures no-ops and deletes the DLQ row

TBD

## WH-P2-012 — `webhook-retry` has no row claim: concurrent retry runs can double-send deliveries

TBD

## ACM-P3-001 — Client-side permission hiding is UI-only for several module actions

TBD

## ACM-P3-002 — No catalog-lint: referenced permission keys are not checked against the `permissions` table

TBD

## ACM-P3-003 — Public route surface is broad and has no single documented inventory

TBD

## ACM-P3-004 — `GET /roles/:id` and `GET /me/permissions` are readable without an admin gate

TBD

## ACM-P3-005 — RLS policies reference `manage` permissions that no role holds (dead predicates)

TBD

## ACM-P3-006 — `GET /api-keys` lists org keys for any org member (no `api-keys:view` gate)

TBD

## ACM-P3-007 — AI copilot endpoints have no permission gate (any org member can run summarization and reply drafts)

TBD

## ACM-P3-008 — ACM-P3-008

TBD

## ADMIN-P3-001 — Web admin gate accepts a broader role set than the API `requireAdmin` (guard/API divergence)

TBD

## ADMIN-P3-002 — Active-org cookie setter performs no server-side authorization

TBD

## ADMIN-P3-003 — Admin global search and dashboard expose global resource names/counts to any admin

TBD

## ADMIN-P3-004 — Global store catalog is mutable by any tenant admin

TBD

## AI-P3-001 — Embedded repo maps and historical pack outputs still reference the pre-rename repository path

TBD

## AI-P3-002 — `AGENTS.md` retains a large self-contradicting snapshot history that an agent must disambiguate

TBD

## AI-P3-003 — Secrets guidance is spread across instructions without a linked canonical runbook

TBD

## AI-P3-004 — Committed audit corpus under docs/audits/ is outside the untrusted-data boundary and has no integrity pin

TBD

## AI-P3-005 — Audit output conventions in docs/audits/README.md are stale vs the committed runs

TBD

## AI-P3-006 — Prompt-pack provenance verification runs only at the deploy gate, not on PRs

TBD

## AI-P3-007 — No AI-authorship disclosure or provenance policy in contribution guidance

TBD

## AI-P3-008 — AGENTS.md Known Debt carries a stale promotion binding and a now-false branch-direction claim

TBD

## AN-P3-001 — Analytics has no consent-mode signalling and no documented event/retention governance

TBD

## AN-P3-002 — Anonymous direct inserts to store_analytics_events bypass API validation, rate limits, and retention

TBD

## AN-P3-003 — Consent is not recorded and the privacy policy omits first-party tracking stores and opt-out mechanics

TBD

## AN-P3-004 — Error telemetry has no explicit PII scrubbing, retention, or vendor disclosure

TBD

## AN-P3-005 — Consent withdrawal does not unload Tawk.to; the widget keeps running until the next page load

TBD

## AN-P3-006 — Analytics track endpoint accepts arbitrary event names and unbounded metadata; the event registry's privacy rules are not enforced server-side

TBD

## API-P3-001 — Minor contract inconsistencies (`rateLimitByUser` non-enveloped 429, capped raw-array lists, no `request_id`)

TBD

## API-P3-002 — OpenAPI artifact is not bound to a commit and the CI audit warns (not fails) on documented-but-missing routes

TBD

## API-P3-003 — Realtime client has no reconnect path; server emits `auth_expired` with no documented client handling

TBD

## API-P3-004 — `/metrics` is fully public when `METRICS_TOKEN` is unset

TBD

## API-P3-005 — Batch Jira/JSM/M365 sync tasks are registered but never dispatched (no scheduler or enqueue path)

TBD

## API-P3-006 — M365 calendar sync recreates a calendar event for every task on each run (duplicate events, no idempotency)

TBD

## API-P3-007 — M365 inbound webhook acknowledges but only processes the first notification of a batch

TBD

## API-P3-008 — GET /dynamic-forms/export.csv ignores format and returns JSON, contradicting the OpenAPI contract

TBD

## ARCH-P3-001 — Web middleware gates routes on an unverified JWT `exp`

TBD

## ARCH-P3-002 — Architecture diagram and ADR 004 contradict the as-built runtime

TBD

## ARCH-P3-003 — `NEXT_PUBLIC_API_URL` runtime override is inert for server-side code; docs claim internal SSR routing

TBD

## ARCH-P3-004 — Request timeout returns 408 but never cancels the handler

TBD

## ARCH-P3-005 — Worker metrics/health are unauthenticated while the API gates /metrics

TBD

## BILL-P3-001 — Webhook raw body typed as `string` but consumed as `Buffer`

TBD

## BILL-P3-002 — Billing email stored in plaintext and raw Stripe payment-method id rendered to users

TBD

## BILL-P3-003 — `invoice.paid` paid_at handling writes epoch dates (sync) or throws when status_transitions is missing (webhook)

TBD

## BILL-P3-004 — Payments list uses an inner join, hiding payments not linked to an invoice

TBD

## BILL-P3-005 — Entitlement override cannot revoke all modules (all-disabled falls back to the subscription set)

TBD

## BILL-P3-006 — Subscription mirror ignores seat quantity and the billing summary excludes trialing plans

TBD

## BILL-P3-007 — Portal 'Sync from Stripe' button is shown to client roles that lack billing:manage

TBD

## BILL-P3-008 — Billing docs contradict the implementation (sync gate, webhook verification, reconcile source, payment statuses)

TBD

## BILL-P3-009 — Entitlement enforcement fails open on billing-state lookup errors with no metric or alert

TBD

## BP-P3-001 — Hotfix and emergency-deploy documentation is a stub and partially stale

TBD

## BP-P3-002 — Dependabot has no security-update separation or triage SLA, and PR template has no enforced link to required checks

TBD

## BP-P3-003 — Operator checklists disagree on which prod environments need required reviewers (`prod` vs `prod-approval`)

TBD

## BP-P3-004 — check-required-checks guard mis-models explicit job names combined with matrices

TBD

## BP-P3-005 — No CODEOWNERS validation; invalid team handles silently disable owner-review enforcement

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

## CI-P3-014 — NEW: Storybook webpack fix landed but CI docs/comments still describe the Chromatic build as broken

TBD

## CTR-P3-001 — Missing `--start-period` on API and Worker Healthchecks

TBD

## CTR-P3-002 — Broad `.dockerignore` `*.md`/`*.txt`/`*.log` Could Mask Needed Build Files

TBD

## CTR-P3-003 — Caddy runs with a writable rootfs and a writable Caddyfile bind mount

TBD

## CTR-P3-004 — Prometheus has no healthcheck and observability is outside the deploy health gate

TBD

## CTR-P3-005 — Image-level HEALTHCHECK for api and worker lacks `--start-period`

TBD

## CTR-P3-006 — infra/digitalocean operator docs and `.env.example` drift from the deployed stack

TBD

## CTR-P3-007 — Third-party pinned images are not vulnerability-scanned in CI

TBD

## CTR-P3-008 — No Dockerfile lint gate in CI

TBD

## DATA-P3-001 — Pre-baseline policies created without a preceding `drop policy if exists`

TBD

## DATA-P3-002 — Migration version gaps undocumented; brief states 141 migrations, tree has 127

TBD

## DATA-P3-003 — Retention purge boundary behaviour is untested; the mock ignores the age cutoff and the PII purge has no tests

TBD

## DATA-P3-004 — Status-like text columns are not constrained by CHECK/enum, so app vocabulary is not enforced by the DB

TBD

## DATA-P3-005 — No down-migrations and destructive migrations lack rollback notes despite the repo's own naming guide

TBD

## DATA-P3-006 — Generated DB types carry no commit/version binding

TBD

## DATA-P3-007 — Governance CRUD accepts free-text statuses that the new CHECK constraints reject with a 500

TBD

## DET-P3-001 — [SEC] gitleaks not installed (secret scan skipped)

TBD

## DET-P3-002 — [SUPPLY] 3 container image(s) without a digest pin

TBD

## DOC-P3-001 — Dated point-in-time audit reports are mixed with current runbooks with no archive/staleness marker

TBD

## DOC-P3-002 — `AGENTS.md` documents the worker consumer incorrectly and omits the queue backend divergence

TBD

## DOC-P3-003 — Migration/workflow/OpenAPI counts drift in README.md, docs/ONBOARDING.md and the endpoint inventory, and the count guard does not cover them

TBD

## DOC-P3-004 — docs/MONITORING_AND_ALERTING.md contradicts the now-wired metrics and the fail-closed /metrics gate

TBD

## DOC-P3-005 — docs/TROUBLESHOOTING.md and docs/ONBOARDING.md name wrong deploy secrets/containers and stale memory limits

TBD

## DOC-P3-006 — docs/audits/README.md index omits the committed repo-deep-dive runs and its naming contract does not match them

TBD

## DOC-P3-007 — scripts/README.md omits 14 scripts, including every CI guard script

TBD

## DOC-P3-008 — AGENTS.md production compose table omits the alertmanager service

TBD

## DOC-P3-009 — Migration naming docs contradict each other and the repo's actual 5302xxx sequence

TBD

## DOC-P3-010 — docs/CI.md and chromatic.yml describe the Storybook webpack pin as pending work, but it is already applied

TBD

## DR-P3-001 — Platform DR drill plan is only in a dated audit folder and the drill ledger is empty

TBD

## DR-P3-002 — Duplicate backup-script logic in bash and PowerShell risks drift

TBD

## DR-P3-003 — Unpinned Postgres image in the restore test; no explicit jq/aws tool pinning in the backup job

TBD

## DR-P3-004 — Documented backup/DR export endpoints do not exist

TBD

## DR-P3-005 — Terraform state restore guidance lacks a tested procedure

TBD

## DR-P3-006 — Backup staleness check still prefers the retired SCHEDULE_DISPATCH_TOKEN over GITHUB_TOKEN

TBD

## DR-P3-007 — New DR drill plan's restore dependency table still documents the legacy full-URI S3_BACKUP_BUCKET

TBD

## EVOL-P3-001 — Feature flags are a hardcoded static map with no managed service, change log, or targeting

TBD

## EVOL-P3-002 — No catalog-lint: referenced permission keys are not checked against the permissions table

TBD

## EVOL-P3-003 — No committed event catalog or webhook documentation for consumers

TBD

## EVOL-P3-004 — API versioning policy is documented but not enforced (no Sunset/Deprecation mechanism; spec version unrelated to the app version)

TBD

## EVOL-P3-005 — Config model is duplicated per app; there is no shared env-schema package

TBD

## EVOL-P3-006 — Shared-package extraction is deferred: @mct/sdk and @mct/ui are source-only, and DB client setup is duplicated

TBD

## EVOL-P3-007 — Migration-strategy docs contradict each other and the tree (ISO vs sequential naming; seed.sql references)

TBD

## EVOL-P3-008 — Roles, plan-to-module mapping, and status vocabularies are hardcoded with no parity guard

TBD

## EVOL-P3-009 — Two overlapping outbound-webhook consumer docs (docs/EVENTS.md, docs/WEBHOOKS.md); only one is guarded and they already diverge

TBD

## FEAT-P3-001 — OpenAPI/Swagger surface is public and its UI is blocked by the API CSP

TBD

## FEAT-P3-002 — Eleven admin Store pages are static JSON views with disabled 'Coming soon' actions but appear as first-class admin-nav features

TBD

## FEAT-P3-003 — Duplicate scorecard docs; one documents a nonexistent /api/v1/scoreboard API and four tables

TBD

## FEAT-P3-004 — `portal_module_settings` is an orphaned table: per-org module configuration is never read or written

TBD

## FEAT-P3-005 — Dead server action `updateProjectBasics` remains exported but is never imported

TBD

## FEAT-P3-006 — Ticket status has no transition validation; any state can jump to any other

TBD

## FEAT-P3-007 — 2026-08-05 module audit docs still list fixed bugs and dead navigation as current

TBD

## FEAT-P3-008 — Seven server actions in the admin project detail are exported but never imported by product code

TBD

## FILE-P3-001 — Share endpoint has no per-token rate limit

TBD

## FILE-P3-002 — Client logo accept list still advertises SVG that the server rejects

TBD

## FILE-P3-003 — Documentation drift on file types and size limits; no documents/upload runbook

TBD

## FILE-P3-004 — Storage restore path exists but has never been exercised

TBD

## FILE-P3-005 — Share revocation does not invalidate already-issued signed URLs

TBD

## FILE-P3-006 — Oversized uploads return 500 instead of a validation error

TBD

## FILE-P3-007 — File-domain test gaps: no upload-validation unit tests and no file-request download coverage

TBD

## FILE-P3-008 — Previews render untrusted files inline without sandbox or disposition controls

TBD

## HYGIENE-P3-001 — Stale and machine-specific generated documentation

TBD

## HYGIENE-P3-002 — Generated artifacts are inconsistently tracked

TBD

## HYGIENE-P3-003 — Dead modules and a dead component with zero references

TBD

## HYGIENE-P3-004 — Orphaned one-off catalog scripts and their 1.2 MB content-map pipeline

TBD

## HYGIENE-P3-005 — Committed Python bytecode and a stale build artifact are tracked

TBD

## HYGIENE-P3-006 — Stray duplicate snippet file with local dev auth seed data

TBD

## HYGIENE-P3-007 — Root package script `sbom:licenses` is known-broken on the pinned pnpm

TBD

## HYGIENE-P3-008 — scripts/README.md index is stale: 14 scripts (10 active CI guards) are undocumented

TBD

## HYGIENE-P3-009 — No circular-dependency guard; one live import cycle in the worker

TBD

## HYGIENE-P3-010 — Explicit `any` is lint-disabled and 63 `supabase as any` casts sit at the typed-client boundary

TBD

## HYGIENE-P3-011 — AGENTS.md (120 KB) doubles as a historical changelog and is mirrored into review.md

TBD

## HYGIENE-P3-012 — Audit run layout contract is not met by the committed repo-deep-dive runs

TBD

## HYGIENE-P3-013 — Two Redis client libraries coexist in apps/api

TBD

## HYGIENE-P3-014 — docs/audits corpus grows unbounded with no size or retention policy (prompts/ is budget-guarded, audits are not)

TBD

## HYGIENE-P3-015 — scripts/README.md lists sync-product-catalog.mjs twice

TBD

## INFRA-P3-001 — `env/prod.tfvars` is tracked despite an ignore rule that names it

TBD

## INFRA-P3-002 — Restore test uses a different Postgres major than the backup script and verifies only table counts

TBD

## INFRA-P3-003 — `docs/RTO_RPO.md` claims Redis AOF persistence that compose does not enable

TBD

## INFRA-P3-004 — `infra/terraform/README.md` references an `aws/` directory that does not exist

TBD

## INFRA-P3-005 — Terraform is manual-dispatch only, so the "push to trigger apply" rollback runbook step is a no-op

TBD

## INFRA-P3-006 — infra/digitalocean/.env.example omits the alerting and internal-metrics variables the compose stack reads

TBD

## INFRA-P3-007 — Terraform tfvars generated/referenced at the module root are not covered by the .gitignore rule

TBD

## INFRA-P3-008 — Cloud-init UFW SSH allowlist is applied only at droplet creation, so narrowed allowlists leave stale host rule

TBD

## INFRA-P3-009 — METRICS_TOKEN has no fail-closed deploy guard; an empty token leaves the API scrape permanently down

TBD

## INFRA-P3-010 — Prometheus alert-rule unit tests exist but are not run in CI

TBD

## INV-P3-001 — Large committed prompt/audit corpus inflates the application repository

TBD

## INV-P3-002 — Stale, machine-specific repo path in the agent reference

TBD

## INV-P3-003 — Committed build artifact apps/web/public/version.json is stale and unguarded

TBD

## INV-P3-004 — Vestigial Vercel deploy configs remain after the DigitalOcean migration

TBD

## INV-P3-005 — Previous-run audit artifacts are amended in place without rebinding to the commit they now reflect

TBD

## INV-P3-006 — Committed Supabase Studio scratch snippet duplicates a dev seed

TBD

## INV-P3-007 — Service worker asset apps/web/public/sw.js is not registered anywhere

TBD

## IR-P3-001 — Terraform state restore guidance lacks a tested procedure

TBD

## IR-P3-002 — Monitoring doc and health endpoint disagree on check semantics; Redis severity undocumented in alerts

TBD

## IR-P3-003 — Monitoring doc still reports wired metrics as 'defined, not wired' and omits the alert rules added for impersonation and RLS

TBD

## IR-P3-004 — Alerting secrets are not documented in the secrets matrix or environment-variable reference

TBD

## IR-P3-005 — Incident plan's first triage step points responders at a URL that currently 404s

TBD

## MOB-P3-001 — PWA manifest ships only an SVG icon and is duplicated across three sources

TBD

## MOB-P3-002 — Icon-only controls have touch targets well below the 44x44 recommendation

TBD

## MOB-P3-003 — Notification dropdown is a fixed 320px panel anchored right-0 and clips on narrow phones

TBD

## MOB-P3-004 — themeColor is declared in the deprecated metadata export, so the theme-color meta tag is not emitted

TBD

## MOB-P3-005 — favicon.ico contains SVG bytes and no apple-touch-icon is declared

TBD

## MOB-P3-006 — Mobile-WebKit horizontal overflow on /login, /store and /store/quote is acknowledged but fixme'd out of the mobile gate

TBD

## MT-P3-001 — No automated cross-tenant isolation regression suite for application-layer scoping

TBD

## MT-P3-002 — Admin notification create accepts an arbitrary recipient and org-less rows bypass the SSE scope assertion

TBD

## NOTIF-P3-001 — No email template system; repetitive inline HTML diverges between senders

TBD

## NOTIF-P3-002 — `sms` channel is a dead preference option; UI copy misstates enforcement

TBD

## NOTIF-P3-003 — SSE polling fallback interval is not cleared on unmount

TBD

## NOTIF-P3-004 — `notification-preferences` PUT accepts a body `organizationId` without `assertOrgScopeMatches`

TBD

## NOTIF-P3-005 — No unsubscribe link or global opt-out in notification emails

TBD

## NOTIF-P3-006 — Worker reminder preference lookups omit the organization, so any org's opt-out suppresses the channel for all

TBD

## NOTIF-P3-007 — No per-recipient send throttle on notification producers

TBD

## NOTIF-P3-008 — Worker ticket-responded email builds the deep link from unescaped payload metadata (latent XSS-in-email)

TBD

## OBS-P3-001 — Incident runbooks/tabletop evidence is partial

TBD

## OBS-P3-002 — Monitoring doc and health endpoint disagree on check semantics; Redis severity undocumented in alerts

TBD

## OBS-P3-003 — `/metrics` is fully public when `METRICS_TOKEN` is unset

TBD

## OBS-P3-004 — API/worker Sentry release markers are not delivered (no SENTRY_RELEASE/GIT_SHA)

TBD

## OBS-P3-005 — Alertmanager secret provisioning gaps: matrix omits ALERTMANAGER_*; awk renderer breaks on '&' or backslash in values

TBD

## OBS-P3-006 — Metrics rate limiter leaves almost no headroom for the 15s scrape (max 5/min vs 4/min)

TBD

## OBS-P3-007 — SLO and monitoring docs drift from implemented metrics and alert rules

TBD

## ORCH-P3-001 — Finding identity is not stable across runs (deterministic IDs reused; legacy area codes persist), so verification status does not carry

TBD

## PERF-P3-001 — Unbounded list reads remain on compliance and time-entry endpoints; exports load up to 10k rows with select("*")

TBD

## PERF-P3-002 — Every paginated list request also runs an exact row count

TBD

## PERF-P3-003 — No bundle-size or performance budget gate; the analyzer is opt-in only

TBD

## PERF-P3-004 — API routes broadly select all columns (`select("*")`) and pagination is ad hoc

TBD

## PRIV-P3-001 — Breach-response and IR plans still claim Alertmanager is not deployed and IR-P0-003 is open

TBD

## PRIV-P3-002 — DATA_BREACH_RESPONSE claims audit_logs records source IP/user-agent; no runtime writer populates them

TBD

## PRIV-P3-003 — public-interaction-retention performs an unbounded single-statement delete and is not covered by the DATA-P1-002 batching fix

TBD

## PRIV-P3-004 — PRIVACY.md known-gaps section contradicts its own retention schedule (claims store_analytics_events has no purge)

TBD

## REL-P3-001 — Commit history contains non-conventional noise commits and a single author, reducing automated-notes quality

TBD

## REL-P3-002 — PR template lacks changelog and versioned-artifact checkboxes

TBD

## REL-P3-003 — CRITICAL dependency fix (handlebars override) shipped without a CHANGELOG entry

TBD

## REL-P3-004 — Delta changelog entries are filed under `Fixed` only, mislabelling features and operator changes

TBD

## RES-P3-001 — Worker graceful shutdown has no force-exit fallback

TBD

## RES-P3-002 — Worker queued webhook dispatcher inserts deliveries without an idempotency key

TBD

## RES-P3-003 — `AGENTS.md` documents the worker consumer incorrectly and omits the queue backend divergence

TBD

## RES-P3-004 — Deploy health gate treats worker unhealthiness as non-fatal

TBD

## RES-P3-005 — Orphan cleanup lists at most 1000 objects per bucket and cannot verify the purge shrank anything

TBD

## RES-P3-006 — Manual rollback script points at the wrong GHCR namespace and accepts non-2xx health codes

TBD

## RES-P3-007 — Circuit breaker leaks an uncleared timer per call and does not abort the timed-out operation

TBD

## RES-P3-008 — Service worker is shipped but never registered — offline capability is dead code

TBD

## RES-P3-009 — Failure-injection and load tests exist but are never executed by CI

TBD

## RES-P3-010 — `requestTimeout` responds 408 but does not abort the handler or close the connection

TBD

## RES-P3-011 — Task deadline fails the task but does not cancel its in-flight work: no production task consumes the context signal

TBD

## RES-P3-012 — Rolling deploy still hard-removes the Caddy ingress before recreating it, so every release has a short hard outage window

TBD

## RLS-P3-001 — 5302116 grants anon UPDATE/DELETE on every table, amplified by no RLS-off × anon-write lint

TBD

## RLS-P3-002 — No behavioral RLS allow/deny matrix test (static gate only)

TBD

## RLS-P3-003 — storage_path_org_id trusts a client-controlled object name

TBD

## RLS-P3-004 — Duplicate scoped-client tests and stale coverage-matrix snapshot

TBD

## RLS-P3-005 — RLS policies reference `manage` permissions that no role holds (dead predicates)

TBD

## RLS-P3-006 — No static lint for RLS role-gate drift or policy↔permission-catalog drift

TBD

## RLS-P3-007 — Scoped-client adoption is partial: several tenant modules have no RLS call sites and service helpers bypass the scoped client

TBD

## RLS-P3-008 — Four live policies still hardcode partial platform-role lists (document_shares trio omits super_admin; notifications insert omits six platform keys)

TBD

## SBOM-P3-001 — Root license is ISC with no documented rationale

TBD

## SBOM-P3-002 — SBOM format/count not validated before upload; no regression guard

TBD

## SBOM-P3-003 — Root package license remains "ISC"

TBD

## SBOM-P3-004 — SBOM is produced as a transient artifact, not bound to a release

TBD

## SBOM-P3-005 — Image SBOMs are attested but never validated (no floor or binding check)

TBD

## SBOM-P3-006 — Runbooks and script headers still document the broken `pnpm licenses list --json` command; docs/CI.md SBOM row is stale

TBD

## SBOM-P3-007 — Documented sharp license exception does not match the machine policy

TBD

## SBOM-P3-008 — Shipped third-party images and GitHub Actions dependencies have no SBOM coverage

TBD

## SBOM-P3-009 — PR license gate depends on the deprecated `deny-licenses` option and cannot fail on unknown licenses

TBD

## SBOM-P3-010 — NEW: validate-sbom.mjs silently drops its first positional path when --digest is absent

TBD

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

## SEARCH-P3-001 — Soft-delete columns are defined but never used by queries or deletes

TBD

## SEARCH-P3-002 — Search module documentation is stale relative to the code

TBD

## SEARCH-P3-003 — Search SDK and OpenAPI contracts do not cover the implemented response (documents, counts, limit)

TBD

## SEARCH-P3-004 — Portal search queries are not audit-logged, unlike the admin search route

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

## SEC-P3-013 — SEC-P3-013

TBD

## SECRET-P3-001 — Worker `.env.example` omits `APP_BASE_URL`

TBD

## SECRET-P3-002 — Web runtime validator can silently fall back to a localhost API URL

TBD

## SECRET-P3-003 — No IT-level break-glass / emergency credential revocation runbook, and no revocation drill evidence

TBD

## SECRET-P3-004 — Secret rotation policy has no evidence any secret was ever rotated

TBD

## SECRET-P3-005 — No automated `.env.example` <-> runtime schema <-> docs parity check

TBD

## TEST-P3-001 — Visual regression is still non-blocking with a known-broken Storybook build

TBD

## TEST-P3-002 — No scheduled production smoke check (health + login + critical read)

TBD

## TEST-P3-003 — Coverage thresholds remain modest and cannot be confirmed met at this SHA

TBD

## TEST-P3-004 — Coverage thresholds are low and E2E stability is unproven on `main`

TBD

## TEST-P3-005 — Shared packages/ui has no test runner and no lint/typecheck script

TBD

## USE-P3-001 — Portal ticket creation gives no success confirmation and the tested action is dead code with a mismatched field name

TBD

## USE-P3-002 — Offline/poor-network support is absent from the running app (service worker never registered)

TBD

## USE-P3-003 — Document version history is display-only: no per-version download/restore and it hides itself for single-version documents

TBD

## USE-P3-004 — Web edit flows never send If-Match, so concurrent admin edits silently overwrite each other

TBD

## USE-P3-005 — Form error handling is lossy or missing: signup can hang, onboarding errors are generic, bulk invite says 'Request failed'

TBD

## USE-P3-006 — Notification-bell SSE session expiry redirects to /login?reason=session_expired, but /login only recognizes reason=expired

TBD

## UX-P3-001 — Four Chip copies render a glyph-only '×' remove button with a sub-24px target size

TBD

## UX-P3-002 — Theme is documented dark-only but ships dead light/system code paths (CSS variables, ThemeProvider, Storybook toolbar)

TBD

## UX-P3-003 — Sidebar group toggles declare aria-haspopup='true' for a popup that is a link list, not a menu

TBD

## UX-P3-004 — Notification bell and store drawer toggles omit aria-expanded

TBD

## UX-P3-005 — Color-token drift: 66 files hardcode hex colors (80x #0A1118) and 45 arbitrary rgba card backgrounds instead of the design tokens

TBD

## UX-P3-006 — Heading order skips a level on the store import/export page

TBD

## UX-P3-007 — ScorecardsEvaluateClient renders the only programmatically unlabeled input in the app and an unannounced error

TBD

## UX-P3-008 — Signup form inputs lack autocomplete attributes

TBD

## UX-P3-009 — Storybook covers only the 7 @mct/ui primitives; packages/ui has no test/lint scripts and the a11y addon runs nowhere

TBD

## UX-P3-010 — Full accessibility breadth scan (68 routes) is triage-only and not a required check

TBD

## UX-P3-011 — The a11y gate scans only initial page loads; interactive states (dialogs, drawers, filters, bulk bars) and client-fetched content are untested

TBD

## WH-P3-001 — Test endpoint generates a random idempotency key and never dedups

TBD

## WH-P3-002 — No committed event catalog or webhook documentation for consumers

TBD

## WH-P3-003 — Worker queued webhook dispatcher inserts deliveries without an idempotency key

TBD

## WH-P3-004 — Webhook raw body typed as `string` but consumed as `Buffer`

TBD

## WH-P3-005 — Retried deliveries replay a body without the envelope `timestamp` (payload drift)

TBD

## WH-P3-006 — Delivery inserts ignore unique-key conflicts, losing the successful-attempt record

TBD

## WH-P3-007 — Outbound webhook response bodies are read without a size cap

TBD

## WH-P3-008 — M365 handler processes only the first notification in a batch (value[0])

TBD

## WH-P3-009 — No retention/cleanup for webhook_deliveries and webhook_dead_letters

TBD

## WH-P3-010 — Provider redelivery after the dedup TTL fails permanently with 500 (unique delivery-log key not conflict-handled)

TBD

