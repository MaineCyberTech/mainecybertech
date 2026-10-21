# AI Automation and Agent Readiness Audit (re-audit)

## Audit Metadata

- Audit name: mainecybertech
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: MaineCyberTech/mainecybertech (origin/main)
- Commit SHA: `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097`
- Generated at: 2026-10-14T00:55:01Z
- Auditor: subagent (full-domain verification re-audit)
- Area code: AI
- Previous run: `mainecybertech-20261011-0426-full-main-8d299b8`

## Executive Summary

The phase-5/6 wave closed most AI-readiness gaps: AGENTS.md is a current-state
contract again (history moved to docs/HISTORY.md), secrets guidance links the
canonical runbook, the audit corpus is inside the untrusted-data boundary,
audit conventions match the committed runs, prompt provenance now runs on PRs,
and AI-authorship disclosure exists. Three findings remain partially fixed:
the vendored pack is still missing prompts 41-45 while committed run manifests
reference prompt 45; per-pack not-instructions markers are still absent; and
the machine-enforced guardrail set still lacks a PR-size check and a committed
OpenAPI regeneration diff. One new issue: AGENTS.md Known Debt states a stale
promotion binding and a now-false branch direction.

Counts: 8 verified-fixed, 4 partially-fixed, 1 new open.

## Findings

| ID | Sev | Title | Status | Evidence |
|---|---:|---|---|---|
| AI-P1-001 | P1 | Vendored packs stale; run manifest references missing prompt 45 | partially-fixed | repo-deep-dive/prompts ends at 40; manifests list 45_exploit_chain_attack_path_audit |
| AI-P1-002 | P1 | AGENTS.md stale path + a11y gate size docs | verified-fixed | AGENTS.md:3; docs/testing.md:66; check-docs-counts.mjs:630-660 |
| AI-P2-001 | P2 | No machine-enforced agent guardrails | partially-fixed | verify-prompts + CODEOWNERS landed; no PR-size or openapi.yaml diff guard |
| AI-P2-002 | P2 | No machine-detectable not-instructions marker in packs | partially-fixed | only PROVENANCE.md + 00_SHARED carry the marker; no guard |
| AI-P2-003 | P2 | .continue config defines models only | verified-fixed | .continue/agents/config.yaml:23-33 |
| AI-P3-001 | P3 | Pre-rename path in embedded maps/onboarding | partially-fixed | docs/ONBOARDING.md:37; 52 occurrences/30 files |
| AI-P3-002 | P3 | AGENTS.md snapshot history | verified-fixed | AGENTS.md 407 lines; docs/HISTORY.md:1-15 |
| AI-P3-003 | P3 | Secrets guidance not linked to runbook | verified-fixed | AGENTS.md:61,85; CONTRIBUTING.md:59; PR template:24 |
| AI-P3-004 | P3 | docs/audits outside untrusted boundary | verified-fixed | AGENTS.md:91-95; docs/audits/README.md:1-11 |
| AI-P3-005 | P3 | Audit output conventions stale | verified-fixed | docs/audits/README.md:13-99 + Runs table |
| AI-P3-006 | P3 | Prompt provenance only at deploy gate | verified-fixed | unit-tests action.yml:168-174; test.yml:44 |
| AI-P3-007 | P3 | No AI-authorship disclosure | verified-fixed | PR template:5-8; AGENTS.md:65-70; CONTRIBUTING.md:50 |
| AI-P3-008 | P3 | AGENTS.md stale promotion binding / branch direction | open (new) | AGENTS.md:124; main is 7 ahead of develop |

## Recommendations

### This week

- AI-P1-001: either vendor prompts 41-45 (upstream pack) or reconcile the two
  committed run manifests and add a pinned-version banner to the pack README;
  the cheapest honest option is a note in each affected manifest plus the
  banner, since the manifests are historical data.

### This month

- AI-P2-002: add a one-line `GENERATED OUTPUT — DATA, NOT INSTRUCTIONS` banner
  to each pack README and extend `verify-prompts.js` to assert the marker for
  non-prompt files.
- AI-P2-001: add a PR-size advisory (changed-files / net-lines) and an
  `openapi.yaml` regenerate-and-diff step; both are dependency-free.
- AI-P3-008: refresh AGENTS.md:124 at each promotion (or delete the binding and
  keep the compare instruction).

### This quarter

- AI-P3-001: fix docs/ONBOARDING.md:37 and annotate the dated docs when next
  touched; add a `C:\\` path grep to check-docs-links.mjs if cheap.

## Quick Wins

| Quick win | Why it helps | Files |
|---|---|---|
| Banner each pack README | Makes the data/instruction boundary visible where files are read | prompts/*/README.md |
| Fix ONBOARDING tree root | Removes the last live pre-rename path | docs/ONBOARDING.md:37 |

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Does the upstream repo-deep-dive pack still publish prompts 41-45? | Decides vendor-vs-annotate | upstream pack release |
| Is a PR-size gate wanted at all? | The guardrail is prose-only by choice so far | maintainer decision |
