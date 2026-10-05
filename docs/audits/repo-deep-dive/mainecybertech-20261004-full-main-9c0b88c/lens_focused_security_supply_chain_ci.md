# Focused security / supply-chain / CI deep-dive - mainecybertech

## Findings

| ID | Severity | Title | Report |
|---|---|---|---|
| DATA-P0-001 | P0 | Orphan cleanup can recursively delete a bucket’s contents | lens_focused_security_supply_chain_ci.md |
| DR-P0-001 | P0 | Scheduled backup and restore-test workflows never run because they are absent from the default branch | lens_focused_security_supply_chain_ci.md |
| DR-P0-002 | P0 | The restore test never asserts integrity and therefore cannot fail on a bad backup | lens_focused_security_supply_chain_ci.md |
| IR-P0-001 | P0 | No platform-level incident response plan, roles, or postmortem process | lens_focused_security_supply_chain_ci.md |
| IR-P0-002 | P0 | No data breach response / notification process | lens_focused_security_supply_chain_ci.md |
| IR-P0-003 | P0 | Total loss of the monitoring/alerting path has no independent dead-man's-switch receiver | lens_focused_security_supply_chain_ci.md |
| ACM-P1-001 | P1 | Client-onboarding mutations run without any `requirePermission` gate | lens_focused_security_supply_chain_ci.md |
| ADMIN-P1-001 | P1 | Org-agnostic `requireAdmin` lets a tenant admin read other tenants' admin data | lens_focused_security_supply_chain_ci.md |
| ADMIN-P1-002 | P1 | Impersonation/cross-tenant access is logged but not reviewable or alerted | lens_focused_security_supply_chain_ci.md |
| AI-P1-001 | P1 | Vendored audit prompt packs are stale and the run manifest references a prompt the pack does not contain | lens_focused_security_supply_chain_ci.md |
| AI-P1-002 | P1 | `AGENTS.md` names a stale repository path and three developer docs state a stale accessibility gate size that no guard covers | lens_focused_security_supply_chain_ci.md |
| BILL-P1-001 | P1 | Module entitlements are derived but not enforced server-side | lens_focused_security_supply_chain_ci.md |
| BILL-P1-002 | P1 | `payments` table is never populated; payment history is silently empty | lens_focused_security_supply_chain_ci.md |
| BILL-P1-003 | P1 | Missing Stripe webhook events leave refunds, void, and payment lifecycle unrecorded | lens_focused_security_supply_chain_ci.md |
| BP-P1-001 | P1 | `main` requires a context (`Dependency Review`) that no job emits | lens_focused_security_supply_chain_ci.md |
| BP-P1-002 | P1 | `enforce_admins:false` lets administrators bypass all required checks and reviews | lens_focused_security_supply_chain_ci.md |
| BP-P1-003 | P1 | Production deploy path uses the unguarded `prod` environment, not `prod-approval` | lens_focused_security_supply_chain_ci.md |
| CHAIN-P1-001 | P1 | Low-trust MSP role key composes into a cross-tenant read pivot | lens_focused_security_supply_chain_ci.md |
| CHAIN-P1-002 | P1 | Caller-controlled reset redirect composes into an account-takeover assist | lens_focused_security_supply_chain_ci.md |
| CHAIN-P1-003 | P1 | Branch-protection bypass + missing prod gate compose into unattended production change | lens_focused_security_supply_chain_ci.md |
| CI-P1-001 | P1 | Production application deploys have no working manual-approval gate | lens_focused_security_supply_chain_ci.md |
| CI-P1-002 | P1 | Branch-protection-as-code has a likely-mismatched required check and permits admin bypass | lens_focused_security_supply_chain_ci.md |
| CI-P1-003 | P1 | Production deploy path cannot run; prod environment lacks secrets and protection rules | lens_focused_security_supply_chain_ci.md |
| CTR-P1-001 | P1 | No Container Image Vulnerability Scan in CI | lens_focused_security_supply_chain_ci.md |
| CTR-P1-002 | P1 | SBOM Is Lockfile-Only, Not an Image SBOM or Attestation | lens_focused_security_supply_chain_ci.md |
| CTR-P1-003 | P1 | Unsigned Images With No Provenance/Attestation | lens_focused_security_supply_chain_ci.md |
| DATA-P1-001 | P1 | Approved-membership RLS predicate reintroduced six times; pending/suspended members could access tenant data | lens_focused_security_supply_chain_ci.md |
| DATA-P1-002 | P1 | `retention` worker task performs unbounded deletes and reports success on partial failure | lens_focused_security_supply_chain_ci.md |
| DATA-P1-003 | P1 | Soft-delete columns remain dead schema; DELETE endpoints hard-delete | lens_focused_security_supply_chain_ci.md |
| DR-P1-001 | P1 | No backup or restore path exists for uploaded files in Supabase Storage | lens_focused_security_supply_chain_ci.md |
| DR-P1-002 | P1 | Restore-test backup location contract (`S3_BACKUP_BUCKET`) is undocumented and can silently mismatch the backup script | lens_focused_security_supply_chain_ci.md |
| DR-P1-003 | P1 | Database backups are unencrypted and stored in a single location with no offsite copy | lens_focused_security_supply_chain_ci.md |
| DR-P1-004 | P1 | The restore test has no failure alert | lens_focused_security_supply_chain_ci.md |
| DR-P1-005 | P1 | No automated migration reverse/rollback and no bad-migration drill | lens_focused_security_supply_chain_ci.md |
| DR-P1-006 | P1 | RPO/RTO targets are documented but unvalidated, and the Postgres RPO conflates PITR with the daily dump | lens_focused_security_supply_chain_ci.md |
| FILE-P1-001 | P1 | Public file-request upload is permission-gated and unreachable for anonymous uploaders | lens_focused_security_supply_chain_ci.md |
| FILE-P1-002 | P1 | File-request uploads have no tenant-scoped path and no download path; orphan cleanup will delete them | lens_focused_security_supply_chain_ci.md |
| FILE-P1-003 | P1 | Document version history objects are deleted at replace and by orphan cleanup | lens_focused_security_supply_chain_ci.md |
| FINAL-P1-001 | P1 | P0 data-loss path and unverified "fixed" claim block a clean release | lens_focused_security_supply_chain_ci.md |
| INFRA-P1-001 | P1 | SSH is open to the internet on both droplets (admin_ip_ranges default 0.0.0.0/0 and CI never overrides it) | lens_focused_security_supply_chain_ci.md |
| INFRA-P1-002 | P1 | Terraform state-locking fix is incompatible with the pinned Terraform version (use_lockfile requires >= 1.10, workflows pin 1.9) | lens_focused_security_supply_chain_ci.md |
| IR-P1-001 | P1 | Rollback documentation contradicts itself on SHA-targeted rollback | lens_focused_security_supply_chain_ci.md |
| IR-P1-002 | P1 | Bad-migration recovery is manual-only with no automated reverse or staging proof | lens_focused_security_supply_chain_ci.md |
| IR-P1-003 | P1 | Worker health failure during deploy is non-fatal | lens_focused_security_supply_chain_ci.md |
| IR-P1-004 | P1 | Backups are not verified deeply enough to prove the documented RPO/RTO | lens_focused_security_supply_chain_ci.md |
| IR-P1-005 | P1 | Backup bucket configuration is inconsistent between the script, the backup workflow, and the restore test | lens_focused_security_supply_chain_ci.md |
| IR-P1-006 | P1 | No runtime detection or alerting for tenant-isolation (RLS) regressions | lens_focused_security_supply_chain_ci.md |
| MT-P1-001 | P1 | Audit log list and export are not org-scoped by default | lens_focused_security_supply_chain_ci.md |
| MT-P1-002 | P1 | Platform dashboards expose all-tenant aggregates to any single-org admin | lens_focused_security_supply_chain_ci.md |
| MT-P1-003 | P1 | Public file-request upload authorizes with a permission unioned across all orgs | lens_focused_security_supply_chain_ci.md |
| NOTIF-P1-001 | P1 | Notification preferences are stored and displayed but never enforced on any send path | lens_focused_security_supply_chain_ci.md |
| NOTIF-P1-002 | P1 | API-originated notifications bypass the dedup unique index | lens_focused_security_supply_chain_ci.md |
| NOTIF-P1-003 | P1 | No delivery observability: email/notification failures are silent and unalerted | lens_focused_security_supply_chain_ci.md |
| REL-P1-001 | P1 | No version identity: no tags, no product version, no commit binding in generated artifacts | lens_focused_security_supply_chain_ci.md |
| REL-P1-002 | P1 | Documented production deploy path is stated as non-functional and the approval gate claim is false | lens_focused_security_supply_chain_ci.md |
| SBOM-P1-001 | P1 | No license allow/deny policy in dependency review or any CI gate | lens_focused_security_supply_chain_ci.md |
| SBOM-P1-002 | P1 | SBOM carries no license data and no dependency graph, limiting triage and license review | lens_focused_security_supply_chain_ci.md |
| SC-P1-001 | P1 | Critical/high advisories persist in the dev dependency tree; `next` override is mis-scoped | lens_focused_security_supply_chain_ci.md |
| SEARCH-P1-001 | P1 | `sanitizeSearchTerm` does not strip PostgREST `.` operator separators | lens_focused_security_supply_chain_ci.md |
| SEARCH-P1-002 | P1 | Admin global search exposes profile PII and never tenant-scopes the organizations query | lens_focused_security_supply_chain_ci.md |
| SEC-P1-001 | P1 | PII field encryption silently degrades to reversible plaintext | lens_focused_security_supply_chain_ci.md |
| SECRET-P1-001 | P1 | M365 webhook secret is dead config while the real M365 auth value is undocumented and undeployed | lens_focused_security_supply_chain_ci.md |
| SECRET-P1-002 | P1 | Deploy pipeline does not write several secret-class env vars the API schema and compose reference | lens_focused_security_supply_chain_ci.md |
| WH-P1-001 | P1 | Outbound webhook idempotency is non-atomic in the API and absent in the worker dispatcher | lens_focused_security_supply_chain_ci.md |
| WH-P1-002 | P1 | M365 webhook auth depends on `M365_CLIENT_STATE` which the deploy pipeline does not write, while `M365_WEBHOOK_SECRET` is dead config | lens_focused_security_supply_chain_ci.md |
| ACM-P2-001 | P2 | `PLATFORM_ADMIN_KEYS` (org traversal) and `ADMIN_BYPASS_KEYS` (permission bypass) are inconsistent trust sets | lens_focused_security_supply_chain_ci.md |
| ACM-P2-002 | P2 | RLS is not a database backstop on API requests (service-role is the default client) | lens_focused_security_supply_chain_ci.md |
| ACM-P2-003 | P2 | Write and state-transition actions gated by `view` permissions (action mismatch) | lens_focused_security_supply_chain_ci.md |
| ACM-P2-004 | P2 | Webhook endpoint and delivery reads are available to any org member (not manage-gated) | lens_focused_security_supply_chain_ci.md |
| ACM-P2-005 | P2 | API keys store `expires_at` but nothing enforces or prunes expiry | lens_focused_security_supply_chain_ci.md |
| ACM-P2-006 | P2 | Webhook signing secrets are stored plaintext with no rotation or expiry | lens_focused_security_supply_chain_ci.md |
| ACM-P2-007 | P2 | Profiles are enumerable by email/id for any authenticated user | lens_focused_security_supply_chain_ci.md |
| ADMIN-P2-001 | P2 | Sensitive admin exports are not audit-logged | lens_focused_security_supply_chain_ci.md |
| ADMIN-P2-002 | P2 | Destructive deletes are inconsistently confirmation-gated and org delete is unrecoverable | lens_focused_security_supply_chain_ci.md |
| ADMIN-P2-003 | P2 | Bulk document operations apply without a per-row preview or elevation guardrail | lens_focused_security_supply_chain_ci.md |
| ADMIN-P2-004 | P2 | Bulk invite creates pre-confirmed auth accounts (and org onboarding auto-approves admin) | lens_focused_security_supply_chain_ci.md |
| ADMIN-P2-005 | P2 | No rate limiting specific to expensive/destructive admin operations | lens_focused_security_supply_chain_ci.md |
| ADMIN-P2-006 | P2 | No undo/soft-delete is exercised despite the schema supporting it | lens_focused_security_supply_chain_ci.md |
| AI-P2-001 | P2 | No machine-enforced agent guardrails: allowed paths, human-approval actions, and small-batch PR limits exist only as prose | lens_focused_security_supply_chain_ci.md |
| AI-P2-002 | P2 | Prompt packs embed generated outputs alongside instructions without a machine-detectable "not instructions" marker | lens_focused_security_supply_chain_ci.md |
| AI-P2-003 | P2 | `.continue/` agent configuration defines models only and does not surface project rules or boundaries | lens_focused_security_supply_chain_ci.md |
| API-P2-001 | P2 | Mutations remain unguarded by `requirePermission` in several routers (including a governance state transition) | lens_focused_security_supply_chain_ci.md |
| API-P2-002 | P2 | External integration syncs report success while dropping items, and `jsm-sync` has no HTTP retry | lens_focused_security_supply_chain_ci.md |
| API-P2-003 | P2 | Published error-handling contract contradicts the implementation (codes, 422, and `request_id`) | lens_focused_security_supply_chain_ci.md |
| API-P2-004 | P2 | SDK retries unsafe requests without an `Idempotency-Key` (duplicate creates on transient failure) | lens_focused_security_supply_chain_ci.md |
| API-P2-005 | P2 | Outbound webhook dispatcher uses a non-atomic idempotency check (duplicate deliveries under concurrency) | lens_focused_security_supply_chain_ci.md |
| API-P2-006 | P2 | Search falls through to an unscoped cross-tenant query | lens_focused_security_supply_chain_ci.md |
| API-P2-007 | P2 | OpenAPI schema is public and the Swagger UI is blocked by CSP | lens_focused_security_supply_chain_ci.md |
| ARCH-P2-001 | P2 | Single-droplet, single-instance runtime is a hard SPOF | lens_focused_security_supply_chain_ci.md |
| ARCH-P2-002 | P2 | API defaults to the service-role DB client (RLS bypass) | lens_focused_security_supply_chain_ci.md |
| ARCH-P2-003 | P2 | Prometheus loads rules but has no alert routing | lens_focused_security_supply_chain_ci.md |
| BILL-P2-001 | P2 | No refund and incomplete trial/cancel state handling | lens_focused_security_supply_chain_ci.md |
| BILL-P2-002 | P2 | `POST /billing/sync` does not paginate Stripe results | lens_focused_security_supply_chain_ci.md |
| BILL-P2-003 | P2 | Reconciliation job has no drift detection, alerting, or tests | lens_focused_security_supply_chain_ci.md |
| BILL-P2-004 | P2 | Failed payments produce no notification or dunning visibility | lens_focused_security_supply_chain_ci.md |
| BILL-P2-005 | P2 | Subscription/invoice schema lacks trial, interval, and void-lifecycle fields | lens_focused_security_supply_chain_ci.md |
| BP-P2-001 | P2 | `require_code_owner_reviews:false` makes the committed CODEOWNERS advisory only | lens_focused_security_supply_chain_ci.md |
| BP-P2-002 | P2 | No break-glass / bypass process for branch protection, and no bypass audit trail | lens_focused_security_supply_chain_ci.md |
| BP-P2-003 | P2 | No drift detection between committed branch-protection JSON and live GitHub settings | lens_focused_security_supply_chain_ci.md |
| BP-P2-004 | P2 | Path-filtered required checks can leave `main`/`develop` protected by checks that never run | lens_focused_security_supply_chain_ci.md |
| CHAIN-P2-001 | P2 | Intra-tenant capability escalation via unguarded mutations | lens_focused_security_supply_chain_ci.md |
| CHAIN-P2-002 | P2 | Definer RPC identity trust composes into forged approvals/comments | lens_focused_security_supply_chain_ci.md |
| CHAIN-P2-003 | P2 | RLS admin-gate regression composes with the API trust model into MSP admin denials | lens_focused_security_supply_chain_ci.md |
| CHAIN-P2-004 | P2 | Retention + cascade compose into silent destruction of audit evidence | lens_focused_security_supply_chain_ci.md |
| CHAIN-P2-005 | P2 | Internet-open SSH composes into service-role exfiltration and tenant takeover | lens_focused_security_supply_chain_ci.md |
| CHAIN-P2-006 | P2 | Terraform version/lockfile conflict composes into un-gated infrastructure change | lens_focused_security_supply_chain_ci.md |
| CHAIN-P2-007 | P2 | Silent worker failures + in-stack monitoring compose into undetected degradation | lens_focused_security_supply_chain_ci.md |
| CI-P2-001 | P2 | World-open DigitalOcean firewall mutation with no approval and unvalidated udp_port | lens_focused_security_supply_chain_ci.md |
| CI-P2-002 | P2 | Deploy-gate secret scan is a no-op on pushes to main | lens_focused_security_supply_chain_ci.md |
| CI-P2-003 | P2 | Production approval environment documented as having no required reviewers | lens_focused_security_supply_chain_ci.md |
| CI-P2-004 | P2 | DB restore test reports success without asserting restore integrity | lens_focused_security_supply_chain_ci.md |
| CI-P2-005 | P2 | Infrastructure changes are no longer gated in CI (terraform-do is manual-dispatch only) | lens_focused_security_supply_chain_ci.md |
| CI-P2-006 | P2 | Chromatic visual-regression job is permanently non-blocking | lens_focused_security_supply_chain_ci.md |
| CI-P2-007 | P2 | Branch protection permits admin bypass and ignores CODEOWNERS | lens_focused_security_supply_chain_ci.md |
| CI-P2-008 | P2 | Terraform apply is manual and drift detection is not automated | lens_focused_security_supply_chain_ci.md |
| CONF-P2-001 | P2 | Workflow-scope PAT SCHEDULE_DISPATCH_TOKEN omitted from secret inventory and rotation policy | lens_focused_security_supply_chain_ci.md |
| CTR-P2-001 | P2 | Pinned Base-Image Digests Have No Automated Refresh | lens_focused_security_supply_chain_ci.md |
| CTR-P2-002 | P2 | Local Compose Ships Default Credentials and Repo-Wide Bind Mount | lens_focused_security_supply_chain_ci.md |
| CTR-P2-003 | P2 | Redis Password Exposed on Process Argument Vector | lens_focused_security_supply_chain_ci.md |
| CTR-P2-004 | P2 | Deploy Health Gate Ignores Worker Health | lens_focused_security_supply_chain_ci.md |
| CTR-P2-005 | P2 | No Container Resource/PID Limits Beyond Memory | lens_focused_security_supply_chain_ci.md |
| DATA-P2-001 | P2 | Blanket `anon` DML grant + default privileges make every future table anon-writable unless RLS happens to stop it | lens_focused_security_supply_chain_ci.md |
| DATA-P2-002 | P2 | Destructive table-replacement migrations are not transaction-wrapped | lens_focused_security_supply_chain_ci.md |
| DATA-P2-003 | P2 | `orphan-cleanup` deletes storage objects based on a truncated listing | lens_focused_security_supply_chain_ci.md |
| DATA-P2-004 | P2 | Migration CI dry-run diff is non-blocking; drift is never gated | lens_focused_security_supply_chain_ci.md |
| DATA-P2-005 | P2 | `audit_logs` org-delete cascade destroys compliance history; 365-day purge has no archive | lens_focused_security_supply_chain_ci.md |
| DATA-P2-006 | P2 | Several stores lack a retention policy and owner | lens_focused_security_supply_chain_ci.md |
| DATA-P2-007 | P2 | Generated DB types / schema can drift from migration intent | lens_focused_security_supply_chain_ci.md |
| DATA-P2-008 | P2 | Orphan cleanup reference query is unbounded in the object list | lens_focused_security_supply_chain_ci.md |
| DR-P2-001 | P2 | Backup-failure alerting is present but cannot be trusted to deliver | lens_focused_security_supply_chain_ci.md |
| DR-P2-002 | P2 | Terraform state bucket versioning is claimed but not backed by any resource | lens_focused_security_supply_chain_ci.md |
| DR-P2-003 | P2 | The backup/DR runbook and module docs describe a client-facing product, not the platform's own recovery, and the module doc is stale | lens_focused_security_supply_chain_ci.md |
| DR-P2-004 | P2 | Manual restore has no environment guardrail and the transient dump is written unencrypted to `/tmp` | lens_focused_security_supply_chain_ci.md |
| DR-P2-005 | P2 | The product `backup_status` module is not wired to any real platform backup heartbeat | lens_focused_security_supply_chain_ci.md |
| FEAT-P2-001 | P2 | API keys cannot authenticate; the feature is dead | lens_focused_security_supply_chain_ci.md |
| FEAT-P2-002 | P2 | Demo/test data can be seeded into a fresh production database | lens_focused_security_supply_chain_ci.md |
| FILE-P2-001 | P2 | `avatars` bucket is used by code but declared nowhere with no storage RLS policy | lens_focused_security_supply_chain_ci.md |
| FILE-P2-002 | P2 | Free-form `storageBucket`/`storagePath` on create/update allows signing arbitrary in-bucket objects | lens_focused_security_supply_chain_ci.md |
| FILE-P2-003 | P2 | No content/AV scanning and no bucket-level MIME/size limits on the documents bucket | lens_focused_security_supply_chain_ci.md |
| FILE-P2-004 | P2 | No backup or restore path for uploaded objects (durability for files) | lens_focused_security_supply_chain_ci.md |
| FILE-P2-005 | P2 | Content sniffing does not cover Office, archive, text/JSON, or polyglot payloads | lens_focused_security_supply_chain_ci.md |
| FILE-P2-006 | P2 | CSV exports do not neutralize formula injection and default to all rows when `organization_id` is omitted | lens_focused_security_supply_chain_ci.md |
| FINAL-P2-001 | P2 | Governance and observability gaps mean the platform cannot yet detect or control production failure | lens_focused_security_supply_chain_ci.md |
| FINAL-P2-002 | P2 | Residual authorization/secret defaults need explicit decisions | lens_focused_security_supply_chain_ci.md |
| HYG-P2-001 | P2 | Committed prompt/audit corpus bloats the repo and review surface | lens_focused_security_supply_chain_ci.md |
| HYG-P2-002 | P2 | Duplicate product catalogs have diverged | lens_focused_security_supply_chain_ci.md |
| INFRA-P2-001 | P2 | Prometheus alert rules have no delivery path (no Alertmanager) | lens_focused_security_supply_chain_ci.md |
| INFRA-P2-002 | P2 | Dev droplet capacity is under-provisioned and the CI value drifts from dev.tfvars.example | lens_focused_security_supply_chain_ci.md |
| INFRA-P2-003 | P2 | Operations documentation contradicts the current pipeline and configuration | lens_focused_security_supply_chain_ci.md |
| INFRA-P2-004 | P2 | Integration/security env vars referenced by the app schema are not delivered by the deploy pipeline | lens_focused_security_supply_chain_ci.md |
| INFRA-P2-005 | P2 | Redis container hardening was weakened and its password remains in process arguments | lens_focused_security_supply_chain_ci.md |
| INV-P2-001 | P2 | Committed generated artifacts drift without a gate | lens_focused_security_supply_chain_ci.md |
| INV-P2-002 | P2 | Duplicate schema bootstrap SQL can be mistaken for the source of truth | lens_focused_security_supply_chain_ci.md |
| IR-P2-001 | P2 | Several Prometheus metrics are declared but not wired, limiting incident diagnosis | lens_focused_security_supply_chain_ci.md |
| IR-P2-002 | P2 | No alerting on audit-trail gaps or privileged (impersonation/admin) abuse | lens_focused_security_supply_chain_ci.md |
| IR-P2-003 | P2 | No alerting when webhook dead-letters accumulate or payment reconciliation drifts | lens_focused_security_supply_chain_ci.md |
| IR-P2-004 | P2 | Secrets rotation is documented but has no exercised evidence | lens_focused_security_supply_chain_ci.md |
| IR-P2-005 | P2 | No platform status/communication surface for MCT's own outages | lens_focused_security_supply_chain_ci.md |
| IR-P2-006 | P2 | Migration dry-run result is discarded in CI | lens_focused_security_supply_chain_ci.md |
| MT-P2-001 | P2 | Admin global search lists all organizations and can fall through unscoped | lens_focused_security_supply_chain_ci.md |
| MT-P2-002 | P2 | By-id org filters are conditional, so they fail open if the org gate is not reached | lens_focused_security_supply_chain_ci.md |
| MT-P2-003 | P2 | Storage writer path and RLS org-derivation disagree (`orgs/<uuid>/` vs `<uuid>/`) | lens_focused_security_supply_chain_ci.md |
| MT-P2-004 | P2 | Realtime/SSE notification channel is scoped by user only, with no org assertion | lens_focused_security_supply_chain_ci.md |
| MT-P2-005 | P2 | Platform-admin cross-tenant access is role-key based, broad, and unalerted | lens_focused_security_supply_chain_ci.md |
| MT-P2-006 | P2 | Platform-wide report generators run as service role with no tenant guard on scope inputs | lens_focused_security_supply_chain_ci.md |
| NOTIF-P2-001 | P2 | Web Push channel is entirely absent (no subscriptions, no VAPID, no service worker) | lens_focused_security_supply_chain_ci.md |
| NOTIF-P2-002 | P2 | SMTP remains optional; email silently degrades to no-op in production | lens_focused_security_supply_chain_ci.md |
| NOTIF-P2-003 | P2 | Worker lacks an `unhandledRejection` handler (independently verified) | lens_focused_security_supply_chain_ci.md |
| NOTIF-P2-004 | P2 | Scheduled reminder inserts and email sends are not atomic; retries can double-send | lens_focused_security_supply_chain_ci.md |
| NOTIF-P2-005 | P2 | Sensitive ticket content is stored and emailed verbatim with no sensitivity filter | lens_focused_security_supply_chain_ci.md |
| NOTIF-P2-006 | P2 | API inline email fallback has no retry and ignores the send result | lens_focused_security_supply_chain_ci.md |
| OBS-P2-001 | P2 | Prometheus alert rules are not routed anywhere | lens_focused_security_supply_chain_ci.md |
| OBS-P2-002 | P2 | No committed dashboards or SLO/error-budget definitions | lens_focused_security_supply_chain_ci.md |
| OBS-P2-003 | P2 | Backup/restore is scheduled but not verified on the deployed branch | lens_focused_security_supply_chain_ci.md |
| PORT-P2-001 | P2 | 17 tracked shell scripts lack the exec bit; documented ./scripts/... commands fail | lens_focused_security_supply_chain_ci.md |
| PRIV-P2-001 | P2 | Google Analytics and Tawk.to load on public pages with no cookie-consent or opt-out gate | lens_focused_security_supply_chain_ci.md |
| REL-P2-001 | P2 | `CHANGELOG.md` is stale relative to HEAD for the final commits in the delta | lens_focused_security_supply_chain_ci.md |
| REL-P2-002 | P2 | No explicit Breaking Changes or upgrade manifest despite 34 migrations and RLS/entitlement behavior changes | lens_focused_security_supply_chain_ci.md |
| REL-P2-003 | P2 | No release-notes or GitHub Release body template; release body must be authored ad hoc | lens_focused_security_supply_chain_ci.md |
| REL-P2-004 | P2 | Rollback documentation is stale (Terraform push flow) and repeats the false approval claim | lens_focused_security_supply_chain_ci.md |
| RES-P2-001 | P2 | Worker process has no `unhandledRejection` handler | lens_focused_security_supply_chain_ci.md |
| RES-P2-002 | P2 | `WORKER_TIMEOUT` is not a real task timeout; generic task failures have no DLQ | lens_focused_security_supply_chain_ci.md |
| RES-P2-003 | P2 | `QUEUE_BACKEND` default `inline` diverges from production and can silently stall all queued work | lens_focused_security_supply_chain_ci.md |
| RES-P2-004 | P2 | External `fetch` calls without `AbortController` in `public.ts` and `auth.ts` | lens_focused_security_supply_chain_ci.md |
| RES-P2-005 | P2 | Availability detection lives inside the failed domain; no external dead-man's switch or alert delivery | lens_focused_security_supply_chain_ci.md |
| RES-P2-006 | P2 | Backup/restore recovery is configured but not evidenced as exercised, and the restore test verifies only table counts | lens_focused_security_supply_chain_ci.md |
| RLS-P2-001 | P2 | MSP platform-admin role keys missing from post-5302129 admin-gate RLS policies | lens_focused_security_supply_chain_ci.md |
| RLS-P2-002 | P2 | webhook_dead_letters has no user-scoped DELETE policy while the API deletes via the RLS client | lens_focused_security_supply_chain_ci.md |
| RLS-P2-003 | P2 | approve_project_task / add_project_task_comment trust a caller-supplied user id and are granted to authenticated | lens_focused_security_supply_chain_ci.md |
| SBOM-P2-001 | P2 | SBOM is artifact-only: not release-bound, not commit-bound, not attested | lens_focused_security_supply_chain_ci.md |
| SBOM-P2-002 | P2 | No container/image SBOM; base-image OS packages untracked | lens_focused_security_supply_chain_ci.md |
| SBOM-P2-003 | P2 | `docs/CI.md` documents the SBOM workflow as "Blocking" but it gates nothing | lens_focused_security_supply_chain_ci.md |
| SC-P2-001 | P2 | No image-level container scanning; Trivy scans filesystem only | lens_focused_security_supply_chain_ci.md |
| SC-P2-002 | P2 | No artifact provenance, attestation, or signing; `id-token: write` requested but unused | lens_focused_security_supply_chain_ci.md |
| SC-P2-003 | P2 | License policy not enforced in CI; non-OSI and LGPL licenses present | lens_focused_security_supply_chain_ci.md |
| SC-P2-004 | P2 | SBOM is generated but not bound to a commit or attached to releases/images | lens_focused_security_supply_chain_ci.md |
| SC-P2-005 | P2 | Dependabot PR backlog is large and not triaged; one stale update conflicts with resolved versions | lens_focused_security_supply_chain_ci.md |
| SEARCH-P2-001 | P2 | Raw search terms persisted in plaintext `audit_logs.metadata` | lens_focused_security_supply_chain_ci.md |
| SEARCH-P2-002 | P2 | Portal search omits documents despite SDK and documentation contract | lens_focused_security_supply_chain_ci.md |
| SEARCH-P2-003 | P2 | Admin search UI silently discards the documents result set | lens_focused_security_supply_chain_ci.md |
| SEARCH-P2-004 | P2 | No search pagination or result counts; hard 5-result ceiling | lens_focused_security_supply_chain_ci.md |
| SEARCH-P2-005 | P2 | Search query analytics metric is dead and the analytics summary RPC is missing | lens_focused_security_supply_chain_ci.md |
| SEARCH-P2-006 | P2 | Prefix/wildcard mismatch: no btree on prefix columns and no full-text (`tsvector`) search | lens_focused_security_supply_chain_ci.md |
| SEARCH-P2-007 | P2 | Typeahead calls full search endpoints without rate limiting or a dedicated autocomplete surface | lens_focused_security_supply_chain_ci.md |
| SEC-P2-001 | P2 | Secret scanner echoes the matched secret value into CI logs | lens_focused_security_supply_chain_ci.md |
| SEC-P2-002 | P2 | Webhook SSRF guard has a DNS-rebinding TOCTOU window | lens_focused_security_supply_chain_ci.md |
| SEC-P2-003 | P2 | Client-onboarding mutations run without `requirePermission` (authorization outlier) | lens_focused_security_supply_chain_ci.md |
| SEC-P2-004 | P2 | MSP platform roles are cross-tenant for org access but not for permissions (inconsistent trust model) | lens_focused_security_supply_chain_ci.md |
| SEC-P2-005 | P2 | Forgot-password email redirect still uses attacker-controlled `Origin` header | lens_focused_security_supply_chain_ci.md |
| SEC-P2-006 | P2 | `GET /analytics/summary` calls a `get_analytics_summary` RPC that no migration defines | lens_focused_security_supply_chain_ci.md |
| SEC-P2-007 | P2 | RLS is bypassed on API requests by default (service-role is the default client) | lens_focused_security_supply_chain_ci.md |
| SEC-P2-008 | P2 | CAPTCHA/Turnstile is bypassed when the secret is unset | lens_focused_security_supply_chain_ci.md |
| SEC-P2-009 | P2 | `/health` publicly discloses provider configuration and Redis errors | lens_focused_security_supply_chain_ci.md |
| SECRET-P2-001 | P2 | Secret rotation inventory and GitHub matrix lag the schema/compose; seven keys uncovered | lens_focused_security_supply_chain_ci.md |
| SECRET-P2-002 | P2 | Rotation reminder workflow referenced in docs does not exist; rotation log shows no real rotation | lens_focused_security_supply_chain_ci.md |
| SECRET-P2-003 | P2 | Secret scanning is diff-scoped only; no full-history scan artifact | lens_focused_security_supply_chain_ci.md |
| SECRET-P2-004 | P2 | Produced Terraform `prod.tfvars` is tracked despite `.gitignore` intending to exclude it | lens_focused_security_supply_chain_ci.md |
| SUPPLY-P2-001 | P2 | `licenses.json` is committed but unenforced and unverified | lens_focused_security_supply_chain_ci.md |
| SUPPLY-P2-002 | P2 | Swagger UI loads an unpinned third-party script without SRI | lens_focused_security_supply_chain_ci.md |
| TEST-P2-001 | P2 | Accessibility gate width contradicts the code (docs say 19 pages, code scans 25) | lens_focused_security_supply_chain_ci.md |
| TEST-P2-002 | P2 | Worker data-mutating scan tasks still lack a dedicated test suite; branch threshold is a no-op | lens_focused_security_supply_chain_ci.md |
| TEST-P2-003 | P2 | E2E flakiness is documented but unresolved, and the prod-only gate masks it | lens_focused_security_supply_chain_ci.md |
| TEST-P2-004 | P2 | Load tests exist but are manual-only with no enforced thresholds or failure injection | lens_focused_security_supply_chain_ci.md |
| TEST-P2-005 | P2 | Orphan-cleanup tests model `storage.list` incorrectly, masking the data-loss bug | lens_focused_security_supply_chain_ci.md |
| TEST-P2-006 | P2 | Route suites stub authorization middleware, so new routes can regress silently | lens_focused_security_supply_chain_ci.md |
| WH-P2-001 | P2 | M365 inbound notifications have no enforced timestamp/replay window | lens_focused_security_supply_chain_ci.md |
| WH-P2-002 | P2 | Inline dispatcher records a fixed `retry_count` and duplicates the worker's retry logic | lens_focused_security_supply_chain_ci.md |
| WH-P2-003 | P2 | Outbound and DLQ delivery outcomes are not metered; only inbound success increments the counter | lens_focused_security_supply_chain_ci.md |
| WH-P2-004 | P2 | Inbound Jira/JSM signature falls back to re-serialized JSON when `req.rawBody` is absent | lens_focused_security_supply_chain_ci.md |
| WH-P2-005 | P2 | `webhook_dead_letters` has no DELETE policy while the API deletes via the RLS client | lens_focused_security_supply_chain_ci.md |
| WH-P2-006 | P2 | No per-provider payload schema or size cap on webhook ingress (global 10mb JSON limit) | lens_focused_security_supply_chain_ci.md |
| ACM-P3-001 | P3 | Client-side permission hiding is UI-only for several module actions | lens_focused_security_supply_chain_ci.md |
| ACM-P3-002 | P3 | No catalog-lint: referenced permission keys are not checked against the `permissions` table | lens_focused_security_supply_chain_ci.md |
| ACM-P3-003 | P3 | Public route surface is broad and has no single documented inventory | lens_focused_security_supply_chain_ci.md |
| ACM-P3-004 | P3 | `GET /roles/:id` and `GET /me/permissions` are readable without an admin gate | lens_focused_security_supply_chain_ci.md |
| ACM-P3-005 | P3 | RLS policies reference `manage` permissions that no role holds (dead predicates) | lens_focused_security_supply_chain_ci.md |
| ADMIN-P3-001 | P3 | Web admin gate accepts a broader role set than the API `requireAdmin` (guard/API divergence) | lens_focused_security_supply_chain_ci.md |
| ADMIN-P3-002 | P3 | Active-org cookie setter performs no server-side authorization | lens_focused_security_supply_chain_ci.md |
| ADMIN-P3-003 | P3 | Admin global search and dashboard expose global resource names/counts to any admin | lens_focused_security_supply_chain_ci.md |
| ADMIN-P3-004 | P3 | Global store catalog is mutable by any tenant admin | lens_focused_security_supply_chain_ci.md |
| AI-P3-001 | P3 | Embedded repo maps and historical pack outputs still reference the pre-rename repository path | lens_focused_security_supply_chain_ci.md |
| AI-P3-002 | P3 | `AGENTS.md` retains a large self-contradicting "snapshot" history that an agent must disambiguate | lens_focused_security_supply_chain_ci.md |
| AI-P3-003 | P3 | Secrets guidance is spread across instructions without a linked canonical runbook | lens_focused_security_supply_chain_ci.md |
| AN-P3-001 | P3 | Analytics has no consent-mode signalling and no documented event/retention governance | lens_focused_security_supply_chain_ci.md |
| API-P3-001 | P3 | Minor contract inconsistencies (`rateLimitByUser` non-enveloped 429, capped raw-array lists, no `request_id`) | lens_focused_security_supply_chain_ci.md |
| API-P3-002 | P3 | OpenAPI artifact is not bound to a commit and the CI audit warns (not fails) on documented-but-missing routes | lens_focused_security_supply_chain_ci.md |
| API-P3-003 | P3 | Realtime client has no reconnect path; server emits `auth_expired` with no documented client handling | lens_focused_security_supply_chain_ci.md |
| API-P3-004 | P3 | `/metrics` is fully public when `METRICS_TOKEN` is unset | lens_focused_security_supply_chain_ci.md |
| ARCH-P3-001 | P3 | Web middleware gates routes on an unverified JWT `exp` | lens_focused_security_supply_chain_ci.md |
| BILL-P3-001 | P3 | Webhook raw body typed as `string` but consumed as `Buffer` | lens_focused_security_supply_chain_ci.md |
| BILL-P3-002 | P3 | Billing email stored in plaintext and raw Stripe payment-method id rendered to users | lens_focused_security_supply_chain_ci.md |
| BP-P3-001 | P3 | Hotfix and emergency-deploy documentation is a stub and partially stale | lens_focused_security_supply_chain_ci.md |
| BP-P3-002 | P3 | Dependabot has no security-update separation or triage SLA, and PR template has no enforced link to required checks | lens_focused_security_supply_chain_ci.md |
| CI-P3-001 | P3 | actionlint/shellcheck workflow lint issues (SC2086/SC2129/SC2002/SC2015) | lens_focused_security_supply_chain_ci.md |
| CI-P3-002 | P3 | Over-broad workflow token permissions (unused write scopes) | lens_focused_security_supply_chain_ci.md |
| CI-P3-003 | P3 | StrictHostKeyChecking=no in the deploy health check | lens_focused_security_supply_chain_ci.md |
| CI-P3-004 | P3 | `main` is far behind `develop`; scheduled jobs fire only from the default branch | lens_focused_security_supply_chain_ci.md |
| CI-P3-005 | P3 | Secret scanner misses the platform's own token formats and scans diffs only | lens_focused_security_supply_chain_ci.md |
| CI-P3-006 | P3 | Unused permission grants across deploy/test workflows | lens_focused_security_supply_chain_ci.md |
| CI-P3-007 | P3 | DB restore test uses an unpinned `postgres:16-alpine` image | lens_focused_security_supply_chain_ci.md |
| CI-P3-008 | P3 | No release/tagging workflow and no post-merge release artifact | lens_focused_security_supply_chain_ci.md |
| CI-P3-009 | P3 | e2e is required on `main` but the documented flakiness makes it an unstable hard gate | lens_focused_security_supply_chain_ci.md |
| CI-P3-010 | P3 | Missing per-job timeouts and minor workflow hygiene gaps | lens_focused_security_supply_chain_ci.md |
| CONF-P3-001 | P3 | Secret rotation policy has no evidence any secret was ever rotated | lens_focused_security_supply_chain_ci.md |
| CTR-P3-001 | P3 | Missing `--start-period` on API and Worker Healthchecks | lens_focused_security_supply_chain_ci.md |
| CTR-P3-002 | P3 | Broad `.dockerignore` `*.md`/`*.txt`/`*.log` Could Mask Needed Build Files | lens_focused_security_supply_chain_ci.md |
| DATA-P3-001 | P3 | Pre-baseline policies created without a preceding `drop policy if exists` | lens_focused_security_supply_chain_ci.md |
| DATA-P3-002 | P3 | Migration version gaps undocumented; brief states 141 migrations, tree has 127 | lens_focused_security_supply_chain_ci.md |
| DET-P3-001 | P3 | [SUPPLY] 3 container image(s) without a digest pin | lens_focused_security_supply_chain_ci.md |
| DOC-P3-001 | P3 | Dated point-in-time audit reports are mixed with current runbooks with no archive/staleness marker | lens_focused_security_supply_chain_ci.md |
| DR-P3-001 | P3 | Duplicate backup-script logic in bash and PowerShell risks drift | lens_focused_security_supply_chain_ci.md |
| DR-P3-002 | P3 | Unpinned Postgres image in the restore test; no explicit jq/aws tool pinning in the backup job | lens_focused_security_supply_chain_ci.md |
| DR-P3-003 | P3 | Documented backup/DR export endpoints do not exist | lens_focused_security_supply_chain_ci.md |
| EVOL-P3-001 | P3 | Feature flags are a hardcoded static map with no managed service, change log, or targeting | lens_focused_security_supply_chain_ci.md |
| FEAT-P3-001 | P3 | OpenAPI/Swagger surface is public and its UI is blocked by the API CSP | lens_focused_security_supply_chain_ci.md |
| FILE-P3-001 | P3 | Share endpoint has no per-token rate limit | lens_focused_security_supply_chain_ci.md |
| FILE-P3-002 | P3 | Client logo accept list still advertises SVG that the server rejects | lens_focused_security_supply_chain_ci.md |
| FILE-P3-003 | P3 | Documentation drift on file types and size limits; no documents/upload runbook | lens_focused_security_supply_chain_ci.md |
| HYG-P3-001 | P3 | Stale and machine-specific generated documentation | lens_focused_security_supply_chain_ci.md |
| HYG-P3-002 | P3 | Generated artifacts are inconsistently tracked | lens_focused_security_supply_chain_ci.md |
| INFRA-P3-001 | P3 | `env/prod.tfvars` is tracked despite an ignore rule that names it | lens_focused_security_supply_chain_ci.md |
| INFRA-P3-002 | P3 | Restore test uses a different Postgres major than the backup script and verifies only table counts | lens_focused_security_supply_chain_ci.md |
| INFRA-P3-003 | P3 | `docs/RTO_RPO.md` claims Redis AOF persistence that compose does not enable | lens_focused_security_supply_chain_ci.md |
| INFRA-P3-004 | P3 | `infra/terraform/README.md` references an `aws/` directory that does not exist | lens_focused_security_supply_chain_ci.md |
| INFRA-P3-005 | P3 | Terraform is manual-dispatch only, so the "push to trigger apply" rollback runbook step is a no-op | lens_focused_security_supply_chain_ci.md |
| INV-P3-001 | P3 | Large committed prompt/audit corpus inflates the application repository | lens_focused_security_supply_chain_ci.md |
| INV-P3-002 | P3 | Stale, machine-specific repo path in the agent reference | lens_focused_security_supply_chain_ci.md |
| IR-P3-001 | P3 | Terraform state restore guidance lacks a tested procedure | lens_focused_security_supply_chain_ci.md |
| IR-P3-002 | P3 | Monitoring doc and health endpoint disagree on check semantics; Redis severity undocumented in alerts | lens_focused_security_supply_chain_ci.md |
| MOB-P3-001 | P3 | PWA manifest ships only an SVG icon and is duplicated across three sources | lens_focused_security_supply_chain_ci.md |
| MT-P3-001 | P3 | No automated cross-tenant isolation regression suite for application-layer scoping | lens_focused_security_supply_chain_ci.md |
| NOTIF-P3-001 | P3 | No email template system; repetitive inline HTML diverges between senders | lens_focused_security_supply_chain_ci.md |
| NOTIF-P3-002 | P3 | `sms` channel is a dead preference option; UI copy misstates enforcement | lens_focused_security_supply_chain_ci.md |
| NOTIF-P3-003 | P3 | SSE polling fallback interval is not cleared on unmount | lens_focused_security_supply_chain_ci.md |
| OBS-P3-001 | P3 | Incident runbooks/tabletop evidence is partial | lens_focused_security_supply_chain_ci.md |
| PERF-P3-001 | P3 | No bundle-size or performance budget gate; the analyzer is opt-in only | lens_focused_security_supply_chain_ci.md |
| PERF-P3-002 | P3 | API routes broadly select all columns (`select("*")`) and pagination is ad hoc | lens_focused_security_supply_chain_ci.md |
| REL-P3-001 | P3 | Commit history contains non-conventional noise commits and a single author, reducing automated-notes quality | lens_focused_security_supply_chain_ci.md |
| REL-P3-002 | P3 | PR template lacks changelog and versioned-artifact checkboxes | lens_focused_security_supply_chain_ci.md |
| RES-P3-001 | P3 | Worker graceful shutdown has no force-exit fallback | lens_focused_security_supply_chain_ci.md |
| RES-P3-002 | P3 | Worker queued webhook dispatcher inserts deliveries without an idempotency key | lens_focused_security_supply_chain_ci.md |
| RES-P3-003 | P3 | `AGENTS.md` documents the worker consumer incorrectly and omits the queue backend divergence | lens_focused_security_supply_chain_ci.md |
| RES-P3-004 | P3 | Deploy health gate treats worker unhealthiness as non-fatal | lens_focused_security_supply_chain_ci.md |
| RES-P3-005 | P3 | Orphan cleanup lists at most 1000 objects per bucket and cannot verify the purge shrank anything | lens_focused_security_supply_chain_ci.md |
| RLS-P3-001 | P3 | 5302116 grants anon UPDATE/DELETE on every table, amplified by no RLS-off × anon-write lint | lens_focused_security_supply_chain_ci.md |
| RLS-P3-002 | P3 | No behavioral RLS allow/deny matrix test (static gate only) | lens_focused_security_supply_chain_ci.md |
| RLS-P3-003 | P3 | storage_path_org_id trusts a client-controlled object name | lens_focused_security_supply_chain_ci.md |
| RLS-P3-004 | P3 | Duplicate scoped-client tests and stale coverage-matrix snapshot | lens_focused_security_supply_chain_ci.md |
| SBOM-P3-001 | P3 | Root license is ISC with no documented rationale | lens_focused_security_supply_chain_ci.md |
| SBOM-P3-002 | P3 | SBOM format/count not validated before upload; no regression guard | lens_focused_security_supply_chain_ci.md |
| SC-P3-001 | P3 | Root package license remains "ISC" | lens_focused_security_supply_chain_ci.md |
| SC-P3-002 | P3 | e2e Docker image is not digest-pinned | lens_focused_security_supply_chain_ci.md |
| SC-P3-003 | P3 | Secret-scanner pattern sets diverge between `.sh` and `.ps1` | lens_focused_security_supply_chain_ci.md |
| SEARCH-P3-001 | P3 | Soft-delete columns are defined but never used by queries or deletes | lens_focused_security_supply_chain_ci.md |
| SEARCH-P3-002 | P3 | Search module documentation is stale relative to the code | lens_focused_security_supply_chain_ci.md |
| SEC-P3-001 | P3 | gitleaks generic-api-key/jwt hits are false positives (no tracked secret) | lens_focused_security_supply_chain_ci.md |
| SEC-P3-002 | P3 | `5302116` grants anon/authenticated full DML on every public table (RLS is the only gate) | lens_focused_security_supply_chain_ci.md |
| SEC-P3-003 | P3 | CORS reflects any origin with credentials when `CORS_ORIGIN="*"` | lens_focused_security_supply_chain_ci.md |
| SEC-P3-004 | P3 | `notification-preferences` PUT accepts a body `organizationId` without `assertOrgScopeMatches` | lens_focused_security_supply_chain_ci.md |
| SEC-P3-005 | P3 | `resolveEffectivePermissions` is uncached and fans out 4–6 queries per gated request | lens_focused_security_supply_chain_ci.md |
| SEC-P3-006 | P3 | Deprecated header and broad API CSP style directive | lens_focused_security_supply_chain_ci.md |
| SEC-P3-007 | P3 | M365 webhook `clientState` is compared non-constant-time | lens_focused_security_supply_chain_ci.md |
| SECRET-P3-001 | P3 | Worker `.env.example` omits `APP_BASE_URL` | lens_focused_security_supply_chain_ci.md |
| SECRET-P3-002 | P3 | Web runtime validator can silently fall back to a localhost API URL | lens_focused_security_supply_chain_ci.md |
| SECRET-P3-003 | P3 | No IT-level break-glass / emergency credential revocation runbook, and no revocation drill evidence | lens_focused_security_supply_chain_ci.md |
| SUPPLY-P3-001 | P3 | Unpinned container images (test/local only); production app images tag-based by design | lens_focused_security_supply_chain_ci.md |
| SUPPLY-P3-002 | P3 | Dockerfile lint: missing WORKDIR in web runner stage and shell-form HEALTHCHECK | lens_focused_security_supply_chain_ci.md |
| SUPPLY-P3-003 | P3 | SBOM is produced as a transient artifact, not bound to a release | lens_focused_security_supply_chain_ci.md |
| SUPPLY-P3-004 | P3 | A secrets file exists on disk outside git (should never be committed) | lens_focused_security_supply_chain_ci.md |
| TEST-P3-001 | P3 | Visual regression is still non-blocking with a known-broken Storybook build | lens_focused_security_supply_chain_ci.md |
| TEST-P3-002 | P3 | No scheduled production smoke check (health + login + critical read) | lens_focused_security_supply_chain_ci.md |
| TEST-P3-003 | P3 | Coverage thresholds remain modest and cannot be confirmed met at this SHA | lens_focused_security_supply_chain_ci.md |
| TEST-P3-004 | P3 | Coverage thresholds are low and E2E stability is unproven on `main` | lens_focused_security_supply_chain_ci.md |
| UX-P3-001 | P3 | Full accessibility breadth scan (68 routes) is triage-only and not a required check | lens_focused_security_supply_chain_ci.md |
| WH-P3-001 | P3 | Test endpoint generates a random idempotency key and never dedups | lens_focused_security_supply_chain_ci.md |
| WH-P3-002 | P3 | No committed event catalog or webhook documentation for consumers | lens_focused_security_supply_chain_ci.md |

