# Documentation, Developer Experience, and Operator Readiness Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260801-0233-develop-a585f1d
- Repository: mainecybertech-portal
- Branch: develop
- Commit SHA: a585f1d
- Generated at: 2026-08-01T02:33:00Z
- Auditor: AI agent (audit script)
- Area code: DOC
- Output path: prompts/repo-deep-dive/20260801-0233-develop-a585f1d/16_documentation_devex_operator_readiness.md
- Scope limitations: No production access; audit evaluates docs, configs, source code, and scripts as evidence of readiness. E2E test files counted but not executed.

## Scope

Reviewed documentation coverage across all domains: README, local setup, env docs, architecture/API docs, DB/migration docs, testing docs, deploy/rollback docs, incident/security docs, contribution/coding standards, PR/release process, operator manuals, troubleshooting guides, ADRs/diagrams, onboarding materials, script docs, known limitations, AI agent instructions (AGENTS.md), prompt packs, and repo maps. Validated doc claims against source code, config files, and test inventories. Cross-referenced AGENTS.md claims with actual codebase state. Assessed docs/INDEX.md completeness against actual docs/ directory.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |
| AGENTS.md | Agent context file | Primary source of truth for AI agents; test counts, architecture claims, feature inventory | 1329 lines; extremely large for context window |
| docs/INDEX.md | Documentation index | Canonical doc listing; claims completeness | 108 lines; lists 18 module docs but actual is 72 |
| docs/ONBOARDING.md | Onboarding guide | Developer onboarding | Verified existence |
| docs/ENVIRONMENT_VARIABLES.md | Env var reference | Central env documentation | Verified existence |
| docs/API_ENDPOINT_INVENTORY.md | API inventory | Endpoint listing | Claims "86 endpoints" |
| docs/openapi.yaml | OpenAPI spec | API contract doc | 393 lines; covers 7 endpoint groups |
| docs/ROLLBACK_PROCEDURES.md | Rollback doc | Operator readiness | 185 lines; covers Docker, Supabase, Terraform |
| docs/ARCHITECTURE_DIAGRAM.md | Architecture diagram | System visualization | Verified existence |
| docs/MONITORING_AND_ALERTING.md | Monitoring doc | Operational readiness | Verified existence |
| docs/SECRETS_ROTATION.md | Secrets doc | Security operations | Verified existence |
| docs/JWT_ROTATION.md | JWT rotation doc | Security operations | Verified existence |
| README.dev.md | Dev setup guide | Onboarding | 586 lines; comprehensive |
| docs/LOCAL_DEVELOPMENT_CHECKLIST.md | Setup checklist | Onboarding | 14-step checklist |
| docs/adr/README.md | ADR index | Architecture decisions | 7 decisions documented |
| apps/api/.env.example | API env template | Env doc accuracy | 29 vars vs 24 in Zod schema |
| apps/web/.env.example | Web env template | Env doc accuracy | 7 vars, no Zod schema |
| apps/worker/.env.example | Worker env template | Env doc accuracy | 28 vars, 19 in Zod schema |
| apps/api/src/config/env.ts | API env schema | Env validation | Zod schema with 24 fields |
| apps/worker/src/env.ts | Worker env schema | Env validation | Zod schema with 20 fields |
| apps/api/src/__tests__/*.test.ts | API tests | Test count verification | 584 it/test calls across 72 test files |
| apps/web/__tests__/**/*.test.* | Web tests | Test count verification | 397 it/test calls |
| packages/sdk/src/__tests__/*.test.ts | SDK tests | Test count verification | 247 it/test calls |
| apps/worker/src/__tests__/*.test.ts | Worker tests | Test count verification | 31 it/test calls |
| apps/web/e2e/**/*.spec.ts | E2E tests | E2E spec count | 56 spec files, 236 it/test calls |
| prompts/repo-deep-dive/ | Prompt pack | Agent instructions | 44 prompt files |
| prompts/hardening_prompt_pack/ | Hardening pack | Security prompts | Verified existence |
| docs/modules/ | Module docs | Feature documentation | 72 files |
| docs/runbooks/ | Runbook docs | Operational procedures | 1 file |
| docs/seo/ | SEO docs | Marketing guidance | 10 files |
| docs/audits/dashboard/ | Audit reports | Prior audit outputs | verified |
| .gitignore | Git ignore | Env file hygiene | Properly ignores .env but not .env.local |
| apps/api/.env, apps/api/.env.local, apps/web/.env.local, apps/worker/.env.local | Local env files | Secret hygiene | Present in source tree despite gitignore |

## Executive Summary

**Overall Score: 3.5/5 — Functional but documentation has significant drift from reality.**

The MCT portal repository has **exceptional breadth** of documentation — 38 docs/, 72 module docs, 44 prompt files, comprehensive operator manuals, and a 586-line dev onboarding guide. This is far above average for a monorepo of this size.

**Critical issue: AGENTS.md test counts are 9 months stale.** The banner claims "774 tests all green (182 API + 108 SDK + 24 Worker + 460 Web)" — these numbers date from June 2026 and predate the massive module expansion. Actual counts: ~584 API, ~247 SDK, ~31 Worker, ~397 Web, ~56 E2E specs. The later "1,530 tests" claim is also stale. This misleads every AI agent reading the context file.

**Secondary issue: docs/INDEX.md is incomplete.** The modules/ directory contains 72 docs but INDEX lists only 37. Several subdirectories (adr/, arch/, audits/, runbooks/, seo/, technical-writing/) are not indexed. References to `archive/stale-docs/` are dead links — that directory was removed.

