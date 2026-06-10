# Documentation Index

> Canonical index for the Maine CyberTech Portal monorepo documentation.

## Quick Start

| Document                  | Purpose                                                               |
| ------------------------- | --------------------------------------------------------------------- |
| [README.md](../README.md) | Project overview, testing, Docker, CI/CD, design decisions            |
| [AGENTS.md](../AGENTS.md) | Agent context: progress, constraints, test patterns, critical context |

## Setup & Local Development

| Document                                                                  | Purpose                                                             |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [../README.dev.md](../README.dev.md)                                      | Developer setup guide, environment variables, testing, architecture |
| [docs/LOCAL_DEVELOPMENT_CHECKLIST.md](LOCAL_DEVELOPMENT_CHECKLIST.md)     | 14-step local dev checklist                                         |
| [docs/SUPABASE_MIGRATION_WORKFLOW.md](SUPABASE_MIGRATION_WORKFLOW.md)     | Migration workflow, schema vs seed, common mistakes                 |
| [docs/SUPABASE_MIGRATION_CHEATSHEET.md](SUPABASE_MIGRATION_CHEATSHEET.md) | Quick reference for Supabase migrations                             |
| [docs/ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md)                 | All env vars across all services                                    |
| [docs/VSCODE_GIT_QUICKSTART.md](VSCODE_GIT_QUICKSTART.md)                 | VS Code Git workflow guide                                          |

## Architecture & Design

| Document                                                                            | Purpose                                                                                                    |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [docs/FULL_SYSTEM_AUDIT_2026-06-09.md](FULL_SYSTEM_AUDIT_2026-06-09.md)             | **Full-system architecture review & repo health audit** — 12-section evidence-based analysis (current)     |
| [docs/ARCHITECTURAL_ANALYSIS.md](ARCHITECTURAL_ANALYSIS.md)                         | Deep-dive audit across 6 pillars with 23 critical observations (current)                                   |
| [docs/ARCHITECTURAL_AUDIT_COMPLETE.md](ARCHITECTURAL_AUDIT_COMPLETE.md)             | Full architectural & operational audit with remediation roadmap (current)                                  |
| [archive/stale-docs/ANALYSIS_SUMMARY.md](../archive/stale-docs/ANALYSIS_SUMMARY.md) | Codebase overview and analysis (stale — see FULL_SYSTEM_AUDIT or ARCHITECTURAL_ANALYSIS)                   |
| [archive/stale-docs/CODEBASE_MAPPING.md](../archive/stale-docs/CODEBASE_MAPPING.md) | File-by-file codebase map (stale — see FULL_SYSTEM_AUDIT or ARCHITECTURAL_ANALYSIS)                        |
| [docs/JIRA_JSM_INTEGRATION.md](JIRA_JSM_INTEGRATION.md)                             | Jira/JSM sync, webhooks, schema, status maps, worker tasks                                                 |
| [docs/BILLING.md](BILLING.md)                                                       | Stripe billing, invoices, subscriptions, payments, webhooks                                                |
| [docs/ORG_BRANDING.md](ORG_BRANDING.md)                                             | Per-org branding: logo upload, colors, custom domains                                                      |
| [docs/ADMIN_FEATURES.md](ADMIN_FEATURES.md)                                         | Webhook management, role/permission editor, audit export, bulk import, org switcher, Sentry, shared ESLint |
| [docs/GAP_ANALYSIS.md](GAP_ANALYSIS.md)                                             | Comprehensive gap analysis, known issues, recommendations                                                  |
| [docs/ARCHITECTURAL_ANALYSIS.md](ARCHITECTURAL_ANALYSIS.md)                         | Deep-dive audit: repository map, code mechanics, architecture, infrastructure, docs drift, cleanup         |
| [docs/FINAL_OPERATOR_MAP.md](FINAL_OPERATOR_MAP.md)                                 | Quick reference for Terraform roots, hostnames, and core infra files                                       |
| [docs/DEPLOYMENT_OPTIONS_COMPARISON.md](DEPLOYMENT_OPTIONS_COMPARISON.md)           | Cost analysis: Vercel vs AWS vs hybrid                                                                     |
| [docs/portal_admin_permissions_guide.md](portal_admin_permissions_guide.md)         | Permissions, access control, and security flow                                                             |

## Deployment & Operations

| Document                                                                                                              | Purpose                                                                |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md](FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md)                               | Operator manual: env model, Terraform, promotion, rollback             |
| [archive/stale-docs/DEPLOYMENT_PLAN_TERRAFORM_VERCEL.md](../archive/stale-docs/DEPLOYMENT_PLAN_TERRAFORM_VERCEL.md)   | [Archived] 7-phase deployment plan, cost estimates, troubleshooting    |
| [docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md](GITHUB_SECRETS_AND_VARIABLES_MATRIX.md)                                 | Required GitHub secrets and variables                                  |
| [docs/ROLLBACK_PROCEDURES.md](ROLLBACK_PROCEDURES.md)                                                                 | ECS, Vercel, Supabase, Terraform rollback                              |
| [docs/MONITORING_AND_ALERTING.md](MONITORING_AND_ALERTING.md)                                                         | Monitoring strategy, alerting setup, dashboards                        |
| [docs/SECRETS_ROTATION.md](SECRETS_ROTATION.md)                                                                       | Rotation schedule, procedures, emergency rotation                      |
| [docs/API_RATE_LIMITING.md](API_RATE_LIMITING.md)                                                                     | Rate limit configuration and behavior (300/15min)                      |
| [docs/API_VERSIONING.md](API_VERSIONING.md)                                                                           | API versioning strategy                                                |
| [docs/CLOUDFLARE_CACHE_AND_PROXY_RECOMMENDATIONS.md](CLOUDFLARE_CACHE_AND_PROXY_RECOMMENDATIONS.md)                   | Cloudflare caching and proxy configuration                             |
| [docs/PRODUCTION_VS_TESTING_DOMAINS.md](PRODUCTION_VS_TESTING_DOMAINS.md)                                             | Production vs testing domain configuration                             |
| [archive/stale-docs/README_WORKFLOWS_AND_ENVIRONMENTS.md](../archive/stale-docs/README_WORKFLOWS_AND_ENVIRONMENTS.md) | [Archived] CI/CD workflows and environment reference                   |
| [docs/MARKETING_SITE_INTEGRATION.md](MARKETING_SITE_INTEGRATION.md)                                                   | Marketing site domain route plan — public API, frontend, domain config |
