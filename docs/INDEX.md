# Documentation Index

> Canonical index for the Maine CyberTech Portal monorepo documentation.
> Reconciled against the repo on 2026-08-01 — every link below targets a real file.

## Quick Start

| Document                            | Purpose                                                       |
| ----------------------------------- | ------------------------------------------------------------- |
| [README.md](../README.md)           | Project overview, testing, Docker, CI/CD, design decisions    |
| [AGENTS.md](../AGENTS.md)           | Agent context: progress, constraints, test patterns           |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Contribution workflow, conventions, PR expectations         |
| [README.dev.md](../README.dev.md)   | Developer setup guide, environment variables, testing         |
| [ONBOARDING.md](ONBOARDING.md)      | Developer onboarding — architecture, workflow, patterns       |
| [LOCAL_DEVELOPMENT_CHECKLIST.md](LOCAL_DEVELOPMENT_CHECKLIST.md) | 14-step local dev checklist                     |
| [VSCODE_GIT_QUICKSTART.md](VSCODE_GIT_QUICKSTART.md) | VS Code Git workflow guide                        |

## Architecture & Design

| Document                                                                          | Purpose                                                                 |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)                                | Mermaid system architecture diagram                                     |
| [adr/README.md](adr/README.md)                                                    | Architecture Decision Records (7 decisions)                             |
| [MASTER_SYSTEM_ARCHITECTURE_REVIEW.md](MASTER_SYSTEM_ARCHITECTURE_REVIEW.md)      | 12-domain synthesis of the full system architecture                     |
| [arch/evaluation/db-package-evaluation.md](arch/evaluation/db-package-evaluation.md) | Shared DB package evaluation                                        |
| [GAP_ANALYSIS.md](GAP_ANALYSIS.md)                                                | Comprehensive gap analysis, known issues, recommendations               |
| [ADMIN_FEATURES.md](ADMIN_FEATURES.md)                                            | Webhook management, role editor, audit export, bulk import, Sentry      |
| [ORG_BRANDING.md](ORG_BRANDING.md)                                                | Per-org branding: logo upload, colors, custom domains                   |

### Audits & Reviews

| Document                                                                          | Purpose                                                                 |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [FULL_SYSTEM_AUDIT_2026-06-09.md](FULL_SYSTEM_AUDIT_2026-06-09.md)                | Full-system architecture review & repo health audit                     |
| [ARCHITECTURAL_ANALYSIS.md](ARCHITECTURAL_ANALYSIS.md)                            | Deep-dive audit across 6 pillars with 23 critical observations          |
| [ARCHITECTURAL_AUDIT_COMPLETE.md](ARCHITECTURAL_AUDIT_COMPLETE.md)                | Full architectural & operational audit with remediation roadmap         |
| [CODE_REVIEW_2026-06-16.md](CODE_REVIEW_2026-06-16.md)                            | Full architecture review — 30 recommendations, risk register            |
| [MEGA_AUDIT_2026-06-18.md](MEGA_AUDIT_2026-06-18.md)                              | Comprehensive architecture & security audit                             |
| [SYSTEM_REVIEW_2026-06-26.md](SYSTEM_REVIEW_2026-06-26.md)                        | Full system review (2026-06-26)                                         |

## Setup & Local Development

| Document                                                              | Purpose                                                      |
| --------------------------------------------------------------------- | ------------------------------------------------------------ |
| [README.dev.md](../README.dev.md)                                     | Developer setup, env vars, testing, architecture             |
| [LOCAL_DEVELOPMENT_CHECKLIST.md](LOCAL_DEVELOPMENT_CHECKLIST.md)      | 14-step local dev checklist                                  |
| [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md)                  | All env vars across all services                             |
| [SUPABASE_MIGRATION_WORKFLOW.md](SUPABASE_MIGRATION_WORKFLOW.md)      | Migration workflow, schema vs seed, common mistakes          |
| [SUPABASE_MIGRATION_CHEATSHEET.md](SUPABASE_MIGRATION_CHEATSHEET.md)  | Quick reference for Supabase migrations                      |
| [migrations/naming-guide.md](migrations/naming-guide.md)              | Database migration naming conventions                        |
| [technical-writing/migration-guide.md](technical-writing/migration-guide.md) | Comprehensive deployment and migration guide         |
| [VSCODE_GIT_QUICKSTART.md](VSCODE_GIT_QUICKSTART.md)                  | VS Code Git workflow guide                                   |

## API & Integration

| Document                                                                          | Purpose                                                              |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [API_ENDPOINT_INVENTORY.md](API_ENDPOINT_INVENTORY.md)                            | Complete API endpoint inventory                                       |
| [openapi.yaml](openapi.yaml)                                                      | OpenAPI 3.0 spec — **generated** from `apps/api/src/openapi/spec.ts` (do not hand-edit; regenerate with `pnpm --filter=api exec tsx scripts/gen-openapi.mjs` or see `spec.ts`) |
| [API_ERROR_HANDLING.md](API_ERROR_HANDLING.md)                                    | API error handling patterns and standards                             |
| [API_RATE_LIMITING.md](API_RATE_LIMITING.md)                                      | Rate limit configuration and behavior (300/15min)                     |
| [API_VERSIONING.md](API_VERSIONING.md)                                           | API versioning strategy                                               |
| [JIRA_JSM_INTEGRATION.md](JIRA_JSM_INTEGRATION.md)                                | Jira/JSM sync, webhooks, schema, status maps, worker tasks            |
| [BILLING.md](BILLING.md)                                                          | Stripe billing, invoices, subscriptions, payments, webhooks           |
| [MARKETING_SITE_INTEGRATION.md](MARKETING_SITE_INTEGRATION.md)                    | Marketing site domain route — public API, frontend, domain config     |