**OpenAPI spec is grossly incomplete.** Covers 7 of 54 route files (13%). Missing all new modules (qbr, proposals, findings, governance, service-catalog, security-suite, security-ops, field-services, edu-automation, file-requests, approvals, api-keys, ai-tools, vendors, final, store, and 20+ more).

**Web lacks env validation.** Unlike API and Worker which use Zod schemas for runtime validation, Web has no env schema. NEXT_PUBLIC_ vars are expected but never validated.

**.env/.env.local files exist in source tree.** Despite .gitignore rules, several apps have committed local env files — a potential secret leakage risk.

## Inventory

| Item | Path | Purpose | Current state | Risk | Notes |
| ---- | ---- | ------- | ------------- | ---- | ----- |
| AGENTS.md | /AGENTS.md | AI agent context file | Stale test counts; very large (1329 lines) | High | Core agent instruction file is misleading |
| README.dev.md | /README.dev.md | Developer onboarding | Good; 586 lines comprehensive | Low | Still references Terraform paths that only exist for DO |
| docs/INDEX.md | /docs/INDEX.md | Documentation index | Incomplete; missing 35+ entries | Medium | Dead links to archive/stale-docs/ |
| OpenAPI spec | /docs/openapi.yaml | API contract | Covers 7/54 routes (13%) | Medium | Not regenerated after module expansion |
| API env schema | /apps/api/src/config/env.ts | Env validation | Zod schema; 24 fields, matches .env.example well | Low | 5 vars in .example not in schema (all optional) |
| Worker env schema | /apps/worker/src/env.ts | Env validation | Zod schema; 20 fields; .env.example has 9 extra vars | Medium | Example is aspirational; actual schema is leaner |
| Web env validation | /apps/web (none) | Env validation | **Absent** — no Zod/env schema | Medium | 7 NEXT_PUBLIC_ vars unvalidated |
| Env var docs | /docs/ENVIRONMENT_VARIABLES.md | Env reference | Verified existence | Low | Needs update for new vars (TURNSTILE, M365, JSM) |
| Module docs | /docs/modules/ | Feature docs | 72 files; INDEX lists 37 | Medium | Many undocumented in index |
| Rollback docs | /docs/ROLLBACK_PROCEDURES.md | Operator readiness | Good; covers Docker, Supabase, Terraform | Low | Still mentions Vercel/ECS in INDEX summary line |
| Onboarding | /docs/ONBOARDING.md | New dev onboarding | Verified existence; comprehensive | Low | |
| Local dev checklist | /docs/LOCAL_DEVELOPMENT_CHECKLIST.md | Setup validation | 14 steps | Low | |
| ADRs | /docs/adr/README.md | Architecture decisions | 7 decisions; well-structured | Low | Not in INDEX.md |
| Prompt packs | /prompts/repo-deep-dive/ | AI audit prompts | 44 files; comprehensive | Low | |
| Hardening pack | /prompts/hardening_prompt_pack/ | Security prompts | Verified | Low | |
| Runbooks | /docs/runbooks/ | Operational procedures | 1 file only | Medium | Named "runbooks" but only has client-onboarding |
| SEO docs | /docs/seo/ | Marketing/SaaS guidance | 10 files; not in INDEX | Low | Not relevant to platform operators |
| Script docs | /scripts/ | Automation | 34 files; no README for most | Low | Includes load-test scripts |
| Troubleshooting guide | /docs/ (none found) | Troubleshooting | **Absent** | Medium | No dedicated troubleshooting doc |
| PR/release process | /docs/ (none found) | Release workflow | **Absent** | Medium | No documented release process |
| Known limitations | /docs/ (none found) | Platform limitations | **Absent** | Low | No known-limitations doc |
| Incident response | /docs/ (none found) | Incident handling | **Absent** | Medium | No incident response runbook |
| .env files | apps/*/.env, apps/*/.env.local | Secrets | Present in source tree | High | Potential secret leakage |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
| -------- | ----: | -------- | --- | ------------------ |
| README | 4 | AGENTS.md exists, README.dev.md 586 lines | AGENTS.md test counts stale | Update AGENTS.md test counts and feature inventory |
| Local setup | 4 | README.dev.md + LOCAL_DEVELOPMENT_CHECKLIST.md + 34 scripts | .env.example vs schema mismatches | Align .env.example files with Zod schemas |
| Env docs | 3 | ENVIRONMENT_VARIABLES.md exists; Zod schemas in API/Worker | Web has no env validation; Worker .env.example over-specified | Add Zod schema to Web; trim Worker .env.example |
| Architecture/API docs | 3 | Architecture diagram, ADRs, API inventory | OpenAPI covers 7/54 routes; API inventory claims "86" but likely stale too | Regenerate OpenAPI spec; update API inventory |
| DB/migration docs | 4 | SUPABASE_MIGRATION_WORKFLOW.md + CHEATSHEET.md | Migration naming guide exists in docs/migrations/ | Good |
| Testing docs | 3 | Test patterns in AGENTS.md | AGENTS.md test counts 9 months stale; no test strategy doc | Update AGENTS.md; create test strategy doc |
| Deploy/rollback docs | 4 | ROLLBACK_PROCEDURES.md 185 lines; GitHub deploy workflows | INDEX summary still says "ECS, Vercel" — should say "DO, GHCR" | Update INDEX.md entry |
| Incident/security docs | 3 | SECRETS_ROTATION.md, JWT_ROTATION.md, MONITORING_AND_ALERTING.md | No incident response runbook; no security incident procedure | Create incident-response.md |
| Contribution/coding standards | 3 | ESLint configs, TypeScript configs, test patterns in AGENTS.md | No CONTRIBUTING.md; no PR template | Create CONTRIBUTING.md + PR template |
| PR/release process | 3 | CI/CD workflows documented in AGENTS.md; validation gates exist | No release checklist; no changelog | Create RELEASE.md; add automated changelog |
| Operator manuals | 3 | FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md; FINAL_OPERATOR_MAP.md | Handoff bundle exists but scattered | Consolidate operator docs |
| Troubleshooting | 1 | No dedicated troubleshooting document | **None found** | Create TROUBLESHOOTING.md |
| ADRs/diagrams | 4 | ARCHITECTURE_DIAGRAM.md, adr/README.md | ADRs not in INDEX.md | Add ADRs to INDEX.md |
| AI agent instructions | 3 | AGENTS.md 1329 lines; 44 prompt files | AGENTS.md is stale, oversized for context window | Split AGENTS.md; update all claims |
| Prompt packs | 5 | 44 prompts in repo-deep-dive; hardening pack; audit outputs preserved | Comprehensive | N/A |
| Repo maps | 3 | AGENTS.md has architecture map; CODE_REVIEW has detailed mapping | Older mapping docs archived but stale | Keep AGENTS.md fresh |

