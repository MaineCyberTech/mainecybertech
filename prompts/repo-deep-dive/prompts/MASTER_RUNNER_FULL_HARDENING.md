# Master Repository Deep-Dive Audit Runner - Full Hardening Edition

You are running a complete repository audit and hardening review.

## Variables

Set:

- `{name}` = `repo-deep-dive`
- `{run}` = current date/time, branch, and short commit SHA if available; otherwise `YYYYMMDD-HHMM-manual`

Create:

`docs/audits/{name}/{run}/`

## Execution rules

- Do not modify application code.
- Only create or update audit artifacts under `docs/audits/{name}/{run}/`.
- Do not invent functionality.
- Every finding must cite repository evidence.
- Use severities P0, P1, P2, and P3.
- Prefer specific file-level findings.
- Use markdown tables where useful.
- Use Mermaid diagrams where useful.
- Mark unknowns clearly.
- If a topic is not applicable, write a short `not applicable / future readiness` report with evidence.
- Do not print secrets. Redact secret-like values.
- Treat repository exports and logs as sensitive.

## Run these prompts in order

1. `00_audit_orchestrator.md`
2. `01_repository_inventory.md`
3. `02_architecture_runtime_topology.md`
4. `03_feature_implementation_map.md`
5. `06_security_authz_tenancy_audit.md`
6. `24_access_control_matrix_audit.md`
7. `25_multi_tenant_isolation_attack_simulation.md`
8. `26_admin_console_abuse_case_audit.md`
9. `07_data_schema_migration_runtime_validation.md`
10. `37_supabase_rls_policy_deep_dive.md`
11. `08_api_contracts_realtime_integrations.md`
12. `27_webhook_delivery_replay_idempotency_audit.md`
13. `28_file_upload_download_security_audit.md`
14. `29_billing_payments_reconciliation_audit.md`
15. `30_notification_email_push_delivery_audit.md`
16. `31_search_indexing_privacy_audit.md`
17. `10_github_actions_cicd_governance.md`
18. `34_branch_protection_required_checks.md`
19. `11_supply_chain_dependency_secrets.md`
20. `35_sbom_license_policy.md`
21. `36_container_runtime_security.md`
22. `38_env_secret_rotation.md`
23. `12_infra_deployment_environment_drift.md`
24. `09_testing_quality_release_confidence.md`
25. `13_resilience_recovery_failure_modes.md`
26. `32_backup_restore_drill.md`
27. `33_incident_tabletop_exercise.md`
28. `14_observability_monitoring_incident_readiness.md`
29. `15_performance_scalability_cost.md`
30. `04_usability_workflow_audit.md`
31. `05_ui_ux_accessibility_audit.md`
32. `17_mobile_pwa_responsive_access.md`
33. `18_privacy_compliance_data_governance.md`
34. `39_analytics_tracking_privacy.md`
35. `16_documentation_devex_operator_readiness.md`
36. `19_platform_evolution_extensibility.md`
37. `20_ai_automation_agent_readiness.md`
38. `21_repo_hygiene_maintainability.md`
39. `22_final_risk_register_roadmap.md`
40. `23_executive_summary_release_gate.md`
41. `40_release_notes_changelog_generator.md`

## Required final files

- `docs/audits/{name}/{run}/INDEX.md`
- `docs/audits/{name}/{run}/risk_register.md`
- `docs/audits/{name}/{run}/roadmap.md`
- `docs/audits/{name}/{run}/patch_plan.md`
- `docs/audits/{name}/{run}/EXECUTIVE_SUMMARY.md`
- `docs/audits/{name}/{run}/RELEASE_GATE.md`
- `docs/audits/{name}/{run}/access_control_matrix.md`
- `docs/audits/{name}/{run}/backup_restore_drill_plan.md`
- `docs/audits/{name}/{run}/incident_tabletop_scenarios.md`
- `docs/audits/{name}/{run}/branch_protection_recommendation.md`
- `docs/audits/{name}/{run}/sbom_license_policy_recommendation.md`
- `docs/audits/{name}/{run}/secret_rotation_runbook.md`
- `docs/audits/{name}/{run}/release_notes_draft.md`
- `docs/audits/{name}/{run}/changelog_draft.md`

## Final response required from the audit agent

```markdown
# Audit Run Complete

## Files Created

## Top 10 Risks

## Release Gate Decision

Use one:

- GO
- GO WITH CONDITIONS
- NO-GO

## Recommended Immediate Patch Set

## Recommended 7-Day Plan

## Recommended 30-Day Plan

## Validation Commands

## Open Questions
```
