# Documentation, Developer Experience, and Operator Readiness Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260730-0650-develop-62da92c
- Repository: mainecybertech-portal
- Branch: develop
- Commit SHA: 62da92c
- Generated at: 2026-07-30T06:50:00Z
- Auditor: principal-level repository auditor
- Area code: DOC
- Output path: docs/audits/repo-deep-dive/20260730-0650-develop-62da92c/16_documentation_devex_operator_readiness.md
- Scope limitations: AI agent instructions (AGENTS.md) reviewed but not exhaustively tested against every module. Prompt packs inventoried but content not re-audited. Scripts directory listed but each script's documentation not verified individually.

## Scope

Reviewed every documentation file in `docs/`, root-level developer files (README*, AGENTS.md, CONTRIBUTING.md, SECURITY.md), `.env.example` files for all 3 apps, GitHub workflow files, scripts directory, ADRs, module docs, technical-writing docs, and checked for presence/absence of common developer experience artifacts (issue templates, PR templates, CODEOWNERS, troubleshooting guides, known limitations).

Not reviewed: individual module docs for content accuracy against source code (72 files — sampled for existence/quality). OpenAPI spec sampled for coverage breadth but not validated against actual routes.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |
| `README.md` (root) | Developer doc | First impression for new contributors | 352 lines, project overview, badges, quick links |
| `README.dev.md` (root) | Developer doc | Primary setup guide | 586 lines, covers branches, tools, VS Code, PR workflow, env setup, local dev |
| `AGENTS.md` (root) | AI agent instructions | Tells AI agents the full repo context | ~100KB, exhaustive — architecture, test patterns, CI/CD, security, history |
| `CONTRIBUTING.md` (root) | Developer doc | Contribution workflow | 41 lines — minimal, no PR checklist, no style guide |
| `SECURITY.md` (root) | Security doc | Vulnerability reporting | 29 lines — bare minimum, basic reporting instructions |
| `docs/INDEX.md` | Doc index | Entry point for all docs | 108 lines, categorized table, good cross-references |
| `docs/ENVIRONMENT_VARIABLES.md` | Reference doc | All env vars across services | 207 lines, comprehensive, per-service tables |
| `docs/API_ENDPOINT_INVENTORY.md` | Reference doc | All API routes | 364 lines, 95 endpoints, auth/Zod/cache/audit per route |
| `docs/ROLLBACK_PROCEDURES.md` | Ops doc | Rollback instructions | 185 lines, Docker/Supabase/Terraform rollback procedures |
| `docs/SECRETS_ROTATION.md` | Ops doc | Secrets rotation policy | 199 lines, 40 secrets, rotation procedures per service |
| `docs/JWT_ROTATION.md` | Ops doc | JWT rotation | 85 lines, multi-secret rotation, procedures |
| `docs/MONITORING_AND_ALERTING.md` | Ops doc | Monitoring strategy | 272 lines, logging, health checks, Sentry, alerting, incident checklist |
| `docs/CODE_REVIEW_2026-06-16.md` | Audit doc | Architecture review | ~1500 lines, 30 findings, risk register |
| `docs/adr/README.md` | ADR doc | Architecture decisions | 7 ADRs (DO migration, BullMQ, PKCE, cache, Supabase, SDK, Turborepo) |
| `docs/ONBOARDING.md` | Developer doc | New dev onboarding | 334 lines, comprehensive |
| `docs/VSCODE_GIT_QUICKSTART.md` | Developer doc | VS Code git workflow | 27 lines — basic |
| `docs/LOCAL_DEVELOPMENT_CHECKLIST.md` | Developer doc | Setup checklist | 14 lines — minimal checklist |
| `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md` | Ops doc | Operator manual | 260 lines, env mapping, deploy workflow, gates, monitoring |
| `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md` | Ops doc | Secrets/variables reference | 93 lines, environment-scoped |
| `docs/SUPABASE_MIGRATION_WORKFLOW.md` | Developer doc | Migration guide | 405 lines, detailed workflow |
| `docs/SUPABASE_MIGRATION_CHEATSHEET.md` | Developer doc | Migration quick reference | 167 lines, one-page reference |
| `docs/API_ERROR_HANDLING.md` | Developer doc | Error handling standards | 320 lines, response format, codes, Zod patterns |
| `docs/ARCHITECTURE_DIAGRAM.md` | Developer doc | System architecture | 151 lines, Mermaid diagram |
| `docs/openapi.yaml` | API spec | OpenAPI specification | 393 lines, 12 endpoint groups with schemas |
| `apps/api/.env.example` | Config example | API env template | 28 vars, all documented in ENVIRONMENT_VARIABLES.md |
| `apps/web/.env.example` | Config example | Web env template | 7 vars, matches docs |
| `apps/worker/.env.example` | Config example | Worker env template | 28 vars, matches docs |
| `.github/workflows/` (12 files) | CI/CD config | Deployment workflows | test, lint, typecheck, e2e, validate, deploy-do, terraform-do, supabase-migrations, build-push, chromatic, db-backup, dependency-review |
| `docs/modules/` (72 files) | Module docs | Per-module documentation | Each module has API routes, admin page, portal page, tests documented |
| `CONTRIBUTING.md` | Dev doc | Contribution rules | 41 lines — basic, no PR template checklist |
| `SECURITY.md` | Security doc | Reporting policy | 29 lines — minimal, no PGP key, no disclosure timeline |
| `.github/ISSUE_TEMPLATE/` | Issue templates | Absent | **Does not exist** |
| `.github/PULL_REQUEST_TEMPLATE/` | PR template | Absent | **Does not exist** |
| `CODEOWNERS` | Ownership | Absent | **Does not exist** |
| `TROUBLESHOOTING.md` | Troubleshooting | Absent | **Does not exist** (referenced in README.dev.md line 583 as `docs/API_ERROR_HANDLING.md` but not as dedicated troubleshooting) |
| `KNOWN_LIMITATIONS.md` | Known limitations | Absent | **Does not exist** |
| `SUPPORT.md` | Support | Absent | **Does not exist** |
| `CODE_OF_CONDUCT.md` | Conduct | Absent | **Does not exist** |
| `scripts/` (20 entries) | Scripts | Automation scripts | Mixture of PS1 and SH. `dev-setup.sh` exists; `dev-start.sh` and `dev-stop.sh` referenced in README.dev.md do NOT exist |