## Detailed Review

### Item: AGENTS.md

- Evidence: `/AGENTS.md` (1329 lines)
- What it does: Provides AI agent context — architecture, test patterns, CI/CD, Docker notes, feature inventory
- How it appears to work: Acts as a comprehensive brain dump for AI coding agents
- Dependencies: None (standalone markdown)
- Current controls: Regularly updated with audit findings
- Missing controls: No version/date stamp for each section; no "last verified" markers
- Risks: Stale test counts (claims 774/1530, actual ~1495+236); E2E spec count says 26, actual 56; references deleted directories (archive/stale-docs/); claims 44 API routes, actual 54; banner test counts from June 2026 have not been updated through massive module expansion
- Recommended improvement: Add date-stamped verification markers to each major section; split into AGENTS.md (core context) and separate extension files for test patterns, Docker notes, module inventory
- Suggested tests: Add CI check that verifies AGENTS.md test counts match actual `pnpm test` output
- Suggested docs: Add "Last verified: YYYY-MM-DD" to each major section header

### Item: OpenAPI Spec

- Evidence: `/docs/openapi.yaml` (393 lines)
- What it does: Documents API contract for 7 endpoint groups: auth, tickets, projects, documents, organizations, public, health
- How it appears to work: Standard OpenAPI 3.0.3 spec with schemas for Error, Success, PaginatedResult
- Dependencies: Used by Swagger UI at `GET /api/v1/docs`
- Current controls: Verified existence; includes security schemes (BearerAuth, CookieAuth)
- Missing controls: Covers only 7 of 54 route files (13%). Missing: admin, ai, analytics, api-keys, approvals, assets, batch, billing, bulk, business-os, client-onboarding-command-center, dashboard, dmarc-coach, domain-monitors, dynamic-client-forms-builder, edu-automation, field-services, file-requests, final, findings, governance, insurance-binder, license-optimizer, memberships, notification-preferences, notifications, profiles, proposals, qbr, roles, satisfaction-pulse-widget, search, search-portal, security-ops, security-suite, service-catalog, sla, status-page, store, training-hub, uptime-monitor, users, vendors, webhook-management, webhooks
- Risks: API consumers cannot discover 87% of endpoints via OpenAPI; Swagger UI is misleadingly incomplete
- Recommended improvement: Auto-generate OpenAPI from Zod schemas and route definitions; or manually expand to cover all 54 modules
- Suggested tests: Add test that verifies every route file has a corresponding OpenAPI path entry
- Suggested docs: Document OpenAPI generation process

### Item: Web Environment Validation

- Evidence: `/apps/web/.env.example` (7 vars); no Zod schema found in `/apps/web/`
- What it does: Lists NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SENTRY_DSN, SENTRY_ORG, SENTRY_PROJECT, NEXT_PUBLIC_GA_ID, NEXT_PUBLIC_TAWKTO_ID, NEXT_PUBLIC_TURNSTILE_SITE_KEY
- How it appears to work: Next.js reads NEXT_PUBLIC_ vars at build time; server-side vars at runtime
- Dependencies: None
- Current controls: .env.example exists
- Missing controls: No Zod schema; no runtime validation of required vars; no startup crash on missing critical vars
- Risks: Missing NEXT_PUBLIC_API_URL at build time would cause silent failures in production
- Recommended improvement: Create `apps/web/src/config/env.ts` with Zod schema validating all required env vars; crash fast on missing critical vars
- Suggested tests: Test that build fails when NEXT_PUBLIC_API_URL is missing
- Suggested docs: Add env validation section to web README

### Item: .env and .env.local Files in Source Tree

- Evidence: `apps/api/.env`, `apps/api/.env.local`, `apps/web/.env.local`, `apps/worker/.env.local`
- What it does: Local development environment files that should never be committed
- How it appears to work: .gitignore has `.env` and `.env.*` lines that should exclude these
- Dependencies: None
- Current controls: .gitignore rules exist
- Missing controls: Files somehow exist in working tree despite gitignore; possibly added before gitignore was updated or force-added
- Risks: These files may contain real API keys, Supabase URLs, Stripe keys, JWT secrets — if pushed, they would expose production credentials
- Recommended improvement: Verify these files are not tracked by git (`git ls-files apps/*/.env*`); if tracked, remove from git history using BFG or git filter-branch; add `.env.local` explicitly to .gitignore
- Suggested tests: Add CI pre-commit hook that fails if .env files (other than .example) are staged
- Suggested docs: Add note to ONBOARDING.md about never committing .env files