## Security & Compliance

| Document                                                                          | Purpose                                                              |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [SECURITY.md](../SECURITY.md)                                                     | Security policy                                                      |
| [portal_admin_permissions_guide.md](portal_admin_permissions_guide.md)            | Permissions, access control, and security flow                       |
| [GITHUB_SECRETS_AND_VARIABLES_MATRIX.md](GITHUB_SECRETS_AND_VARIABLES_MATRIX.md)  | Required GitHub secrets and variables                                |
| [SECRETS_ROTATION.md](SECRETS_ROTATION.md)                                        | Rotation schedule, procedures, emergency rotation                    |
| [JWT_ROTATION.md](JWT_ROTATION.md)                                                | JWT secret rotation policy and procedures                            |
| [RTO_RPO.md](RTO_RPO.md)                                                          | Recovery time objective / recovery point objective                   |

## Deployment & Operations

| Document                                                                              | Purpose                                                               |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md](FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md)    | Operator manual: env model, Terraform, promotion, rollback            |
| [FINAL_OPERATOR_MAP.md](FINAL_OPERATOR_MAP.md)                                        | Quick reference: Terraform roots, hostnames, core infra files         |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md)                                              | Common issues and fixes by service (new)                              |
| [ROLLBACK_PROCEDURES.md](ROLLBACK_PROCEDURES.md)                                      | Docker, Supabase, Terraform rollback                                  |
| [MONITORING_AND_ALERTING.md](MONITORING_AND_ALERTING.md)                              | Monitoring strategy, alerting setup, dashboards                       |
| [DEPLOYMENT_OPTIONS_COMPARISON.md](DEPLOYMENT_OPTIONS_COMPARISON.md)                  | Cost analysis: Vercel vs AWS vs hybrid                                |
| [PRODUCTION_VS_TESTING_DOMAINS.md](PRODUCTION_VS_TESTING_DOMAINS.md)                  | Production vs testing domain configuration                            |
| [CLOUDFLARE_CACHE_AND_PROXY_RECOMMENDATIONS.md](CLOUDFLARE_CACHE_AND_PROXY_RECOMMENDATIONS.md) | Cloudflare caching and proxy configuration               |

## Module Documentation (`docs/modules/` — 72 files)

API routes, SDK wrappers, admin/portal pages, tests, and worker tasks per module:

