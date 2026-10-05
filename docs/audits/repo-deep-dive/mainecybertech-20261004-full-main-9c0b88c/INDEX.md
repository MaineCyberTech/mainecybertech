# Audit run mainecybertech-20261004-full-main-9c0b88c - mainecybertech

Focused security / supply-chain / CI deep-dive (`main` @ `9c0b88c`).

Counts: P0 x6, P1 x59, P2 x166, P3 x105

| File | Contents |
|---|---|
| lens_focused_security_supply_chain_ci.md | Full findings write-up |
| findings.json | Machine-readable findings |
| EXECUTIVE_SUMMARY.md | Summary |
| risk_register.md / follow_up_register.md | Findings register |
| RELEASE_GATE.md | Gate verdict |
| roadmap.md / patch_plan.md | Remediation plan |
| audit_manifest.json | Run manifest |

## P0/P1
- **DATA-P0-001** (P0) Orphan cleanup can recursively delete a bucket’s contents
- **DR-P0-001** (P0) Scheduled backup and restore-test workflows never run because they are absent from the default branch
- **DR-P0-002** (P0) The restore test never asserts integrity and therefore cannot fail on a bad backup
- **IR-P0-001** (P0) No platform-level incident response plan, roles, or postmortem process
- **IR-P0-002** (P0) No data breach response / notification process
- **IR-P0-003** (P0) Total loss of the monitoring/alerting path has no independent dead-man's-switch receiver
- **ACM-P1-001** (P1) Client-onboarding mutations run without any `requirePermission` gate
- **ADMIN-P1-001** (P1) Org-agnostic `requireAdmin` lets a tenant admin read other tenants' admin data
- **ADMIN-P1-002** (P1) Impersonation/cross-tenant access is logged but not reviewable or alerted
- **AI-P1-001** (P1) Vendored audit prompt packs are stale and the run manifest references a prompt the pack does not contain
- **AI-P1-002** (P1) `AGENTS.md` names a stale repository path and three developer docs state a stale accessibility gate size that no guard covers
- **BILL-P1-001** (P1) Module entitlements are derived but not enforced server-side
- **BILL-P1-002** (P1) `payments` table is never populated; payment history is silently empty
- **BILL-P1-003** (P1) Missing Stripe webhook events leave refunds, void, and payment lifecycle unrecorded
- **BP-P1-001** (P1) `main` requires a context (`Dependency Review`) that no job emits
- **BP-P1-002** (P1) `enforce_admins:false` lets administrators bypass all required checks and reviews
- **BP-P1-003** (P1) Production deploy path uses the unguarded `prod` environment, not `prod-approval`
- **CHAIN-P1-001** (P1) Low-trust MSP role key composes into a cross-tenant read pivot
- **CHAIN-P1-002** (P1) Caller-controlled reset redirect composes into an account-takeover assist
- **CHAIN-P1-003** (P1) Branch-protection bypass + missing prod gate compose into unattended production change
- **CI-P1-001** (P1) Production application deploys have no working manual-approval gate
- **CI-P1-002** (P1) Branch-protection-as-code has a likely-mismatched required check and permits admin bypass
- **CI-P1-003** (P1) Production deploy path cannot run; prod environment lacks secrets and protection rules
- **CTR-P1-001** (P1) No Container Image Vulnerability Scan in CI
- **CTR-P1-002** (P1) SBOM Is Lockfile-Only, Not an Image SBOM or Attestation
- **CTR-P1-003** (P1) Unsigned Images With No Provenance/Attestation
- **DATA-P1-001** (P1) Approved-membership RLS predicate reintroduced six times; pending/suspended members could access tenant data
- **DATA-P1-002** (P1) `retention` worker task performs unbounded deletes and reports success on partial failure
- **DATA-P1-003** (P1) Soft-delete columns remain dead schema; DELETE endpoints hard-delete
- **DR-P1-001** (P1) No backup or restore path exists for uploaded files in Supabase Storage
- **DR-P1-002** (P1) Restore-test backup location contract (`S3_BACKUP_BUCKET`) is undocumented and can silently mismatch the backup script
- **DR-P1-003** (P1) Database backups are unencrypted and stored in a single location with no offsite copy
- **DR-P1-004** (P1) The restore test has no failure alert
- **DR-P1-005** (P1) No automated migration reverse/rollback and no bad-migration drill
- **DR-P1-006** (P1) RPO/RTO targets are documented but unvalidated, and the Postgres RPO conflates PITR with the daily dump
- **FILE-P1-001** (P1) Public file-request upload is permission-gated and unreachable for anonymous uploaders
- **FILE-P1-002** (P1) File-request uploads have no tenant-scoped path and no download path; orphan cleanup will delete them
- **FILE-P1-003** (P1) Document version history objects are deleted at replace and by orphan cleanup
- **FINAL-P1-001** (P1) P0 data-loss path and unverified "fixed" claim block a clean release
- **INFRA-P1-001** (P1) SSH is open to the internet on both droplets (admin_ip_ranges default 0.0.0.0/0 and CI never overrides it)
- **INFRA-P1-002** (P1) Terraform state-locking fix is incompatible with the pinned Terraform version (use_lockfile requires >= 1.10, workflows pin 1.9)
- **IR-P1-001** (P1) Rollback documentation contradicts itself on SHA-targeted rollback
- **IR-P1-002** (P1) Bad-migration recovery is manual-only with no automated reverse or staging proof
- **IR-P1-003** (P1) Worker health failure during deploy is non-fatal
- **IR-P1-004** (P1) Backups are not verified deeply enough to prove the documented RPO/RTO
- **IR-P1-005** (P1) Backup bucket configuration is inconsistent between the script, the backup workflow, and the restore test
- **IR-P1-006** (P1) No runtime detection or alerting for tenant-isolation (RLS) regressions
- **MT-P1-001** (P1) Audit log list and export are not org-scoped by default
- **MT-P1-002** (P1) Platform dashboards expose all-tenant aggregates to any single-org admin
- **MT-P1-003** (P1) Public file-request upload authorizes with a permission unioned across all orgs
- **NOTIF-P1-001** (P1) Notification preferences are stored and displayed but never enforced on any send path
- **NOTIF-P1-002** (P1) API-originated notifications bypass the dedup unique index
- **NOTIF-P1-003** (P1) No delivery observability: email/notification failures are silent and unalerted
- **REL-P1-001** (P1) No version identity: no tags, no product version, no commit binding in generated artifacts
- **REL-P1-002** (P1) Documented production deploy path is stated as non-functional and the approval gate claim is false
- **SBOM-P1-001** (P1) No license allow/deny policy in dependency review or any CI gate
- **SBOM-P1-002** (P1) SBOM carries no license data and no dependency graph, limiting triage and license review
- **SC-P1-001** (P1) Critical/high advisories persist in the dev dependency tree; `next` override is mis-scoped
- **SEARCH-P1-001** (P1) `sanitizeSearchTerm` does not strip PostgREST `.` operator separators
- **SEARCH-P1-002** (P1) Admin global search exposes profile PII and never tenant-scopes the organizations query
- **SEC-P1-001** (P1) PII field encryption silently degrades to reversible plaintext
- **SECRET-P1-001** (P1) M365 webhook secret is dead config while the real M365 auth value is undocumented and undeployed
- **SECRET-P1-002** (P1) Deploy pipeline does not write several secret-class env vars the API schema and compose reference
- **WH-P1-001** (P1) Outbound webhook idempotency is non-atomic in the API and absent in the worker dispatcher
- **WH-P1-002** (P1) M365 webhook auth depends on `M365_CLIENT_STATE` which the deploy pipeline does not write, while `M365_WEBHOOK_SECRET` is dead config

