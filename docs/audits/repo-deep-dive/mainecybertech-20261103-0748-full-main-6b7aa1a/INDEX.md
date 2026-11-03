# Audit Run Index

## Metadata

- Name: mainecybertech
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Mode: full
- Profile: base
- Target repo: ``
- Branch: `main`
- Commit: `6b7aa1a`
- Release gate: **NO-GO**
- Findings: 773 total — P0 8, P1 98, P2 339, P3 328

## Domains

| Domain | Area | Findings | Status |
|---|---|---:|---|
| deterministic | DET | 3 | done |
| 00_audit_orchestrator | ORCH | 3 | done |
| 01_repository_inventory | INV | 10 | done |
| 02_architecture_runtime_topology | ARCH | 11 | done |
| 03_feature_implementation_map | FEAT | 15 | done |
| 06_security_authz_tenancy_audit | SEC | 46 | done |
| 24_access_control_matrix_audit | ACM | 19 | done |
| 25_multi_tenant_isolation_attack_simulation | MT | 15 | done |
| 26_admin_console_abuse_case_audit | ADMIN | 18 | done |
| 07_data_schema_migration_runtime_validation | DATA | 23 | done |
| 37_supabase_rls_policy_deep_dive | RLS | 18 | done |
| 08_api_contracts_realtime_integrations | API | 15 | done |
| 27_webhook_delivery_replay_idempotency_audit | WH | 24 | done |
| 28_file_upload_download_security_audit | FILE | 20 | done |
| 29_billing_payments_reconciliation_audit | BILL | 21 | done |
| 30_notification_email_push_delivery_audit | NOTIF | 26 | done |
| 31_search_indexing_privacy_audit | SEARCH | 15 | done |
| 10_github_actions_cicd_governance | CI | 31 | done |
| 34_branch_protection_required_checks | BP | 16 | done |
| 11_supply_chain_dependency_secrets | SC | 27 | done |
| 35_sbom_license_policy | SBOM | 29 | done |
| 36_container_runtime_security | CTR | 19 | done |
| 38_env_secret_rotation | SECRET | 18 | done |
| 12_infra_deployment_environment_drift | INFRA | 20 | done |
| 09_testing_quality_release_confidence | TEST | 16 | done |
| 13_resilience_recovery_failure_modes | RES | 22 | done |
| 32_backup_restore_drill | DR | 27 | done |
| 33_incident_tabletop_exercise | IR | 25 | done |
| 14_observability_monitoring_incident_readiness | OBS | 28 | done |
| 15_performance_scalability_cost | PERF | 11 | done |
| 04_usability_workflow_audit | USE | 25 | done |
| 05_ui_ux_accessibility_audit | UX | 17 | done |
| 17_mobile_pwa_responsive_access | MOB | 12 | done |
| 18_privacy_compliance_data_governance | PRIV | 14 | done |
| 39_analytics_tracking_privacy | AN | 13 | done |
| 16_documentation_devex_operator_readiness | DOC | 25 | done |
| 19_platform_evolution_extensibility | EVOL | 13 | done |
| 20_ai_automation_agent_readiness | AI | 13 | done |
| 21_repo_hygiene_maintainability | HYGIENE | 20 | done |
| 45_exploit_chain_attack_path_audit | CHAIN | 17 | done |
| 22_final_risk_register_roadmap | FINAL | 0 | not run |
| 23_executive_summary_release_gate | EXEC | 0 | not run |
| 40_release_notes_changelog_generator | REL | 13 | done |

## Key Outputs

- Executive summary: `EXECUTIVE_SUMMARY.md`
- Risk register: `risk_register.md`
- Follow-up register: `follow_up_register.md`
- Coverage: `coverage.md`
- Roadmap: `roadmap.md`
- Patch plan: `patch_plan.md`
- Release gate: `RELEASE_GATE.md` — **NO-GO**

## Next Actions

1. Validate: `tools/check_run.sh mainecybertech-20261103-0748-full-main-6b7aa1a`.
2. Publish: `tools/publish_audit.py --repo mainecybertech ...` (see runbook).
3. Remediate unresolved P0/P1/P2 per `patch_plan.md`.

