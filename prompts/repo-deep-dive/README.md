# Repository Deep-Dive Full Hardening Audit Pack

This pack contains a comprehensive LLM prompt system for deep repository audits. It is designed for complex SaaS, MSP portal, chat, workflow, multi-tenant, Supabase/Postgres, Docker, GitHub Actions, and modern TypeScript/Next.js style repositories, but it is generic enough to use on almost any software repo.

## What this pack produces

A complete audit run writes structured markdown reports under:

`docs/audits/{name}/{run}/`

Recommended defaults:

- `{name}`: `repo-deep-dive`
- `{run}`: `YYYYMMDD-HHMM-{branch}-{shortsha}`

The final run should produce:

- `INDEX.md`
- `risk_register.md`
- `roadmap.md`
- `patch_plan.md`
- `EXECUTIVE_SUMMARY.md`
- `RELEASE_GATE.md`
- Domain audit reports from `00` through `40`
- Hardening companion artifacts such as access-control matrix, branch-protection recommendation, secret-rotation runbook, backup/restore drill plan, incident tabletop scenarios, release notes draft, and changelog draft

## Logical organization

## Foundation and Discovery

|   # | Prompt                                  | File                                          | Purpose                                                                                                                              |
| --: | --------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
|  00 | Audit Orchestrator                      | `prompts/00_audit_orchestrator.md`            | Coordinate the full audit run, establish scope, execute order, evidence rules, manifest, and final output map.                       |
|  01 | Comprehensive Repository Inventory      | `prompts/01_repository_inventory.md`          | Create a narrated inventory explaining what each meaningful folder/file is, how it works, why it matters, and what risks it creates. |
|  02 | Architecture and Runtime Topology Audit | `prompts/02_architecture_runtime_topology.md` | Explain system architecture, runtime components, data flow, trust boundaries, deployment topology, and operational model.            |
|  03 | Feature Implementation and Gap Map      | `prompts/03_feature_implementation_map.md`    | Map all implemented and partial features to UI, API, data, worker, permissions, tests, docs, and missing work.                       |

## Security, Authorization, and Tenant Safety

|   # | Prompt                                     | File                                                     | Purpose                                                                                                                                |
| --: | ------------------------------------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
|  06 | Security, Authorization, and Tenancy Audit | `prompts/06_security_authz_tenancy_audit.md`             | Perform a deep security audit of authn, authz, tenant isolation, input validation, secrets, sessions, APIs, and secure defaults.       |
|  24 | Access Control Matrix Audit                | `prompts/24_access_control_matrix_audit.md`              | Create a complete access-control matrix across roles, permissions, routes, APIs, objects, actions, and data scopes.                    |
|  25 | Multi-Tenant Isolation Attack Simulation   | `prompts/25_multi_tenant_isolation_attack_simulation.md` | Simulate safe code-level abuse cases for cross-tenant data access through IDs, routes, APIs, realtime, files, jobs, cache, and search. |
|  26 | Admin Console Abuse Case Audit             | `prompts/26_admin_console_abuse_case_audit.md`           | Audit admin/operator surfaces for misuse, accidental damage, privilege escalation, unsafe bulk actions, and weak audit logging.        |

## Data, API, Integrations, and Domain Runtime