---

# Executive Summary

- Target: `mainecybertech` @ `9c0b88c` (branch `main`)
- Run: `mainecybertech-20261004-full-main-9c0b88c` (full mode, full-domain)
- Verdict: **NO-GO**

## Findings

- 336 total: P0 6, P1 59, P2 166, P3 105.
- Domains covered: deterministic, 00_audit_orchestrator, 01_repository_inventory, 02_architecture_runtime_topology, 03_feature_implementation_map, 06_security_authz_tenancy_audit, 24_access_control_matrix_audit, 25_multi_tenant_isolation_attack_simulation, 26_admin_console_abuse_case_audit, 07_data_schema_migration_runtime_validation, 37_supabase_rls_policy_deep_dive, 08_api_contracts_realtime_integrations, 27_webhook_delivery_replay_idempotency_audit, 28_file_upload_download_security_audit, 29_billing_payments_reconciliation_audit, 30_notification_email_push_delivery_audit, 31_search_indexing_privacy_audit, 10_github_actions_cicd_governance, 34_branch_protection_required_checks, 11_supply_chain_dependency_secrets, 35_sbom_license_policy, 36_container_runtime_security, 38_env_secret_rotation, 12_infra_deployment_environment_drift, 09_testing_quality_release_confidence, 13_resilience_recovery_failure_modes, 32_backup_restore_drill, 33_incident_tabletop_exercise, 14_observability_monitoring_incident_readiness, 15_performance_scalability_cost, 04_usability_workflow_audit, 05_ui_ux_accessibility_audit, 17_mobile_pwa_responsive_access, 18_privacy_compliance_data_governance, 39_analytics_tracking_privacy, 16_documentation_devex_operator_readiness, 19_platform_evolution_extensibility, 20_ai_automation_agent_readiness, 21_repo_hygiene_maintainability, 45_exploit_chain_attack_path_audit, 22_final_risk_register_roadmap, 23_executive_summary_release_gate, 40_release_notes_changelog_generator.