## Executive Summary

The MCT Portal codebase has **exceptional breadth and depth of documentation** — 48+ top-level files in `docs/`, 72 module-specific docs, ADRs, an OpenAPI spec, Mermaid architecture diagrams, comprehensive ops handbooks (rollback, secrets rotation, monitoring), and a 100KB AGENTS.md that serves as the canonical AI agent onboarding file. This is in the top tier of documentation maturity for a monorepo of this size.

**Strengths:**
- AGENTS.md is an outstanding AI agent instruction file — architecture, test patterns, CI/CD, security, history, all in one place.
- Environment variables are fully documented per-service with tables, defaults, and descriptions.
- All 95+ API endpoints are inventoried with auth requirements, Zod schemas, cache behavior, and audit events.
- Ops readiness docs (rollback, secrets rotation, JWT rotation, monitoring/alerting) are detailed and actionable.
- ADR format established with 7 decisions.
- Every module (60+) has a feature doc in `docs/modules/`.
- OpenAPI spec exists (393 lines, 12 endpoint groups).
- Scripts directory has both PowerShell and bash versions of core automation.
- Root docs (README.md, README.dev.md) cover project overview, setup, local dev, CI/CD, and deployment flow.

**Risks / Gaps:**
1. **No issue or PR templates** — every new issue/PR starts from scratch with no structured format.
2. **No CODEOWNERS file** — no automatic review assignment, risk of unowned code paths.
3. **No dedicated troubleshooting or known-limitations doc** — operators and devs must search across multiple docs.
4. **CONTRIBUTING.md is very brief** (41 lines) — no PR checklist, no style guide, no commit message conventions.
5. **SECURITY.md is bare minimum** (29 lines) — no PGP key, no disclosure timeline, no bounty info.
6. **No SUPPORT.md or CODE_OF_CONDUCT.md** — missing standard community files.
7. **`docs/developer-guide/` directory exists but is empty** — suggests incomplete migration of developer docs.
8. **OpenAPI spec covers only 12 of ~50+ route files** — significant gap for client generation.
9. **Scripts `dev-start.sh` and `dev-stop.sh` referenced in README.dev.md don't exist** — stale references.
10. **No dedicated runbook for common operational failure modes** (incident response is a checklist in MONITORING_AND_ALERTING.md but not a standalone doc).
11. **Some audit docs are extremely large** (CODE_REVIEW, FULL_SYSTEM_AUDIT, GAP_ANALYSIS) — could benefit from summarization with pointers to code.
12. **Module docs (72 files) may be stale** — not verified against actual route implementations in this audit.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
| ---- | ------------- | ------- | ------------- | ---- | ----- |
| README | `README.md` | Project overview, badges, quick start | Implemented | Low | 352 lines, clear, with badges |
| README.dev | `README.dev.md` | Developer setup guide | Implemented | Medium | 586 lines, but references non-existent scripts (dev-start.sh, dev-stop.sh) |
| AGENTS.md | `AGENTS.md` | AI agent context | Implemented | Low | ~100KB, exceptional — best practice |
| CONTRIBUTING.md | `CONTRIBUTING.md` | Contribution rules | Partially implemented | Medium | 41 lines — too brief, no PR checklist, no style guide |
| SECURITY.md | `SECURITY.md` | Security reporting | Partially implemented | Medium | 29 lines — no PGP, no disclosure timeline |
| Env docs | `docs/ENVIRONMENT_VARIABLES.md` | Env var reference | Implemented | Low | 207 lines, comprehensive |
| API inventory | `docs/API_ENDPOINT_INVENTORY.md` | API route reference | Implemented | Low | 364 lines, thorough |
| Rollback procedures | `docs/ROLLBACK_PROCEDURES.md` | Ops rollback | Implemented | Low | 185 lines, detailed |
| Secrets rotation | `docs/SECRETS_ROTATION.md` | Rotation policy | Implemented | Low | 199 lines, 40 secrets |
| JWT rotation | `docs/JWT_ROTATION.md` | JWT rotation | Implemented | Low | 85 lines, clear procedure |
| Monitoring | `docs/MONITORING_AND_ALERTING.md` | Monitoring strategy | Implemented | Low | 272 lines, includes incident checklist |
| ADRs | `docs/adr/README.md` | Architecture decisions | Implemented | Low | 7 ADRs, standard format |
| Onboarding | `docs/ONBOARDING.md` | New dev onboarding | Implemented | Low | 334 lines, comprehensive |
| Migration workflow | `docs/SUPABASE_MIGRATION_WORKFLOW.md` | DB migration guide | Implemented | Low | 405 lines, thorough |
| Migration cheatsheet | `docs/SUPABASE_MIGRATION_CHEATSHEET.md` | Quick reference | Implemented | Low | 167 lines, good |
| Error handling | `docs/API_ERROR_HANDLING.md` | Error patterns | Implemented | Low | 320 lines, well-structured |
| Architecture diagram | `docs/ARCHITECTURE_DIAGRAM.md` | System diagram | Implemented | Low | 151 lines Mermaid |
| OpenAPI spec | `docs/openapi.yaml` | API specification | Partially implemented | Medium | 393 lines but only 12 of ~50 route files |
| Deploy ops handbook | `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md` | Operator manual | Implemented | Low | 260 lines, covers full deploy flow |
| Secrets matrix | `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md` | Secrets/vars ref | Implemented | Low | 93 lines, thorough |
| Module docs | `docs/modules/*.md` (72 files) | Per-module docs | Implemented | Medium | Not verified against code for accuracy |
| Issue templates | `.github/ISSUE_TEMPLATE/` | Issue structure | Absent | Medium | No templates for bug/feature/security |
| PR template | `.github/PULL_REQUEST_TEMPLATE/` | PR structure | Absent | Medium | No PR template |
| CODEOWNERS | `CODEOWNERS` | Review assignment | Absent | Medium | No ownership definitions |
| Troubleshooting | `TROUBLESHOOTING.md` | Common issues | Absent | Medium | Referenced in README.dev.md but doesn't exist |
| Known limitations | `KNOWN_LIMITATIONS.md` | Known issues | Absent | Low | Not present |
| SUPPORT.md | `SUPPORT.md` | Support info | Absent | Low | Not present |
| CODE_OF_CONDUCT.md | `CODE_OF_CONDUCT.md` | Community norms | Absent | Low | Not present |
| .env.example files | `apps/*/.env.example` | Env templates | Implemented | Low | All 3 apps, well-maintained |
| Workflow docs | `.github/workflows/` (12 files) | CI/CD config | Implemented | Low | All critical workflows present |
| Scripts | `scripts/` (20 files) | Automation | Implemented | Medium | Mixed PS1/SH. dev-start.sh and dev-stop.sh referenced but absent |
| Developer guide dir | `docs/developer-guide/` | Dev docs | Empty | Medium | Directory exists with 0 files |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
| -------- | ----: | -------- | --- | ------------------ |
| README | 4/5 | `README.md` (352 lines) + `README.dev.md` (586 lines) + `AGENTS.md` (~100KB) | README.dev.md references non-existent scripts; AGENTS.md is very long | Fix stale script references; consider splitting AGENTS.md |
| Local setup | 5/5 | `README.dev.md` section, `docs/ONBOARDING.md` (334 lines), `docs/LOCAL_DEVELOPMENT_CHECKLIST.md`, multiple setup scripts | None significant | Maintain currency |
| Env docs | 5/5 | `docs/ENVIRONMENT_VARIABLES.md` (207 lines), 3 `.env.example` files, `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md` (93 lines) | None significant | Maintain currency |
| Architecture/API docs | 4/5 | `docs/API_ENDPOINT_INVENTORY.md` (364 lines, 95 endpoints), `docs/ARCHITECTURE_DIAGRAM.md` (Mermaid), `docs/adr/README.md` (7 ADRs), `docs/openapi.yaml` (393 lines) | OpenAPI only covers 12 of ~50 route files; ADRs stopped at May 2026 | Expand OpenAPI; add recent ADRs |
| DB/migration docs | 5/5 | `docs/SUPABASE_MIGRATION_WORKFLOW.md` (405 lines), `docs/SUPABASE_MIGRATION_CHEATSHEET.md` (167 lines), `docs/migrations/naming-guide.md` | None significant | Maintain currency |
| Testing docs | 4/5 | `AGENTS.md` test patterns section (detailed), `README.dev.md` test commands, `docs/CODE_REVIEW_2026-06-16.md` test assessment | No standalone testing guide; test patterns embedded in AGENTS.md | Extract testing patterns into a standalone doc |
| Deploy/rollback docs | 5/5 | `docs/ROLLBACK_PROCEDURES.md` (185 lines), `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md` (260 lines), `docs/MONITORING_AND_ALERTING.md` deploy verification section | None significant | Maintain currency |
| Incident/security docs | 3/5 | `docs/MONITORING_AND_ALERTING.md` incident checklist, `SECURITY.md` (29 lines), `docs/SECRETS_ROTATION.md` | No standalone incident response plan; SECURITY.md is minimal | Expand SECURITY.md; create incident response runbook |
| Contribution/coding standards | 2/5 | `CONTRIBUTING.md` (41 lines), `docs/API_ERROR_HANDLING.md` | No PR checklist; no style guide; no commit conventions; no CODEOWNERS | Rewrite CONTRIBUTING.md; create STYLE_GUIDE.md |
| PR/release process | 3/5 | `README.dev.md` promotion path, `.github/workflows/` (12 files), workflow descriptions in AGENTS.md | No PR template; no release notes process; no CHANGELOG | Add PR template; create release process doc |
| Operator manuals | 5/5 | `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md` (260 lines), `docs/MONITORING_AND_ALERTING.md` (272 lines), `docs/ROLLBACK_PROCEDURES.md` (185 lines), `docs/SECRETS_ROTATION.md` (199 lines) | None significant | Maintain currency |
| Troubleshooting | 1/5 | Incident checklist in MONITORING_AND_ALERTING.md; API_ERROR_HANDLING.md covers error patterns | No dedicated TROUBLESHOOTING.md; no known limitations doc; no common failure modes | Create TROUBLESHOOTING.md and KNOWN_LIMITATIONS.md |