### Item: docs/INDEX.md Dead Links

- Evidence: `/docs/INDEX.md` lines 36-37, 53, 63
- What it does: References `archive/stale-docs/ANALYSIS_SUMMARY.md`, `archive/stale-docs/CODEBASE_MAPPING.md`, and others
- How it appears to work: Points to files in a directory that no longer exists
- Dependencies: None
- Current controls: INDEX.md regularly updated
- Missing controls: No automated dead-link checking
- Risks: Broken developer experience; new team members click dead links
- Recommended improvement: Remove all archive/stale-docs/ references; add CI link checker (e.g., markdown-link-check)
- Suggested tests: CI step that validates all relative links in docs/INDEX.md
- Suggested docs: N/A (fix existing)

### Item: Worker .env.example Over-specification

- Evidence: `/apps/worker/.env.example` (28 vars) vs `/apps/worker/src/env.ts` (20 vars in Zod schema)
- What it does: Example lists JSM_BASE_URL, M365_TENANT_ID, M365_CLIENT_ID, M365_CLIENT_SECRET, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM — none of which are in the Zod schema
- How it appears to work: These vars are aspirational (planned features) but not yet validated at runtime
- Dependencies: None
- Current controls: .env.example is a template
- Missing controls: If a developer sets these vars per the example, they silently do nothing (no validation, no consumption)
- Risks: Confusion about which vars are actually required; wasted developer time configuring unused vars
- Recommended improvement: Either add these vars to the Zod schema or remove them from .env.example; mark aspirational vars with `# (planned, not yet active)` comments
- Suggested tests: Test that every var in .env.example has a corresponding Zod schema field
- Suggested docs: Add section to ENVIRONMENT_VARIABLES.md noting which vars are active vs planned

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
| -- | ------------------- | -------- | --------------- | --- | -------- | -------------- |
| DOC-001 | AGENTS.md accuracy | Test counts 9 months stale; says 774 (actual ~1495), E2E says 26 (actual 56) | AGENTS.md acts as agent context | Agent misdirection | P1 | Update all counts; add CI verification |
| DOC-002 | OpenAPI completeness | 7 of 54 routes documented (13%) | openapi.yaml exists | 47 missing route groups | P1 | Auto-generate or manually expand |
| DOC-003 | Web env validation | No Zod schema in web package | .env.example exists | No runtime validation | P1 | Add Zod schema to apps/web/ |
| DOC-004 | .env files committed | .env/.env.local files in working tree | .gitignore rules exist | Potential secret leakage | P1 | Remove from git; verify not tracked |
| DOC-005 | docs/INDEX.md dead links | References archive/stale-docs/ (deleted directory) | INDEX.md exists | Broken links | P2 | Remove dead references; add CI link check |
| DOC-006 | docs/INDEX.md missing entries | 72 module docs exist; INDEX lists 37 | INDEX.md lists modules | 35 missing entries | P2 | Update INDEX.md with full module listing |
| DOC-007 | No troubleshooting doc | No TROUBLESHOOTING.md found | None | Operator gap | P2 | Create troubleshooting guide |
| DOC-008 | No incident response doc | No incident-response.md found | None | Operator gap | P2 | Create incident response runbook |
| DOC-009 | Worker .env.example over-specifies | 28 vars in example, 20 in schema | .env.example template | Developer confusion | P2 | Align example with schema |
| DOC-010 | No PR/release process doc | No CONTRIBUTING.md or RELEASE.md | CI/CD workflows exist | New contributor gap | P2 | Create CONTRIBUTING.md + PR template |
| DOC-011 | ADRs not in INDEX.md | 7 ADRs under docs/adr/ | ADRs exist | Not discoverable | P3 | Add ADRs to INDEX.md |
| DOC-012 | AGENTS.md oversized | 1329 lines | Agent context | Context window pressure | P3 | Split into extension files |

## Findings

### Finding ID: DOC-P1-001 - AGENTS.md test counts are 9 months stale, misleading all AI agents

- Severity: P1
- Confidence: High
- Area: Documentation / Agent instructions
- Evidence:
  - `AGENTS.md` line 5: "774 tests all green (182 API + 108 SDK + 24 Worker + 460 Web)"
  - `AGENTS.md` line 68: "1,530 tests, all passing: API 583, SDK 223, Worker 24, Web 700"
  - Actual counts (2026-08-01): API ~584, SDK ~247, Worker ~31, Web ~397, E2E ~56 specs
  - `AGENTS.md` line 76: "E2E | 26 spec files" — actual: 56 spec files in `apps/web/e2e/`
  - `AGENTS.md` line 86: claims "44 API route files" — actual: 54 route files in `apps/api/src/routes/`
- What is happening: The AGENTS.md banner test count (774) dates from the June 2026 "Latest audit session" and was never updated through massive module expansion (19 new modules in July 2026). The later "1,530" claim in the Test Status section is also stale.
- Why it matters: AGENTS.md is the primary context file read by every AI coding agent. Stale test counts cause agents to misunderstand project scale, skip test verification, and make incorrect assumptions about codebase maturity.
- User/business impact: AI agents may skip running tests for "already-passing" code; new developers misestimate project size; audit reports based on stale counts propagate misinformation.
- Security/privacy/reliability impact: Low direct impact, but incorrect test coverage assumptions could lead to unreviewed code being merged.
- Recommended fix: Run `pnpm test` and capture actual counts; update all three locations in AGENTS.md (banner, Test Status table, E2E count); add a CI check that compares AGENTS.md claims against actual test output.
- Suggested validation: Run `pnpm test -- --json --outputFile=test-results.json` and compare against AGENTS.md counts.
- Owner suggestion: Principal engineer
- Effort estimate: 30 min
- Dependencies: Test suite must be runnable
- Status: Open