Top risks:

- `DATA-P0-001` — Orphan cleanup can recursively delete a bucket’s contents
- `DR-P0-001` — Scheduled backup and restore-test workflows never run because they are absent from the default branch
- `DR-P0-002` — The restore test never asserts integrity and therefore cannot fail on a bad backup
- `IR-P0-001` — No platform-level incident response plan, roles, or postmortem process
- `IR-P0-002` — No data breach response / notification process
- `IR-P0-003` — Total loss of the monitoring/alerting path has no independent dead-man's-switch receiver
- `ACM-P1-001` — Client-onboarding mutations run without any `requirePermission` gate
- `ADMIN-P1-001` — Org-agnostic `requireAdmin` lets a tenant admin read other tenants' admin data
- `ADMIN-P1-002` — Impersonation/cross-tenant access is logged but not reviewable or alerted
- `AI-P1-001` — Vendored audit prompt packs are stale and the run manifest references a prompt the pack does not contain
- `AI-P1-002` — `AGENTS.md` names a stale repository path and three developer docs state a stale accessibility gate size that no guard covers
- `BILL-P1-001` — Module entitlements are derived but not enforced server-side
- `BILL-P1-002` — `payments` table is never populated; payment history is silently empty
- `BILL-P1-003` — Missing Stripe webhook events leave refunds, void, and payment lifecycle unrecorded
- `BP-P1-001` — `main` requires a context (`Dependency Review`) that no job emits
- `BP-P1-002` — `enforce_admins:false` lets administrators bypass all required checks and reviews
- `BP-P1-003` — Production deploy path uses the unguarded `prod` environment, not `prod-approval`
- `CHAIN-P1-001` — Low-trust MSP role key composes into a cross-tenant read pivot
- `CHAIN-P1-002` — Caller-controlled reset redirect composes into an account-takeover assist
- `CHAIN-P1-008` — Branch-protection bypass + missing prod gate compose into unattended production change
- `CI-P1-001` — Production application deploys have no working manual-approval gate
- `CI-P1-002` — Branch-protection-as-code has a likely-mismatched required check and permits admin bypass
- `CI-P1-003` — Production deploy path cannot run; prod environment lacks secrets and protection rules
- `CTR-P1-001` — No Container Image Vulnerability Scan in CI
- `CTR-P1-002` — SBOM Is Lockfile-Only, Not an Image SBOM or Attestation
- `CTR-P1-003` — Unsigned Images With No Provenance/Attestation
- `DATA-P1-001` — Approved-membership RLS predicate reintroduced six times; pending/suspended members could access tenant data
- `DATA-P1-002` — `retention` worker task performs unbounded deletes and reports success on partial failure
- `DATA-P1-003` — Soft-delete columns remain dead schema; DELETE endpoints hard-delete
- `DR-P1-001` — No backup or restore path exists for uploaded files in Supabase Storage
- `DR-P1-002` — Restore-test backup location contract (`S3_BACKUP_BUCKET`) is undocumented and can silently mismatch the backup script
- `DR-P1-003` — Database backups are unencrypted and stored in a single location with no offsite copy
- `DR-P1-004` — The restore test has no failure alert
- `DR-P1-005` — No automated migration reverse/rollback and no bad-migration drill
- `DR-P1-006` — RPO/RTO targets are documented but unvalidated, and the Postgres RPO conflates PITR with the daily dump
- `FILE-P1-001` — Public file-request upload is permission-gated and unreachable for anonymous uploaders
- `FILE-P1-002` — File-request uploads have no tenant-scoped path and no download path; orphan cleanup will delete them
- `FILE-P1-003` — Document version history objects are deleted at replace and by orphan cleanup
- `FINAL-P1-001` — P0 data-loss path and unverified "fixed" claim block a clean release
- `INFRA-P1-001` — SSH is open to the internet on both droplets (admin_ip_ranges default 0.0.0.0/0 and CI never overrides it)
- `INFRA-P1-002` — Terraform state-locking fix is incompatible with the pinned Terraform version (use_lockfile requires >= 1.10, workflows pin 1.9)
- `IR-P1-001` — Rollback documentation contradicts itself on SHA-targeted rollback
- `IR-P1-002` — Bad-migration recovery is manual-only with no automated reverse or staging proof
- `IR-P1-003` — Worker health failure during deploy is non-fatal
- `IR-P1-004` — Backups are not verified deeply enough to prove the documented RPO/RTO
- `IR-P1-005` — Backup bucket configuration is inconsistent between the script, the backup workflow, and the restore test
- `IR-P1-006` — No runtime detection or alerting for tenant-isolation (RLS) regressions
- `MT-P1-001` — Audit log list and export are not org-scoped by default
- `MT-P1-002` — Platform dashboards expose all-tenant aggregates to any single-org admin
- `MT-P1-003` — Public file-request upload authorizes with a permission unioned across all orgs
- `NOTIF-P1-001` — Notification preferences are stored and displayed but never enforced on any send path
- `NOTIF-P1-002` — API-originated notifications bypass the dedup unique index
- `NOTIF-P1-003` — No delivery observability: email/notification failures are silent and unalerted
- `REL-P1-001` — No version identity: no tags, no product version, no commit binding in generated artifacts
- `REL-P1-002` — Documented production deploy path is stated as non-functional and the approval gate claim is false
- `SBOM-P1-001` — No license allow/deny policy in dependency review or any CI gate
- `SBOM-P1-002` — SBOM carries no license data and no dependency graph, limiting triage and license review
- `SC-P1-001` — Critical/high advisories persist in the dev dependency tree; `next` override is mis-scoped
- `SEARCH-P1-001` — `sanitizeSearchTerm` does not strip PostgREST `.` operator separators
- `SEARCH-P1-002` — Admin global search exposes profile PII and never tenant-scopes the organizations query
- `SEC-P1-001` — PII field encryption silently degrades to reversible plaintext
- `SECRET-P1-001` — M365 webhook secret is dead config while the real M365 auth value is undocumented and undeployed
- `SECRET-P1-002` — Deploy pipeline does not write several secret-class env vars the API schema and compose reference
- `WH-P1-001` — Outbound webhook idempotency is non-atomic in the API and absent in the worker dispatcher
- `WH-P1-002` — M365 webhook auth depends on `M365_CLIENT_STATE` which the deploy pipeline does not write, while `M365_WEBHOOK_SECRET` is dead config