**Overall domain score: 4.0/5** — Production-hardened documentation with exceptional breadth. Gaps are in community/contribution artifacts (templates, CODEOWNERS) and standalone troubleshooting docs rather than core operational documentation.

## Detailed Review

### Item: README.md / README.dev.md

- Evidence: `README.md` (352 lines), `README.dev.md` (586 lines)
- What it does: Project overview, badges, quick reference (README.md). Full developer setup, branch model, env setup, VS Code workflow, local dev, CI/CD, promotion path (README.dev.md)
- How it appears to work: Well-structured, clear language, covers all major workflows
- Dependencies: References scripts at `scripts/dev-start.sh` and `scripts/dev-stop.sh` which do NOT exist
- Current controls: Both files exist, are well-maintained, and indexed in docs/INDEX.md
- Missing controls: No consistency check between documented scripts and actual scripts
- Risks: Stale references will confuse new developers
- Recommended improvement: Remove or create the missing scripts; audit README.dev.md for other stale references
- Suggested tests: `Test-Path` for all referenced scripts
- Suggested docs: README.dev.md cleanup pass

### Item: AGENTS.md

- Evidence: `AGENTS.md` (~100KB, >2600 lines)
- What it does: Comprehensive AI agent onboarding — architecture, test patterns, CI/CD, infra, env vars, key decisions, audit history, recommendations
- How it appears to work: Excellent — single source of truth for AI context
- Dependencies: Reflects codebase state at last edit; must be updated when architecture changes
- Current controls: Manually maintained; part of code review process
- Missing controls: No automated freshness check against code
- Risks: Can drift if not updated with significant architectural changes; very long file may exceed AI context windows
- Recommended improvement: Consider splitting into focused sub-files (AGENTS_ARCHITECTURE.md, AGENTS_TESTING.md, etc.) with a thin AGENTS.md index
- Suggested tests: N/A
- Suggested docs: AGENTS.md remains; add companion files