### Finding ID: DOC-P1-002 - OpenAPI spec covers only 13% of API route files

- Severity: P1
- Confidence: High
- Area: API documentation
- Evidence:
  - `docs/openapi.yaml`: 393 lines, 7 path groups (auth, tickets, projects, documents, organizations, public, health)
  - `apps/api/src/routes/`: 54 route files
  - Missing from spec: admin, ai, analytics, api-keys, approvals, assets, batch, billing, bulk, business-os, client-onboarding-command-center, dashboard, dmarc-coach, domain-monitors, dynamic-client-forms-builder, edu-automation, field-services, file-requests, final, findings, governance, insurance-binder, license-optimizer, memberships, notification-preferences, notifications, profiles, proposals, qbr, roles, satisfaction-pulse-widget, search, search-portal, security-ops, security-suite, service-catalog, sla, status-page, store, training-hub, uptime-monitor, users, vendors, webhook-management, webhooks
- What is happening: The OpenAPI spec was written for the original 7 core modules and never updated as 47 new route files were added.
- Why it matters: API consumers (internal devs, SDK, third-party integrations) have no contract documentation for 87% of endpoints. Swagger UI at `/api/v1/docs` is misleadingly incomplete.
- User/business impact: Any external API consumer or new developer cannot discover extended functionality without reading source code.
- Security/privacy/reliability impact: Undocumented endpoints may have unexpected behavior; no contract testing is possible.
- Recommended fix: Either auto-generate OpenAPI spec from Zod schemas and Express route definitions, or manually expand the YAML to cover all 54 route groups. Prioritize public-facing and frequently-used endpoints.
- Suggested validation: Write a test that asserts every route file in `apps/api/src/routes/` has a corresponding `paths:` entry in the OpenAPI spec.
- Owner suggestion: API team lead
- Effort estimate: 2-5 days for full manual expansion; 1-2 days for auto-generation tooling
- Dependencies: Route definitions must expose their schemas
- Status: Open

### Finding ID: DOC-P1-003 - Web package has no environment variable validation

- Severity: P1
- Confidence: High
- Area: Configuration / Developer experience
- Evidence:
  - `apps/web/.env.example`: 7 variables (NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SENTRY_DSN, SENTRY_ORG, SENTRY_PROJECT, NEXT_PUBLIC_GA_ID, NEXT_PUBLIC_TAWKTO_ID, NEXT_PUBLIC_TURNSTILE_SITE_KEY)
  - No Zod schema or env validation in `apps/web/` (grep confirmed: zero matches for "zod|envSchema|parseEnv|getEnv")
  - API has Zod schema at `apps/api/src/config/env.ts` (24 fields)
  - Worker has Zod schema at `apps/worker/src/env.ts` (20 fields)
- What is happening: Unlike API and Worker which validate env vars at startup via Zod, Web relies on Next.js build-time inlining of NEXT_PUBLIC_ vars with no runtime validation.
- Why it matters: A missing NEXT_PUBLIC_API_URL at build time would cause all API calls to fail silently or go to an incorrect URL. Missing GA/Tawk.to IDs would silently break analytics.
- User/business impact: Production builds with misconfigured env vars would deploy but fail at runtime with no clear error.
- Security/privacy/reliability impact: No data exposure but reliability risk — failed deploys without clear error messages.
- Recommended fix: Create `apps/web/src/config/env.ts` with Zod schema; validate at build time in next.config.mjs or in a pre-build script; add `NEXT_PUBLIC_API_URL` as required (not optional).
- Suggested validation: Add build-time test that fails when NEXT_PUBLIC_API_URL is missing.
- Owner suggestion: Web team lead
- Effort estimate: 1 hour
- Dependencies: None
- Status: Open

### Finding ID: DOC-P1-004 - Committed .env/.env.local files pose secret leakage risk

- Severity: P1
- Confidence: Medium
- Area: Security / Repository hygiene
- Evidence:
  - `apps/api/.env`: present in working tree
  - `apps/api/.env.local`: present in working tree
  - `apps/web/.env.local`: present in working tree
  - `apps/worker/.env.local`: present in working tree
  - `.gitignore`: contains `.env`, `.env.*`, `!.env.example`, `!.env.*.example`
- What is happening: Environment files that should be ignored by git exist in the working tree. They may contain real Supabase URLs, API keys, JWT secrets, Stripe keys.
- Why it matters: If these files are tracked by git (force-added before .gitignore was updated), pushing would expose production credentials to the repository.
- User/business impact: Potential full credential compromise if these files are pushed to a public or shared repository.
- Security/privacy/reliability impact: Could expose SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, JWT_SECRET, SMTP credentials, JSM_API_TOKEN, and other sensitive values.
- Recommended fix: Run `git ls-files apps/*/.env*` to check if tracked; if tracked, remove from git history; add explicit `.env.local` to .gitignore; add pre-commit hook that blocks staging of .env files.
- Suggested validation: CI step that scans for .env files in repo and fails if any non-example env files exist.
- Owner suggestion: Security / DevOps
- Effort estimate: 30 min
- Dependencies: None
- Status: Open

### Finding ID: DOC-P2-001 - docs/INDEX.md has dead links and 35+ missing entries

