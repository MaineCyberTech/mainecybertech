# 16_documentation_devex_operator_readiness — Prompt 16 - Documentation, Developer Experience, and Operator Readiness Audit

- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Target: `mainecybertech` @ `6b7aa1a` (branch `main`)
- Domain: `16_documentation_devex_operator_readiness.md` (area DOC, prompt)

## Verification Performed

Domain subagent produced 25 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| DOC-P2-001 | P2 | Operations documentation contradicts the current pipeline and configuration |
| DOC-P2-002 | P2 | Rollback documentation is stale (Terraform push flow) and repeats the false approval claim |
| DOC-P2-003 | P2 | `docs/CI.md` documents the SBOM workflow as "Blocking" but it gates nothing |
| DOC-P2-004 | P2 | Incident-response and breach docs still describe the alerting dead-man's switch as undeployed and list closed gaps |
| DOC-P2-005 | P2 | docs/RELEASE_GATE.md is a stale status artifact contradicting the current verified-fixed register |
| DOC-P2-006 | P2 | Alert-delivery secrets (NTFY_ALERTS_*, ALERTMANAGER_*) are missing from the canonical secret docs, which still name Slack as the only channel |
| DOC-P2-007 | P2 | docs/GAP_ANALYSIS.md is an AWS-era historical draft presented as current |
| DOC-P2-008 | P2 | docs/technical-writing/migration-guide.md documents commands and a release process that do not exist |
| DOC-P3-001 | P3 | Dated point-in-time audit reports are mixed with current runbooks with no archive/staleness marker |
| DOC-P3-002 | P3 | `AGENTS.md` documents the worker consumer incorrectly and omits the queue backend divergence |
| DOC-P3-003 | P3 | Migration/workflow/OpenAPI counts drift in README.md, docs/ONBOARDING.md and the endpoint inventory, and the count guard does not cover them |
| DOC-P3-004 | P3 | docs/MONITORING_AND_ALERTING.md contradicts the now-wired metrics and the fail-closed /metrics gate |
| DOC-P3-005 | P3 | docs/TROUBLESHOOTING.md and docs/ONBOARDING.md name wrong deploy secrets/containers and stale memory limits |
| DOC-P3-006 | P3 | docs/audits/README.md index omits the committed repo-deep-dive runs and its naming contract does not match them |
| DOC-P3-007 | P3 | scripts/README.md omits 14 scripts, including every CI guard script |
| DOC-P3-008 | P3 | AGENTS.md production compose table omits the alertmanager service |
| DOC-P3-009 | P3 | Migration naming docs contradict each other and the repo's actual 5302xxx sequence |
| DOC-P2-009 | P2 | docs/audits/README.md omits the committed 905ed63 re-audit run, so the required Test check's docs-links guard fails at 7dd0402 |
| DOC-P3-010 | P3 | docs/CI.md and chromatic.yml describe the Storybook webpack pin as pending work, but it is already applied |
| DOC-P2-010 | P2 | AGENTS.md Known Debt contradicts the ops docs on the prod-approval reviewer gate and on main/develop divergence |
| DOC-P3-011 | P3 | docs/RELEASING.md still records PR #281 @ 7dd04023 as the last promotion; main is now 6b7aa1a (2026-11-03) |
| DOC-P3-012 | P3 | docs/modules/change-requests.md documents a nonexistent /api/v1/change-requests base path |
| DOC-P3-013 | P3 | Monitoring docs and AGENTS.md still pin prometheus v3.5.1 / alertmanager v0.28.1 after the compose bump to v3.15.1 / v0.29.0 |
| DOC-P3-014 | P3 | docs/LICENSE_POLICY.md allowed-license list omits PSF-2.0, which security/license-policy.json now allows |
| DOC-P3-015 | P3 | docs/API_ERROR_HANDLING.md names the 429 code as FULL, while the rate-limit middleware and docs/API_RATE_LIMITING.md return RATE_LIMITED |
