# Prompt 23 - Executive Summary and Release Gate

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Create a leadership-friendly summary and practical release gate decision based on evidence.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/23_executive_summary_release_gate.md`

## Area code

Use finding IDs beginning with `EXEC`.

Examples:

- `EXEC-P0-001`
- `EXEC-P1-001`
- `EXEC-P2-001`
- `EXEC-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for current state?
2. What repository evidence proves the current behavior for strengths?
3. What repository evidence proves the current behavior for biggest risks?
4. What repository evidence proves the current behavior for release blockers?
5. What repository evidence proves the current behavior for business/security/ops/ux impact?
6. What repository evidence proves the current behavior for investment recommendation?
7. What repository evidence proves the current behavior for next actions?
8. What repository evidence proves the current behavior for risk counts/themes?

## Scope to analyze

- Current state
- Strengths
- Biggest risks
- Release blockers
- Business/security/ops/UX impact
- Investment recommendation
- Next actions
- Risk counts/themes

## Required special checks

- NO-GO if unresolved P0
- GO WITH CONDITIONS if P1 mitigated
- GO only with no P0/P1 blockers and validation evidence

## Required outputs and companion artifacts

- `EXECUTIVE_SUMMARY.md`
- `RELEASE_GATE.md`
- Risk summary table
- Next actions

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

- [ ] Reviewed Current state
- [ ] Reviewed Strengths
- [ ] Reviewed Biggest risks
- [ ] Reviewed Release blockers
- [ ] Reviewed Business/security/ops/UX impact
- [ ] Reviewed Investment recommendation
- [ ] Reviewed Next actions
- [ ] Reviewed Risk counts/themes

## Required report structure

```markdown
# Executive Summary and Release Gate

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: EXEC
- Output path: docs/audits/{name}/{run}/23_executive_summary_release_gate.md
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

| Category                        | Score | Evidence | Gap | Recommended action |
| ------------------------------- | ----: | -------- | --- | ------------------ |
| Current state                   |   0-5 | Evidence | Gap | Recommended action |
| Strengths                       |   0-5 | Evidence | Gap | Recommended action |
| Biggest risks                   |   0-5 | Evidence | Gap | Recommended action |
| Release blockers                |   0-5 | Evidence | Gap | Recommended action |
| Business/security/ops/UX impact |   0-5 | Evidence | Gap | Recommended action |
| Investment recommendation       |   0-5 | Evidence | Gap | Recommended action |
| Next actions                    |   0-5 | Evidence | Gap | Recommended action |
| Risk counts/themes              |   0-5 | Evidence | Gap | Recommended action |

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

| ID       | Scenario or control             | Evidence | Current control | Gap | Severity | Recommendation |
| -------- | ------------------------------- | -------- | --------------- | --- | -------- | -------------- |
| EXEC-001 | Current state                   | Evidence | Current control | Gap | Severity | Recommendation |
| EXEC-002 | Strengths                       | Evidence | Current control | Gap | Severity | Recommendation |
| EXEC-003 | Biggest risks                   | Evidence | Current control | Gap | Severity | Recommendation |
| EXEC-004 | Release blockers                | Evidence | Current control | Gap | Severity | Recommendation |
| EXEC-005 | Business/security/ops/UX impact | Evidence | Current control | Gap | Severity | Recommendation |
| EXEC-006 | Investment recommendation       | Evidence | Current control | Gap | Severity | Recommendation |
| EXEC-007 | Next actions                    | Evidence | Current control | Gap | Severity | Recommendation |
| EXEC-008 | Risk counts/themes              | Evidence | Current control | Gap | Severity | Recommendation |

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