- Severity: P2
- Confidence: High
- Area: Documentation
- Evidence:
  - `docs/INDEX.md` lines 36-37: references `archive/stale-docs/ANALYSIS_SUMMARY.md` and `archive/stale-docs/CODEBASE_MAPPING.md` — directory does not exist
  - `docs/INDEX.md` lines 53, 63: references `archive/stale-docs/DEPLOYMENT_PLAN_TERRAFORM_VERCEL.md` and `archive/stale-docs/README_WORKFLOWS_AND_ENVIRONMENTS.md` — directory does not exist
  - `docs/modules/` contains 72 files; INDEX lists only 37 (18 "New" + 19 "Core")
  - Missing from INDEX: `docs/adr/`, `docs/arch/`, `docs/audits/`, `docs/runbooks/`, `docs/seo/`, `docs/technical-writing/`, `docs/developer-guide/`, `docs/features/`, `docs/migrations/`, `docs/portal_platform_formal_handoff_bundle/`
- What is happening: The INDEX was updated for the July 2026 module expansion but only partially — the "New Module Docs" section lists 18 but directory has grown to 72. Dead archive links were never cleaned up after the archive deletion.
- Why it matters: New developers rely on INDEX.md as their primary navigation; dead links and missing entries waste time and erode trust.
- User/business impact: Slower onboarding; developers unaware of existing documentation.
- Security/privacy/reliability impact: None
- Recommended fix: Remove all archive/stale-docs/ references; add all subdirectories to INDEX; list all 72 module docs; add CI link checker.
- Suggested validation: Run markdown-link-check on INDEX.md in CI.
- Owner suggestion: Documentation maintainer
- Effort estimate: 1 hour
- Dependencies: None
- Status: Open

### Finding ID: DOC-P2-002 - Worker .env.example lists 9 variables not in its Zod schema

- Severity: P2
- Confidence: High
- Area: Environment configuration
- Evidence:
  - `apps/worker/.env.example`: 28 environment variables
  - `apps/worker/src/env.ts`: 20 fields in Zod schema
  - Not in schema: JSM_BASE_URL, M365_TENANT_ID, M365_CLIENT_ID, M365_CLIENT_SECRET, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