## Reconciliation note

All six P0 entries above are `verified-fixed` at `9c0b88c` (evidence in `verification_log.md`).
The automated **NO-GO** is fail-closed: `tools/full_domain.py` counts register severities
regardless of status, and the verdict mirrors the repository's own pre-go-live
`docs/RELEASE_GATE.md` (production is not provisioned; operator exit criteria remain open).
The only open P1 in the latest authoritative verification ledger (`a97425d`, an ancestor of
main) is `CI-P1-001` — provisioning the `prod` environment, an operator action.

Rows from the `20261002-0344` full run are carried **unverified at this commit** and are
marked as such in their notes; fail-closed discipline treats them as open until re-checked.
Fresh findings at `9c0b88c`: `PERF-P3-001`, `PERF-P3-002`, `UX-P3-001`, `PRIV-P2-001`,
`AN-P3-001`, `MOB-P3-001`, `EVOL-P3-001`, `DOC-P3-001`, and the lab deterministic
`DET-P3-001` (3 container images without a digest pin). `CI-P3-003` was re-verified open on
main: the fix merged to `develop` (#94) is not on the default branch.


---

This canonical copy was published from the pack run
`runs/mainecybertech-20261004-full-main-9c0b88c` (full-domain reconciliation at
main `9c0b88c`). The pack run carries the full 42-domain reports; this published
copy carries the normalized findings register.