### Item: ENVIRONMENT_VARIABLES.md

- Evidence: `docs/ENVIRONMENT_VARIABLES.md` (207 lines)
- What it does: Documents all env vars for all 3 services + E2E tests
- How it appears to work: Excellent — per-service tables with Required, Default, Description columns
- Dependencies: Must be updated when env schemas change
- Current controls: Cross-referenced in AGENTS.md, README.dev.md, and .env.example files
- Missing controls: No automated schema-to-doc validation
- Risks: Low — well-maintained historically
- Recommended improvement: Add a CI check that validates ENVIRONMENT_VARIABLES.md matches Zod env schemas
- Suggested tests: Compare ENVIRONMENT_VARIABLES.md against `apps/api/src/config/env.ts`, `apps/worker/src/env.ts`, and `apps/web/.env.example`
- Suggested docs: None needed

### Item: API Endpoint Inventory

- Evidence: `docs/API_ENDPOINT_INVENTORY.md` (364 lines)
- What it does: Documents all 95 endpoints with method, auth, Zod schema, cache, audit event
- How it appears to work: Excellent — comprehensive, structured tables by route group
- Dependencies: Must be updated when routes change; currently self-reported as accurate
- Current controls: Manually maintained
- Missing controls: No automated route-to-doc validation
- Risks: Can drift from actual routes; already notes some routes as "inferred from patterns"
- Recommended improvement: Add CI check that counts routes vs documented endpoints
- Suggested tests: Compare route registrations in `apps/api/src/routes/*.ts` against inventory
- Suggested docs: None needed

### Item: Issue and PR Templates

- Evidence: `.github/ISSUE_TEMPLATE/` — does not exist; `.github/PULL_REQUEST_TEMPLATE/` — does not exist
- What it does: Would structure bug reports, feature requests, and pull requests
- How it appears to work: Not present — every issue/PR is ad-hoc
- Dependencies: None
- Current controls: None
- Missing controls: No templates for bugs, features, security, or PR descriptions
- Risks: Inconsistent issue reports; missing critical fields in bug reports
- Recommended improvement: Create `bug_report.md`, `feature_request.md`, and `pull_request_template.md`
- Suggested tests: Verify templates render correctly on new issue/PR creation
- Suggested docs: Add to docs/INDEX.md

### Item: CODEOWNERS

- Evidence: `CODEOWNERS` — does not exist
- What it does: Defines automatic review assignments per path pattern
- How it appears to work: Not present
- Dependencies: GitHub repository settings
- Current controls: None
- Missing controls: No automatic reviewer assignment for apps/api, apps/web, apps/worker, infra, docs
- Risks: PRs may go unreviewed; no ownership clarity for code paths
- Recommended improvement: Create `CODEOWNERS` with path-based ownership
- Suggested tests: Verify GitHub loads CODEOWNERS correctly
- Suggested docs: Add to repo root

### Item: Troubleshooting and Known Limitations

- Evidence: `TROUBLESHOOTING.md` — does not exist. `KNOWN_LIMITATIONS.md` — does not exist
- What it does: Would document common issues, error messages, and solutions
- How it appears to work: Not present
- Dependencies: None
- Current controls: Incidental troubleshooting in README.dev.md (4 sections) and MONITORING_AND_ALERTING.md incident checklist
- Missing controls: No central place for known issues, workarounds, or failure mode diagnosis
- Risks: Operators must search across multiple docs for solutions; new developers hit known stalls repeatedly
- Recommended improvement: Create TROUBLESHOOTING.md with sections per service; create KNOWN_LIMITATIONS.md from GAP_ANALYSIS.md findings
- Suggested tests: N/A
- Suggested docs: Both files

### Item: CONTRIBUTING.md

- Evidence: `CONTRIBUTING.md` (41 lines)
- What it does: Defines contribution workflow
- How it appears to work: Minimal — covers basic workflow, local validation commands, Supabase commands
- Dependencies: None
- Current controls: Exists with basic content
- Missing controls: No PR checklist, no commit message conventions, no style guide reference, no code review expectations, no test requirements
- Risks: Inconsistent PRs, unclear expectations for first-time contributors
- Recommended improvement: Expand to include PR checklist, commit message format (Conventional Commits), code style reference, test requirements, and review process
- Suggested tests: N/A
- Suggested docs: Rewrite CONTRIBUTING.md

### Item: OpenAPI Spec

- Evidence: `docs/openapi.yaml` (393 lines)
- What it does: OpenAPI 3.0.3 specification
- How it appears to work: Partial — covers 12 core endpoint groups but not the 40+ module route files or new module routes
- Dependencies: Must be regenerated when routes change
- Current controls: Manually maintained
- Missing controls: No generator or CI validation
- Risks: Significantly incomplete; cannot be used for client code generation for most routes
- Recommended improvement: Adopt a code-first OpenAPI generation approach (e.g., zod-to-openapi from Zod schemas) or document the gap explicitly
- Suggested tests: Validate openapi.yaml against a schema linter in CI
- Suggested docs: Note coverage gap in spec header

### Item: Scripts Documentation