- What is happening: The .env.example template includes aspirational variables for planned features (JSM integration, M365 calendar sync, email sending) that are not yet implemented or validated in the worker's env schema. A developer setting these vars per the example would have no effect.
- Why it matters: Wasted developer time configuring non-functional variables; confusion about which variables are actually required for the worker to operate.
- User/business impact: Developer frustration during local setup.
- Security/privacy/reliability impact: None (these vars are read but silently unused).
- Recommended fix: Either add these vars to the Zod schema (if they're used by worker tasks) or remove from .env.example and add comment: `# Planned — not yet active`. Also consider adding a script that validates .env.example matches schema.
- Suggested validation: Test that every var in .env.example maps to a Zod schema field in env.ts.
- Owner suggestion: Worker team
- Effort estimate: 15 min
- Dependencies: Confirm which vars are actually consumed by worker task handlers
- Status: Open

### Finding ID: DOC-P2-003 - No troubleshooting document exists

- Severity: P2
- Confidence: High
- Area: Operator readiness
- Evidence:
  - No TROUBLESHOOTING.md found in docs/ or root
  - grep for "troubleshoot" in docs/ returned no dedicated file
- What is happening: The repository has extensive documentation for setup, architecture, deployment, and operations but no single troubleshooting reference.
- Why it matters: Operators encountering common issues (Caddy TLS failures, Redis connection errors, Supabase auth issues, Docker OOM kills, GHCR pull failures) must search through AGENTS.md and commit history instead of a structured guide.
- User/business impact: Longer MTTR (Mean Time To Recovery) for production incidents.
- Security/privacy/reliability impact: Slower incident response.
- Recommended fix: Create `docs/TROUBLESHOOTING.md` with common issues organized by service: API startup failures, Web build errors, Worker connection issues, Docker problems, Supabase migration errors, Caddy TLS issues, Redis connectivity.
- Suggested validation: Include at least one troubleshooting entry per service (api, web, worker, docker, caddy, redis, supabase).
- Owner suggestion: DevOps / SRE
- Effort estimate: 2 hours
- Dependencies: Collect known issues from commit history and AGENTS.md
- Status: Open

### Finding ID: DOC-P2-004 - No incident response runbook

- Severity: P2
- Confidence: High
- Area: Operator readiness
- Evidence:
  - No incident-response.md or security-incident.md found in docs/
  - SECRETS_ROTATION.md covers credential rotation but not incident response workflow
  - ROLLBACK_PROCEDURES.md covers technical rollback but not incident communication
- What is happening: The repository documents how to recover technically (rollback, rotate secrets) but not how to respond to incidents: who to notify, communication templates, escalation paths, post-mortem process.
- Why it matters: During a real security incident or outage, operators need a checklist, not a reference manual. Without one, critical steps (customer notification, evidence preservation, regulatory reporting) may be missed.
- User/business impact: Regulatory non-compliance; extended outage communication gaps.
- Security/privacy/reliability impact: Potential GDPR/CCPA notification timing violations.
- Recommended fix: Create `docs/INCIDENT_RESPONSE.md` with: incident severity levels, escalation contacts, communication templates, forensic evidence preservation steps, post-mortem template.
- Suggested validation: Tabletop exercise using this runbook.
- Owner suggestion: Security / CTO
- Effort estimate: 3 hours
- Dependencies: Define escalation contacts and severity levels
- Status: Open

### Finding ID: DOC-P3-001 - AGENTS.md is oversized for AI context windows

- Severity: P3
- Confidence: High
- Area: Agent instructions
- Evidence:
  - `AGENTS.md`: 1329 lines
  - Contains: architecture, test patterns, Docker notes, CI/CD details, completed features list (100+ items), audit findings timeline, module inventory, documentation file listing
- What is happening: The AGENTS.md file has grown organically as a running log of all work done on the repository. At 1329 lines it consumes significant context window space for every AI agent session.
- Why it matters: AI agents reading this file may miss critical instructions buried in the middle; large context consumption reduces available space for actual code analysis.
- User/business impact: Slower AI agent responses; potential for agents to miss key constraints.
- Security/privacy/reliability impact: None
- Recommended fix: Split into: AGENTS.md (core context ~200 lines: architecture, test commands, security model, key decisions) + separate files for audit history, feature inventory, completed work log. Reference extension files from AGENTS.md.
- Suggested validation: AGENTS.md should be under 300 lines.
- Owner suggestion: Principal engineer
- Effort estimate: 1 hour
- Dependencies: None
- Status: Open

### Finding ID: DOC-P3-002 - No CONTRIBUTING.md or PR template

- Severity: P3
- Confidence: High
- Area: Developer experience
- Evidence:
  - No CONTRIBUTING.md found in repo root or docs/
  - No `.github/PULL_REQUEST_TEMPLATE.md`
  - AGENTS.md contains test patterns and conventions but no structured contribution guide
- What is happening: Developers must infer contribution workflow from AGENTS.md and CI/CD workflows rather than a structured guide.
- Why it matters: New contributors may submit PRs that don't follow conventions, don't include tests, or don't reference issues.
- User/business impact: Slower PR review cycles; inconsistent PR quality.
- Security/privacy/reliability impact: None
- Recommended fix: Create `CONTRIBUTING.md` with: branch naming, commit message format, PR checklist (tests, lint, typecheck), review expectations. Create `.github/PULL_REQUEST_TEMPLATE.md` with checklist.
- Suggested validation: PR template appears automatically on new PRs.
- Owner suggestion: Team lead
- Effort estimate: 30 min
- Dependencies: None
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| ---- | -------- | ---------- | ------ | -------- | ---------- |
| AI agents make incorrect decisions based on stale AGENTS.md | High | High | Medium | Test counts off by 2x; E2E spec count off by 2x | Update AGENTS.md with CI-verified counts |
| .env files pushed to remote | High | Low | Critical | .env files in working tree | Remove files; add pre-commit hook |
| Undocumented API routes cause integration failures | Medium | Medium | Medium | 47/54 routes missing from OpenAPI | Expand OpenAPI spec |
| Missing web env validation causes silent production failures | Medium | Low | High | No Zod schema in web | Add env validation |
| Developers waste time on dead docs links | Low | High | Low | archive/stale-docs/ doesn't exist | Clean up INDEX.md |
| Slow incident response due to missing runbook | Medium | Medium | High | No incident-response.md | Create incident runbook |
| Worker developers configure unused env vars | Low | Medium | Low | 9 extra vars in .env.example vs schema | Align .env.example with schema |

## Recommendations

### Immediate / Release Blocking

1. **Update AGENTS.md test counts** — Run full test suite, capture actual counts, update all three locations. Add CI verification.
2. **Audit .env files** — Check if `apps/*/.env*` files are git-tracked. If so, remove from history.
3. **Add web env validation** — Create Zod schema for web package; fail build on missing NEXT_PUBLIC_API_URL.

### This Week

4. **Fix docs/INDEX.md dead links and missing entries** — Remove archive/ references; add all subdirectories and modules.
5. **Align Worker .env.example with schema** — Remove or comment-out unused vars.
6. **Expand OpenAPI spec** — Prioritize high-traffic endpoints (users, notifications, billing, roles, webhooks).
7. **Create TROUBLESHOOTING.md** — Document common issues organized by service.

### This Month

8. **Create incident response runbook** — Define severity levels, escalation, communication templates.
9. **Create CONTRIBUTING.md and PR template** — Standardize contribution workflow.
10. **Split AGENTS.md** — Extract audit history, feature inventory, completed work log to extension files.
11. **Add CI link checker** — Validate all relative links in docs/INDEX.md.
12. **Create release process doc** — Document versioning, changelog generation, release checklist.

### Later / Platform Evolution

13. **Auto-generate OpenAPI from route definitions** — Eliminate manual spec drift.
14. **Auto-verify docs vs code** — CI step that compares AGENTS.md claims against actual file counts, route counts, test counts.
15. **Create test strategy document** — Formalize testing pyramid, coverage expectations, mocking standards.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --------- | ------------ | --------------------- | ---------- |
| Update AGENTS.md test counts | Every AI agent gets correct info | AGENTS.md | `pnpm test` output |
| Remove archive/stale-docs/ from INDEX | No more dead links | docs/INDEX.md | Click all links |
| Add .env.local to .gitignore | Block future secret leaks | .gitignore | Try to stage .env.local |
| Comment unused vars in Worker .env.example | Reduce developer confusion | apps/worker/.env.example | Visual review |
| Add web env Zod schema | Prevent silent production failures | apps/web/src/config/env.ts (new) | Build fails without API_URL |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| ------------ | -------- | ---------------- | ------ | ---------- |
| AGENTS.md CI verification | P1 | DevOps | 1h | Test suite must run in CI |
| OpenAPI auto-generation | P1 | API team | 3d | Route schema extraction |
| .env file audit and cleanup | P1 | DevOps | 1h | Git history access |
| docs link checker CI | P2 | DevOps | 30m | None |
| Web env validation | P1 | Web team | 1h | None |
| Incident response runbook | P2 | Security | 3h | Escalation contacts defined |
| TROUBLESHOOTING.md | P2 | DevOps | 2h | Collect known issues |
| CONTRIBUTING.md | P3 | Team lead | 30m | None |
| AGENTS.md split | P3 | Principal | 1h | None |
| Release process doc | P3 | DevOps | 1h | CI/CD workflow knowledge |

## Suggested Tests

1. **Unit test**: Verify AGENTS.md test counts match `pnpm test --json` output
2. **Unit test**: Verify every file in `apps/api/src/routes/` has a corresponding path in `docs/openapi.yaml`
3. **Unit test**: Verify every var in `apps/worker/.env.example` has a corresponding field in `apps/worker/src/env.ts`
4. **Build test**: Web build fails when NEXT_PUBLIC_API_URL is missing
5. **CI test**: markdown-link-check on docs/INDEX.md (no dead links)
6. **CI test**: Pre-commit hook that blocks staging of .env files (non-.example)
7. **CI test**: Web Zod schema validation passes with .env.example values
8. **E2E test**: Swagger UI at /api/v1/docs loads and shows all expected endpoints

## Suggested Documentation Updates

1. **Create**: `docs/TROUBLESHOOTING.md` — Common issues by service
2. **Create**: `docs/INCIDENT_RESPONSE.md` — Severity levels, escalation, communication
3. **Create**: `CONTRIBUTING.md` — Branch naming, commit format, PR checklist
4. **Create**: `.github/PULL_REQUEST_TEMPLATE.md` — Standard PR checklist
5. **Create**: `apps/web/src/config/env.ts` — Zod schema for web env vars
6. **Update**: `AGENTS.md` — Fresh test counts, E2E spec count, API route count
7. **Update**: `docs/INDEX.md` — Remove dead links, add all subdirectories, list all 72 module docs
8. **Update**: `docs/openapi.yaml` — Expand to cover all 54 route groups
9. **Update**: `apps/worker/.env.example` — Comment out unused aspirational vars
10. **Update**: `docs/ENVIRONMENT_VARIABLES.md` — Add TURNSTILE vars, mark active vs planned
11. **Update**: `.gitignore` — Add explicit `.env.local` rule
12. **Split**: `AGENTS.md` into core context + extension files for history/inventory

## Open Questions

| Question | Why it matters | Evidence needed |
| -------- | -------------- | --------------- |
| Are .env files tracked by git? | Potential credential leak | `git ls-files apps/*/.env*` output |
| Do .env files contain real secrets? | Severity of credential leak | Content of .env files (redacted) |
| Is the "86 endpoints" claim in API_ENDPOINT_INVENTORY.md still accurate? | Another stale count | Count routes in all 54 route files |
| Are worker task handlers actually using JSM/M365/SMTP vars? | Determines if .env.example extras should be added to schema or removed | Check task handler imports |
| Is store catalog (apps/api/src/routes/store.ts) a production module or experimental? | Determines if it should be in OpenAPI spec and docs | Check if store has web pages and DB migrations |

## Appendix

### Test Count Reconciliation

| Source | Claim | Actual (it/test only) | Actual (incl. describe) | Delta |
| ------ | ----- | --------------------- | ----------------------- | ----- |
| AGENTS.md banner | "774 total (182+108+24+460)" | — | — | Pre-July-2026 |
| AGENTS.md test status | "1,530: API 583, SDK 223, Worker 24, Web 700" | 1259 (584+247+31+397) | ~1719 | -271 it/test; -106 describe-incl |
| AGENTS.md E2E | "26 spec files" | 56 spec files | 56 spec files | +30 spec files |
| AGENTS.md API routes | "44 API route files" | 54 route files | 54 route files | +10 route files |

### Documentation Directory Inventory

```
docs/
├── adr/           (7 ADRs — not in INDEX.md)
├── arch/evaluation/ (1 file — not in INDEX.md)
├── audits/dashboard/ (prior audit outputs — not in INDEX.md)
├── developer-guide/ (not in INDEX.md)
├── features/      (not in INDEX.md)
├── migrations/    (naming-guide.md — not in INDEX.md)
├── modules/       (72 files — INDEX lists only 37)
├── portal_platform_formal_handoff_bundle/ (in INDEX.md)
├── runbooks/      (1 file — not in INDEX.md)
├── seo/           (10 files — not in INDEX.md)
├── technical-writing/ (1 file — not in INDEX.md)
├── AGENTS.md      (1329 lines — stale counts)
├── openapi.yaml   (393 lines — 13% coverage)
└── INDEX.md       (108 lines — incomplete)
```

### Environment Variable Schema Comparison

| Var | API .env.example | API env.ts | Worker .env.example | Worker env.ts | Web .env.example | Web Zod |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| JSM_BASE_URL | — | — | ✓ | — | — | — |
| M365_TENANT_ID | — | — | ✓ | — | — | — |
| M365_CLIENT_ID | — | — | ✓ | — | — | — |
| M365_CLIENT_SECRET | — | — | ✓ | — | — | — |
| SMTP_HOST | ✓ | ✓ (optional) | ✓ | — | — | — |
| SMTP_PORT | ✓ | ✓ (optional) | ✓ | — | — | — |
| SMTP_USER | ✓ | ✓ (optional) | ✓ | — | — | — |
| SMTP_PASS | ✓ | ✓ (optional) | ✓ | — | — | — |
| EMAIL_FROM | ✓ | ✓ (optional) | ✓ | — | — | — |
| API_BASE_URL | — | — | ✓ | ✓ (optional) | — | — |
| NEXT_PUBLIC_API_URL | — | — | — | — | ✓ | — |
