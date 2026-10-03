# Prompt 22 - Final Risk Register, Roadmap, and Patch Plan

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Aggregate all reports into one risk register, roadmap, patch plan, validation plan, and definition of done.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/22_final_risk_register_roadmap.md`

## Area code

Use finding IDs beginning with `FINAL`.

Examples:

- `FINAL-P0-001`
- `FINAL-P1-001`
- `FINAL-P2-001`
- `FINAL-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for all previous reports?
2. What repository evidence proves the current behavior for p0/p1 risks?
3. What repository evidence proves the current behavior for duplicate findings?
4. What repository evidence proves the current behavior for cross-cutting themes?
5. What repository evidence proves the current behavior for quick wins?
6. What repository evidence proves the current behavior for 7/30/60/90-day plans?
7. What repository evidence proves the current behavior for patch sets?
8. What repository evidence proves the current behavior for validation commands?
9. What repository evidence proves the current behavior for owners/effort/dependencies?
10. What repository evidence proves the current behavior for accepted/deferred risks?

## Scope to analyze

- All previous reports
- P0/P1 risks
- Duplicate findings
- Cross-cutting themes
- Quick wins
- 7/30/60/90-day plans
- Patch sets
- Validation commands
- Owners/effort/dependencies
- Accepted/deferred risks

## Required special checks

- Prioritize P0 then P1 release blockers
- Merge duplicates rather than inflate counts
- Create actionable patch sets

## Required outputs and companion artifacts

- `risk_register.md`
- `roadmap.md`
- `patch_plan.md`
- Consolidated risk table
- Definition of done

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

- [ ] Reviewed All previous reports
- [ ] Reviewed P0/P1 risks
- [ ] Reviewed Duplicate findings
- [ ] Reviewed Cross-cutting themes
- [ ] Reviewed Quick wins
- [ ] Reviewed 7/30/60/90-day plans
- [ ] Reviewed Patch sets
- [ ] Reviewed Validation commands
- [ ] Reviewed Owners/effort/dependencies
- [ ] Reviewed Accepted/deferred risks

## Required report structure

```markdown
# Final Risk Register, Roadmap, and Patch Plan

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: FINAL
- Output path: docs/audits/{name}/{run}/22_final_risk_register_roadmap.md
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

| Category                   | Score | Evidence | Gap | Recommended action |
| -------------------------- | ----: | -------- | --- | ------------------ |
| All previous reports       |   0-5 | Evidence | Gap | Recommended action |
| P0/P1 risks                |   0-5 | Evidence | Gap | Recommended action |
| Duplicate findings         |   0-5 | Evidence | Gap | Recommended action |
| Cross-cutting themes       |   0-5 | Evidence | Gap | Recommended action |
| Quick wins                 |   0-5 | Evidence | Gap | Recommended action |
| 7/30/60/90-day plans       |   0-5 | Evidence | Gap | Recommended action |
| Patch sets                 |   0-5 | Evidence | Gap | Recommended action |
| Validation commands        |   0-5 | Evidence | Gap | Recommended action |
| Owners/effort/dependencies |   0-5 | Evidence | Gap | Recommended action |
| Accepted/deferred risks    |   0-5 | Evidence | Gap | Recommended action |

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

| ID        | Scenario or control        | Evidence | Current control | Gap | Severity | Recommendation |
| --------- | -------------------------- | -------- | --------------- | --- | -------- | -------------- |
| FINAL-001 | All previous reports       | Evidence | Current control | Gap | Severity | Recommendation |
| FINAL-002 | P0/P1 risks                | Evidence | Current control | Gap | Severity | Recommendation |
| FINAL-003 | Duplicate findings         | Evidence | Current control | Gap | Severity | Recommendation |
| FINAL-004 | Cross-cutting themes       | Evidence | Current control | Gap | Severity | Recommendation |
| FINAL-005 | Quick wins                 | Evidence | Current control | Gap | Severity | Recommendation |
| FINAL-006 | 7/30/60/90-day plans       | Evidence | Current control | Gap | Severity | Recommendation |
| FINAL-007 | Patch sets                 | Evidence | Current control | Gap | Severity | Recommendation |
| FINAL-008 | Validation commands        | Evidence | Current control | Gap | Severity | Recommendation |
| FINAL-009 | Owners/effort/dependencies | Evidence | Current control | Gap | Severity | Recommendation |
| FINAL-010 | Accepted/deferred risks    | Evidence | Current control | Gap | Severity | Recommendation |

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