- Evidence: `scripts/` (20 files)
- What it does: Automation scripts for local dev, Supabase sync, backup, testing
- How it appears to work: Well-populated directory with both PS1 and SH versions for most scripts
- Dependencies: README.dev.md references dev-start.sh and dev-stop.sh which don't exist
- Current controls: Script headers describe purpose
- Missing controls: No `scripts/README.md` explaining each script's purpose and usage
- Risks: Stale references in README.dev.md; no onboarding for script usage
- Recommended improvement: Create `scripts/README.md` listing all scripts with purpose and usage; remove stale references
- Suggested tests: Verify all scripts referenced in docs exist
- Suggested docs: `scripts/README.md`

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
| -- | ------------------ | -------- | --------------- | --- | -------- | -------------- |
| DOC-P2-001 | Standard issue templates | `.github/ISSUE_TEMPLATE/` absent | None | No templates for bug/feature/security | P2 Medium | Create bug_report.md, feature_request.md, security.md templates |
| DOC-P2-002 | PR template | `.github/PULL_REQUEST_TEMPLATE/` absent | None | No structured PR description | P2 Medium | Create pull_request_template.md with checklist |
| DOC-P3-001 | CODEOWNERS file | `CODEOWNERS` absent | None | No auto-review assignment | P3 Low | Create CODEOWNERS with path ownership |
| DOC-P2-003 | Troubleshooting guide | `TROUBLESHOOTING.md` absent | Scattered troubleshooting in README.dev.md | No central troubleshooting resource | P2 Medium | Create TROUBLESHOOTING.md |
| DOC-P3-002 | Known limitations | `KNOWN_LIMITATIONS.md` absent | GAP_ANALYSIS.md covers some | No explicit limitations doc | P3 Low | Extract from GAP_ANALYSIS.md |
| DOC-P3-003 | SUPPORT.md | `SUPPORT.md` absent | None | No support info for users | P3 Low | Create SUPPORT.md |
| DOC-P3-004 | CODE_OF_CONDUCT.md | `CODE_OF_CONDUCT.md` absent | None | Missing standard community file | P3 Low | Create CODE_OF_CONDUCT.md |
| DOC-P2-004 | CONTRIBUTING.md completeness | `CONTRIBUTING.md` (41 lines) | Basic workflow | Too brief; no PR checklist, style guide, commit conventions | P2 Medium | Expand CONTRIBUTING.md significantly |
| DOC-P2-005 | SECURITY.md completeness | `SECURITY.md` (29 lines) | Basic reporting | No PGP key, no disclosure timeline | P2 Medium | Expand with PGP key, disclosure timeline, bounty info |
| DOC-P2-006 | Stale script references | README.dev.md references dev-start.sh, dev-stop.sh | None | Referenced scripts don't exist | P2 Medium | Create or remove references |
| DOC-P2-007 | OpenAPI completeness | `docs/openapi.yaml` (393 lines) | Partial spec | Only 12 of ~50 route groups | P2 Medium | Expand or adopt code-first generation |
| DOC-P3-005 | Empty developer-guide dir | `docs/developer-guide/` (0 files) | Directory exists | Empty — confusing for developers | P3 Low | Populate or remove |
| DOC-P3-006 | No standalone testing guide | Test patterns embedded in AGENTS.md | Detailed patterns exist | No standalone testing doc | P3 Low | Extract to docs/TESTING.md |
| DOC-P2-008 | No incident response runbook | Incident checklist in MONITORING_AND_ALERTING.md | Good but embedded | No standalone runbook for on-call | P2 Medium | Extract to docs/INCIDENT_RESPONSE.md |
| DOC-P3-007 | ADRs stopped at May 2026 | `docs/adr/README.md` (7 ADRs) | Format established | 14 months without new ADRs | P3 Low | Add recent decisions as ADR-008+ |
| DOC-P3-008 | No CHANGELOG or release notes | No `CHANGELOG.md` | None | No release artifact history | P3 Low | Create CHANGELOG.md |

## Findings

### Finding ID: DOC-P2-001 - Missing issue and PR templates

- Severity: P2 Medium
- Confidence: High
- Area: Documentation / Developer Experience
- Evidence:
  - `.github/ISSUE_TEMPLATE/` — does not exist
  - `.github/PULL_REQUEST_TEMPLATE/` — does not exist
- What is happening: The repository has no GitHub issue or PR templates. Every bug report, feature request, and pull request starts from a blank markdown editor with no structure.
- Why it matters: Without templates, contributors may omit critical information (reproduction steps, environment, expected vs actual behavior, test evidence). This slows triage, increases back-and-forth, and leads to inconsistent quality in issues and PRs.
- User / business impact: Slower development velocity; harder to triage bugs; inconsistent PR descriptions make code review less efficient.
- Security / privacy / reliability impact: No security issue template means reporters may not know how to responsibly disclose.
- Recommended fix: Create `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/ISSUE_TEMPLATE/feature_request.md`, `.github/PULL_REQUEST_TEMPLATE/pull_request_template.md` with fields for description, motivation, test plan, and checklist.
- Suggested validation: Create a test issue/PR in a fork and verify the template renders.
- Owner suggestion: Project maintainer
- Effort estimate: Small (1-2 hours)
- Dependencies: None
- Status: Open

### Finding ID: DOC-P2-002 - CONTRIBUTING.md is too minimal

- Severity: P2 Medium
- Confidence: High
- Evidence:
  - `CONTRIBUTING.md` — 41 lines total
  - No PR checklist, no commit message convention, no style guide, no test requirements
- What is happening: The contributing guide provides only a basic 5-step workflow and Supabase validation commands. It lacks a PR checklist, commit message format (e.g., Conventional Commits), code style reference (ESLint/Prettier), test coverage expectations, and review process description.
- Why it matters: New contributors have no explicit guidance on what constitutes a good PR, leading to inconsistent submissions and longer review cycles.
- User / business impact: Higher friction for community contributions; maintainer time spent on format issues instead of logic.
- Security / privacy / reliability impact: None directly.
- Recommended fix: Rewrite CONTRIBUTING.md with sections for: PR checklist, commit message format, code style, test requirements, review process, and reference to relevant docs (STYLE_GUIDE.md, TESTING.md if created).
- Suggested validation: Have a new contributor attempt to submit a PR using the guide.
- Owner suggestion: Project maintainer
- Effort estimate: Small (2-4 hours)
- Dependencies: None
- Status: Open