|   # | Prompt                                                | File                                                      | Purpose                                                                                                                                 |
| --: | ----------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
|  07 | Data, Schema, Migration, and Runtime Validation Audit | `prompts/07_data_schema_migration_runtime_validation.md`  | Audit schema design, migrations, constraints, indexes, runtime validators, config validation, and data lifecycle safety.                |
|  37 | Supabase RLS Policy Deep-Dive Audit                   | `prompts/37_supabase_rls_policy_deep_dive.md`             | Audit Supabase/Postgres RLS policies, grants, storage policies, functions, triggers, service role usage, and app consistency.           |
|  08 | API Contracts, Realtime, and Integrations Audit       | `prompts/08_api_contracts_realtime_integrations.md`       | Audit API correctness, contracts, realtime channels, webhooks, external integrations, pagination, errors, retries, and idempotency.     |
|  27 | Webhook Delivery, Replay, and Idempotency Audit       | `prompts/27_webhook_delivery_replay_idempotency_audit.md` | Audit inbound/outbound webhooks for auth, signatures, replay protection, idempotency, retries, DLQ, tenant scoping, and observability.  |
|  28 | File Upload and Download Security Audit               | `prompts/28_file_upload_download_security_audit.md`       | Audit upload, download, preview, export, attachment, signed URL, storage, and file-sharing flows.                                       |
|  29 | Billing, Payments, and Reconciliation Audit           | `prompts/29_billing_payments_reconciliation_audit.md`     | Audit billing/subscription/payment references, plan state, entitlements, webhooks, reconciliation, and sensitive payment data handling. |
|  30 | Notification, Email, and Push Delivery Audit          | `prompts/30_notification_email_push_delivery_audit.md`    | Audit in-app, email, push, reminders, alerts, preferences, retries, duplicates, and sensitive notification content.                     |
|  31 | Search, Indexing, and Privacy Audit                   | `prompts/31_search_indexing_privacy_audit.md`             | Audit search/indexing features for authorization, tenant isolation, sensitive fields, deletion, analytics, and privacy.                 |

## CI/CD, Supply Chain, Environments, and Containers

|   # | Prompt                                                  | File                                               | Purpose                                                                                                                     |
| --: | ------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
|  10 | GitHub Actions, CI/CD, and Governance Audit             | `prompts/10_github_actions_cicd_governance.md`     | Audit workflows, PR gates, deployments, release process, environment promotion, permissions, and governance controls.       |
|  34 | Branch Protection and Required Checks Audit             | `prompts/34_branch_protection_required_checks.md`  | Recommend branch protection, required checks, review rules, environment protections, and governance controls.               |
|  11 | Supply Chain, Dependency, and Secrets Audit             | `prompts/11_supply_chain_dependency_secrets.md`    | Audit package dependencies, lockfiles, scripts, dependency updates, secret exposure, SBOM, provenance, and license risk.    |
|  35 | SBOM and License Policy Audit                           | `prompts/35_sbom_license_policy.md`                | Audit SBOM readiness, license risk, dependency review, vulnerable dependency handling, and release provenance.              |
|  36 | Container Runtime Security Audit                        | `prompts/36_container_runtime_security.md`         | Audit Dockerfiles, image build hardening, runtime security, secrets, health checks, users, and deployment safety.           |
|  38 | Environment and Secret Rotation Audit                   | `prompts/38_env_secret_rotation.md`                | Audit env vars, secrets, key rotation, scope boundaries, startup validation, exposure risk, and emergency revocation.       |
|  12 | Infrastructure, Deployment, and Environment Drift Audit | `prompts/12_infra_deployment_environment_drift.md` | Audit infrastructure/deploy config, Docker/container setup, env vars, runtime config, hosting assumptions, and drift risks. |

## Quality, Resilience, Recovery, and Operations

|   # | Prompt                                                  | File                                                        | Purpose                                                                                                                 |
| --: | ------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
|  09 | Testing, Quality, and Release Confidence Audit          | `prompts/09_testing_quality_release_confidence.md`          | Audit whether the repo has enough validation to release safely and repeatedly.                                          |
|  13 | Resilience, Recovery, and Failure Modes Audit           | `prompts/13_resilience_recovery_failure_modes.md`           | Audit failure behavior under partial outages, retries, crashes, migration failures, and recovery events.                |
|  32 | Backup and Restore Drill Audit                          | `prompts/32_backup_restore_drill.md`                        | Audit backup/restore readiness and produce practical disaster recovery drill plan.                                      |
|  33 | Incident Tabletop Exercise                              | `prompts/33_incident_tabletop_exercise.md`                  | Create and evaluate incident response tabletop exercises based on repository architecture, risks, and operations model. |
|  14 | Observability, Monitoring, and Incident Readiness Audit | `prompts/14_observability_monitoring_incident_readiness.md` | Audit whether operators can detect, triage, debug, and recover from production issues.                                  |
|  15 | Performance, Scalability, and Cost Audit                | `prompts/15_performance_scalability_cost.md`                | Audit performance bottlenecks, scalability risks, cost drivers, frontend/API/DB/worker efficiency, and CI cost.         |

