# Release Gate

- Target: `mainecybertech` @ `8d299b8` (`main`)
- Run: `mainecybertech-20261011-0426-full-main-8d299b8`
- Decision: **NO-GO**

## Basis

- P0 x8, P1 x89, P2 x321, P3 x272.

## Blocking findings

| ID | Sev | Title |
|---|---|---|
| DATA-P0-001 | P0 | Orphan cleanup can recursively delete a bucket's contents |
| DR-P0-001 | P0 | No successful backup has ever run: every db-backup, storage-backup and db-restore-test CI run fails |
| DR-P0-002 | P0 | Scheduled backup and restore-test workflows never run because they are absent from the default branch |
| DR-P0-003 | P0 | The restore test never asserts integrity and therefore cannot fail on a bad backup |
| IR-P0-001 | P0 | No platform-level incident response plan, roles, or postmortem process |
| IR-P0-002 | P0 | No data breach response / notification process |
| IR-P0-003 | P0 | Total loss of the monitoring/alerting path has no independent dead-man's-switch receiver |
| OBS-P0-001 | P0 | Total loss of the monitoring/alerting path has no independent dead-man's-switch receiver |
| ACM-P1-001 | P1 | Client-onboarding mutations run without any `requirePermission` gate |
| ACM-P1-002 | P1 | `profiles.is_super_admin` is user-writable under the RLS self-update policy (forgeable super-admin flag) |
| ADMIN-P1-001 | P1 | Org-agnostic `requireAdmin` lets a tenant admin read other tenants' admin data |
| ADMIN-P1-002 | P1 | Impersonation/cross-tenant access is logged but not reviewable or alerted |
| ADMIN-P1-003 | P1 | Role assignment paths let a delegated user-manager grant cross-tenant admin roles (self-escalation) |
| AI-P1-001 | P1 | Vendored audit prompt packs are stale and the run manifest references a prompt the pack does not contain |
| AI-P1-002 | P1 | `AGENTS.md` names a stale repository path and three developer docs state a stale accessibility gate size that no guard covers |
| BILL-P1-001 | P1 | Module entitlements are derived but not enforced server-side |
| BILL-P1-002 | P1 | `payments` table is never populated; payment history is silently empty |
| BILL-P1-003 | P1 | Missing Stripe webhook events leave refunds, void, and payment lifecycle unrecorded |
| BP-P1-001 | P1 | `main` requires a context (`Dependency Review`) that no job emits |
| BP-P1-002 | P1 | `enforce_admins:false` lets administrators bypass all required checks and reviews |
| BP-P1-003 | P1 | Production deploy path uses the unguarded `prod` environment, not `prod-approval` |
| CHAIN-P1-001 | P1 | Low-trust MSP role key composes into a cross-tenant read pivot |
| CHAIN-P1-002 | P1 | Caller-controlled reset redirect composes into an account-takeover assist |
| CHAIN-P1-003 | P1 | Branch-protection bypass + missing prod gate compose into unattended production change |
| CHAIN-P1-004 | P1 | Delegated user-manager self-escalation to cross-tenant admin (role-assignment policy gap) |
| CHAIN-P1-005 | P1 | Forgeable `profiles.is_super_admin` composes into full permission bypass and all-tenant RLS reads |
| CHAIN-P1-006 | P1 | Tenant-blind response cache keys compose into cross-tenant aggregate disclosure |
| CI-P1-001 | P1 | Production application deploys have no working manual-approval gate |
| CI-P1-002 | P1 | Branch-protection-as-code has a likely-mismatched required check and permits admin bypass |
| CI-P1-003 | P1 | Production deploy path cannot run; prod environment lacks secrets and protection rules |
| CTR-P1-001 | P1 | No Container Image Vulnerability Scan in CI |
| CTR-P1-002 | P1 | SBOM Is Lockfile-Only, Not an Image SBOM or Attestation |
| CTR-P1-003 | P1 | Unsigned Images With No Provenance/Attestation |
| DATA-P1-001 | P1 | Approved-membership RLS predicate reintroduced six times; pending/suspended members could access tenant data |
| DATA-P1-002 | P1 | `retention` worker task performs unbounded deletes and reports success on partial failure |
| DATA-P1-003 | P1 | Soft-delete columns remain dead schema; DELETE endpoints hard-delete |
| DR-P1-001 | P1 | The weekly restore test fails at baseline load (invalid GITHUB_ENV format) so no restore verification ever executes |
| DR-P1-002 | P1 | No backup or restore path exists for uploaded files in Supabase Storage |
| DR-P1-003 | P1 | Restore-test backup location contract (`S3_BACKUP_BUCKET`) is undocumented and can silently mismatch the backup script |
| DR-P1-004 | P1 | Database backups are unencrypted and stored in a single location with no offsite copy |
| DR-P1-005 | P1 | The restore test has no failure alert |
| DR-P1-006 | P1 | No automated migration reverse/rollback and no bad-migration drill |
| DR-P1-007 | P1 | RPO/RTO targets are documented but unvalidated, and the Postgres RPO conflates PITR with the daily dump |
| EXEC-P1-001 | P1 | P0 data-loss path and unverified "fixed" claim block a clean release |
| FILE-P1-001 | P1 | Public file-request upload is permission-gated and unreachable for anonymous uploaders |
| FILE-P1-002 | P1 | File-request uploads have no tenant-scoped path and no download path; orphan cleanup will delete them |
| FILE-P1-003 | P1 | Document version history objects are deleted at replace and by orphan cleanup |
| FINAL-P1-001 | P1 | P0 data-loss path and unverified "fixed" claim block a clean release |
| INFRA-P1-001 | P1 | SSH is open to the internet on both droplets (admin_ip_ranges default 0.0.0.0/0 and CI never overrides it) |
| INFRA-P1-002 | P1 | Terraform state-locking fix is incompatible with the pinned Terraform version (use_lockfile requires >= 1.10, workflows pin 1.9) |
| IR-P1-001 | P1 | Rollback documentation contradicts itself on SHA-targeted rollback |
| IR-P1-002 | P1 | Bad-migration recovery is manual-only with no automated reverse or staging proof |
| IR-P1-003 | P1 | Worker health failure during deploy is non-fatal |
| IR-P1-004 | P1 | Backups are not verified deeply enough to prove the documented RPO/RTO |
| IR-P1-005 | P1 | Backup bucket configuration is inconsistent between the script, the backup workflow, and the restore test |
| IR-P1-006 | P1 | No runtime detection or alerting for tenant-isolation (RLS) regressions |
| MT-P1-001 | P1 | Audit log list and export are not org-scoped by default |
| MT-P1-002 | P1 | Platform dashboards expose all-tenant aggregates to any single-org admin |
| MT-P1-003 | P1 | Public file-request upload authorizes with a permission unioned across all orgs |
| MT-P1-004 | P1 | Response cache keys omit the caller's tenant scope, so all-tenant responses can be served to single-org members |
| NOTIF-P1-001 | P1 | Notification preferences are stored and displayed but never enforced on any send path |
| NOTIF-P1-002 | P1 | API-originated notifications bypass the dedup unique index |
| NOTIF-P1-003 | P1 | No delivery observability: email/notification failures are silent and unalerted |
| NOTIF-P1-004 | P1 | Notification preference writes from the web UI omit organization_id (NOT NULL) so toggles cannot persist |
| OBS-P1-001 | P1 | No runtime detection or alerting for tenant-isolation (RLS) regressions |
| ORCH-P1-001 | P1 | Published main audit run is internally inconsistent (report/register ID divergence; full-domain metadata over a one-report inventory) |
| REL-P1-001 | P1 | No version identity: no tags, no product version, no commit binding in generated artifacts |
| REL-P1-002 | P1 | Documented production deploy path is stated as non-functional and the approval gate claim is false |
| RLS-P1-001 | P1 | No runtime detection or alerting for tenant-isolation (RLS) regressions |
| RLS-P1-002 | P1 | Approved-membership RLS predicate reintroduced six times; pending/suspended members could access tenant data |
| SBOM-P1-001 | P1 | SBOM Is Lockfile-Only, Not an Image SBOM or Attestation |
| SBOM-P1-002 | P1 | Unsigned Images With No Provenance/Attestation |
| SBOM-P1-003 | P1 | No version identity: no tags, no product version, no commit binding in generated artifacts |
| SBOM-P1-004 | P1 | No license allow/deny policy in dependency review or any CI gate |
| SBOM-P1-005 | P1 | SBOM carries no license data and no dependency graph, limiting triage and license review |
| SC-P1-001 | P1 | Critical/high advisories persist in the dev dependency tree; `next` override is mis-scoped |
| SEARCH-P1-001 | P1 | `sanitizeSearchTerm` does not strip PostgREST `.` operator separators |
| SEARCH-P1-002 | P1 | Admin global search exposes profile PII and never tenant-scopes the organizations query |
| SEC-P1-001 | P1 | super_admin role can be granted through membership/onboarding/bulk-invite APIs without the /users/:id/role guard |
| SEC-P1-002 | P1 | PII field encryption silently degrades to reversible plaintext |
| SEC-P1-003 | P1 | Org-agnostic `requireAdmin` lets a tenant admin read other tenants' admin data |
| SEC-P1-004 | P1 | Impersonation/cross-tenant access is logged but not reviewable or alerted |
| SEC-P1-005 | P1 | Low-trust MSP role key composes into a cross-tenant read pivot |
| SEC-P1-006 | P1 | Caller-controlled reset redirect composes into an account-takeover assist |
| SEC-P1-007 | P1 | Client-onboarding mutations run without any `requirePermission` gate |
| SEC-P1-008 | P1 | M365 webhook secret is dead config while the real M365 auth value is undocumented and undeployed |
| SEC-P1-009 | P1 | Deploy pipeline does not write several secret-class env vars the API schema and compose reference |
| SEC-P1-010 | P1 | Public file-request upload authorizes with a permission unioned across all orgs |
| SECRET-P1-001 | P1 | M365 webhook secret is dead config while the real M365 auth value is undocumented and undeployed |
| SECRET-P1-002 | P1 | Deploy pipeline does not write several secret-class env vars the API schema and compose reference |
| SECRET-P1-003 | P1 | Rotation and emergency procedures target the wrong GitHub environment for the prod deploy and backup workflows |
| USE-P1-001 | P1 | Self-service password reset dead-ends: the email link lands on a page that cannot complete the reset |
| USE-P1-002 | P1 | Signup email-confirmation link points at the API host and 404s, blocking first login |
| USE-P1-003 | P1 | Admin approval queue cannot approve or reject memberships (roleId sent as empty string) |
| USE-P1-004 | P1 | Every SDK delete reports failure after succeeding because the client cannot parse empty 204 bodies |
| WH-P1-001 | P1 | Outbound webhook idempotency is non-atomic in the API and absent in the worker dispatcher |
| WH-P1-002 | P1 | M365 webhook auth depends on `M365_CLIENT_STATE` which the deploy pipeline does not write, while `M365_WEBHOOK_SECRET` is dead config |

## Verification required to change the verdict

Re-run the owning domains at the remediated commit and capture artifacts; confirm zero P0/P1 remains. This run records a delta only.