### Finding ID: DOC-P2-003 - No troubleshooting guide or known limitations

- Severity: P2 Medium
- Confidence: High
- Evidence:
  - `TROUBLESHOOTING.md` — does not exist
  - `KNOWN_LIMITATIONS.md` — does not exist
  - README.dev.md has 4 troubleshooting notes (VS Code Git controls, branch behind, PR file count, PR review)
- What is happening: There is no centralized document for common operational or development issues. Troubleshooting notes are scattered across README.dev.md, MONITORING_AND_ALERTING.md (incident checklist), and various other docs.
- Why it matters: When something breaks, operators and developers waste time searching across multiple documents. Known limitations (e.g., no WebSocket, no caching, 30s polling) are not explicitly stated anywhere for new team members.
- User / business impact: Slower incident response; repeated questions about known limitations.
- Security / privacy / reliability impact: None directly.
- Recommended fix: Create TROUBLESHOOTING.md with sections per service (API, Web, Worker, Database, Docker) listing common errors, causes, and solutions. Create KNOWN_LIMITATIONS.md extracted from GAP_ANALYSIS.md.
- Suggested validation: Walk through 5 common failure scenarios and verify the doc provides a solution path.
- Owner suggestion: Project maintainer
- Effort estimate: Small (3-5 hours)
- Dependencies: None
- Status: Open

### Finding ID: DOC-P2-004 - SECURITY.md is bare minimum

- Severity: P2 Medium
- Confidence: High
- Evidence:
  - `SECURITY.md` — 29 lines
  - No PGP key for encrypted disclosure
  - No disclosure timeline or policy reference
  - No vulnerability bounty or recognition program
- What is happening: The security policy only says "report privately to maintainer" and lists sensitive areas. It lacks the standard elements expected in GitHub security policies: PGP key, disclosure timeline (e.g., 90 days), and vulnerability handling process.
- Why it matters: Security researchers and ethical hackers expect a clear disclosure process. Without a PGP key, reporters cannot securely send exploit details. Missing timeline means researchers don't know when to expect fixes.
- User / business impact: Potential for uncoordinated vulnerability disclosure; researchers may report publicly instead of privately if no clear process exists.
- Security / privacy / reliability impact: Medium — delayed or public vulnerability disclosure.
- Recommended fix: Add PGP key, disclosure timeline (90 days), vulnerability severity reference, and link to docs/SECRETS_ROTATION.md for incident response.
- Suggested validation: Review against GitHub's security policy best practices.
- Owner suggestion: Security lead
- Effort estimate: Small (1-2 hours)
- Dependencies: None
- Status: Open

### Finding ID: DOC-P2-005 - OpenAPI spec is significantly incomplete

- Severity: P2 Medium
- Confidence: High
- Evidence:
  - `docs/openapi.yaml` — 393 lines, covers 12 core endpoint groups
  - `docs/API_ENDPOINT_INVENTORY.md` — documents 95 endpoints across 50+ route files
- What is happening: The OpenAPI spec covers only approximately 12 of 50+ route files (auth, organizations, memberships, users, profiles, tickets, projects, documents, roles, notifications, public, billing). The 19 new modules (2026-07-26) and 40+ module route files are not represented.
- Why it matters: An incomplete OpenAPI spec cannot be used for client generation, API client validation, or documentation generation for the majority of the API surface.
- User / business impact: API consumers must read the endpoint inventory doc instead of using standard OpenAPI tooling.
- Security / privacy / reliability impact: None directly.
- Recommended fix: Two options: (1) Adopt code-first OpenAPI generation using Zod schemas (e.g., `zod-to-openapi` or `@asteasolutions/zod-to-openapi`) to auto-generate the spec; (2) Document the coverage gap explicitly in the openapi.yaml header and update docs/INDEX.md.
- Suggested validation: Run OpenAPI spec through a validator and verify all route files are represented.
- Owner suggestion: Senior engineer
- Effort estimate: Medium (1-2 weeks for full generation)
- Dependencies: Zod schemas already exist for all 27+ mutation endpoints
- Status: Open

### Finding ID: DOC-P3-001 - No CODEOWNERS file

- Severity: P3 Low
- Confidence: High
- Evidence:
  - `CODEOWNERS` — does not exist
- What is happening: There is no CODEOWNERS file to define automatic review assignments based on file path patterns.
- Why it matters: PRs modifying critical paths (apps/api, apps/worker, infra/terraform) may not get the right reviewers automatically.
- User / business impact: Slower review turnaround; potential for unreviewed changes in critical paths.
- Security / privacy / reliability impact: Low — but missing required reviews on sensitive paths is a risk.
- Recommended fix: Create `CODEOWNERS` with path-based ownership (e.g., `/apps/api/* @team-backend`, `/infra/terraform/* @team-infra`, `/docs/* @team-docs`).
- Suggested validation: Verify GitHub loads CODEOWNERS and displays ownership in PR UI.
- Owner suggestion: Project maintainer
- Effort estimate: Small (30 min)
- Dependencies: None
- Status: Open

### Finding ID: DOC-P3-002 - Stale script references in README.dev.md

- Severity: P3 Low
- Confidence: High
- Evidence:
  - `README.dev.md` lines 579-581: references `scripts/dev-start.sh`, `scripts/dev-stop.sh`
  - `scripts/` directory — contains `dev-setup.sh` but no `dev-start.sh` or `dev-stop.sh`
- What is happening: README.dev.md lists three scripts as "New Documentation (Added 2026-06-26)". Only `dev-setup.sh` exists.
- Why it matters: New developers following the guide will look for non-existent files.
- User / business impact: Frustration and lost trust in documentation accuracy.
- Security / privacy / reliability impact: None.
- Recommended fix: Create the missing scripts or remove the references. Audit README.dev.md for other stale references.
- Suggested validation: Walk through every file reference in README.dev.md and verify existence.
- Owner suggestion: Project maintainer
- Effort estimate: Trivial (30 min)
- Dependencies: None
- Status: Open