## Product Experience and Access

|   # | Prompt                                        | File                                         | Purpose                                                                                                                 |
| --: | --------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
|  04 | Usability and Workflow Audit                  | `prompts/04_usability_workflow_audit.md`     | Audit core workflows from the perspective of real users, admins, operators, support staff, and mobile users.            |
|  05 | UI/UX, Design System, and Accessibility Audit | `prompts/05_ui_ux_accessibility_audit.md`    | Audit visual consistency, component reuse, responsive layouts, design-system maturity, and accessibility readiness.     |
|  17 | Mobile, PWA, and Responsive Access Audit      | `prompts/17_mobile_pwa_responsive_access.md` | Audit mobile usability, responsive layouts, PWA behavior, offline readiness, installability, push, and touch workflows. |

## Governance, Documentation, Platform Evolution, and AI Readiness

|   # | Prompt                                                            | File                                                   | Purpose                                                                                                                                               |
| --: | ----------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
|  18 | Privacy, Compliance, and Data Governance Audit                    | `prompts/18_privacy_compliance_data_governance.md`     | Audit privacy, data governance, auditability, retention, consent, export/deletion, and compliance readiness.                                          |
|  39 | Analytics, Tracking, and Privacy Audit                            | `prompts/39_analytics_tracking_privacy.md`             | Audit analytics, telemetry, tracking scripts, event capture, cookies, consent, PII handling, and data minimization.                                   |
|  16 | Documentation, Developer Experience, and Operator Readiness Audit | `prompts/16_documentation_devex_operator_readiness.md` | Audit whether developers, operators, and AI agents can understand, run, test, deploy, and maintain the repo safely.                                   |
|  19 | Platform Evolution and Extensibility Audit                        | `prompts/19_platform_evolution_extensibility.md`       | Audit how easily the platform can evolve with new modules, integrations, tenants, AI features, mobile clients, billing plans, and operations tooling. |
|  20 | AI Automation and Agent Readiness Audit                           | `prompts/20_ai_automation_agent_readiness.md`          | Audit whether AI coding agents can safely contribute without breaking architecture, security, tests, docs, or release gates.                          |
|  21 | Repository Hygiene, Maintainability, and Code Health Audit        | `prompts/21_repo_hygiene_maintainability.md`           | Audit maintainability, naming, duplication, complexity, stale files, config sprawl, typing, linting, and long-term burden.                            |

## Final Aggregation and Release Outputs

|   # | Prompt                                       | File                                              | Purpose                                                                                                                   |
| --: | -------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
|  22 | Final Risk Register, Roadmap, and Patch Plan | `prompts/22_final_risk_register_roadmap.md`       | Aggregate all reports into one risk register, roadmap, patch plan, validation plan, and definition of done.               |
|  23 | Executive Summary and Release Gate           | `prompts/23_executive_summary_release_gate.md`    | Create a leadership-friendly summary and practical release gate decision based on evidence.                               |
|  40 | Release Notes and Changelog Generator        | `prompts/40_release_notes_changelog_generator.md` | Generate release notes and changelog drafts from git history, diffs, audit evidence, migrations, docs, and changed files. |

## How to use

1. Copy this folder into the repository root.
2. Open `prompts/MASTER_RUNNER_FULL_HARDENING.md`.
3. Run the master prompt in your AI coding agent.
4. Ensure the agent only writes under `docs/audits/{name}/{run}/`.
5. Review final outputs in this order:
   - `EXECUTIVE_SUMMARY.md`
   - `RELEASE_GATE.md`
   - `risk_register.md`
   - `patch_plan.md`
   - Domain reports for evidence and implementation details

## Safety reminders

- Do not modify application code during audit.
- Do not expose secret values in reports.
- Do not invent functionality.
- Evidence must come from repository files.
- If details are unclear, mark them as `Unknown`.
- Use P0/P1/P2/P3 severity consistently.

## Recommended run strategy

Run discovery and architecture first, then security and tenant isolation, then data/API, CI/CD/supply chain, operations/resilience, UX/mobile, governance/docs, and final aggregation.

The exact order is in `RUN_ORDER.md` and `prompts/MASTER_RUNNER_FULL_HARDENING.md`.
