# Final Risk Register — repo-deep-dive run `20261002-0344-develop-6286137`

Aggregated by prompt 22 (`22_final_risk_register_roadmap.md`) from the 26 domain/specialist reports in this run folder into a single authoritative register. Companion artifacts: `roadmap.md`, `patch_plan.md`, and the narrative synthesis in `22_final_risk_register_roadmap.md`.

- Repository: `C:/temp/mainecybertech`
- Branch: `develop`
- Commit: `62861370`
- Generated: 2026-10-02
- Area code: `FINAL` (only for new synthesis findings; this register preserves the exact IDs of the source reports)

## Headline counts (verified against sources)

| Metric | Value |
|---|---:|
| Source reports scanned | 26 |
| **Total findings** | **269** |
| P0 — Critical | 5 |
| P1 — High | 56 |
| P2 — Medium | 132 |
| P3 — Low | 76 |
| Findings N/A (reports with no findings) | 0 (every report in the run emitted at least one finding) |
| Excluded from count | none |
| Duplicate finding IDs | 0 (each ID is unique; verified by `tools/lib_findings.collect_with_dupes`) |

Counts are machine-derived from `### Finding ID:` headings and compact table rows via `tools/collect_findings.py` at this run:

```
run: 20261002-0344-develop-6286137
reports scanned: 26
findings: 269 (P0 x5, P1 x56, P2 x132, P3 x76)
areas: ACM x13, ADMIN x12, AI x8, API x8, BILL x10, BP x9, CHAIN x10, CI x11, CTR x10,
       DATA x11, DR x16, FILE x12, INFRA x12, IR x17, MT x10, NOTIF x12, REL x8, RES x11,
       RLS x7, SBOM x7, SC x9, SEARCH x11, SEC x9, SECRET x9, TEST x7, WH x10
```

