# Prompt 34 - Branch Protection and Required Checks Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Recommend branch protection, required checks, review rules, environment protections, and governance controls.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/34_branch_protection_required_checks.md`

## Area code

Use finding IDs beginning with `BP`.

Examples:

- `BP-P0-001`
- `BP-P1-001`
- `BP-P2-001`
- `BP-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for workflows/jobs?
2. What repository evidence proves the current behavior for pr templates?
3. What repository evidence proves the current behavior for codeowners?
4. What repository evidence proves the current behavior for dependabot?
5. What repository evidence proves the current behavior for release/deploy/migration/security workflows?
6. What repository evidence proves the current behavior for branch/release/hotfix docs?
7. What repository evidence proves the current behavior for environment approvals?
8. What repository evidence proves the current behavior for manual dispatch?
9. What repository evidence proves the current behavior for workflow risks?

## Scope to analyze

- Workflows/jobs
- PR templates
- CODEOWNERS
- Dependabot
- Release/deploy/migration/security workflows
- Branch/release/hotfix docs
- Environment approvals
- Manual dispatch
- Workflow risks

## Required special checks

- Map workflows to required checks
- Include main/develop/release/hotfix rules
- Define break-glass process

## Required outputs and companion artifacts

- `branch_protection_recommendation.md`
- Workflow-to-check mapping
- Required status checks
- Implementation checklist

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

- [ ] Reviewed Workflows/jobs
- [ ] Reviewed PR templates
- [ ] Reviewed CODEOWNERS
- [ ] Reviewed Dependabot
- [ ] Reviewed Release/deploy/migration/security workflows
- [ ] Reviewed Branch/release/hotfix docs
- [ ] Reviewed Environment approvals
- [ ] Reviewed Manual dispatch
- [ ] Reviewed Workflow risks

## Required report structure

```markdown
# Branch Protection and Required Checks Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: BP
- Output path: docs/audits/{name}/{run}/34_branch_protection_required_checks.md
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

| Category                                    | Score | Evidence | Gap | Recommended action |
| ------------------------------------------- | ----: | -------- | --- | ------------------ |
| Workflows/jobs                              |   0-5 | Evidence | Gap | Recommended action |
| PR templates                                |   0-5 | Evidence | Gap | Recommended action |
| CODEOWNERS                                  |   0-5 | Evidence | Gap | Recommended action |
| Dependabot                                  |   0-5 | Evidence | Gap | Recommended action |
| Release/deploy/migration/security workflows |   0-5 | Evidence | Gap | Recommended action |
| Branch/release/hotfix docs                  |   0-5 | Evidence | Gap | Recommended action |
| Environment approvals                       |   0-5 | Evidence | Gap | Recommended action |
| Manual dispatch                             |   0-5 | Evidence | Gap | Recommended action |
| Workflow risks                              |   0-5 | Evidence | Gap | Recommended action |

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

| ID     | Scenario or control                         | Evidence | Current control | Gap | Severity | Recommendation |
| ------ | ------------------------------------------- | -------- | --------------- | --- | -------- | -------------- |
| BP-001 | Workflows/jobs                              | Evidence | Current control | Gap | Severity | Recommendation |
| BP-002 | PR templates                                | Evidence | Current control | Gap | Severity | Recommendation |
| BP-003 | CODEOWNERS                                  | Evidence | Current control | Gap | Severity | Recommendation |
| BP-004 | Dependabot                                  | Evidence | Current control | Gap | Severity | Recommendation |
| BP-005 | Release/deploy/migration/security workflows | Evidence | Current control | Gap | Severity | Recommendation |
| BP-006 | Branch/release/hotfix docs                  | Evidence | Current control | Gap | Severity | Recommendation |
| BP-007 | Environment approvals                       | Evidence | Current control | Gap | Severity | Recommendation |
| BP-008 | Manual dispatch                             | Evidence | Current control | Gap | Severity | Recommendation |
| BP-009 | Workflow risks                              | Evidence | Current control | Gap | Severity | Recommendation |

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