- [admin-utilities](modules/admin-utilities.md) — admin utilities (test email)
- [ai-policy](modules/ai-policy.md) — AI usage policy
- [ai-tools](modules/ai-tools.md) — AI tools
- [api-documentation](modules/api-documentation.md) — Swagger UI + OpenAPI spec
- [api-keys](modules/api-keys.md) — API key management
- [approvals](modules/approvals.md) — approval workflows
- [assets](modules/assets.md) — asset management
- [audit](modules/audit.md) — audit log (admin listing, CSV/JSON export)
- [audit-logging](modules/audit-logging.md) — audit logging service
- [auth](modules/auth.md) — authentication (sign-in, sign-up, PKCE, password reset)
- [automation-workflows](modules/automation-workflows.md) — automation workflows
- [backup-dr](modules/backup-dr.md) — backup & disaster recovery
- [batch](modules/batch.md) — batch operations (licenses, status items, DMARC)
- [bulk-invite](modules/bulk-invite.md) — bulk user invite (CSV import)
- [business-os](modules/business-os.md) — business OS dashboard/summary
- [camera-calculator](modules/camera-calculator.md) — camera coverage calculator
- [change-requests](modules/change-requests.md) — change request management
- [client-onboarding](modules/client-onboarding.md) — client onboarding
- [compliance-readiness](modules/compliance-readiness.md) — compliance readiness
- [dashboard](modules/dashboard.md) — admin dashboard (aggregate counts)
- [dmarc-coach](modules/dmarc-coach.md) — DMARC assessments
- [documents](modules/documents.md) — document management (upload, versions, shares)
- [domain-monitors](modules/domain-monitors.md) — domain monitoring
- [dynamic-client-forms](modules/dynamic-client-forms.md) — dynamic forms builder
- [edu-automation](modules/edu-automation.md) — education automation (11 sub-routes)
- [endpoint-security](modules/endpoint-security.md) — endpoint security
- [field-services](modules/field-services.md) — field services (6 sub-routes)
- [file-requests](modules/file-requests.md) — file request uploads
- [final-multi-module](modules/final-multi-module.md) — final multi-module (10+ sub-routes)
- [findings](modules/findings.md) — findings management
- [governance](modules/governance.md) — governance (policies, controls, risks)
- [health](modules/health.md) — health check endpoint
- [identity-verification](modules/identity-verification.md) — identity verification
- [incident-response](modules/incident-response.md) — incident response
- [insurance-binder](modules/insurance-binder.md) — insurance binder
- [isp-phone](modules/isp-phone.md) — ISP/phone services
- [knowledge-base](modules/knowledge-base.md) — knowledge base
- [license-optimizer](modules/license-optimizer.md) — license optimizer
- [m365-hardening](modules/m365-hardening.md) — M365 hardening
- [memberships](modules/memberships.md) — org memberships
- [notification-preferences](modules/notification-preferences.md) — per-module toggles
- [notifications](modules/notifications.md) — notifications (SSE, mark-read, CRUD)
- [offboarding](modules/offboarding.md) — offboarding
- [organizations](modules/organizations.md) — organizations
- [phishing-simulation](modules/phishing-simulation.md) — phishing campaigns
- [port-maps](modules/port-maps.md) — network port maps
- [powershell-policy](modules/powershell-policy.md) — PowerShell policy
- [profiles](modules/profiles.md) — user profiles (CRUD, avatar upload)
- [projects](modules/projects.md) — projects (tasks, comments, approval, timeline)
- [proposals](modules/proposals.md) — proposals
- [qbr-reports](modules/qbr-reports.md) — QBR reports
- [risk-register](modules/risk-register.md) — risk register
- [roles](modules/roles.md) — roles & permissions
- [satisfaction-pulse](modules/satisfaction-pulse.md) — satisfaction surveys
- [scoreboard-gamification](modules/scoreboard-gamification.md) — scoreboards & gamification
- [scoreboards-gamification](modules/scoreboards-gamification.md) — scoreboards & gamification (variant)
- [search](modules/search.md) — admin global search
- [search-portal](modules/search-portal.md) — portal-scoped search
- [security-ops](modules/security-ops.md) — security operations (4 sub-routes)
- [security-suite](modules/security-suite.md) — security suite (4 sub-routes)
- [service-catalog](modules/service-catalog.md) — service catalog
- [sla-metrics](modules/sla-metrics.md) — SLA tracking (breach rates, metrics)
- [sop-library](modules/sop-library.md) — SOP library
- [status-page](modules/status-page.md) — public status pages
- [tickets](modules/tickets.md) — support tickets (CRUD, comments, bulk update)
- [training-hub](modules/training-hub.md) — training hub
- [unifi-survey](modules/unifi-survey.md) — UniFi survey
- [uptime-monitor](modules/uptime-monitor.md) — uptime monitoring
- [users](modules/users.md) — user management (roles, permissions, multi-org)
- [vendors](modules/vendors.md) — vendors (contracts + contacts)
- [webhook-management](modules/webhook-management.md) — webhook endpoint management
- [webhooks](modules/webhooks.md) — webhook delivery handlers

## Features & Runbooks

| Document                                                                      | Purpose                                                      |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [features/client-onboarding-command-center.md](features/client-onboarding-command-center.md) | Client onboarding command center feature spec |
| [runbooks/client-onboarding-command-center.md](runbooks/client-onboarding-command-center.md) | Client onboarding command center runbook     |

## Marketing & SEO (`docs/seo/` — 10 files)

- [seo/README.md](seo/README.md) — SEO documentation index
- [seo/AI_BLOG_GENERATION_PROMPTS.md](seo/AI_BLOG_GENERATION_PROMPTS.md) — AI blog generation prompts
- [seo/BLOG_IDEA_BACKLOG.md](seo/BLOG_IDEA_BACKLOG.md) — blog idea backlog
- [seo/GOOGLE_BUSINESS_PROFILE_CHECKLIST.md](seo/GOOGLE_BUSINESS_PROFILE_CHECKLIST.md) — Google Business Profile checklist
- [seo/IMPLEMENTATION_ORDER.md](seo/IMPLEMENTATION_ORDER.md) — SEO implementation order
- [seo/LOCAL_CITATION_CHECKLIST.md](seo/LOCAL_CITATION_CHECKLIST.md) — local citation checklist
- [seo/LOCAL_SEO_CONTENT_PLAN.md](seo/LOCAL_SEO_CONTENT_PLAN.md) — local SEO content plan
- [seo/SEO_IMPLEMENTATION_PROMPT_PACK.md](seo/SEO_IMPLEMENTATION_PROMPT_PACK.md) — SEO prompt pack
- [seo/SEO_PR_CHECKLIST.md](seo/SEO_PR_CHECKLIST.md) — SEO PR checklist
- [seo/SERVICE_PAGE_KEYWORD_MAP.md](seo/SERVICE_PAGE_KEYWORD_MAP.md) — service page keyword map

## Handoff Bundle

| Document                                                            | Purpose                                                    |
| ------------------------------------------------------------------- | ---------------------------------------------------------- |
| [portal_platform_formal_handoff_bundle/](portal_platform_formal_handoff_bundle/) | Formal handoff docs (docx), architecture diagrams (png), bootstrap SQL |
