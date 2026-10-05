# Follow-up register

| Finding | Severity | Title | Owner | Target | Status | Note |
|---|---|---|---|---|---|---|
| DATA-P0-001 | P0 | Orphan cleanup can recursively delete a bucket’s contents | @owner | DATA | open | remediation |
| DR-P0-001 | P0 | Scheduled backup and restore-test workflows never run because they are absent from the default branch | @owner | DR | open | remediation |
| DR-P0-002 | P0 | The restore test never asserts integrity and therefore cannot fail on a bad backup | @owner | DR | open | remediation |
| IR-P0-001 | P0 | No platform-level incident response plan, roles, or postmortem process | @owner | IR | open | remediation |
| IR-P0-002 | P0 | No data breach response / notification process | @owner | IR | open | remediation |
| IR-P0-003 | P0 | Total loss of the monitoring/alerting path has no independent dead-man's-switch receiver | @owner | IR | open | remediation |
| ACM-P1-001 | P1 | Client-onboarding mutations run without any `requirePermission` gate | @owner | ACM | open | remediation |
| ADMIN-P1-001 | P1 | Org-agnostic `requireAdmin` lets a tenant admin read other tenants' admin data | @owner | ADMIN | open | remediation |
| ADMIN-P1-002 | P1 | Impersonation/cross-tenant access is logged but not reviewable or alerted | @owner | ADMIN | open | remediation |
| AI-P1-001 | P1 | Vendored audit prompt packs are stale and the run manifest references a prompt the pack does not contain | @owner | AI | open | remediation |
| AI-P1-002 | P1 | `AGENTS.md` names a stale repository path and three developer docs state a stale accessibility gate size that no guard covers | @owner | AI | open | remediation |
| BILL-P1-001 | P1 | Module entitlements are derived but not enforced server-side | @owner | BILL | open | remediation |
| BILL-P1-002 | P1 | `payments` table is never populated; payment history is silently empty | @owner | BILL | open | remediation |
| BILL-P1-003 | P1 | Missing Stripe webhook events leave refunds, void, and payment lifecycle unrecorded | @owner | BILL | open | remediation |
| BP-P1-001 | P1 | `main` requires a context (`Dependency Review`) that no job emits | @owner | BP | open | remediation |
| BP-P1-002 | P1 | `enforce_admins:false` lets administrators bypass all required checks and reviews | @owner | BP | open | remediation |
| BP-P1-003 | P1 | Production deploy path uses the unguarded `prod` environment, not `prod-approval` | @owner | BP | open | remediation |
| CHAIN-P1-001 | P1 | Low-trust MSP role key composes into a cross-tenant read pivot | @owner | CHAIN | open | remediation |
| CHAIN-P1-002 | P1 | Caller-controlled reset redirect composes into an account-takeover assist | @owner | CHAIN | open | remediation |
| CHAIN-P1-003 | P1 | Branch-protection bypass + missing prod gate compose into unattended production change | @owner | CHAIN | open | remediation |
| CI-P1-001 | P1 | Production application deploys have no working manual-approval gate | @owner | CI | open | remediation |
| CI-P1-002 | P1 | Branch-protection-as-code has a likely-mismatched required check and permits admin bypass | @owner | CI | open | remediation |
| CI-P1-003 | P1 | Production deploy path cannot run; prod environment lacks secrets and protection rules | @owner | CI | open | remediation |
| CTR-P1-001 | P1 | No Container Image Vulnerability Scan in CI | @owner | CTR | open | remediation |
| CTR-P1-002 | P1 | SBOM Is Lockfile-Only, Not an Image SBOM or Attestation | @owner | CTR | open | remediation |
| CTR-P1-003 | P1 | Unsigned Images With No Provenance/Attestation | @owner | CTR | open | remediation |
| DATA-P1-001 | P1 | Approved-membership RLS predicate reintroduced six times; pending/suspended members could access tenant data | @owner | DATA | open | remediation |
| DATA-P1-002 | P1 | `retention` worker task performs unbounded deletes and reports success on partial failure | @owner | DATA | open | remediation |
| DATA-P1-003 | P1 | Soft-delete columns remain dead schema; DELETE endpoints hard-delete | @owner | DATA | open | remediation |
| DR-P1-001 | P1 | No backup or restore path exists for uploaded files in Supabase Storage | @owner | DR | open | remediation |
| DR-P1-002 | P1 | Restore-test backup location contract (`S3_BACKUP_BUCKET`) is undocumented and can silently mismatch the backup script | @owner | DR | open | remediation |
| DR-P1-003 | P1 | Database backups are unencrypted and stored in a single location with no offsite copy | @owner | DR | open | remediation |
| DR-P1-004 | P1 | The restore test has no failure alert | @owner | DR | open | remediation |
| DR-P1-005 | P1 | No automated migration reverse/rollback and no bad-migration drill | @owner | DR | open | remediation |
| DR-P1-006 | P1 | RPO/RTO targets are documented but unvalidated, and the Postgres RPO conflates PITR with the daily dump | @owner | DR | open | remediation |
| FILE-P1-001 | P1 | Public file-request upload is permission-gated and unreachable for anonymous uploaders | @owner | FILE | open | remediation |
| FILE-P1-002 | P1 | File-request uploads have no tenant-scoped path and no download path; orphan cleanup will delete them | @owner | FILE | open | remediation |
| FILE-P1-003 | P1 | Document version history objects are deleted at replace and by orphan cleanup | @owner | FILE | open | remediation |
| FINAL-P1-001 | P1 | P0 data-loss path and unverified "fixed" claim block a clean release | @owner | FINAL | open | remediation |
| INFRA-P1-001 | P1 | SSH is open to the internet on both droplets (admin_ip_ranges default 0.0.0.0/0 and CI never overrides it) | @owner | INFRA | open | remediation |
| INFRA-P1-002 | P1 | Terraform state-locking fix is incompatible with the pinned Terraform version (use_lockfile requires >= 1.10, workflows pin 1.9) | @owner | INFRA | open | remediation |
| IR-P1-001 | P1 | Rollback documentation contradicts itself on SHA-targeted rollback | @owner | IR | open | remediation |
| IR-P1-002 | P1 | Bad-migration recovery is manual-only with no automated reverse or staging proof | @owner | IR | open | remediation |
| IR-P1-003 | P1 | Worker health failure during deploy is non-fatal | @owner | IR | open | remediation |
| IR-P1-004 | P1 | Backups are not verified deeply enough to prove the documented RPO/RTO | @owner | IR | open | remediation |
| IR-P1-005 | P1 | Backup bucket configuration is inconsistent between the script, the backup workflow, and the restore test | @owner | IR | open | remediation |
| IR-P1-006 | P1 | No runtime detection or alerting for tenant-isolation (RLS) regressions | @owner | IR | open | remediation |
| MT-P1-001 | P1 | Audit log list and export are not org-scoped by default | @owner | MT | open | remediation |
| MT-P1-002 | P1 | Platform dashboards expose all-tenant aggregates to any single-org admin | @owner | MT | open | remediation |
| MT-P1-003 | P1 | Public file-request upload authorizes with a permission unioned across all orgs | @owner | MT | open | remediation |
| NOTIF-P1-001 | P1 | Notification preferences are stored and displayed but never enforced on any send path | @owner | NOTIF | open | remediation |
| NOTIF-P1-002 | P1 | API-originated notifications bypass the dedup unique index | @owner | NOTIF | open | remediation |
| NOTIF-P1-003 | P1 | No delivery observability: email/notification failures are silent and unalerted | @owner | NOTIF | open | remediation |
| REL-P1-001 | P1 | No version identity: no tags, no product version, no commit binding in generated artifacts | @owner | REL | open | remediation |
| REL-P1-002 | P1 | Documented production deploy path is stated as non-functional and the approval gate claim is false | @owner | REL | open | remediation |
| SBOM-P1-001 | P1 | No license allow/deny policy in dependency review or any CI gate | @owner | SBOM | open | remediation |
| SBOM-P1-002 | P1 | SBOM carries no license data and no dependency graph, limiting triage and license review | @owner | SBOM | open | remediation |
| SC-P1-001 | P1 | Critical/high advisories persist in the dev dependency tree; `next` override is mis-scoped | @owner | SC | open | remediation |
| SEARCH-P1-001 | P1 | `sanitizeSearchTerm` does not strip PostgREST `.` operator separators | @owner | SEARCH | open | remediation |
| SEARCH-P1-002 | P1 | Admin global search exposes profile PII and never tenant-scopes the organizations query | @owner | SEARCH | open | remediation |
| SEC-P1-001 | P1 | PII field encryption silently degrades to reversible plaintext | @owner | SEC | open | remediation |
| SECRET-P1-001 | P1 | M365 webhook secret is dead config while the real M365 auth value is undocumented and undeployed | @owner | SECRET | open | remediation |
| SECRET-P1-002 | P1 | Deploy pipeline does not write several secret-class env vars the API schema and compose reference | @owner | SECRET | open | remediation |
| WH-P1-001 | P1 | Outbound webhook idempotency is non-atomic in the API and absent in the worker dispatcher | @owner | WH | open | remediation |
| WH-P1-002 | P1 | M365 webhook auth depends on `M365_CLIENT_STATE` which the deploy pipeline does not write, while `M365_WEBHOOK_SECRET` is dead config | @owner | WH | open | remediation |
| ACM-P2-001 | P2 | `PLATFORM_ADMIN_KEYS` (org traversal) and `ADMIN_BYPASS_KEYS` (permission bypass) are inconsistent trust sets | @owner | ACM | open | remediation |
| ACM-P2-002 | P2 | RLS is not a database backstop on API requests (service-role is the default client) | @owner | ACM | open | remediation |
| ACM-P2-003 | P2 | Write and state-transition actions gated by `view` permissions (action mismatch) | @owner | ACM | open | remediation |
| ACM-P2-004 | P2 | Webhook endpoint and delivery reads are available to any org member (not manage-gated) | @owner | ACM | open | remediation |
| ACM-P2-005 | P2 | API keys store `expires_at` but nothing enforces or prunes expiry | @owner | ACM | open | remediation |
| ACM-P2-006 | P2 | Webhook signing secrets are stored plaintext with no rotation or expiry | @owner | ACM | open | remediation |
| ACM-P2-007 | P2 | Profiles are enumerable by email/id for any authenticated user | @owner | ACM | open | remediation |
| ADMIN-P2-001 | P2 | Sensitive admin exports are not audit-logged | @owner | ADMIN | open | remediation |
| ADMIN-P2-002 | P2 | Destructive deletes are inconsistently confirmation-gated and org delete is unrecoverable | @owner | ADMIN | open | remediation |
| ADMIN-P2-003 | P2 | Bulk document operations apply without a per-row preview or elevation guardrail | @owner | ADMIN | open | remediation |
| ADMIN-P2-004 | P2 | Bulk invite creates pre-confirmed auth accounts (and org onboarding auto-approves admin) | @owner | ADMIN | open | remediation |
| ADMIN-P2-005 | P2 | No rate limiting specific to expensive/destructive admin operations | @owner | ADMIN | open | remediation |
| ADMIN-P2-006 | P2 | No undo/soft-delete is exercised despite the schema supporting it | @owner | ADMIN | open | remediation |
| AI-P2-001 | P2 | No machine-enforced agent guardrails: allowed paths, human-approval actions, and small-batch PR limits exist only as prose | @owner | AI | open | remediation |
| AI-P2-002 | P2 | Prompt packs embed generated outputs alongside instructions without a machine-detectable "not instructions" marker | @owner | AI | open | remediation |
| AI-P2-003 | P2 | `.continue/` agent configuration defines models only and does not surface project rules or boundaries | @owner | AI | open | remediation |
| API-P2-001 | P2 | Mutations remain unguarded by `requirePermission` in several routers (including a governance state transition) | @owner | API | open | remediation |
| API-P2-002 | P2 | External integration syncs report success while dropping items, and `jsm-sync` has no HTTP retry | @owner | API | open | remediation |
| API-P2-003 | P2 | Published error-handling contract contradicts the implementation (codes, 422, and `request_id`) | @owner | API | open | remediation |
| API-P2-004 | P2 | SDK retries unsafe requests without an `Idempotency-Key` (duplicate creates on transient failure) | @owner | API | open | remediation |
| API-P2-005 | P2 | Outbound webhook dispatcher uses a non-atomic idempotency check (duplicate deliveries under concurrency) | @owner | API | open | remediation |
| API-P2-006 | P2 | Search falls through to an unscoped cross-tenant query | @owner | API | open | remediation |
| API-P2-007 | P2 | OpenAPI schema is public and the Swagger UI is blocked by CSP | @owner | API | open | remediation |
| ARCH-P2-001 | P2 | Single-droplet, single-instance runtime is a hard SPOF | @owner | ARCH | open | remediation |
| ARCH-P2-002 | P2 | API defaults to the service-role DB client (RLS bypass) | @owner | ARCH | open | remediation |
| ARCH-P2-003 | P2 | Prometheus loads rules but has no alert routing | @owner | ARCH | open | remediation |
| BILL-P2-001 | P2 | No refund and incomplete trial/cancel state handling | @owner | BILL | open | remediation |
| BILL-P2-002 | P2 | `POST /billing/sync` does not paginate Stripe results | @owner | BILL | open | remediation |
| BILL-P2-003 | P2 | Reconciliation job has no drift detection, alerting, or tests | @owner | BILL | open | remediation |
| BILL-P2-004 | P2 | Failed payments produce no notification or dunning visibility | @owner | BILL | open | remediation |
| BILL-P2-005 | P2 | Subscription/invoice schema lacks trial, interval, and void-lifecycle fields | @owner | BILL | open | remediation |
| BP-P2-001 | P2 | `require_code_owner_reviews:false` makes the committed CODEOWNERS advisory only | @owner | BP | open | remediation |
| BP-P2-002 | P2 | No break-glass / bypass process for branch protection, and no bypass audit trail | @owner | BP | open | remediation |
| BP-P2-003 | P2 | No drift detection between committed branch-protection JSON and live GitHub settings | @owner | BP | open | remediation |
| BP-P2-004 | P2 | Path-filtered required checks can leave `main`/`develop` protected by checks that never run | @owner | BP | open | remediation |
| CHAIN-P2-001 | P2 | Intra-tenant capability escalation via unguarded mutations | @owner | CHAIN | open | remediation |
| CHAIN-P2-002 | P2 | Definer RPC identity trust composes into forged approvals/comments | @owner | CHAIN | open | remediation |
| CHAIN-P2-003 | P2 | RLS admin-gate regression composes with the API trust model into MSP admin denials | @owner | CHAIN | open | remediation |
| CHAIN-P2-004 | P2 | Retention + cascade compose into silent destruction of audit evidence | @owner | CHAIN | open | remediation |
| CHAIN-P2-005 | P2 | Internet-open SSH composes into service-role exfiltration and tenant takeover | @owner | CHAIN | open | remediation |
| CHAIN-P2-006 | P2 | Terraform version/lockfile conflict composes into un-gated infrastructure change | @owner | CHAIN | open | remediation |
| CHAIN-P2-007 | P2 | Silent worker failures + in-stack monitoring compose into undetected degradation | @owner | CHAIN | open | remediation |
| CI-P2-001 | P2 | World-open DigitalOcean firewall mutation with no approval and unvalidated udp_port | @owner | CI | open | Add an environment approval (prod-approval or a dedicated firewall-approval), restrict droplet to an explicit choice all |
| CI-P2-002 | P2 | Deploy-gate secret scan is a no-op on pushes to main | @owner | CI | open | For push events, diff against github.event.before (fall back to HEAD~1 when it is all-zeros), not git merge-base with or |
| CI-P2-003 | P2 | Production approval environment documented as having no required reviewers | @owner | CI | open | Configure prod-approval with 1+ required reviewers in GitHub Settings -> Environments, move prod migrations under prod-a |
| CI-P2-004 | P2 | DB restore test reports success without asserting restore integrity | @owner | CI | open | remediation |
| CI-P2-005 | P2 | Infrastructure changes are no longer gated in CI (terraform-do is manual-dispatch only) | @owner | CI | open | remediation |
| CI-P2-006 | P2 | Chromatic visual-regression job is permanently non-blocking | @owner | CI | open | remediation |
| CI-P2-007 | P2 | Branch protection permits admin bypass and ignores CODEOWNERS | @owner | CI | open | remediation |
| CI-P2-008 | P2 | Terraform apply is manual and drift detection is not automated | @owner | CI | open | remediation |
| CONF-P2-001 | P2 | Workflow-scope PAT SCHEDULE_DISPATCH_TOKEN omitted from secret inventory and rotation policy | @owner | CONF | open | Add SCHEDULE_DISPATCH_TOKEN to the secrets matrix and SECRETS_ROTATION.md with an owner and 90-day rotation; prefer a re |
| CTR-P2-001 | P2 | Pinned Base-Image Digests Have No Automated Refresh | @owner | CTR | open | remediation |
| CTR-P2-002 | P2 | Local Compose Ships Default Credentials and Repo-Wide Bind Mount | @owner | CTR | open | remediation |
| CTR-P2-003 | P2 | Redis Password Exposed on Process Argument Vector | @owner | CTR | open | remediation |
| CTR-P2-004 | P2 | Deploy Health Gate Ignores Worker Health | @owner | CTR | open | remediation |
| CTR-P2-005 | P2 | No Container Resource/PID Limits Beyond Memory | @owner | CTR | open | remediation |
| DATA-P2-001 | P2 | Blanket `anon` DML grant + default privileges make every future table anon-writable unless RLS happens to stop it | @owner | DATA | open | remediation |
| DATA-P2-002 | P2 | Destructive table-replacement migrations are not transaction-wrapped | @owner | DATA | open | remediation |
| DATA-P2-003 | P2 | `orphan-cleanup` deletes storage objects based on a truncated listing | @owner | DATA | open | remediation |
| DATA-P2-004 | P2 | Migration CI dry-run diff is non-blocking; drift is never gated | @owner | DATA | open | remediation |
| DATA-P2-005 | P2 | `audit_logs` org-delete cascade destroys compliance history; 365-day purge has no archive | @owner | DATA | open | remediation |
| DATA-P2-006 | P2 | Several stores lack a retention policy and owner | @owner | DATA | open | remediation |
| DATA-P2-007 | P2 | Generated DB types / schema can drift from migration intent | @owner | DATA | open | remediation |
| DATA-P2-008 | P2 | Orphan cleanup reference query is unbounded in the object list | @owner | DATA | open | remediation |
| DR-P2-001 | P2 | Backup-failure alerting is present but cannot be trusted to deliver | @owner | DR | open | remediation |
| DR-P2-002 | P2 | Terraform state bucket versioning is claimed but not backed by any resource | @owner | DR | open | remediation |
| DR-P2-003 | P2 | The backup/DR runbook and module docs describe a client-facing product, not the platform's own recovery, and the module doc is stale | @owner | DR | open | remediation |
| DR-P2-004 | P2 | Manual restore has no environment guardrail and the transient dump is written unencrypted to `/tmp` | @owner | DR | open | remediation |
| DR-P2-005 | P2 | The product `backup_status` module is not wired to any real platform backup heartbeat | @owner | DR | open | remediation |
| FEAT-P2-001 | P2 | API keys cannot authenticate; the feature is dead | @owner | FEAT | open | remediation |
| FEAT-P2-002 | P2 | Demo/test data can be seeded into a fresh production database | @owner | FEAT | open | remediation |
| FILE-P2-001 | P2 | `avatars` bucket is used by code but declared nowhere with no storage RLS policy | @owner | FILE | open | remediation |
| FILE-P2-002 | P2 | Free-form `storageBucket`/`storagePath` on create/update allows signing arbitrary in-bucket objects | @owner | FILE | open | remediation |
| FILE-P2-003 | P2 | No content/AV scanning and no bucket-level MIME/size limits on the documents bucket | @owner | FILE | open | remediation |
| FILE-P2-004 | P2 | No backup or restore path for uploaded objects (durability for files) | @owner | FILE | open | remediation |
| FILE-P2-005 | P2 | Content sniffing does not cover Office, archive, text/JSON, or polyglot payloads | @owner | FILE | open | remediation |
| FILE-P2-006 | P2 | CSV exports do not neutralize formula injection and default to all rows when `organization_id` is omitted | @owner | FILE | open | remediation |
| FINAL-P2-001 | P2 | Governance and observability gaps mean the platform cannot yet detect or control production failure | @owner | FINAL | open | remediation |
| FINAL-P2-002 | P2 | Residual authorization/secret defaults need explicit decisions | @owner | FINAL | open | remediation |
| HYG-P2-001 | P2 | Committed prompt/audit corpus bloats the repo and review surface | @owner | HYG | open | remediation |
| HYG-P2-002 | P2 | Duplicate product catalogs have diverged | @owner | HYG | open | remediation |
| INFRA-P2-001 | P2 | Prometheus alert rules have no delivery path (no Alertmanager) | @owner | INFRA | open | remediation |
| INFRA-P2-002 | P2 | Dev droplet capacity is under-provisioned and the CI value drifts from dev.tfvars.example | @owner | INFRA | open | remediation |
| INFRA-P2-003 | P2 | Operations documentation contradicts the current pipeline and configuration | @owner | INFRA | open | remediation |
| INFRA-P2-004 | P2 | Integration/security env vars referenced by the app schema are not delivered by the deploy pipeline | @owner | INFRA | open | remediation |
| INFRA-P2-005 | P2 | Redis container hardening was weakened and its password remains in process arguments | @owner | INFRA | open | remediation |
| INV-P2-001 | P2 | Committed generated artifacts drift without a gate | @owner | INV | open | remediation |
| INV-P2-002 | P2 | Duplicate schema bootstrap SQL can be mistaken for the source of truth | @owner | INV | open | remediation |
| IR-P2-001 | P2 | Several Prometheus metrics are declared but not wired, limiting incident diagnosis | @owner | IR | open | remediation |
| IR-P2-002 | P2 | No alerting on audit-trail gaps or privileged (impersonation/admin) abuse | @owner | IR | open | remediation |
| IR-P2-003 | P2 | No alerting when webhook dead-letters accumulate or payment reconciliation drifts | @owner | IR | open | remediation |
| IR-P2-004 | P2 | Secrets rotation is documented but has no exercised evidence | @owner | IR | open | remediation |
| IR-P2-005 | P2 | No platform status/communication surface for MCT's own outages | @owner | IR | open | remediation |
| IR-P2-006 | P2 | Migration dry-run result is discarded in CI | @owner | IR | open | remediation |
| MT-P2-001 | P2 | Admin global search lists all organizations and can fall through unscoped | @owner | MT | open | remediation |
| MT-P2-002 | P2 | By-id org filters are conditional, so they fail open if the org gate is not reached | @owner | MT | open | remediation |
| MT-P2-003 | P2 | Storage writer path and RLS org-derivation disagree (`orgs/<uuid>/` vs `<uuid>/`) | @owner | MT | open | remediation |
| MT-P2-004 | P2 | Realtime/SSE notification channel is scoped by user only, with no org assertion | @owner | MT | open | remediation |
| MT-P2-005 | P2 | Platform-admin cross-tenant access is role-key based, broad, and unalerted | @owner | MT | open | remediation |
| MT-P2-006 | P2 | Platform-wide report generators run as service role with no tenant guard on scope inputs | @owner | MT | open | remediation |
| NOTIF-P2-001 | P2 | Web Push channel is entirely absent (no subscriptions, no VAPID, no service worker) | @owner | NOTIF | open | remediation |
| NOTIF-P2-002 | P2 | SMTP remains optional; email silently degrades to no-op in production | @owner | NOTIF | open | remediation |
| NOTIF-P2-003 | P2 | Worker lacks an `unhandledRejection` handler (independently verified) | @owner | NOTIF | open | remediation |
| NOTIF-P2-004 | P2 | Scheduled reminder inserts and email sends are not atomic; retries can double-send | @owner | NOTIF | open | remediation |
| NOTIF-P2-005 | P2 | Sensitive ticket content is stored and emailed verbatim with no sensitivity filter | @owner | NOTIF | open | remediation |
| NOTIF-P2-006 | P2 | API inline email fallback has no retry and ignores the send result | @owner | NOTIF | open | remediation |
| OBS-P2-001 | P2 | Prometheus alert rules are not routed anywhere | @owner | OBS | open | remediation |
| OBS-P2-002 | P2 | No committed dashboards or SLO/error-budget definitions | @owner | OBS | open | remediation |
| OBS-P2-003 | P2 | Backup/restore is scheduled but not verified on the deployed branch | @owner | OBS | open | remediation |
| PORT-P2-001 | P2 | 17 tracked shell scripts lack the exec bit; documented ./scripts/... commands fail | @owner | PORT | open | git update-index --chmod=+x the 17 scripts and commit; add a CI check that no tracked *.sh is mode 100644. |
| PRIV-P2-001 | P2 | Google Analytics and Tawk.to load on public pages with no cookie-consent or opt-out gate | @owner | PRIV | open | Gate GA/Tawk behind a consent manager (or use Google Consent Mode v2 with analytics_storage denied by default), record c |
| REL-P2-001 | P2 | `CHANGELOG.md` is stale relative to HEAD for the final commits in the delta | @owner | REL | open | remediation |
| REL-P2-002 | P2 | No explicit Breaking Changes or upgrade manifest despite 34 migrations and RLS/entitlement behavior changes | @owner | REL | open | remediation |
| REL-P2-003 | P2 | No release-notes or GitHub Release body template; release body must be authored ad hoc | @owner | REL | open | remediation |
| REL-P2-004 | P2 | Rollback documentation is stale (Terraform push flow) and repeats the false approval claim | @owner | REL | open | remediation |
| RES-P2-001 | P2 | Worker process has no `unhandledRejection` handler | @owner | RES | open | remediation |
| RES-P2-002 | P2 | `WORKER_TIMEOUT` is not a real task timeout; generic task failures have no DLQ | @owner | RES | open | remediation |
| RES-P2-003 | P2 | `QUEUE_BACKEND` default `inline` diverges from production and can silently stall all queued work | @owner | RES | open | remediation |
| RES-P2-004 | P2 | External `fetch` calls without `AbortController` in `public.ts` and `auth.ts` | @owner | RES | open | remediation |
| RES-P2-005 | P2 | Availability detection lives inside the failed domain; no external dead-man's switch or alert delivery | @owner | RES | open | remediation |
| RES-P2-006 | P2 | Backup/restore recovery is configured but not evidenced as exercised, and the restore test verifies only table counts | @owner | RES | open | remediation |
| RLS-P2-001 | P2 | MSP platform-admin role keys missing from post-5302129 admin-gate RLS policies | @owner | RLS | open | remediation |
| RLS-P2-002 | P2 | webhook_dead_letters has no user-scoped DELETE policy while the API deletes via the RLS client | @owner | RLS | open | remediation |
| RLS-P2-003 | P2 | approve_project_task / add_project_task_comment trust a caller-supplied user id and are granted to authenticated | @owner | RLS | open | remediation |
| SBOM-P2-001 | P2 | SBOM is artifact-only: not release-bound, not commit-bound, not attested | @owner | SBOM | open | remediation |
| SBOM-P2-002 | P2 | No container/image SBOM; base-image OS packages untracked | @owner | SBOM | open | remediation |
| SBOM-P2-003 | P2 | `docs/CI.md` documents the SBOM workflow as "Blocking" but it gates nothing | @owner | SBOM | open | remediation |
| SC-P2-001 | P2 | No image-level container scanning; Trivy scans filesystem only | @owner | SC | open | remediation |
| SC-P2-002 | P2 | No artifact provenance, attestation, or signing; `id-token: write` requested but unused | @owner | SC | open | remediation |
| SC-P2-003 | P2 | License policy not enforced in CI; non-OSI and LGPL licenses present | @owner | SC | open | remediation |
| SC-P2-004 | P2 | SBOM is generated but not bound to a commit or attached to releases/images | @owner | SC | open | remediation |
| SC-P2-005 | P2 | Dependabot PR backlog is large and not triaged; one stale update conflicts with resolved versions | @owner | SC | open | remediation |
| SEARCH-P2-001 | P2 | Raw search terms persisted in plaintext `audit_logs.metadata` | @owner | SEARCH | open | remediation |
| SEARCH-P2-002 | P2 | Portal search omits documents despite SDK and documentation contract | @owner | SEARCH | open | remediation |
| SEARCH-P2-003 | P2 | Admin search UI silently discards the documents result set | @owner | SEARCH | open | remediation |
| SEARCH-P2-004 | P2 | No search pagination or result counts; hard 5-result ceiling | @owner | SEARCH | open | remediation |
| SEARCH-P2-005 | P2 | Search query analytics metric is dead and the analytics summary RPC is missing | @owner | SEARCH | open | remediation |
| SEARCH-P2-006 | P2 | Prefix/wildcard mismatch: no btree on prefix columns and no full-text (`tsvector`) search | @owner | SEARCH | open | remediation |
| SEARCH-P2-007 | P2 | Typeahead calls full search endpoints without rate limiting or a dedicated autocomplete surface | @owner | SEARCH | open | remediation |
| SEC-P2-001 | P2 | Secret scanner echoes the matched secret value into CI logs | @owner | SEC | open | Print only file, line number and rule name; never echo the diff or matched value; call ::add-mask:: before any echo. App |
| SEC-P2-002 | P2 | Webhook SSRF guard has a DNS-rebinding TOCTOU window | @owner | SEC | open | Resolve once and connect to the validated IP while preserving the Host header (custom undici lookup / ssrf-req-filter),  |
| SEC-P2-003 | P2 | Client-onboarding mutations run without `requirePermission` (authorization outlier) | @owner | SEC | open | remediation |
| SEC-P2-004 | P2 | MSP platform roles are cross-tenant for org access but not for permissions (inconsistent trust model) | @owner | SEC | open | remediation |
| SEC-P2-005 | P2 | Forgot-password email redirect still uses attacker-controlled `Origin` header | @owner | SEC | open | remediation |
| SEC-P2-006 | P2 | `GET /analytics/summary` calls a `get_analytics_summary` RPC that no migration defines | @owner | SEC | open | remediation |
| SEC-P2-007 | P2 | RLS is bypassed on API requests by default (service-role is the default client) | @owner | SEC | open | remediation |
| SEC-P2-008 | P2 | CAPTCHA/Turnstile is bypassed when the secret is unset | @owner | SEC | open | remediation |
| SEC-P2-009 | P2 | `/health` publicly discloses provider configuration and Redis errors | @owner | SEC | open | remediation |
| SECRET-P2-001 | P2 | Secret rotation inventory and GitHub matrix lag the schema/compose; seven keys uncovered | @owner | SECRET | open | remediation |
| SECRET-P2-002 | P2 | Rotation reminder workflow referenced in docs does not exist; rotation log shows no real rotation | @owner | SECRET | open | remediation |
| SECRET-P2-003 | P2 | Secret scanning is diff-scoped only; no full-history scan artifact | @owner | SECRET | open | remediation |
| SECRET-P2-004 | P2 | Produced Terraform `prod.tfvars` is tracked despite `.gitignore` intending to exclude it | @owner | SECRET | open | remediation |
| SUPPLY-P2-001 | P2 | `licenses.json` is committed but unenforced and unverified | @owner | SUPPLY | open | remediation |
| SUPPLY-P2-002 | P2 | Swagger UI loads an unpinned third-party script without SRI | @owner | SUPPLY | open | remediation |
| TEST-P2-001 | P2 | Accessibility gate width contradicts the code (docs say 19 pages, code scans 25) | @owner | TEST | open | remediation |
| TEST-P2-002 | P2 | Worker data-mutating scan tasks still lack a dedicated test suite; branch threshold is a no-op | @owner | TEST | open | remediation |
| TEST-P2-003 | P2 | E2E flakiness is documented but unresolved, and the prod-only gate masks it | @owner | TEST | open | remediation |
| TEST-P2-004 | P2 | Load tests exist but are manual-only with no enforced thresholds or failure injection | @owner | TEST | open | remediation |
| TEST-P2-005 | P2 | Orphan-cleanup tests model `storage.list` incorrectly, masking the data-loss bug | @owner | TEST | open | remediation |
| TEST-P2-006 | P2 | Route suites stub authorization middleware, so new routes can regress silently | @owner | TEST | open | remediation |
| WH-P2-001 | P2 | M365 inbound notifications have no enforced timestamp/replay window | @owner | WH | open | remediation |
| WH-P2-002 | P2 | Inline dispatcher records a fixed `retry_count` and duplicates the worker's retry logic | @owner | WH | open | remediation |
| WH-P2-003 | P2 | Outbound and DLQ delivery outcomes are not metered; only inbound success increments the counter | @owner | WH | open | remediation |
| WH-P2-004 | P2 | Inbound Jira/JSM signature falls back to re-serialized JSON when `req.rawBody` is absent | @owner | WH | open | remediation |
| WH-P2-005 | P2 | `webhook_dead_letters` has no DELETE policy while the API deletes via the RLS client | @owner | WH | open | remediation |
| WH-P2-006 | P2 | No per-provider payload schema or size cap on webhook ingress (global 10mb JSON limit) | @owner | WH | open | remediation |
| ACM-P3-001 | P3 | Client-side permission hiding is UI-only for several module actions | @owner | ACM | open | remediation |
| ACM-P3-002 | P3 | No catalog-lint: referenced permission keys are not checked against the `permissions` table | @owner | ACM | open | remediation |
| ACM-P3-003 | P3 | Public route surface is broad and has no single documented inventory | @owner | ACM | open | remediation |
| ACM-P3-004 | P3 | `GET /roles/:id` and `GET /me/permissions` are readable without an admin gate | @owner | ACM | open | remediation |
| ACM-P3-005 | P3 | RLS policies reference `manage` permissions that no role holds (dead predicates) | @owner | ACM | open | remediation |
| ADMIN-P3-001 | P3 | Web admin gate accepts a broader role set than the API `requireAdmin` (guard/API divergence) | @owner | ADMIN | open | remediation |
| ADMIN-P3-002 | P3 | Active-org cookie setter performs no server-side authorization | @owner | ADMIN | open | remediation |
| ADMIN-P3-003 | P3 | Admin global search and dashboard expose global resource names/counts to any admin | @owner | ADMIN | open | remediation |
| ADMIN-P3-004 | P3 | Global store catalog is mutable by any tenant admin | @owner | ADMIN | open | remediation |
| AI-P3-001 | P3 | Embedded repo maps and historical pack outputs still reference the pre-rename repository path | @owner | AI | open | remediation |
| AI-P3-002 | P3 | `AGENTS.md` retains a large self-contradicting "snapshot" history that an agent must disambiguate | @owner | AI | open | remediation |
| AI-P3-003 | P3 | Secrets guidance is spread across instructions without a linked canonical runbook | @owner | AI | open | remediation |
| AN-P3-001 | P3 | Analytics has no consent-mode signalling and no documented event/retention governance | @owner | AN | open | Adopt a consent-state contract, document each event's purpose and retention, and add the event schema to the data-govern |
| API-P3-001 | P3 | Minor contract inconsistencies (`rateLimitByUser` non-enveloped 429, capped raw-array lists, no `request_id`) | @owner | API | open | remediation |
| API-P3-002 | P3 | OpenAPI artifact is not bound to a commit and the CI audit warns (not fails) on documented-but-missing routes | @owner | API | open | remediation |
| API-P3-003 | P3 | Realtime client has no reconnect path; server emits `auth_expired` with no documented client handling | @owner | API | open | remediation |
| API-P3-004 | P3 | `/metrics` is fully public when `METRICS_TOKEN` is unset | @owner | API | open | remediation |
| ARCH-P3-001 | P3 | Web middleware gates routes on an unverified JWT `exp` | @owner | ARCH | open | remediation |
| BILL-P3-001 | P3 | Webhook raw body typed as `string` but consumed as `Buffer` | @owner | BILL | open | remediation |
| BILL-P3-002 | P3 | Billing email stored in plaintext and raw Stripe payment-method id rendered to users | @owner | BILL | open | remediation |
| BP-P3-001 | P3 | Hotfix and emergency-deploy documentation is a stub and partially stale | @owner | BP | open | remediation |
| BP-P3-002 | P3 | Dependabot has no security-update separation or triage SLA, and PR template has no enforced link to required checks | @owner | BP | open | remediation |
| CI-P3-001 | P3 | actionlint/shellcheck workflow lint issues (SC2086/SC2129/SC2002/SC2015) | @owner | CI | open | Quote GITHUB_ENV/GITHUB_OUTPUT/GITHUB_STEP_SUMMARY and expression-derived variables; add an actionlint CI job (and optio |
| CI-P3-002 | P3 | Over-broad workflow token permissions (unused write scopes) | @owner | CI | open | Remove unused actions: write / pull-requests: write; scope any genuinely needed write permission to the specific job (de |
| CI-P3-003 | P3 | StrictHostKeyChecking=no in the deploy health check | @owner | CI | open | Pin the droplet host key via a secret and use StrictHostKeyChecking=yes with a known_hosts file (or the host-key configu |
| CI-P3-004 | P3 | `main` is far behind `develop`; scheduled jobs fire only from the default branch | @owner | CI | open | remediation |
| CI-P3-005 | P3 | Secret scanner misses the platform's own token formats and scans diffs only | @owner | CI | open | remediation |
| CI-P3-006 | P3 | Unused permission grants across deploy/test workflows | @owner | CI | open | remediation |
| CI-P3-007 | P3 | DB restore test uses an unpinned `postgres:16-alpine` image | @owner | CI | open | remediation |
| CI-P3-008 | P3 | No release/tagging workflow and no post-merge release artifact | @owner | CI | open | remediation |
| CI-P3-009 | P3 | e2e is required on `main` but the documented flakiness makes it an unstable hard gate | @owner | CI | open | remediation |
| CI-P3-010 | P3 | Missing per-job timeouts and minor workflow hygiene gaps | @owner | CI | open | remediation |
| CONF-P3-001 | P3 | Secret rotation policy has no evidence any secret was ever rotated | @owner | CONF | open | Populate the Rotation Log on the next cycle with date, operator, environment and the gh secret set / deploy run URL; hav |
| CTR-P3-001 | P3 | Missing `--start-period` on API and Worker Healthchecks | @owner | CTR | open | remediation |
| CTR-P3-002 | P3 | Broad `.dockerignore` `*.md`/`*.txt`/`*.log` Could Mask Needed Build Files | @owner | CTR | open | remediation |
| DATA-P3-001 | P3 | Pre-baseline policies created without a preceding `drop policy if exists` | @owner | DATA | open | remediation |
| DATA-P3-002 | P3 | Migration version gaps undocumented; brief states 141 migrations, tree has 127 | @owner | DATA | open | remediation |
| DET-P3-001 | P3 | [SUPPLY] 3 container image(s) without a digest pin | @owner | DET | open | remediation |
| DOC-P3-001 | P3 | Dated point-in-time audit reports are mixed with current runbooks with no archive/staleness marker | @owner | DOC | open | Move historical audits under docs/audits/ or docs/archive/ with a banner, and have docs/INDEX.md separate 'current' from |
| DR-P3-001 | P3 | Duplicate backup-script logic in bash and PowerShell risks drift | @owner | DR | open | remediation |
| DR-P3-002 | P3 | Unpinned Postgres image in the restore test; no explicit jq/aws tool pinning in the backup job | @owner | DR | open | remediation |
| DR-P3-003 | P3 | Documented backup/DR export endpoints do not exist | @owner | DR | open | remediation |
| EVOL-P3-001 | P3 | Feature flags are a hardcoded static map with no managed service, change log, or targeting | @owner | EVOL | open | Move flags to a managed store or a versioned config with an audit log, and support tenant/percentage targeting with a ki |
| FEAT-P3-001 | P3 | OpenAPI/Swagger surface is public and its UI is blocked by the API CSP | @owner | FEAT | open | remediation |
| FILE-P3-001 | P3 | Share endpoint has no per-token rate limit | @owner | FILE | open | remediation |
| FILE-P3-002 | P3 | Client logo accept list still advertises SVG that the server rejects | @owner | FILE | open | remediation |
| FILE-P3-003 | P3 | Documentation drift on file types and size limits; no documents/upload runbook | @owner | FILE | open | remediation |
| HYG-P3-001 | P3 | Stale and machine-specific generated documentation | @owner | HYG | open | remediation |
| HYG-P3-002 | P3 | Generated artifacts are inconsistently tracked | @owner | HYG | open | remediation |
| INFRA-P3-001 | P3 | `env/prod.tfvars` is tracked despite an ignore rule that names it | @owner | INFRA | open | remediation |
| INFRA-P3-002 | P3 | Restore test uses a different Postgres major than the backup script and verifies only table counts | @owner | INFRA | open | remediation |
| INFRA-P3-003 | P3 | `docs/RTO_RPO.md` claims Redis AOF persistence that compose does not enable | @owner | INFRA | open | remediation |
| INFRA-P3-004 | P3 | `infra/terraform/README.md` references an `aws/` directory that does not exist | @owner | INFRA | open | remediation |
| INFRA-P3-005 | P3 | Terraform is manual-dispatch only, so the "push to trigger apply" rollback runbook step is a no-op | @owner | INFRA | open | remediation |
| INV-P3-001 | P3 | Large committed prompt/audit corpus inflates the application repository | @owner | INV | open | remediation |
| INV-P3-002 | P3 | Stale, machine-specific repo path in the agent reference | @owner | INV | open | remediation |
| IR-P3-001 | P3 | Terraform state restore guidance lacks a tested procedure | @owner | IR | open | remediation |
| IR-P3-002 | P3 | Monitoring doc and health endpoint disagree on check semantics; Redis severity undocumented in alerts | @owner | IR | open | remediation |
| MOB-P3-001 | P3 | PWA manifest ships only an SVG icon and is duplicated across three sources | @owner | MOB | open | Keep one manifest source (the Next metadata route), add 192/512 PNG and maskable icons, and delete the duplicate public  |
| MT-P3-001 | P3 | No automated cross-tenant isolation regression suite for application-layer scoping | @owner | MT | open | remediation |
| NOTIF-P3-001 | P3 | No email template system; repetitive inline HTML diverges between senders | @owner | NOTIF | open | remediation |
| NOTIF-P3-002 | P3 | `sms` channel is a dead preference option; UI copy misstates enforcement | @owner | NOTIF | open | remediation |
| NOTIF-P3-003 | P3 | SSE polling fallback interval is not cleared on unmount | @owner | NOTIF | open | remediation |
| OBS-P3-001 | P3 | Incident runbooks/tabletop evidence is partial | @owner | OBS | open | remediation |
| PERF-P3-001 | P3 | No bundle-size or performance budget gate; the analyzer is opt-in only | @owner | PERF | open | Add a size-limit or Lighthouse-CI/bundle budget to the web CI and fail on threshold, or publish a bundle report on PRs. |
| PERF-P3-002 | P3 | API routes broadly select all columns (`select("*")`) and pagination is ad hoc | @owner | PERF | open | Project only needed columns, add a shared pagination/limit helper to list endpoints, and add a lint check for bare selec |
| REL-P3-001 | P3 | Commit history contains non-conventional noise commits and a single author, reducing automated-notes quality | @owner | REL | open | remediation |
| REL-P3-002 | P3 | PR template lacks changelog and versioned-artifact checkboxes | @owner | REL | open | remediation |
| RES-P3-001 | P3 | Worker graceful shutdown has no force-exit fallback | @owner | RES | open | remediation |
| RES-P3-002 | P3 | Worker queued webhook dispatcher inserts deliveries without an idempotency key | @owner | RES | open | remediation |
| RES-P3-003 | P3 | `AGENTS.md` documents the worker consumer incorrectly and omits the queue backend divergence | @owner | RES | open | remediation |
| RES-P3-004 | P3 | Deploy health gate treats worker unhealthiness as non-fatal | @owner | RES | open | remediation |
| RES-P3-005 | P3 | Orphan cleanup lists at most 1000 objects per bucket and cannot verify the purge shrank anything | @owner | RES | open | remediation |
| RLS-P3-001 | P3 | 5302116 grants anon UPDATE/DELETE on every table, amplified by no RLS-off × anon-write lint | @owner | RLS | open | remediation |
| RLS-P3-002 | P3 | No behavioral RLS allow/deny matrix test (static gate only) | @owner | RLS | open | remediation |
| RLS-P3-003 | P3 | storage_path_org_id trusts a client-controlled object name | @owner | RLS | open | remediation |
| RLS-P3-004 | P3 | Duplicate scoped-client tests and stale coverage-matrix snapshot | @owner | RLS | open | remediation |
| SBOM-P3-001 | P3 | Root license is ISC with no documented rationale | @owner | SBOM | open | remediation |
| SBOM-P3-002 | P3 | SBOM format/count not validated before upload; no regression guard | @owner | SBOM | open | remediation |
| SC-P3-001 | P3 | Root package license remains "ISC" | @owner | SC | open | remediation |
| SC-P3-002 | P3 | e2e Docker image is not digest-pinned | @owner | SC | open | remediation |
| SC-P3-003 | P3 | Secret-scanner pattern sets diverge between `.sh` and `.ps1` | @owner | SC | open | remediation |
| SEARCH-P3-001 | P3 | Soft-delete columns are defined but never used by queries or deletes | @owner | SEARCH | open | remediation |
| SEARCH-P3-002 | P3 | Search module documentation is stale relative to the code | @owner | SEARCH | open | remediation |
| SEC-P3-001 | P3 | gitleaks generic-api-key/jwt hits are false positives (no tracked secret) | @owner | SEC | open | Commit a .gitleaks.toml allowlisting prompts/manifest.json (hashes), the m365-hardening key and test fixtures; optionall |
| SEC-P3-002 | P3 | `5302116` grants anon/authenticated full DML on every public table (RLS is the only gate) | @owner | SEC | open | remediation |
| SEC-P3-003 | P3 | CORS reflects any origin with credentials when `CORS_ORIGIN="*"` | @owner | SEC | open | remediation |
| SEC-P3-004 | P3 | `notification-preferences` PUT accepts a body `organizationId` without `assertOrgScopeMatches` | @owner | SEC | open | remediation |
| SEC-P3-005 | P3 | `resolveEffectivePermissions` is uncached and fans out 4–6 queries per gated request | @owner | SEC | open | remediation |
| SEC-P3-006 | P3 | Deprecated header and broad API CSP style directive | @owner | SEC | open | remediation |
| SEC-P3-007 | P3 | M365 webhook `clientState` is compared non-constant-time | @owner | SEC | open | remediation |
| SECRET-P3-001 | P3 | Worker `.env.example` omits `APP_BASE_URL` | @owner | SECRET | open | remediation |
| SECRET-P3-002 | P3 | Web runtime validator can silently fall back to a localhost API URL | @owner | SECRET | open | remediation |
| SECRET-P3-003 | P3 | No IT-level break-glass / emergency credential revocation runbook, and no revocation drill evidence | @owner | SECRET | open | remediation |
| SUPPLY-P3-001 | P3 | Unpinned container images (test/local only); production app images tag-based by design | @owner | SUPPLY | open | Pin the playwright and postgres test images by digest and consider pinning the Supabase local image set; document that a |
| SUPPLY-P3-002 | P3 | Dockerfile lint: missing WORKDIR in web runner stage and shell-form HEALTHCHECK | @owner | SUPPLY | open | Add WORKDIR /app to the web runner stage before the COPYs; optionally use exec-form HEALTHCHECK arrays. Add hadolint to  |
| SUPPLY-P3-003 | P3 | SBOM is produced as a transient artifact, not bound to a release | @owner | SUPPLY | open | remediation |
| SUPPLY-P3-004 | P3 | A secrets file exists on disk outside git (should never be committed) | @owner | SUPPLY | open | remediation |
| TEST-P3-001 | P3 | Visual regression is still non-blocking with a known-broken Storybook build | @owner | TEST | open | remediation |
| TEST-P3-002 | P3 | No scheduled production smoke check (health + login + critical read) | @owner | TEST | open | remediation |
| TEST-P3-003 | P3 | Coverage thresholds remain modest and cannot be confirmed met at this SHA | @owner | TEST | open | remediation |
| TEST-P3-004 | P3 | Coverage thresholds are low and E2E stability is unproven on `main` | @owner | TEST | open | remediation |
| UX-P3-001 | P3 | Full accessibility breadth scan (68 routes) is triage-only and not a required check | @owner | UX | open | Ratchet the breadth set into the default gate in batches (start with the currently-green pages), record a violation base |
| WH-P3-001 | P3 | Test endpoint generates a random idempotency key and never dedups | @owner | WH | open | remediation |
| WH-P3-002 | P3 | No committed event catalog or webhook documentation for consumers | @owner | WH | open | remediation |