### Finding ID: DOC-P3-003 - Empty developer-guide directory

- Severity: P3 Low
- Confidence: High
- Evidence:
  - `docs/developer-guide/` — directory exists with 0 files
- What is happening: A directory was created for developer guides but never populated. The INDEX.md does not reference it.
- Why it matters: An empty directory suggests either incomplete work or a pattern that was started and abandoned, which can confuse developers.
- User / business impact: None significant.
- Security / privacy / reliability impact: None.
- Recommended fix: Either populate with at minimum a README.md redirecting to other docs, or remove the empty directory.
- Suggested validation: N/A
- Owner suggestion: Project maintainer
- Effort estimate: Trivial (5 min)
- Dependencies: None
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| ---- | -------- | ---------- | ------ | -------- | ---------- |
| OpenAPI spec drift from actual routes | P2 Medium | High | Medium | Spec covers 12/50+ route files; 19 new modules unrepresented | Adopt code-first OpenAPI generation from Zod schemas |
| Security vulnerability mishandling | P2 Medium | Low | High | SECURITY.md lacks PGP key, disclosure timeline, bounty info | Expand SECURITY.md with standard sections |
| Inconsistent contribution quality | P2 Medium | Medium | Medium | CONTRIBUTING.md is 41 lines with no PR checklist or style guide | Expand CONTRIBUTING.md with checklist, conventions |
| Developer confusion from stale docs | P3 Low | High | Low | README.dev.md references non-existent scripts; empty developer-guide dir | Audit and fix stale references |
| Unreviewed changes in critical paths | P3 Low | Low | High | No CODEOWNERS file for auto-review assignments | Create CODEOWNERS with path-based ownership |
| PR/issue triage inefficiency | P2 Medium | High | Low | No issue or PR templates; every submission is ad-hoc | Create bug_report, feature_request, PR templates |

## Recommendations

### Immediate / Release Blocking

None — all critical documentation gaps are already addressed by existing files.

### This Week

1. **Create issue and PR templates** — `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/ISSUE_TEMPLATE/feature_request.md`, `.github/PULL_REQUEST_TEMPLATE/pull_request_template.md`. Estimated: 2 hours.
2. **Fix stale script references in README.dev.md** — Create or remove references to `dev-start.sh` and `dev-stop.sh`. Estimated: 30 min.
3. **Remove or populate `docs/developer-guide/`** — Empty directory confuses devs. Estimated: 15 min.

### This Month

4. **Expand CONTRIBUTING.md** — Add PR checklist, commit message conventions, style guide reference, test requirements, review process. Estimated: 4 hours.
5. **Expand SECURITY.md** — Add PGP key, disclosure timeline (90 days), vulnerability severity reference, link to secrets rotation doc. Estimated: 2 hours.
6. **Create TROUBLESHOOTING.md** — Per-service sections with common issues, causes, and solutions. Estimated: 6 hours.
7. **Create KNOWN_LIMITATIONS.md** — Extract from GAP_ANALYSIS.md and AGENTS.md. Estimated: 2 hours.
8. **Create CODEOWNERS** — Path-based ownership for all major directories. Estimated: 1 hour.

### Later / Platform Evolution

9. **Adopt code-first OpenAPI generation** — Use `zod-to-openapi` from existing Zod schemas to auto-generate a complete spec. Estimated: 2 weeks.
10. **Add recent ADRs** — Document decisions made since May 2026 (nonce-based CSP, webhook idempotency, optimistic locking, worker main.ts split, DO migration follow-ups). Estimated: 4 hours.
11. **Extract standalone testing guide** — Move test patterns from AGENTS.md into `docs/TESTING.md`. Estimated: 3 hours.
12. **Create incident response runbook** — Extract incident checklist from MONITORING_AND_ALERTING.md into `docs/INCIDENT_RESPONSE.md`. Estimated: 3 hours.
13. **Add CI validation for doc accuracy** — Script that validates `ENVIRONMENT_VARIABLES.md` against Zod env schemas and counts routes in `API_ENDPOINT_INVENTORY.md` vs actual route registrations. Estimated: 1-2 days.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --------- | ------------ | --------------------- | ---------- |
| Remove or populate empty docs/developer-guide/ | Eliminates a confusing empty directory | `docs/developer-guide/` | `Get-ChildItem docs/developer-guide/` returns content or removed |
| Fix README.dev.md stale script refs | Prevents developer frustration | `README.dev.md` | Verify `dev-start.sh` exists or reference removed |
| Create CODEOWNERS file | Ensures proper review assignment | `CODEOWNERS` | GitHub displays CODEOWNERS in PR UI |
| Create basic PR template | Consistent PR descriptions | `.github/PULL_REQUEST_TEMPLATE/pull_request_template.md` | Template renders on new PR |
| Create basic bug report template | Standardized bug reports | `.github/ISSUE_TEMPLATE/bug_report.md` | Template renders on new issue |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| ------------ | -------- | ---------------- | ------ | ---------- |
| Code-first OpenAPI generation from Zod schemas | P2 Medium | Senior engineer | 2 weeks | None |
| CONTRIBUTING.md rewrite with checklist + conventions | P2 Medium | Project maintainer | 4 hours | None |
| SECURITY.md expansion with PGP + timeline | P2 Medium | Security lead | 2 hours | None |
| TROUBLESHOOTING.md creation | P2 Medium | Project maintainer | 6 hours | None |
| KNOWN_LIMITATIONS.md creation | P3 Low | Project maintainer | 2 hours | None |
| Standalone testing guide (extract from AGENTS.md) | P3 Low | Senior engineer | 3 hours | None |
| Incident response runbook | P3 Low | Ops lead | 3 hours | None |
| CI doc validation (env vars, routes) | P2 Medium | Senior engineer | 1-2 days | None |
| Recent ADRs (2026-05 through 2026-07) | P3 Low | Architect | 4 hours | None |
| CHANGELOG.md creation | P3 Low | Project maintainer | 1 hour | None |

