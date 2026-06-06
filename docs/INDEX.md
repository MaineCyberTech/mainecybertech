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

| Document                                                                    | Purpose                                                                                                    |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [docs/ANALYSIS_SUMMARY.md](ANALYSIS_SUMMARY.md)                             | Codebase overview and analysis (stale — see AGENTS.md)                                                     |
| [docs/CODEBASE_MAPPING.md](CODEBASE_MAPPING.md)                             | File-by-file codebase map (stale — see AGENTS.md)                                                          |
| [docs/JIRA_JSM_INTEGRATION.md](JIRA_JSM_INTEGRATION.md)                     | Jira/JSM sync, webhooks, schema, status maps, worker tasks                                                 |
| [docs/BILLING.md](BILLING.md)                                               | Stripe billing, invoices, subscriptions, payments, webhooks                                                |
| [docs/ORG_BRANDING.md](ORG_BRANDING.md)                                     | Per-org branding: logo upload, colors, custom domains                                                      |
| [docs/ADMIN_FEATURES.md](ADMIN_FEATURES.md)                                 | Webhook management, role/permission editor, audit export, bulk import, org switcher, Sentry, shared ESLint |
| [docs/GAP_ANALYSIS.md](GAP_ANALYSIS.md)                                     | Comprehensive gap analysis, known issues, recommendations                                                  |
| [docs/FINAL_OPERATOR_MAP.md](FINAL_OPERATOR_MAP.md)                         | Quick reference for Terraform roots, hostnames, and core infra files                                       |
| [docs/DEPLOYMENT_OPTIONS_COMPARISON.md](DEPLOYMENT_OPTIONS_COMPARISON.md)   | Cost analysis: Vercel vs AWS vs hybrid                                                                     |
| [docs/portal_admin_permissions_guide.md](portal_admin_permissions_guide.md) | Permissions, access control, and security flow                                                             |

## Deployment & Operations

| Document                                                                                                              | Purpose                                                                |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md](FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md)                               | Operator manual: env model, Terraform, promotion, rollback             |
| [archive/stale-docs/DEPLOYMENT_PLAN_TERRAFORM_VERCEL.md](../archive/stale-docs/DEPLOYMENT_PLAN_TERRAFORM_VERCEL.md)   | [Archived] 7-phase deployment plan, cost estimates, troubleshooting    |
| [docs/PRODUCTION_CUTOVER_CHECKLIST.md](PRODUCTION_CUTOVER_CHECKLIST.md)                                               | Day-of production cutover checklist                                    |
| [docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md](GITHUB_SECRETS_AND_VARIABLES_MATRIX.md)                                 | Required GitHub secrets and variables                                  |
| [docs/ROLLBACK_PROCEDURES.md](ROLLBACK_PROCEDURES.md)                                                                 | ECS, Vercel, Supabase, Terraform rollback                              |
| [docs/MONITORING_AND_ALERTING.md](MONITORING_AND_ALERTING.md)                                                         | Monitoring strategy, alerting setup, dashboards                        |
| [docs/SECRETS_ROTATION.md](SECRETS_ROTATION.md)                                                                       | Rotation schedule, procedures, emergency rotation                      |
| [docs/API_RATE_LIMITING.md](API_RATE_LIMITING.md)                                                                     | Rate limit configuration and behavior (300/15min)                      |
| [docs/API_VERSIONING.md](API_VERSIONING.md)                                                                           | API versioning strategy                                                |
| [docs/CLOUDFLARE_CACHE_AND_PROXY_RECOMMENDATIONS.md](CLOUDFLARE_CACHE_AND_PROXY_RECOMMENDATIONS.md)                   | Cloudflare caching and proxy configuration                             |
| [docs/CLOUDFLARE_VERCEL_DOMAIN_COMPLETION_README.md](CLOUDFLARE_VERCEL_DOMAIN_COMPLETION_README.md)                   | Cloudflare + Vercel domain setup guide                                 |
| [docs/DOCUMENTATION_INDEX_DOMAIN_COMPLETION.md](DOCUMENTATION_INDEX_DOMAIN_COMPLETION.md)                             | Domain completion documentation index                                  |
| [docs/ENVIRONMENT_PROVISIONING_AND_PROMOTION.md](ENVIRONMENT_PROVISIONING_AND_PROMOTION.md)                           | Environment provisioning and promotion workflow                        |
| [docs/PRODUCTION_VS_TESTING_DOMAINS.md](PRODUCTION_VS_TESTING_DOMAINS.md)                                             | Production vs testing domain configuration                             |
| [docs/VERCEL_DOMAIN_ASSIGNMENT_CHECKLIST.md](VERCEL_DOMAIN_ASSIGNMENT_CHECKLIST.md)                                   | Vercel domain assignment checklist                                     |
| [archive/stale-docs/README_WORKFLOWS_AND_ENVIRONMENTS.md](../archive/stale-docs/README_WORKFLOWS_AND_ENVIRONMENTS.md) | [Archived] CI/CD workflows and environment reference                   |
| [docs/ZERO_DOWNTIME_CUTOVER_NOTES.md](ZERO_DOWNTIME_CUTOVER_NOTES.md)                                                 | Zero-downtime cutover procedures                                       |
| [docs/MARKETING_SITE_INTEGRATION.md](MARKETING_SITE_INTEGRATION.md)                                                   | Marketing site domain route plan — public API, frontend, domain config |
| [docs/ENVIRONMENT_MATRIX.md](ENVIRONMENT_MATRIX.md)                                                                   | Environment variable matrix across services                            |