The 5 P0s are: `DR-P0-001`, `DR-P0-002` (backup workflows absent from `main`; restore test cannot fail) and `IR-P0-001`, `IR-P0-002`, `IR-P0-003` (no incident-response plan, no breach process, no independent dead-man's-switch).

> **Run-set note.** The run index originally listed 25 reports; a 26th, `40_release_notes_changelog_generator.md`, was published after the first scan and contributes 8 `REL` findings. This register includes it, so the total is 269, not 261.

## How to read this register

- **Evidence** column cites the source report file and the finding section. Full narrative, reproduction notes, and suggested validation live in the cited report.
- **Owner** is a suggested owner bucket, not an assignment.
- **Target** follows the shared remediation windows: P0 immediate (same day) · P1 this week · P2 this month · P3 this quarter.
- **Status** uses the shared vocabulary (`open`, `partially-fixed`, `verified-fixed`, `still-open`, `regressed`, `owner-accepted`).
- **Duplicate clusters** are annotated `_(cluster C-NN)_` on every member row. Clustering merges *count inflation* in the narrative and patch plan; it does **not** delete rows (the register keeps all 269 IDs so it stays consistent with its sources).

## Status reconciliation (stale / carried rows)

| Finding | Report status | Register status | Note |
|---|---|---|---|
| `IR-P1-003` | `partially-fixed` | `partially-fixed` | Worker health check exists but is still non-fatal (deploy gate ignores it). |
| `CHAIN-P2-009` | `regressed` | `regressed` | Terraform `use_lockfile` vs pinned 1.9 conflict is a regression from a previous fix attempt. |
| `CHAIN-P1-002`, `SEC-P2-003` | `still-open` | `still-open` | Forgot-password `Origin` redirect carried unchanged across runs (cluster C-14). |
| `CHAIN-P2-007` | `still-open` | `still-open` | Internet-open SSH carried unchanged (cluster C-15). |
| `ACM-P1-001`, `SEC-P2-001`, `API-P2-001`, `CHAIN-P2-003` | `open` | `open` | Same onboarding gap seen from four reports (cluster C-01); no closed-but-open or open-but-closed rows found. |
| All others | `open` | `open` | No rows claim a verified fix at this commit. |

No finding in this run is `verified-fixed`, and no row contradicts its source status.

---

## Consolidated risk table

Every finding from every report is one row. IDs match the source reports exactly.

| ID | Severity | Title | Evidence | Owner | Target | Status |
|---|---|---|---|---|---|---|
| DR-P0-001 | P0 | Scheduled backup and restore-test workflows never run because they are absent from the default branch | 32_backup_restore_drill.md §DR-P0-001 | platform/backend + platform/ops | immediate (same day) | open |
| DR-P0-002 | P0 | The restore test never asserts integrity and therefore cannot fail on a bad backup _(cluster C-02)_ | 32_backup_restore_drill.md §DR-P0-002 | platform/backend + platform/ops | immediate (same day) | open |
| IR-P0-001 | P0 | No platform-level incident response plan, roles, or postmortem process | 33_incident_tabletop_exercise.md §IR-P0-001 | platform lead / security reviewer | immediate (same day) | open |
| IR-P0-002 | P0 | No data breach response / notification process | 33_incident_tabletop_exercise.md §IR-P0-002 | platform lead / security reviewer | immediate (same day) | open |
| IR-P0-003 | P0 | Total loss of the monitoring/alerting path has no independent dead-man's-switch receiver _(cluster C-18)_ | 33_incident_tabletop_exercise.md §IR-P0-003 | platform lead / security reviewer | immediate (same day) | open |
| ACM-P1-001 | P1 | Client-onboarding mutations run without any `requirePermission` gate _(cluster C-01)_ | 24_access_control_matrix_audit.md §ACM-P1-001 | API platform | this week | open |
| ADMIN-P1-001 | P1 | Org-agnostic `requireAdmin` lets a tenant admin read other tenants' admin data | 26_admin_console_abuse_case_audit.md §ADMIN-P1-001 | API platform / security | this week | open |
| ADMIN-P1-002 | P1 | Impersonation/cross-tenant access is logged but not reviewable or alerted | 26_admin_console_abuse_case_audit.md §ADMIN-P1-002 | API platform / security | this week | open |
| AI-P1-001 | P1 | Vendored audit prompt packs are stale and the run manifest references a prompt the pack does not contain | 20_ai_automation_agent_readiness.md §AI-P1-001 | repo maintainer (AI readiness) | this week | open |
| AI-P1-002 | P1 | `AGENTS.md` names a stale repository path and three developer docs state a stale accessibility gate size that no guard covers | 20_ai_automation_agent_readiness.md §AI-P1-002 | repo maintainer (AI readiness) | this week | open |
| BILL-P1-001 | P1 | Module entitlements are derived but not enforced server-side | 29_billing_payments_reconciliation_audit.md §BILL-P1-001 | billing/backend | this week | open |
| BILL-P1-002 | P1 | `payments` table is never populated; payment history is silently empty | 29_billing_payments_reconciliation_audit.md §BILL-P1-002 | billing/backend | this week | open |
| BILL-P1-003 | P1 | Missing Stripe webhook events leave refunds, void, and payment lifecycle unrecorded | 29_billing_payments_reconciliation_audit.md §BILL-P1-003 | billing/backend | this week | open |
| BP-P1-001 | P1 | `main` requires a context (`Dependency Review`) that no job emits _(cluster C-16)_ | 34_branch_protection_required_checks.md §BP-P1-001 | repo admin (owner decision) | this week | open |
| BP-P1-002 | P1 | `enforce_admins:false` lets administrators bypass all required checks and reviews _(cluster C-16)_ | 34_branch_protection_required_checks.md §BP-P1-002 | repo admin (owner decision) | this week | open |
| BP-P1-003 | P1 | Production deploy path uses the unguarded `prod` environment, not `prod-approval` _(cluster C-16)_ | 34_branch_protection_required_checks.md §BP-P1-003 | repo admin (owner decision) | this week | open |
| CHAIN-P1-001 | P1 | Low-trust MSP role key composes into a cross-tenant read pivot _(cluster C-24)_ | 45_exploit_chain_attack_path_audit.md §CHAIN-P1-001 | CTO/security lead + API team | this week | open |
| CHAIN-P1-002 | P1 | Caller-controlled reset redirect composes into an account-takeover assist _(cluster C-14)_ | 45_exploit_chain_attack_path_audit.md §CHAIN-P1-002 | CTO/security lead + API team | this week | still-open |
| CHAIN-P1-008 | P1 | Branch-protection bypass + missing prod gate compose into unattended production change _(cluster C-16)_ | 45_exploit_chain_attack_path_audit.md §CHAIN-P1-008 | CTO/security lead + API team | this week | open |
| CI-P1-001 | P1 | Production application deploys have no working manual-approval gate | 10_github_actions_cicd_governance.md §CI-P1-001 | platform/CI owner | this week | open |
| CI-P1-002 | P1 | Branch-protection-as-code has a likely-mismatched required check and permits admin bypass _(cluster C-16)_ | 10_github_actions_cicd_governance.md §CI-P1-002 | platform/CI owner | this week | open |
| CTR-P1-001 | P1 | No Container Image Vulnerability Scan in CI _(cluster C-20)_ | 36_container_runtime_security.md §CTR-P1-001 | platform/infrastructure | this week | open |
| CTR-P1-002 | P1 | SBOM Is Lockfile-Only, Not an Image SBOM or Attestation _(cluster C-20)_ | 36_container_runtime_security.md §CTR-P1-002 | platform/infrastructure | this week | open |
| CTR-P1-003 | P1 | Unsigned Images With No Provenance/Attestation _(cluster C-20)_ | 36_container_runtime_security.md §CTR-P1-003 | platform/infrastructure | this week | open |
| DATA-P1-001 | P1 | Approved-membership RLS predicate reintroduced six times; pending/suspended members could access tenant data | 07_data_schema_migration_runtime_validation.md §DATA-P1-001 | backend/data governance | this week | open |
| DATA-P1-002 | P1 | `retention` worker task performs unbounded deletes and reports success on partial failure _(cluster C-22)_ | 07_data_schema_migration_runtime_validation.md §DATA-P1-002 | backend/data governance | this week | open |
| DATA-P1-003 | P1 | Soft-delete columns remain dead schema; DELETE endpoints hard-delete | 07_data_schema_migration_runtime_validation.md §DATA-P1-003 | backend/data governance | this week | open |
| DR-P1-001 | P1 | No backup or restore path exists for uploaded files in Supabase Storage _(cluster C-21)_ | 32_backup_restore_drill.md §DR-P1-001 | platform/backend + platform/ops | this week | open |
| DR-P1-002 | P1 | Restore-test backup location contract (`S3_BACKUP_BUCKET`) is undocumented and can silently mismatch the backup script _(cluster C-03)_ | 32_backup_restore_drill.md §DR-P1-002 | platform/backend + platform/ops | this week | open |
| DR-P1-003 | P1 | Database backups are unencrypted and stored in a single location with no offsite copy | 32_backup_restore_drill.md §DR-P1-003 | platform/backend + platform/ops | this week | open |
| DR-P1-004 | P1 | The restore test has no failure alert | 32_backup_restore_drill.md §DR-P1-004 | platform/backend + platform/ops | this week | open |
| DR-P1-005 | P1 | No automated migration reverse/rollback and no bad-migration drill _(cluster C-27)_ | 32_backup_restore_drill.md §DR-P1-005 | platform/backend + platform/ops | this week | open |
| DR-P1-006 | P1 | RPO/RTO targets are documented but unvalidated, and the Postgres RPO conflates PITR with the daily dump | 32_backup_restore_drill.md §DR-P1-006 | platform/backend + platform/ops | this week | open |
| FILE-P1-001 | P1 | Public file-request upload is permission-gated and unreachable for anonymous uploaders | 28_file_upload_download_security_audit.md §FILE-P1-001 | API/backend + storage | this week | open |
| FILE-P1-002 | P1 | File-request uploads have no tenant-scoped path and no download path; orphan cleanup will delete them | 28_file_upload_download_security_audit.md §FILE-P1-002 | API/backend + storage | this week | open |
| FILE-P1-003 | P1 | Document version history objects are deleted at replace and by orphan cleanup | 28_file_upload_download_security_audit.md §FILE-P1-003 | API/backend + storage | this week | open |
| INFRA-P1-001 | P1 | SSH is open to the internet on both droplets (admin_ip_ranges default 0.0.0.0/0 and CI never overrides it) _(cluster C-15)_ | 12_infra_deployment_environment_drift.md §INFRA-P1-001 | platform/infrastructure | this week | open |
| INFRA-P1-002 | P1 | Terraform state-locking fix is incompatible with the pinned Terraform version (use_lockfile requires >= 1.10, workflows pin 1.9) _(cluster C-04)_ | 12_infra_deployment_environment_drift.md §INFRA-P1-002 | platform/infrastructure | this week | open |
| IR-P1-001 | P1 | Rollback documentation contradicts itself on SHA-targeted rollback _(cluster C-27)_ | 33_incident_tabletop_exercise.md §IR-P1-001 | platform lead / security reviewer | this week | open |
| IR-P1-002 | P1 | Bad-migration recovery is manual-only with no automated reverse or staging proof | 33_incident_tabletop_exercise.md §IR-P1-002 | platform lead / security reviewer | this week | open |
| IR-P1-003 | P1 | Worker health failure during deploy is non-fatal _(cluster C-11)_ | 33_incident_tabletop_exercise.md §IR-P1-003 | platform lead / security reviewer | this week | partially-fixed |
| IR-P1-004 | P1 | Backups are not verified deeply enough to prove the documented RPO/RTO _(cluster C-02)_ | 33_incident_tabletop_exercise.md §IR-P1-004 | platform lead / security reviewer | this week | open |
| IR-P1-005 | P1 | Backup bucket configuration is inconsistent between the script, the backup workflow, and the restore test _(cluster C-03)_ | 33_incident_tabletop_exercise.md §IR-P1-005 | platform lead / security reviewer | this week | open |
| IR-P1-006 | P1 | No runtime detection or alerting for tenant-isolation (RLS) regressions | 33_incident_tabletop_exercise.md §IR-P1-006 | platform lead / security reviewer | this week | open |
| MT-P1-001 | P1 | Audit log list and export are not org-scoped by default | 25_multi_tenant_isolation_attack_simulation.md §MT-P1-001 | API platform / security | this week | open |
| MT-P1-002 | P1 | Platform dashboards expose all-tenant aggregates to any single-org admin | 25_multi_tenant_isolation_attack_simulation.md §MT-P1-002 | API platform / security | this week | open |
| MT-P1-003 | P1 | Public file-request upload authorizes with a permission unioned across all orgs | 25_multi_tenant_isolation_attack_simulation.md §MT-P1-003 | API platform / security | this week | open |
| NOTIF-P1-001 | P1 | Notification preferences are stored and displayed but never enforced on any send path | 30_notification_email_push_delivery_audit.md §NOTIF-P1-001 | notifications/backend | this week | open |
| NOTIF-P1-002 | P1 | API-originated notifications bypass the dedup unique index | 30_notification_email_push_delivery_audit.md §NOTIF-P1-002 | notifications/backend | this week | open |
| NOTIF-P1-003 | P1 | No delivery observability: email/notification failures are silent and unalerted | 30_notification_email_push_delivery_audit.md §NOTIF-P1-003 | notifications/backend | this week | open |
| REL-P1-001 | P1 | No version identity: no tags, no product version, no commit binding in generated artifacts _(cluster C-20)_ | 40_release_notes_changelog_generator.md §REL-P1-001 | platform engineering (release owner) | this week | open |
| REL-P1-002 | P1 | Documented production deploy path is stated as non-functional and the approval gate claim is false _(cluster C-16)_ | 40_release_notes_changelog_generator.md §REL-P1-002 | platform engineering (release owner) | this week | open |
| SBOM-P1-001 | P1 | No license allow/deny policy in dependency review or any CI gate _(cluster C-20)_ | 35_sbom_license_policy.md §SBOM-P1-001 | supply-chain owner | this week | open |
| SBOM-P1-002 | P1 | SBOM carries no license data and no dependency graph, limiting triage and license review _(cluster C-20)_ | 35_sbom_license_policy.md §SBOM-P1-002 | supply-chain owner | this week | open |
| SC-P1-001 | P1 | Critical/high advisories persist in the dev dependency tree; `next` override is mis-scoped | 11_supply_chain_dependency_secrets.md §SC-P1-001 | supply-chain owner | this week | open |
| SEARCH-P1-001 | P1 | `sanitizeSearchTerm` does not strip PostgREST `.` operator separators | 31_search_indexing_privacy_audit.md §SEARCH-P1-001 | search/backend | this week | open |
| SEARCH-P1-002 | P1 | Admin global search exposes profile PII and never tenant-scopes the organizations query _(cluster C-23)_ | 31_search_indexing_privacy_audit.md §SEARCH-P1-002 | search/backend | this week | open |
| SECRET-P1-001 | P1 | M365 webhook secret is dead config while the real M365 auth value is undocumented and undeployed _(cluster C-06)_ | 38_env_secret_rotation.md §SECRET-P1-001 | platform/security | this week | open |
| SECRET-P1-002 | P1 | Deploy pipeline does not write several secret-class env vars the API schema and compose reference _(cluster C-17)_ | 38_env_secret_rotation.md §SECRET-P1-002 | platform/security | this week | open |
| WH-P1-001 | P1 | Outbound webhook idempotency is non-atomic in the API and absent in the worker dispatcher | 27_webhook_delivery_replay_idempotency_audit.md §WH-P1-001 | integrations/backend | this week | open |
| WH-P1-002 | P1 | M365 webhook auth depends on `M365_CLIENT_STATE` which the deploy pipeline does not write, while `M365_WEBHOOK_SECRET` is dead config _(cluster C-06)_ | 27_webhook_delivery_replay_idempotency_audit.md §WH-P1-002 | integrations/backend | this week | open |
| ACM-P2-002 | P2 | `PLATFORM_ADMIN_KEYS` (org traversal) and `ADMIN_BYPASS_KEYS` (permission bypass) are inconsistent trust sets _(cluster C-24)_ | 24_access_control_matrix_audit.md §ACM-P2-002 | API platform | this month | open |
| ACM-P2-003 | P2 | RLS is not a database backstop on API requests (service-role is the default client) _(cluster C-05)_ | 24_access_control_matrix_audit.md §ACM-P2-003 | API platform | this month | open |
| ACM-P2-004 | P2 | Write and state-transition actions gated by `view` permissions (action mismatch) | 24_access_control_matrix_audit.md §ACM-P2-004 | API platform | this month | open |
| ACM-P2-005 | P2 | Webhook endpoint and delivery reads are available to any org member (not manage-gated) | 24_access_control_matrix_audit.md §ACM-P2-005 | API platform | this month | open |
| ACM-P2-006 | P2 | API keys store `expires_at` but nothing enforces or prunes expiry | 24_access_control_matrix_audit.md §ACM-P2-006 | API platform | this month | open |
| ACM-P2-007 | P2 | Webhook signing secrets are stored plaintext with no rotation or expiry | 24_access_control_matrix_audit.md §ACM-P2-007 | API platform | this month | open |
| ACM-P2-008 | P2 | Profiles are enumerable by email/id for any authenticated user _(cluster C-23)_ | 24_access_control_matrix_audit.md §ACM-P2-008 | API platform | this month | open |
| ADMIN-P2-001 | P2 | Sensitive admin exports are not audit-logged | 26_admin_console_abuse_case_audit.md §ADMIN-P2-001 | API platform / security | this month | open |
| ADMIN-P2-002 | P2 | Destructive deletes are inconsistently confirmation-gated and org delete is unrecoverable | 26_admin_console_abuse_case_audit.md §ADMIN-P2-002 | API platform / security | this month | open |
| ADMIN-P2-003 | P2 | Bulk document operations apply without a per-row preview or elevation guardrail | 26_admin_console_abuse_case_audit.md §ADMIN-P2-003 | API platform / security | this month | open |
| ADMIN-P2-004 | P2 | Bulk invite creates pre-confirmed auth accounts (and org onboarding auto-approves admin) | 26_admin_console_abuse_case_audit.md §ADMIN-P2-004 | API platform / security | this month | open |
| ADMIN-P2-005 | P2 | No rate limiting specific to expensive/destructive admin operations | 26_admin_console_abuse_case_audit.md §ADMIN-P2-005 | API platform / security | this month | open |
| ADMIN-P2-006 | P2 | No undo/soft-delete is exercised despite the schema supporting it | 26_admin_console_abuse_case_audit.md §ADMIN-P2-006 | API platform / security | this month | open |
| AI-P2-001 | P2 | No machine-enforced agent guardrails: allowed paths, human-approval actions, and small-batch PR limits exist only as prose | 20_ai_automation_agent_readiness.md §AI-P2-001 | repo maintainer (AI readiness) | this month | open |
| AI-P2-002 | P2 | Prompt packs embed generated outputs alongside instructions without a machine-detectable "not instructions" marker | 20_ai_automation_agent_readiness.md §AI-P2-002 | repo maintainer (AI readiness) | this month | open |
| AI-P2-003 | P2 | `.continue/` agent configuration defines models only and does not surface project rules or boundaries | 20_ai_automation_agent_readiness.md §AI-P2-003 | repo maintainer (AI readiness) | this month | open |
| API-P2-001 | P2 | Mutations remain unguarded by `requirePermission` in several routers (including a governance state transition) _(cluster C-01)_ | 08_api_contracts_realtime_integrations.md §API-P2-001 | API principal engineer | this month | open |
| API-P2-002 | P2 | External integration syncs report success while dropping items, and `jsm-sync` has no HTTP retry | 08_api_contracts_realtime_integrations.md §API-P2-002 | API principal engineer | this month | open |
| API-P2-003 | P2 | Published error-handling contract contradicts the implementation (codes, 422, and `request_id`) | 08_api_contracts_realtime_integrations.md §API-P2-003 | API principal engineer | this month | open |
| API-P2-004 | P2 | SDK retries unsafe requests without an `Idempotency-Key` (duplicate creates on transient failure) | 08_api_contracts_realtime_integrations.md §API-P2-004 | API principal engineer | this month | open |
| API-P2-005 | P2 | Outbound webhook dispatcher uses a non-atomic idempotency check (duplicate deliveries under concurrency) | 08_api_contracts_realtime_integrations.md §API-P2-005 | API principal engineer | this month | open |
| BILL-P2-001 | P2 | No refund and incomplete trial/cancel state handling | 29_billing_payments_reconciliation_audit.md §BILL-P2-001 | billing/backend | this month | open |
| BILL-P2-002 | P2 | `POST /billing/sync` does not paginate Stripe results | 29_billing_payments_reconciliation_audit.md §BILL-P2-002 | billing/backend | this month | open |
| BILL-P2-003 | P2 | Reconciliation job has no drift detection, alerting, or tests | 29_billing_payments_reconciliation_audit.md §BILL-P2-003 | billing/backend | this month | open |
| BILL-P2-004 | P2 | Failed payments produce no notification or dunning visibility | 29_billing_payments_reconciliation_audit.md §BILL-P2-004 | billing/backend | this month | open |
| BILL-P2-005 | P2 | Subscription/invoice schema lacks trial, interval, and void-lifecycle fields | 29_billing_payments_reconciliation_audit.md §BILL-P2-005 | billing/backend | this month | open |
| BP-P2-001 | P2 | `require_code_owner_reviews:false` makes the committed CODEOWNERS advisory only | 34_branch_protection_required_checks.md §BP-P2-001 | repo admin (owner decision) | this month | open |
| BP-P2-002 | P2 | No break-glass / bypass process for branch protection, and no bypass audit trail | 34_branch_protection_required_checks.md §BP-P2-002 | repo admin (owner decision) | this month | open |
| BP-P2-003 | P2 | No drift detection between committed branch-protection JSON and live GitHub settings | 34_branch_protection_required_checks.md §BP-P2-003 | repo admin (owner decision) | this month | open |
| BP-P2-004 | P2 | Path-filtered required checks can leave `main`/`develop` protected by checks that never run | 34_branch_protection_required_checks.md §BP-P2-004 | repo admin (owner decision) | this month | open |
| CHAIN-P2-003 | P2 | Intra-tenant capability escalation via unguarded mutations _(cluster C-01)_ | 45_exploit_chain_attack_path_audit.md §CHAIN-P2-003 | CTO/security lead + API team | this month | open |
| CHAIN-P2-004 | P2 | Definer RPC identity trust composes into forged approvals/comments _(cluster C-26)_ | 45_exploit_chain_attack_path_audit.md §CHAIN-P2-004 | CTO/security lead + API team | this month | open |
| CHAIN-P2-005 | P2 | RLS admin-gate regression composes with the API trust model into MSP admin denials _(cluster C-25)_ | 45_exploit_chain_attack_path_audit.md §CHAIN-P2-005 | CTO/security lead + API team | this month | open |
| CHAIN-P2-006 | P2 | Retention + cascade compose into silent destruction of audit evidence _(cluster C-22)_ | 45_exploit_chain_attack_path_audit.md §CHAIN-P2-006 | CTO/security lead + API team | this month | open |
| CHAIN-P2-007 | P2 | Internet-open SSH composes into service-role exfiltration and tenant takeover _(cluster C-15)_ | 45_exploit_chain_attack_path_audit.md §CHAIN-P2-007 | CTO/security lead + API team | this month | still-open |
| CHAIN-P2-009 | P2 | Terraform version/lockfile conflict composes into un-gated infrastructure change _(cluster C-04)_ | 45_exploit_chain_attack_path_audit.md §CHAIN-P2-009 | CTO/security lead + API team | this month | regressed |
| CHAIN-P2-010 | P2 | Silent worker failures + in-stack monitoring compose into undetected degradation _(cluster C-18)_ | 45_exploit_chain_attack_path_audit.md §CHAIN-P2-010 | CTO/security lead + API team | this month | open |
| CI-P2-002 | P2 | DB restore test reports success without asserting restore integrity _(cluster C-02)_ | 10_github_actions_cicd_governance.md §CI-P2-002 | platform/CI owner | this month | open |
| CI-P2-003 | P2 | Infrastructure changes are no longer gated in CI (terraform-do is manual-dispatch only) | 10_github_actions_cicd_governance.md §CI-P2-003 | platform/CI owner | this month | open |
| CI-P2-004 | P2 | Chromatic visual-regression job is permanently non-blocking | 10_github_actions_cicd_governance.md §CI-P2-004 | platform/CI owner | this month | open |
| CTR-P2-001 | P2 | Pinned Base-Image Digests Have No Automated Refresh _(cluster C-20)_ | 36_container_runtime_security.md §CTR-P2-001 | platform/infrastructure | this month | open |
| CTR-P2-002 | P2 | Local Compose Ships Default Credentials and Repo-Wide Bind Mount | 36_container_runtime_security.md §CTR-P2-002 | platform/infrastructure | this month | open |
| CTR-P2-003 | P2 | Redis Password Exposed on Process Argument Vector _(cluster C-13)_ | 36_container_runtime_security.md §CTR-P2-003 | platform/infrastructure | this month | open |
| CTR-P2-004 | P2 | Deploy Health Gate Ignores Worker Health _(cluster C-11)_ | 36_container_runtime_security.md §CTR-P2-004 | platform/infrastructure | this month | open |
| CTR-P2-005 | P2 | No Container Resource/PID Limits Beyond Memory | 36_container_runtime_security.md §CTR-P2-005 | platform/infrastructure | this month | open |
| DATA-P2-001 | P2 | Blanket `anon` DML grant + default privileges make every future table anon-writable unless RLS happens to stop it _(cluster C-09)_ | 07_data_schema_migration_runtime_validation.md §DATA-P2-001 | backend/data governance | this month | open |
| DATA-P2-002 | P2 | Destructive table-replacement migrations are not transaction-wrapped | 07_data_schema_migration_runtime_validation.md §DATA-P2-002 | backend/data governance | this month | open |
| DATA-P2-003 | P2 | `orphan-cleanup` deletes storage objects based on a truncated listing | 07_data_schema_migration_runtime_validation.md §DATA-P2-003 | backend/data governance | this month | open |
| DATA-P2-004 | P2 | Migration CI dry-run diff is non-blocking; drift is never gated | 07_data_schema_migration_runtime_validation.md §DATA-P2-004 | backend/data governance | this month | open |
| DATA-P2-005 | P2 | `audit_logs` org-delete cascade destroys compliance history; 365-day purge has no archive _(cluster C-28)_ | 07_data_schema_migration_runtime_validation.md §DATA-P2-005 | backend/data governance | this month | open |
| DATA-P2-006 | P2 | Several stores lack a retention policy and owner _(cluster C-22)_ | 07_data_schema_migration_runtime_validation.md §DATA-P2-006 | backend/data governance | this month | open |
| DR-P2-001 | P2 | Backup-failure alerting is present but cannot be trusted to deliver _(cluster C-19)_ | 32_backup_restore_drill.md §DR-P2-001 | platform/backend + platform/ops | this month | open |
| DR-P2-002 | P2 | Terraform state bucket versioning is claimed but not backed by any resource | 32_backup_restore_drill.md §DR-P2-002 | platform/backend + platform/ops | this month | open |
| DR-P2-003 | P2 | The backup/DR runbook and module docs describe a client-facing product, not the platform's own recovery, and the module doc is stale | 32_backup_restore_drill.md §DR-P2-003 | platform/backend + platform/ops | this month | open |
| DR-P2-004 | P2 | Manual restore has no environment guardrail and the transient dump is written unencrypted to `/tmp` | 32_backup_restore_drill.md §DR-P2-004 | platform/backend + platform/ops | this month | open |
| DR-P2-005 | P2 | The product `backup_status` module is not wired to any real platform backup heartbeat _(cluster C-19)_ | 32_backup_restore_drill.md §DR-P2-005 | platform/backend + platform/ops | this month | open |
| FILE-P2-001 | P2 | `avatars` bucket is used by code but declared nowhere with no storage RLS policy | 28_file_upload_download_security_audit.md §FILE-P2-001 | API/backend + storage | this month | open |
| FILE-P2-002 | P2 | Free-form `storageBucket`/`storagePath` on create/update allows signing arbitrary in-bucket objects | 28_file_upload_download_security_audit.md §FILE-P2-002 | API/backend + storage | this month | open |
| FILE-P2-003 | P2 | No content/AV scanning and no bucket-level MIME/size limits on the documents bucket | 28_file_upload_download_security_audit.md §FILE-P2-003 | API/backend + storage | this month | open |
| FILE-P2-004 | P2 | No backup or restore path for uploaded objects (durability for files) _(cluster C-21)_ | 28_file_upload_download_security_audit.md §FILE-P2-004 | API/backend + storage | this month | open |
| FILE-P2-005 | P2 | Content sniffing does not cover Office, archive, text/JSON, or polyglot payloads | 28_file_upload_download_security_audit.md §FILE-P2-005 | API/backend + storage | this month | open |
| FILE-P2-006 | P2 | CSV exports do not neutralize formula injection and default to all rows when `organization_id` is omitted | 28_file_upload_download_security_audit.md §FILE-P2-006 | API/backend + storage | this month | open |
| INFRA-P2-003 | P2 | Prometheus alert rules have no delivery path (no Alertmanager) _(cluster C-18)_ | 12_infra_deployment_environment_drift.md §INFRA-P2-003 | platform/infrastructure | this month | open |
| INFRA-P2-004 | P2 | Dev droplet capacity is under-provisioned and the CI value drifts from dev.tfvars.example | 12_infra_deployment_environment_drift.md §INFRA-P2-004 | platform/infrastructure | this month | open |
| INFRA-P2-005 | P2 | Operations documentation contradicts the current pipeline and configuration | 12_infra_deployment_environment_drift.md §INFRA-P2-005 | platform/infrastructure | this month | open |
| INFRA-P2-006 | P2 | Integration/security env vars referenced by the app schema are not delivered by the deploy pipeline _(cluster C-17)_ | 12_infra_deployment_environment_drift.md §INFRA-P2-006 | platform/infrastructure | this month | open |
| INFRA-P2-007 | P2 | Redis container hardening was weakened and its password remains in process arguments _(cluster C-13)_ | 12_infra_deployment_environment_drift.md §INFRA-P2-007 | platform/infrastructure | this month | open |
| IR-P2-001 | P2 | Several Prometheus metrics are declared but not wired, limiting incident diagnosis | 33_incident_tabletop_exercise.md §IR-P2-001 | platform lead / security reviewer | this month | open |
| IR-P2-002 | P2 | No alerting on audit-trail gaps or privileged (impersonation/admin) abuse | 33_incident_tabletop_exercise.md §IR-P2-002 | platform lead / security reviewer | this month | open |
| IR-P2-003 | P2 | No alerting when webhook dead-letters accumulate or payment reconciliation drifts | 33_incident_tabletop_exercise.md §IR-P2-003 | platform lead / security reviewer | this month | open |
| IR-P2-004 | P2 | Secrets rotation is documented but has no exercised evidence | 33_incident_tabletop_exercise.md §IR-P2-004 | platform lead / security reviewer | this month | open |
| IR-P2-005 | P2 | No platform status/communication surface for MCT's own outages | 33_incident_tabletop_exercise.md §IR-P2-005 | platform lead / security reviewer | this month | open |
| IR-P2-006 | P2 | Migration dry-run result is discarded in CI | 33_incident_tabletop_exercise.md §IR-P2-006 | platform lead / security reviewer | this month | open |
| MT-P2-001 | P2 | Admin global search lists all organizations and can fall through unscoped _(cluster C-10)_ | 25_multi_tenant_isolation_attack_simulation.md §MT-P2-001 | API platform / security | this month | open |
| MT-P2-002 | P2 | By-id org filters are conditional, so they fail open if the org gate is not reached | 25_multi_tenant_isolation_attack_simulation.md §MT-P2-002 | API platform / security | this month | open |
| MT-P2-003 | P2 | Storage writer path and RLS org-derivation disagree (`orgs/<uuid>/` vs `<uuid>/`) | 25_multi_tenant_isolation_attack_simulation.md §MT-P2-003 | API platform / security | this month | open |
| MT-P2-004 | P2 | Realtime/SSE notification channel is scoped by user only, with no org assertion | 25_multi_tenant_isolation_attack_simulation.md §MT-P2-004 | API platform / security | this month | open |
| MT-P2-005 | P2 | Platform-admin cross-tenant access is role-key based, broad, and unalerted _(cluster C-24)_ | 25_multi_tenant_isolation_attack_simulation.md §MT-P2-005 | API platform / security | this month | open |
| MT-P2-006 | P2 | Platform-wide report generators run as service role with no tenant guard on scope inputs | 25_multi_tenant_isolation_attack_simulation.md §MT-P2-006 | API platform / security | this month | open |
| NOTIF-P2-001 | P2 | Web Push channel is entirely absent (no subscriptions, no VAPID, no service worker) | 30_notification_email_push_delivery_audit.md §NOTIF-P2-001 | notifications/backend | this month | open |
| NOTIF-P2-002 | P2 | SMTP remains optional; email silently degrades to no-op in production | 30_notification_email_push_delivery_audit.md §NOTIF-P2-002 | notifications/backend | this month | open |
| NOTIF-P2-003 | P2 | Worker lacks an `unhandledRejection` handler (independently verified) _(cluster C-07)_ | 30_notification_email_push_delivery_audit.md §NOTIF-P2-003 | notifications/backend | this month | open |
| NOTIF-P2-004 | P2 | Scheduled reminder inserts and email sends are not atomic; retries can double-send | 30_notification_email_push_delivery_audit.md §NOTIF-P2-004 | notifications/backend | this month | open |
| NOTIF-P2-005 | P2 | Sensitive ticket content is stored and emailed verbatim with no sensitivity filter | 30_notification_email_push_delivery_audit.md §NOTIF-P2-005 | notifications/backend | this month | open |
| NOTIF-P2-006 | P2 | API inline email fallback has no retry and ignores the send result | 30_notification_email_push_delivery_audit.md §NOTIF-P2-006 | notifications/backend | this month | open |
| REL-P2-001 | P2 | `CHANGELOG.md` is stale relative to HEAD for the final commits in the delta | 40_release_notes_changelog_generator.md §REL-P2-001 | platform engineering (release owner) | this month | open |
| REL-P2-002 | P2 | No explicit Breaking Changes or upgrade manifest despite 34 migrations and RLS/entitlement behavior changes _(cluster C-28)_ | 40_release_notes_changelog_generator.md §REL-P2-002 | platform engineering (release owner) | this month | open |
| REL-P2-003 | P2 | No release-notes or GitHub Release body template; release body must be authored ad hoc | 40_release_notes_changelog_generator.md §REL-P2-003 | platform engineering (release owner) | this month | open |
| REL-P2-004 | P2 | Rollback documentation is stale (Terraform push flow) and repeats the false approval claim _(cluster C-27)_ | 40_release_notes_changelog_generator.md §REL-P2-004 | platform engineering (release owner) | this month | open |
| RES-P2-001 | P2 | Worker process has no `unhandledRejection` handler _(cluster C-07)_ | 13_resilience_recovery_failure_modes.md §RES-P2-001 | platform/backend | this month | open |
| RES-P2-002 | P2 | `WORKER_TIMEOUT` is not a real task timeout; generic task failures have no DLQ | 13_resilience_recovery_failure_modes.md §RES-P2-002 | platform/backend | this month | open |
| RES-P2-003 | P2 | `QUEUE_BACKEND` default `inline` diverges from production and can silently stall all queued work | 13_resilience_recovery_failure_modes.md §RES-P2-003 | platform/backend | this month | open |
| RES-P2-004 | P2 | External `fetch` calls without `AbortController` in `public.ts` and `auth.ts` | 13_resilience_recovery_failure_modes.md §RES-P2-004 | platform/backend | this month | open |
| RES-P2-005 | P2 | Availability detection lives inside the failed domain; no external dead-man's switch or alert delivery _(cluster C-18)_ | 13_resilience_recovery_failure_modes.md §RES-P2-005 | platform/backend | this month | open |
| RES-P2-006 | P2 | Backup/restore recovery is configured but not evidenced as exercised, and the restore test verifies only table counts _(cluster C-02)_ | 13_resilience_recovery_failure_modes.md §RES-P2-006 | platform/backend | this month | open |
| RLS-P2-001 | P2 | MSP platform-admin role keys missing from post-5302129 admin-gate RLS policies _(cluster C-25)_ | 37_supabase_rls_policy_deep_dive.md §RLS-P2-001 | backend/DB lead + platform | this month | open |
| RLS-P2-002 | P2 | webhook_dead_letters has no user-scoped DELETE policy while the API deletes via the RLS client _(cluster C-08)_ | 37_supabase_rls_policy_deep_dive.md §RLS-P2-002 | backend/DB lead + platform | this month | open |
| RLS-P2-003 | P2 | approve_project_task / add_project_task_comment trust a caller-supplied user id and are granted to authenticated _(cluster C-26)_ | 37_supabase_rls_policy_deep_dive.md §RLS-P2-003 | backend/DB lead + platform | this month | open |
| SBOM-P2-001 | P2 | SBOM is artifact-only: not release-bound, not commit-bound, not attested _(cluster C-20)_ | 35_sbom_license_policy.md §SBOM-P2-001 | supply-chain owner | this month | open |
| SBOM-P2-002 | P2 | No container/image SBOM; base-image OS packages untracked _(cluster C-20)_ | 35_sbom_license_policy.md §SBOM-P2-002 | supply-chain owner | this month | open |
| SBOM-P2-003 | P2 | `docs/CI.md` documents the SBOM workflow as "Blocking" but it gates nothing _(cluster C-20)_ | 35_sbom_license_policy.md §SBOM-P2-003 | supply-chain owner | this month | open |
| SC-P2-001 | P2 | No image-level container scanning; Trivy scans filesystem only _(cluster C-20)_ | 11_supply_chain_dependency_secrets.md §SC-P2-001 | supply-chain owner | this month | open |
| SC-P2-002 | P2 | No artifact provenance, attestation, or signing; `id-token: write` requested but unused _(cluster C-20)_ | 11_supply_chain_dependency_secrets.md §SC-P2-002 | supply-chain owner | this month | open |
| SC-P2-003 | P2 | License policy not enforced in CI; non-OSI and LGPL licenses present _(cluster C-20)_ | 11_supply_chain_dependency_secrets.md §SC-P2-003 | supply-chain owner | this month | open |
| SC-P2-004 | P2 | SBOM is generated but not bound to a commit or attached to releases/images _(cluster C-20)_ | 11_supply_chain_dependency_secrets.md §SC-P2-004 | supply-chain owner | this month | open |
| SC-P2-005 | P2 | Dependabot PR backlog is large and not triaged; one stale update conflicts with resolved versions | 11_supply_chain_dependency_secrets.md §SC-P2-005 | supply-chain owner | this month | open |
| SEARCH-P2-001 | P2 | Raw search terms persisted in plaintext `audit_logs.metadata` | 31_search_indexing_privacy_audit.md §SEARCH-P2-001 | search/backend | this month | open |
| SEARCH-P2-002 | P2 | Portal search omits documents despite SDK and documentation contract | 31_search_indexing_privacy_audit.md §SEARCH-P2-002 | search/backend | this month | open |
| SEARCH-P2-003 | P2 | Admin search UI silently discards the documents result set | 31_search_indexing_privacy_audit.md §SEARCH-P2-003 | search/backend | this month | open |
| SEARCH-P2-004 | P2 | No search pagination or result counts; hard 5-result ceiling | 31_search_indexing_privacy_audit.md §SEARCH-P2-004 | search/backend | this month | open |
| SEARCH-P2-005 | P2 | Search query analytics metric is dead and the analytics summary RPC is missing | 31_search_indexing_privacy_audit.md §SEARCH-P2-005 | search/backend | this month | open |
| SEARCH-P2-006 | P2 | Prefix/wildcard mismatch: no btree on prefix columns and no full-text (`tsvector`) search | 31_search_indexing_privacy_audit.md §SEARCH-P2-006 | search/backend | this month | open |
| SEARCH-P2-007 | P2 | Typeahead calls full search endpoints without rate limiting or a dedicated autocomplete surface | 31_search_indexing_privacy_audit.md §SEARCH-P2-007 | search/backend | this month | open |
| SEC-P2-001 | P2 | Client-onboarding mutations run without `requirePermission` (authorization outlier) _(cluster C-01)_ | 06_security_authz_tenancy_audit.md §SEC-P2-001 | API team / security | this month | open |
| SEC-P2-002 | P2 | MSP platform roles are cross-tenant for org access but not for permissions (inconsistent trust model) _(cluster C-24)_ | 06_security_authz_tenancy_audit.md §SEC-P2-002 | API team / security | this month | open |
| SEC-P2-003 | P2 | Forgot-password email redirect still uses attacker-controlled `Origin` header _(cluster C-14)_ | 06_security_authz_tenancy_audit.md §SEC-P2-003 | API team / security | this month | still-open |
| SEC-P2-004 | P2 | `GET /analytics/summary` calls a `get_analytics_summary` RPC that no migration defines | 06_security_authz_tenancy_audit.md §SEC-P2-004 | API team / security | this month | open |
| SEC-P2-005 | P2 | RLS is bypassed on API requests by default (service-role is the default client) _(cluster C-05)_ | 06_security_authz_tenancy_audit.md §SEC-P2-005 | API team / security | this month | open |
| SECRET-P2-001 | P2 | Secret rotation inventory and GitHub matrix lag the schema/compose; seven keys uncovered | 38_env_secret_rotation.md §SECRET-P2-001 | platform/security | this month | open |
| SECRET-P2-002 | P2 | Rotation reminder workflow referenced in docs does not exist; rotation log shows no real rotation | 38_env_secret_rotation.md §SECRET-P2-002 | platform/security | this month | open |
| SECRET-P2-003 | P2 | Secret scanning is diff-scoped only; no full-history scan artifact | 38_env_secret_rotation.md §SECRET-P2-003 | platform/security | this month | open |
| SECRET-P2-004 | P2 | Produced Terraform `prod.tfvars` is tracked despite `.gitignore` intending to exclude it _(cluster C-12)_ | 38_env_secret_rotation.md §SECRET-P2-004 | platform/security | this month | open |
| TEST-P2-001 | P2 | Accessibility gate width contradicts the code (docs say 19 pages, code scans 25) | 09_testing_quality_release_confidence.md §TEST-P2-001 | QA/release owner | this month | open |
| TEST-P2-002 | P2 | Worker data-mutating scan tasks still lack a dedicated test suite; branch threshold is a no-op | 09_testing_quality_release_confidence.md §TEST-P2-002 | QA/release owner | this month | open |
| TEST-P2-003 | P2 | E2E flakiness is documented but unresolved, and the prod-only gate masks it | 09_testing_quality_release_confidence.md §TEST-P2-003 | QA/release owner | this month | open |
| TEST-P2-004 | P2 | Load tests exist but are manual-only with no enforced thresholds or failure injection | 09_testing_quality_release_confidence.md §TEST-P2-004 | QA/release owner | this month | open |
| WH-P2-001 | P2 | M365 inbound notifications have no enforced timestamp/replay window | 27_webhook_delivery_replay_idempotency_audit.md §WH-P2-001 | integrations/backend | this month | open |
| WH-P2-002 | P2 | Inline dispatcher records a fixed `retry_count` and duplicates the worker's retry logic | 27_webhook_delivery_replay_idempotency_audit.md §WH-P2-002 | integrations/backend | this month | open |
| WH-P2-003 | P2 | Outbound and DLQ delivery outcomes are not metered; only inbound success increments the counter | 27_webhook_delivery_replay_idempotency_audit.md §WH-P2-003 | integrations/backend | this month | open |
| WH-P2-004 | P2 | Inbound Jira/JSM signature falls back to re-serialized JSON when `req.rawBody` is absent | 27_webhook_delivery_replay_idempotency_audit.md §WH-P2-004 | integrations/backend | this month | open |
| WH-P2-005 | P2 | `webhook_dead_letters` has no DELETE policy while the API deletes via the RLS client _(cluster C-08)_ | 27_webhook_delivery_replay_idempotency_audit.md §WH-P2-005 | integrations/backend | this month | open |
| WH-P2-006 | P2 | No per-provider payload schema or size cap on webhook ingress (global 10mb JSON limit) | 27_webhook_delivery_replay_idempotency_audit.md §WH-P2-006 | integrations/backend | this month | open |
| ACM-P3-001 | P3 | Client-side permission hiding is UI-only for several module actions | 24_access_control_matrix_audit.md §ACM-P3-001 | API platform | this quarter | open |
| ACM-P3-002 | P3 | No catalog-lint: referenced permission keys are not checked against the `permissions` table | 24_access_control_matrix_audit.md §ACM-P3-002 | API platform | this quarter | open |
| ACM-P3-003 | P3 | Public route surface is broad and has no single documented inventory | 24_access_control_matrix_audit.md §ACM-P3-003 | API platform | this quarter | open |
| ACM-P3-004 | P3 | `GET /roles/:id` and `GET /me/permissions` are readable without an admin gate | 24_access_control_matrix_audit.md §ACM-P3-004 | API platform | this quarter | open |
| ACM-P3-005 | P3 | RLS policies reference `manage` permissions that no role holds (dead predicates) | 24_access_control_matrix_audit.md §ACM-P3-005 | API platform | this quarter | open |
| ADMIN-P3-001 | P3 | Web admin gate accepts a broader role set than the API `requireAdmin` (guard/API divergence) | 26_admin_console_abuse_case_audit.md §ADMIN-P3-001 | API platform / security | this quarter | open |
| ADMIN-P3-002 | P3 | Active-org cookie setter performs no server-side authorization | 26_admin_console_abuse_case_audit.md §ADMIN-P3-002 | API platform / security | this quarter | open |
| ADMIN-P3-003 | P3 | Admin global search and dashboard expose global resource names/counts to any admin _(cluster C-10)_ | 26_admin_console_abuse_case_audit.md §ADMIN-P3-003 | API platform / security | this quarter | open |
| ADMIN-P3-004 | P3 | Global store catalog is mutable by any tenant admin | 26_admin_console_abuse_case_audit.md §ADMIN-P3-004 | API platform / security | this quarter | open |
| AI-P3-001 | P3 | Embedded repo maps and historical pack outputs still reference the pre-rename repository path | 20_ai_automation_agent_readiness.md §AI-P3-001 | repo maintainer (AI readiness) | this quarter | open |
| AI-P3-002 | P3 | `AGENTS.md` retains a large self-contradicting "snapshot" history that an agent must disambiguate | 20_ai_automation_agent_readiness.md §AI-P3-002 | repo maintainer (AI readiness) | this quarter | open |
| AI-P3-003 | P3 | Secrets guidance is spread across instructions without a linked canonical runbook | 20_ai_automation_agent_readiness.md §AI-P3-003 | repo maintainer (AI readiness) | this quarter | open |
| API-P3-001 | P3 | Minor contract inconsistencies (`rateLimitByUser` non-enveloped 429, capped raw-array lists, no `request_id`) | 08_api_contracts_realtime_integrations.md §API-P3-001 | API principal engineer | this quarter | open |
| API-P3-002 | P3 | OpenAPI artifact is not bound to a commit and the CI audit warns (not fails) on documented-but-missing routes | 08_api_contracts_realtime_integrations.md §API-P3-002 | API principal engineer | this quarter | open |
| API-P3-003 | P3 | Realtime client has no reconnect path; server emits `auth_expired` with no documented client handling | 08_api_contracts_realtime_integrations.md §API-P3-003 | API principal engineer | this quarter | open |
| BILL-P3-001 | P3 | Webhook raw body typed as `string` but consumed as `Buffer` | 29_billing_payments_reconciliation_audit.md §BILL-P3-001 | billing/backend | this quarter | open |
| BILL-P3-002 | P3 | Billing email stored in plaintext and raw Stripe payment-method id rendered to users | 29_billing_payments_reconciliation_audit.md §BILL-P3-002 | billing/backend | this quarter | open |
| BP-P3-001 | P3 | Hotfix and emergency-deploy documentation is a stub and partially stale | 34_branch_protection_required_checks.md §BP-P3-001 | repo admin (owner decision) | this quarter | open |
| BP-P3-002 | P3 | Dependabot has no security-update separation or triage SLA, and PR template has no enforced link to required checks | 34_branch_protection_required_checks.md §BP-P3-002 | repo admin (owner decision) | this quarter | open |
| CI-P3-005 | P3 | Secret scanner misses the platform's own token formats and scans diffs only | 10_github_actions_cicd_governance.md §CI-P3-005 | platform/CI owner | this quarter | open |
| CI-P3-006 | P3 | Unused permission grants across deploy/test workflows | 10_github_actions_cicd_governance.md §CI-P3-006 | platform/CI owner | this quarter | open |
| CI-P3-007 | P3 | DB restore test uses an unpinned `postgres:16-alpine` image | 10_github_actions_cicd_governance.md §CI-P3-007 | platform/CI owner | this quarter | open |
| CI-P3-008 | P3 | No release/tagging workflow and no post-merge release artifact | 10_github_actions_cicd_governance.md §CI-P3-008 | platform/CI owner | this quarter | open |
| CI-P3-009 | P3 | e2e is required on `main` but the documented flakiness makes it an unstable hard gate | 10_github_actions_cicd_governance.md §CI-P3-009 | platform/CI owner | this quarter | open |
| CI-P3-010 | P3 | Missing per-job timeouts and minor workflow hygiene gaps | 10_github_actions_cicd_governance.md §CI-P3-010 | platform/CI owner | this quarter | open |
| CTR-P3-001 | P3 | Missing `--start-period` on API and Worker Healthchecks | 36_container_runtime_security.md §CTR-P3-001 | platform/infrastructure | this quarter | open |
| CTR-P3-002 | P3 | Broad `.dockerignore` `*.md`/`*.txt`/`*.log` Could Mask Needed Build Files | 36_container_runtime_security.md §CTR-P3-002 | platform/infrastructure | this quarter | open |
| DATA-P3-001 | P3 | Pre-baseline policies created without a preceding `drop policy if exists` | 07_data_schema_migration_runtime_validation.md §DATA-P3-001 | backend/data governance | this quarter | open |
| DATA-P3-002 | P3 | Migration version gaps undocumented; brief states 141 migrations, tree has 127 | 07_data_schema_migration_runtime_validation.md §DATA-P3-002 | backend/data governance | this quarter | open |
| DR-P3-001 | P3 | Duplicate backup-script logic in bash and PowerShell risks drift | 32_backup_restore_drill.md §DR-P3-001 | platform/backend + platform/ops | this quarter | open |
| DR-P3-002 | P3 | Unpinned Postgres image in the restore test; no explicit jq/aws tool pinning in the backup job | 32_backup_restore_drill.md §DR-P3-002 | platform/backend + platform/ops | this quarter | open |
| DR-P3-003 | P3 | Documented backup/DR export endpoints do not exist | 32_backup_restore_drill.md §DR-P3-003 | platform/backend + platform/ops | this quarter | open |
| FILE-P3-001 | P3 | Share endpoint has no per-token rate limit | 28_file_upload_download_security_audit.md §FILE-P3-001 | API/backend + storage | this quarter | open |
| FILE-P3-002 | P3 | Client logo accept list still advertises SVG that the server rejects | 28_file_upload_download_security_audit.md §FILE-P3-002 | API/backend + storage | this quarter | open |
| FILE-P3-003 | P3 | Documentation drift on file types and size limits; no documents/upload runbook | 28_file_upload_download_security_audit.md §FILE-P3-003 | API/backend + storage | this quarter | open |
| INFRA-P3-008 | P3 | `env/prod.tfvars` is tracked despite an ignore rule that names it _(cluster C-12)_ | 12_infra_deployment_environment_drift.md §INFRA-P3-008 | platform/infrastructure | this quarter | open |
| INFRA-P3-009 | P3 | Restore test uses a different Postgres major than the backup script and verifies only table counts _(cluster C-03)_ | 12_infra_deployment_environment_drift.md §INFRA-P3-009 | platform/infrastructure | this quarter | open |
| INFRA-P3-010 | P3 | `docs/RTO_RPO.md` claims Redis AOF persistence that compose does not enable | 12_infra_deployment_environment_drift.md §INFRA-P3-010 | platform/infrastructure | this quarter | open |
| INFRA-P3-011 | P3 | `infra/terraform/README.md` references an `aws/` directory that does not exist | 12_infra_deployment_environment_drift.md §INFRA-P3-011 | platform/infrastructure | this quarter | open |
| INFRA-P3-012 | P3 | Terraform is manual-dispatch only, so the "push to trigger apply" rollback runbook step is a no-op | 12_infra_deployment_environment_drift.md §INFRA-P3-012 | platform/infrastructure | this quarter | open |
| IR-P3-001 | P3 | Terraform state restore guidance lacks a tested procedure | 33_incident_tabletop_exercise.md §IR-P3-001 | platform lead / security reviewer | this quarter | open |
| IR-P3-002 | P3 | Monitoring doc and health endpoint disagree on check semantics; Redis severity undocumented in alerts | 33_incident_tabletop_exercise.md §IR-P3-002 | platform lead / security reviewer | this quarter | open |
| MT-P3-001 | P3 | No automated cross-tenant isolation regression suite for application-layer scoping | 25_multi_tenant_isolation_attack_simulation.md §MT-P3-001 | API platform / security | this quarter | open |
| NOTIF-P3-001 | P3 | No email template system; repetitive inline HTML diverges between senders | 30_notification_email_push_delivery_audit.md §NOTIF-P3-001 | notifications/backend | this quarter | open |
| NOTIF-P3-002 | P3 | `sms` channel is a dead preference option; UI copy misstates enforcement | 30_notification_email_push_delivery_audit.md §NOTIF-P3-002 | notifications/backend | this quarter | open |
| NOTIF-P3-003 | P3 | SSE polling fallback interval is not cleared on unmount | 30_notification_email_push_delivery_audit.md §NOTIF-P3-003 | notifications/backend | this quarter | open |
| REL-P3-001 | P3 | Commit history contains non-conventional noise commits and a single author, reducing automated-notes quality | 40_release_notes_changelog_generator.md §REL-P3-001 | platform engineering (release owner) | this quarter | open |
| REL-P3-002 | P3 | PR template lacks changelog and versioned-artifact checkboxes | 40_release_notes_changelog_generator.md §REL-P3-002 | platform engineering (release owner) | this quarter | open |
| RES-P3-001 | P3 | Worker graceful shutdown has no force-exit fallback | 13_resilience_recovery_failure_modes.md §RES-P3-001 | platform/backend | this quarter | open |
| RES-P3-002 | P3 | Worker queued webhook dispatcher inserts deliveries without an idempotency key | 13_resilience_recovery_failure_modes.md §RES-P3-002 | platform/backend | this quarter | open |
| RES-P3-003 | P3 | `AGENTS.md` documents the worker consumer incorrectly and omits the queue backend divergence | 13_resilience_recovery_failure_modes.md §RES-P3-003 | platform/backend | this quarter | open |
| RES-P3-004 | P3 | Deploy health gate treats worker unhealthiness as non-fatal _(cluster C-11)_ | 13_resilience_recovery_failure_modes.md §RES-P3-004 | platform/backend | this quarter | open |
| RES-P3-005 | P3 | Orphan cleanup lists at most 1000 objects per bucket and cannot verify the purge shrank anything | 13_resilience_recovery_failure_modes.md §RES-P3-005 | platform/backend | this quarter | open |
| RLS-P3-001 | P3 | 5302116 grants anon UPDATE/DELETE on every table, amplified by no RLS-off × anon-write lint _(cluster C-09)_ | 37_supabase_rls_policy_deep_dive.md §RLS-P3-001 | backend/DB lead + platform | this quarter | open |
| RLS-P3-002 | P3 | No behavioral RLS allow/deny matrix test (static gate only) | 37_supabase_rls_policy_deep_dive.md §RLS-P3-002 | backend/DB lead + platform | this quarter | open |
| RLS-P3-003 | P3 | storage_path_org_id trusts a client-controlled object name | 37_supabase_rls_policy_deep_dive.md §RLS-P3-003 | backend/DB lead + platform | this quarter | open |
| RLS-P3-004 | P3 | Duplicate scoped-client tests and stale coverage-matrix snapshot | 37_supabase_rls_policy_deep_dive.md §RLS-P3-004 | backend/DB lead + platform | this quarter | open |
| SBOM-P3-001 | P3 | Root license is ISC with no documented rationale | 35_sbom_license_policy.md §SBOM-P3-001 | supply-chain owner | this quarter | open |
| SBOM-P3-002 | P3 | SBOM format/count not validated before upload; no regression guard | 35_sbom_license_policy.md §SBOM-P3-002 | supply-chain owner | this quarter | open |
| SC-P3-001 | P3 | Root package license remains "ISC" | 11_supply_chain_dependency_secrets.md §SC-P3-001 | supply-chain owner | this quarter | open |
| SC-P3-002 | P3 | e2e Docker image is not digest-pinned | 11_supply_chain_dependency_secrets.md §SC-P3-002 | supply-chain owner | this quarter | open |
| SC-P3-003 | P3 | Secret-scanner pattern sets diverge between `.sh` and `.ps1` | 11_supply_chain_dependency_secrets.md §SC-P3-003 | supply-chain owner | this quarter | open |
| SEARCH-P3-001 | P3 | Soft-delete columns are defined but never used by queries or deletes | 31_search_indexing_privacy_audit.md §SEARCH-P3-001 | search/backend | this quarter | open |
| SEARCH-P3-002 | P3 | Search module documentation is stale relative to the code | 31_search_indexing_privacy_audit.md §SEARCH-P3-002 | search/backend | this quarter | open |
| SEC-P3-001 | P3 | `5302116` grants anon/authenticated full DML on every public table (RLS is the only gate) _(cluster C-09)_ | 06_security_authz_tenancy_audit.md §SEC-P3-001 | API team / security | this quarter | open |
| SEC-P3-002 | P3 | CORS reflects any origin with credentials when `CORS_ORIGIN="*"` | 06_security_authz_tenancy_audit.md §SEC-P3-002 | API team / security | this quarter | open |
| SEC-P3-003 | P3 | `notification-preferences` PUT accepts a body `organizationId` without `assertOrgScopeMatches` | 06_security_authz_tenancy_audit.md §SEC-P3-003 | API team / security | this quarter | open |
| SEC-P3-004 | P3 | `resolveEffectivePermissions` is uncached and fans out 4–6 queries per gated request | 06_security_authz_tenancy_audit.md §SEC-P3-004 | API team / security | this quarter | open |
| SECRET-P3-001 | P3 | Worker `.env.example` omits `APP_BASE_URL` | 38_env_secret_rotation.md §SECRET-P3-001 | platform/security | this quarter | open |
| SECRET-P3-002 | P3 | Web runtime validator can silently fall back to a localhost API URL | 38_env_secret_rotation.md §SECRET-P3-002 | platform/security | this quarter | open |
| SECRET-P3-003 | P3 | No IT-level break-glass / emergency credential revocation runbook, and no revocation drill evidence | 38_env_secret_rotation.md §SECRET-P3-003 | platform/security | this quarter | open |
| TEST-P3-001 | P3 | Visual regression is still non-blocking with a known-broken Storybook build | 09_testing_quality_release_confidence.md §TEST-P3-001 | QA/release owner | this quarter | open |
| TEST-P3-002 | P3 | No scheduled production smoke check (health + login + critical read) | 09_testing_quality_release_confidence.md §TEST-P3-002 | QA/release owner | this quarter | open |
| TEST-P3-003 | P3 | Coverage thresholds remain modest and cannot be confirmed met at this SHA | 09_testing_quality_release_confidence.md §TEST-P3-003 | QA/release owner | this quarter | open |
| WH-P3-001 | P3 | Test endpoint generates a random idempotency key and never dedups | 27_webhook_delivery_replay_idempotency_audit.md §WH-P3-001 | integrations/backend | this quarter | open |
| WH-P3-002 | P3 | No committed event catalog or webhook documentation for consumers | 27_webhook_delivery_replay_idempotency_audit.md §WH-P3-002 | integrations/backend | this quarter | open |

---

## Duplicate / overlap clusters (merged themes, no count inflation)

| Cluster | Theme | Member findings | Canonical fix |
|---|---|---|---|
| C-01 | Onboarding mutations lack `requirePermission` (plus the neighbouring governance `submit` gap) | ACM-P1-001, SEC-P2-001, API-P2-001, CHAIN-P2-003 | Add module guards to `client-onboarding-command-center.ts` and `governance.ts` submit |
| C-02 | Restore test cannot fail / does not assert integrity | DR-P0-002, CI-P2-002, IR-P1-004, RES-P2-006 | Assert table/migration baselines; remove `\|\| true`; add row/timestamp checks |
| C-03 | Backup location contract mismatch (`S3_BUCKET`+prefix vs `S3_BACKUP_BUCKET`) | DR-P1-002, IR-P1-005, INFRA-P3-009 | One documented contract consumed by both workflows |
| C-04 | Terraform `use_lockfile` vs pinned 1.9 | INFRA-P1-002, CHAIN-P2-009 | Bump to ≥1.10 or drop `use_lockfile`; restore plan-only PR trigger |
| C-05 | RLS is not a backstop (service-role default client) | ACM-P2-003, SEC-P2-005 | Incremental RLS rollout + scoped client |
| C-06 | M365 secret: dead `M365_WEBHOOK_SECRET` vs unwritten `M365_CLIENT_STATE` | SECRET-P1-001, WH-P1-002 | Write the real var in deploy; delete dead config |
| C-07 | Worker has no `unhandledRejection` handler | NOTIF-P2-003, RES-P2-001 | Add handler in `worker/src/main.ts` |
| C-08 | `webhook_dead_letters` lacks a DELETE policy | RLS-P2-002, WH-P2-005 | Add user-scoped DELETE policy or use service client |
| C-09 | Blanket anon/authenticated DML on all tables (RLS the only gate) | DATA-P2-001, RLS-P3-001, SEC-P3-001 | Revoke blanket grants; default-deny; anon-write lint |
| C-10 | Admin global search not tenant-scoped / exposes cross-org PII | SEARCH-P1-002, MT-P2-001, ADMIN-P3-003 | Tenant-scope the organizations query and profile fields |
| C-11 | Deploy gate treats worker unhealthiness as non-fatal | IR-P1-003, CTR-P2-004, RES-P3-004 | Make worker health fatal in `deploy-do.yml` |
| C-12 | Produced `prod.tfvars` tracked despite ignore rule | SECRET-P2-004, INFRA-P3-008 | Untrack and rotate any exposed values |
| C-13 | Redis password on process argv / weakened hardening | CTR-P2-003, INFRA-P2-007 | Move to config file / secrets; restore hardening |
| C-14 | Forgot-password uses attacker-controlled `Origin` | SEC-P2-003, CHAIN-P1-002 | Use `APP_BASE_URL` only |
| C-15 | SSH open to the internet (`admin_ip_ranges` default 0.0.0.0/0) | INFRA-P1-001, CHAIN-P2-007 | Require `admin_ip_ranges` from a secret |
| C-16 | Branch-protection bypass + missing prod approval gate + false approval docs | BP-P1-001, BP-P1-002, BP-P1-003, CI-P1-002, CHAIN-P1-008, REL-P1-002 | Fix required context; `enforce_admins:true`; protect `prod`; correct docs |
| C-17 | Secret-class env vars referenced but not delivered by deploy | SECRET-P1-002, INFRA-P2-006 | Write all schema-referenced vars in the deploy pipeline |
| C-18 | No Alertmanager / external dead-man's switch | IR-P0-003, INFRA-P2-003, RES-P2-005, CHAIN-P2-010 | Deploy Alertmanager + out-of-band receiver |
| C-19 | Platform backup has no real heartbeat/alert | DR-P2-001, DR-P2-005 | Wire a real platform backup heartbeat + delivery |
| C-20 | Supply-chain: SBOM binding, image scan, signing, license policy, version identity | SBOM-P1-001, SBOM-P1-002, SBOM-P2-001, SBOM-P2-002, SBOM-P2-003, SC-P2-001, SC-P2-002, SC-P2-003, SC-P2-004, CTR-P1-001, CTR-P1-002, CTR-P1-003, CTR-P2-001, REL-P1-001 | Image SBOM + scan + attestation + license gate + tags/binding |
| C-21 | No storage backup/restore | DR-P1-001, FILE-P2-004 | Enable versioning or export; rehearse D5 |
| C-22 | Retention + cascade destroy audit evidence; unbounded deletes | DATA-P1-002, DATA-P2-005, DATA-P2-006, CHAIN-P2-006 | Bound deletes; archive; `SET NULL`; retention policy owner |
| C-23 | Profiles enumerable by email/id | ACM-P2-008 (SEARCH-P1-002 overlaps) | Restrict email filter to admin scope |
| C-24 | MSP trust-model divergence (cross-tenant read breadth) | SEC-P2-002, ACM-P2-002, CHAIN-P1-001, MT-P2-005 | Explicit `can_traverse_tenants` decision + ADR |
| C-25 | RLS admin-gate regression vs `PLATFORM_ADMIN_KEYS` | RLS-P2-001, CHAIN-P2-005 | Re-append 6 keys via helper; drift lint |
| C-26 | Definer RPC trusts caller-supplied user id | RLS-P2-003, CHAIN-P2-004 | Add `p_user_id is distinct from auth.uid()` guard |
| C-27 | Rollback/migration docs contradict the workflows | IR-P1-001, DR-P1-005, REL-P2-004 | One corrected rollback runbook matching `deploy-do`/`terraform-do` |
| C-28 | Behavior-affecting schema changes under-documented | REL-P2-002, DATA-P2-005 | Populate a Breaking Changes section + migration manifest |

**Aggregate reconciliation:** 269 unique finding IDs; the 28 clusters merge 96 member rows into 28 themes. No finding is dropped; cluster labels are annotations only, so the machine-readable count remains 269.

## Top risks (likelihood × impact)

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Automated backups never run (not on `main`) | P0 | High | All-tenant data loss on incident | DR-P0-001 | PS-001 |
| Restore test cannot fail | P0 | High | False DR assurance; silent bad restore | DR-P0-002, CI-P2-002, IR-P1-004 | PS-001 |
| No incident-response or breach process | P0 | High | Extended outages; notification exposure | IR-P0-001, IR-P0-002 | PS-002 |
| Monitoring cannot report its own death | P0 | High | Undetected outages | IR-P0-003, INFRA-P2-003, RES-P2-005 | PS-008 |
| Cross-tenant read via low-trust MSP key | P1 | Medium | Mass tenant confidentiality loss | CHAIN-P1-001, SEC-P2-002 | PS-009 |
| Internet-open SSH to service-role host | P1 | Medium | Full platform compromise | INFRA-P1-001, CHAIN-P2-007 | PS-013 |
| Unattended prod change (admin bypass + no gate + false docs) | P1 | Medium | Unreviewed change to production | BP-P1-002, BP-P1-003, CI-P1-001, CHAIN-P1-008, REL-P1-002 | PS-012 |
| Self-service password-reset phishing → ATO | P1 | Medium | MSP/client account takeover | CHAIN-P1-002, SEC-P2-003 | PS-004 |
| Onboarding RBAC gap (intra-tenant escalation) | P1 | High | Unauthorized record mutation | ACM-P1-001, SEC-P2-001, API-P2-001 | PS-003 |
| Unencrypted single-location DB backups | P1 | Medium | Mass tenant-data exposure; single point of failure | DR-P1-003 | PS-010 |
| No version identity / unbound SBOM | P1 | Medium | Non-reconstructible shipped artifact set | REL-P1-001, SBOM-P2-001, SC-P2-004 | PS-015 |

## Definition of done (register-level)

- [ ] All 5 P0 rows `verified-fixed` with an artifact captured at the remediation commit.
- [ ] The P0-only immediate patch set (`PS-001`, `PS-002`) closed with no dependencies outstanding.
- [ ] Every P1 row has an owner, a target, and a merged duplicate cluster reference.
- [ ] Each patch set in `patch_plan.md` has a green verification command recorded.
- [ ] No `open`/`still-open`/`regressed` rows remain for C-01, C-02, C-04, C-14, C-15, C-16.
- [ ] `roadmap.md` 7/30/60/90-day items all map to at least one patch set.