## Suggested Tests

| Test type | Description | Validation |
| --------- | ----------- | ---------- |
| Doc reference integrity | Walk every file reference in README.dev.md and verify the target exists | No broken references |
| OpenAPI coverage | Count routes in openapi.yaml vs actual route files | Coverage > 50% |
| Env var doc accuracy | Parse ENVIRONMENT_VARIABLES.md table and compare against Zod env schemas | No missing or extra vars |
| Script existence | Verify all scripts referenced in docs exist | No stale references |
| Module doc accuracy | Spot-check 5 module docs against actual route implementations | Content matches code |
| AGENTS.md freshness | Verify key sections (test count, key decisions) match current state | No drift > 2 weeks |

## Suggested Documentation Updates

| Doc | Action | Reason |
| --- | ------ | ------ |
| `README.dev.md` | Fix stale script references (dev-start.sh, dev-stop.sh) | Currently references non-existent files |
| `CONTRIBUTING.md` | Rewrite with PR checklist, commit conventions, style guide ref, test requirements | Too minimal (41 lines) |
| `SECURITY.md` | Add PGP key, disclosure timeline, bounty info | Missing standard security policy elements |
| `TROUBLESHOOTING.md` | Create new file | Doesn't exist |
| `KNOWN_LIMITATIONS.md` | Create new file | Doesn't exist |
| `docs/INDEX.md` | Add new docs as created | Keep index current |
| `.github/ISSUE_TEMPLATE/bug_report.md` | Create new template | Missing |
| `.github/ISSUE_TEMPLATE/feature_request.md` | Create new template | Missing |
| `.github/PULL_REQUEST_TEMPLATE/pull_request_template.md` | Create new template | Missing |
| `CODEOWNERS` | Create new file | Missing |
| `docs/adr/README.md` | Add ADR-008+ for recent decisions | 14 months without new ADRs |
| `docs/TESTING.md` | Create standalone testing guide | Patterns currently embedded in AGENTS.md |
| `docs/INCIDENT_RESPONSE.md` | Create standalone runbook | Currently a section in MONITORING_AND_ALERTING.md |
| `CHANGELOG.md` | Create release notes file | Missing |

## Open Questions

| Question | Why it matters | Evidence needed |
| -------- | -------------- | --------------- |
| Are all 72 module docs accurate against current route implementations? | Module docs may be stale after refactoring | Cross-reference each module doc against route file |
| Why does docs/developer-guide/ exist empty? | Indicates incomplete work or abandoned pattern | Check git log for creation date and context |
| Are the GAP_ANALYSIS.md findings still accurate? | Many findings marked resolved; doc may be stale | Compare against AGENTS.md status columns |
| Is the OpenAPI spec maintainable manually? | Grows more obsolete with each new module | Evaluate code-first generation tooling |
| Do CONTRIBUTING.md's commands still work? | `pnpm typecheck` — is it a valid script? | Check root package.json scripts |

## Appendix

### Documentation count by category

| Category | Count |
| -------- | ----: |
| Root developer docs (README.md, README.dev.md, CONTRIBUTING.md, SECURITY.md, AGENTS.md) | 5 |
| Architecture / system design docs | 5 |
| Deployment / operations docs | 6 |
| Security / secrets docs | 3 |
| Developer guides (onboarding, setup, VS Code, migration) | 5 |
| API docs (endpoint inventory, error handling, rate limiting, versioning, OpenAPI) | 5 |
| Feature / integration docs (billing, Jira, JSM, branding, admin features, marketing) | 10 |
| Module docs (docs/modules/) | 72 |
| Audit / review docs | 5 |
| ADRs | 1 (7 decisions) |
| Index / map docs | 2 (INDEX.md, FINAL_OPERATOR_MAP.md) |
| Other | 4 (handoff bundle, deployment comparison, domain comparison, SEO) |
| **Total doc files** | **~120+** |

### Recommended new developer journey (current vs ideal)

**Current flow:**
1. README.md → badges + overview → "see README.dev.md"
2. README.dev.md → 586 lines covering everything from Git setup to production deploy
3. AGENTS.md → additional 100KB of context
4. docs/ONBOARDING.md → 334 lines of architecture + setup
5. CONTRIBUTING.md → 41 lines of process
6. Trial and error for troubleshooting

**Gaps:** No single "start here" entry point; README.dev.md is too broad. CONTRIBUTING.md is an afterthought.

**Ideal flow:**
1. `START_HERE.md` (new) → "Read this first: 3 paths" (developer, operator, AI agent)
2. README.md → project overview and links
3. README.dev.md → setup and local dev only (move deployment to ops handbook)
4. AGENTS.md → AI agent context (can remain as-is)
5. CONTRIBUTING.md → PR workflow with checklist
6. TROUBLESHOOTING.md → common issues

### Top-level file presence checklist

| File | Exists? | Location | Notes |
| ---- | ------- | -------- | ----- |
| README.md | Yes | Root | 352 lines, good |
| README.dev.md | Yes | Root | 586 lines, needs cleanup |
| AGENTS.md | Yes | Root | ~100KB, excellent |
| CONTRIBUTING.md | Yes | Root | 41 lines, needs expansion |
| SECURITY.md | Yes | Root | 29 lines, needs expansion |
| LICENSE | No | Root | Missing |
| CODE_OF_CONDUCT.md | No | Root | Missing |
| SUPPORT.md | No | Root | Missing |
| CHANGELOG.md | No | Root | Missing |
| TROUBLESHOOTING.md | No | Root | Missing |
| KNOWN_LIMITATIONS.md | No | Root | Missing |
| CODEOWNERS | No | Root | Missing |
| .github/ISSUE_TEMPLATE/ | No | .github | Missing |
| .github/PULL_REQUEST_TEMPLATE/ | No | .github | Missing |
