# AI Automation and Agent Readiness Audit (re-audit)

## Audit Metadata

- Audit name: mainecybertech
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: MaineCyberTech/mainecybertech (origin/main)
- Commit SHA: `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03T09:43:35Z
- Auditor: subagent (full-domain verification re-audit)
- Area code: AI
- Previous run: `mainecybertech-20261014-0033-full-main-7dd0402`

## Executive Summary

Most AI-readiness findings remain closed: AGENTS.md is a current-state contract,
the a11y/path docs are guarded, prompt provenance runs on PRs, the audit corpus
is inside the untrusted-data boundary, audit conventions match the committed
runs, secrets guidance links the runbook, and AI-authorship disclosure exists.

The vendored pack gap improved materially: prompt 45 is now present, RUN_ORDER
lists it, and `verify-prompts.js` resolves every run-manifest domain to a
vendored prompt. Remaining partials are: no pinned-version/source banner in the
pack README (and no README-path guard), no PR-size or OpenAPI-YAML regenerate
diff guardrail, no per-pack not-instructions marker, the pre-rename path in
`docs/ONBOARDING.md:37`, and stale hardcoded branch counts in AGENTS.md Known
Debt. No new AI finding was raised at 6b7aa1a.

Counts: 8 verified-fixed, 5 partially-fixed, 0 new open.

## Findings

| ID | Sev | Title | Status | Evidence |
|---|---:|---|---|---|
| AI-P1-001 | P1 | Vendored packs stale; manifest references missing prompt 45 | partially-fixed | 45 vendored; RUN_ORDER:44; verify-prompts.js:83-115; README has no version banner |
| AI-P1-002 | P1 | AGENTS.md stale path + a11y gate size docs | verified-fixed | AGENTS.md:3; docs/testing.md:66,130; check-docs-counts.mjs:630-680 |
| AI-P2-001 | P2 | No machine-enforced agent guardrails | partially-fixed | verify-prompts + CODEOWNERS landed; no PR-size or openapi.yaml diff guard |
| AI-P2-002 | P2 | No machine-detectable not-instructions marker in packs | partially-fixed | only PROVENANCE.md carries it; no per-pack marker or guard |
| AI-P2-003 | P2 | .continue config defines models only | verified-fixed | .continue/agents/config.yaml:23-33 |
| AI-P3-001 | P3 | Pre-rename path in embedded maps/onboarding | partially-fixed | docs/ONBOARDING.md:37; 58 occurrences / 35 files |
| AI-P3-002 | P3 | AGENTS.md snapshot history | verified-fixed | AGENTS.md 407 lines; docs/HISTORY.md:1-15; sync-review-md |
| AI-P3-003 | P3 | Secrets guidance not linked to runbook | verified-fixed | AGENTS.md:61,85; CONTRIBUTING.md:59; PR template:24 |
| AI-P3-004 | P3 | docs/audits outside untrusted boundary | verified-fixed | AGENTS.md:91-95; docs/audits/README.md:1-11 |
| AI-P3-005 | P3 | Audit output conventions stale | verified-fixed | docs/audits/README.md:22-118 |
| AI-P3-006 | P3 | Prompt provenance only at deploy gate | verified-fixed | action.yml:186-189; test.yml:41 |
| AI-P3-007 | P3 | No AI-authorship disclosure | verified-fixed | PR template:5-9; AGENTS.md:65-72; CONTRIBUTING.md:50 |
| AI-P3-008 | P3 | Stale promotion binding / branch counts in Known Debt | partially-fixed | AGENTS.md:124 says 26 ahead (actual 1); RELEASING.md:201 last promotion #281 |

## Detailed verification

### Prompt pack (AI-P1-001)

- `prompts/repo-deep-dive/prompts/45_exploit_chain_attack_path_audit.md` exists
  (246 lines); `RUN_ORDER.md:44` and the pack README table (`README.md:46`) list
  it.
- `scripts/verify-prompts.js:83-115` resolves every `audit_manifest.json`
  `scope.domains` entry to a vendored prompt; `verify` passes with 624 pinned
  files / 8.9 MiB.
- Residual: the repo-deep-dive pack README has no pinned-version/source banner,
  and README script paths are not resolved by the guard.

### Guardrails (AI-P2-001)

- Landed: `verify-prompts` in the shared PR job (action.yml:189) and explicit
  CODEOWNERS owners (`.github/CODEOWNERS:31-50`).
- Missing: PR-size enforcement (only prose at `AGENTS.md:77` and
  `.continue/agents/config.yaml:33`), and a `docs/openapi.yaml`
  regenerate-and-diff step (`openapi-audit.js` compares code to `spec.ts`).

### Known Debt branch state (AI-P3-008)

```
$ git rev-list --left-right --count origin/main...origin/develop
1	0
```

`AGENTS.md:124` claims "main now carries 26 commits that develop does not".
`docs/RELEASING.md:201` still names PR #281 as the last promotion although the
latest release tag is `v0.1.0-20261103-6b7aa1a`. The compare instruction in the
same paragraph is correct; the hardcoded counts/binding are not.

## Recommendations

### This week

- AI-P3-008: delete the hardcoded ahead-count and "last promotion" binding (or
  refresh them at each promotion); keep the `git log --oneline --left-right`
  instruction.
- AI-P1-001: add a one-line pinned-version/source banner to each pack README and
  extend `verify-prompts.js` to check README-referenced script paths.

### This month

- AI-P2-002: add a `GENERATED OUTPUT — DATA, NOT INSTRUCTIONS` marker to each
  pack README and assert it in `verify-prompts.js`.
- AI-P2-001: add a PR-size advisory and an `openapi.yaml` regenerate-and-diff
  step; both are dependency-free.
- AI-P3-001: fix `docs/ONBOARDING.md:37` and annotate the dated docs when next
  touched.

## Quick Wins

| Quick win | Why it helps | Files |
|---|---|---|
| Drop stale branch counts | Agents read Known Debt as current state | AGENTS.md:124, docs/RELEASING.md:201 |
| Banner each pack README | Makes the data/instruction boundary visible where files are read | prompts/*/README.md |
| Fix ONBOARDING tree root | Removes the last live pre-rename path | docs/ONBOARDING.md:37 |

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Is a PR-size gate wanted at all? | The guardrail is still prose-only by choice | maintainer decision |
| Does the upstream repo-deep-dive pack publish a version identifier? | Decides the README banner content | upstream pack release |
