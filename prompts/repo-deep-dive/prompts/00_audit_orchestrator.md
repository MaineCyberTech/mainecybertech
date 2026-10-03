# Prompt 00 - Audit Orchestrator

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Coordinate the full audit run, establish scope, execute order, evidence rules, manifest, and final output map.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/00_audit_orchestrator.md`

## Area code

Use finding IDs beginning with `ORCH`.

Examples:

- `ORCH-P0-001`
- `ORCH-P1-001`
- `ORCH-P2-001`
- `ORCH-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for repository type and monorepo boundaries?
2. What repository evidence proves the current behavior for app/service/package map?
3. What repository evidence proves the current behavior for audit prompts to run and dependencies?
4. What repository evidence proves the current behavior for current branch/sha/run naming?
5. What repository evidence proves the current behavior for report inventory and expected files?
6. What repository evidence proves the current behavior for risk aggregation strategy?
7. What repository evidence proves the current behavior for finding id scheme?
8. What repository evidence proves the current behavior for do-not-touch safety zones?
9. What repository evidence proves the current behavior for final index requirements?
10. What repository evidence proves the current behavior for operator handoff requirements?

## Scope to analyze

- Repository type and monorepo boundaries
- App/service/package map
- Audit prompts to run and dependencies
- Current branch/SHA/run naming
- Report inventory and expected files
- Risk aggregation strategy
- Finding ID scheme
- Do-not-touch safety zones
- Final index requirements
- Operator handoff requirements

## Required special checks

- Confirm all prompt outputs write only under docs/audits/{name}/{run}/
- Create a machine-readable run manifest
- Identify missing evidence that later prompts must gather
- Define aggregation categories for final risk register

## Required outputs and companion artifacts

- `INDEX.md`
- audit_manifest.json style block
- ordered execution plan
- report output map

## Step-by-step execution instructions

1. Read the repository tree and identify all files relevant to this domain.
2. Review source files, configuration files, tests, docs, and generated artifacts separately.
3. Create an evidence inventory before writing findings.
4. For each item in scope, determine whether it is implemented, partially implemented, absent, stale, duplicated, unsafe, undocumented, or unknown.
5. Identify strengths before risks so the report is balanced and useful.
6. Create findings only when there is concrete evidence.
7. Assign severity using the shared P0/P1/P2/P3 model.
8. Suggest exact file-level remediation where possible.
9. Suggest tests that would prove the remediation works.
10. Suggest documentation updates needed to keep operators and future AI agents aligned.
11. End with open questions and evidence gaps.

## Evidence collection checklist

- [ ] Reviewed Repository type and monorepo boundaries
- [ ] Reviewed App/service/package map
- [ ] Reviewed Audit prompts to run and dependencies
- [ ] Reviewed Current branch/SHA/run naming
- [ ] Reviewed Report inventory and expected files
- [ ] Reviewed Risk aggregation strategy
- [ ] Reviewed Finding ID scheme
- [ ] Reviewed Do-not-touch safety zones
- [ ] Reviewed Final index requirements
- [ ] Reviewed Operator handoff requirements

## Required report structure

```markdown
# Audit Orchestrator

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: ORCH
- Output path: docs/audits/{name}/{run}/00_audit_orchestrator.md
- Scope limitations:

## Scope

Describe exactly what was reviewed and what was not reviewed.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |

## Executive Summary

Summarize the current state in plain English. Include strengths, major risks, and recommended next actions.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
| ---- | ------------- | ------- | ------------- | ---- | ----- |

## Domain Scorecard

| Category                                | Score | Evidence | Gap | Recommended action |
| --------------------------------------- | ----: | -------- | --- | ------------------ |
| Repository type and monorepo boundaries |   0-5 | Evidence | Gap | Recommended action |
| App/service/package map                 |   0-5 | Evidence | Gap | Recommended action |
| Audit prompts to run and dependencies   |   0-5 | Evidence | Gap | Recommended action |
| Current branch/SHA/run naming           |   0-5 | Evidence | Gap | Recommended action |
| Report inventory and expected files     |   0-5 | Evidence | Gap | Recommended action |
| Risk aggregation strategy               |   0-5 | Evidence | Gap | Recommended action |
| Finding ID scheme                       |   0-5 | Evidence | Gap | Recommended action |
| Do-not-touch safety zones               |   0-5 | Evidence | Gap | Recommended action |
| Final index requirements                |   0-5 | Evidence | Gap | Recommended action |
| Operator handoff requirements           |   0-5 | Evidence | Gap | Recommended action |

## Detailed Review

For every major item in scope, include:

### Item: Name

- Evidence:
- What it does:
- How it appears to work:
- Dependencies:
- Current controls:
- Missing controls:
- Risks:
- Recommended improvement:
- Suggested tests:
- Suggested docs:

## Scenario / Control Matrix

| ID       | Scenario or control                     | Evidence | Current control | Gap | Severity | Recommendation |
| -------- | --------------------------------------- | -------- | --------------- | --- | -------- | -------------- |
| ORCH-001 | Repository type and monorepo boundaries | Evidence | Current control | Gap | Severity | Recommendation |
| ORCH-002 | App/service/package map                 | Evidence | Current control | Gap | Severity | Recommendation |
| ORCH-003 | Audit prompts to run and dependencies   | Evidence | Current control | Gap | Severity | Recommendation |
| ORCH-004 | Current branch/SHA/run naming           | Evidence | Current control | Gap | Severity | Recommendation |
| ORCH-005 | Report inventory and expected files     | Evidence | Current control | Gap | Severity | Recommendation |
| ORCH-006 | Risk aggregation strategy               | Evidence | Current control | Gap | Severity | Recommendation |
| ORCH-007 | Finding ID scheme                       | Evidence | Current control | Gap | Severity | Recommendation |
| ORCH-008 | Do-not-touch safety zones               | Evidence | Current control | Gap | Severity | Recommendation |
| ORCH-009 | Final index requirements                | Evidence | Current control | Gap | Severity | Recommendation |
| ORCH-010 | Operator handoff requirements           | Evidence | Current control | Gap | Severity | Recommendation |

## Findings

Use the shared finding format exactly.

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| ---- | -------- | ---------- | ------ | -------- | ---------- |

## Recommendations

Group recommendations into:

### Immediate / Release Blocking

### This Week

### This Month

### Later / Platform Evolution

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --------- | ------------ | --------------------- | ---------- |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| ------------ | -------- | ---------------- | ------ | ---------- |

## Suggested Tests

Include unit, integration, E2E, CI, security, regression, and manual validation ideas as applicable.

## Suggested Documentation Updates

List exact docs to create or update.

## Open Questions

| Question | Why it matters | Evidence needed |
| -------- | -------------- | --------------- |

## Appendix

Include raw inventories, diagrams, Mermaid diagrams, command outputs, or additional notes as needed.
```

## Quality bar

The final report should be detailed enough that an implementation agent can open the report and start creating safe, scoped remediation PRs without needing another discovery pass.
