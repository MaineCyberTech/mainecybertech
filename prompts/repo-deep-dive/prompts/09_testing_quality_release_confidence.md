# Prompt 09 - Testing, Quality, and Release Confidence Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit whether the repo has enough validation to release safely and repeatedly.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/09_testing_quality_release_confidence.md`

## Area code

Use finding IDs beginning with `TEST`.

Examples:

- `TEST-P0-001`
- `TEST-P1-001`
- `TEST-P2-001`
- `TEST-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for unit tests?
2. What repository evidence proves the current behavior for integration tests?
3. What repository evidence proves the current behavior for api tests?
4. What repository evidence proves the current behavior for e2e?
5. What repository evidence proves the current behavior for component tests?
6. What repository evidence proves the current behavior for visual regression?
7. What repository evidence proves the current behavior for accessibility?
8. What repository evidence proves the current behavior for contract tests?
9. What repository evidence proves the current behavior for migration tests?
10. What repository evidence proves the current behavior for security tests?

## Scope to analyze

- Unit tests
- Integration tests
- API tests
- E2E
- Component tests
- Visual regression
- Accessibility
- Contract tests
- Migration tests
- Security tests
- Load/failure tests
- Smoke tests
- CI execution
- Flaky risks
- Test data/mocking
- Coverage
- Critical paths
- Pre-commit hooks
- Local commands
- Docs

## Required special checks

- Score each testing category 0-5
- Map critical workflows to coverage
- Identify blocking release gaps
- Recommend CI gate changes

## Required outputs and companion artifacts

- Test inventory
- Critical workflow coverage matrix
- Release confidence scorecard
- Manual QA checklist

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

- [ ] Reviewed Unit tests
- [ ] Reviewed Integration tests
- [ ] Reviewed API tests
- [ ] Reviewed E2E
- [ ] Reviewed Component tests
- [ ] Reviewed Visual regression
- [ ] Reviewed Accessibility
- [ ] Reviewed Contract tests
- [ ] Reviewed Migration tests
- [ ] Reviewed Security tests
- [ ] Reviewed Load/failure tests
- [ ] Reviewed Smoke tests
- [ ] Reviewed CI execution
- [ ] Reviewed Flaky risks
- [ ] Reviewed Test data/mocking
- [ ] Reviewed Coverage
- [ ] Reviewed Critical paths
- [ ] Reviewed Pre-commit hooks
- [ ] Reviewed Local commands
- [ ] Reviewed Docs

## Required report structure

```markdown
# Testing, Quality, and Release Confidence Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: TEST
- Output path: docs/audits/{name}/{run}/09_testing_quality_release_confidence.md
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

| Category           | Score | Evidence | Gap | Recommended action |
| ------------------ | ----: | -------- | --- | ------------------ |
| Unit tests         |   0-5 | Evidence | Gap | Recommended action |
| Integration tests  |   0-5 | Evidence | Gap | Recommended action |
| API tests          |   0-5 | Evidence | Gap | Recommended action |
| E2E                |   0-5 | Evidence | Gap | Recommended action |
| Component tests    |   0-5 | Evidence | Gap | Recommended action |
| Visual regression  |   0-5 | Evidence | Gap | Recommended action |
| Accessibility      |   0-5 | Evidence | Gap | Recommended action |
| Contract tests     |   0-5 | Evidence | Gap | Recommended action |
| Migration tests    |   0-5 | Evidence | Gap | Recommended action |
| Security tests     |   0-5 | Evidence | Gap | Recommended action |
| Load/failure tests |   0-5 | Evidence | Gap | Recommended action |
| Smoke tests        |   0-5 | Evidence | Gap | Recommended action |

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

| ID       | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
| -------- | ------------------- | -------- | --------------- | --- | -------- | -------------- |
| TEST-001 | Unit tests          | Evidence | Current control | Gap | Severity | Recommendation |
| TEST-002 | Integration tests   | Evidence | Current control | Gap | Severity | Recommendation |
| TEST-003 | API tests           | Evidence | Current control | Gap | Severity | Recommendation |
| TEST-004 | E2E                 | Evidence | Current control | Gap | Severity | Recommendation |
| TEST-005 | Component tests     | Evidence | Current control | Gap | Severity | Recommendation |
| TEST-006 | Visual regression   | Evidence | Current control | Gap | Severity | Recommendation |
| TEST-007 | Accessibility       | Evidence | Current control | Gap | Severity | Recommendation |
| TEST-008 | Contract tests      | Evidence | Current control | Gap | Severity | Recommendation |
| TEST-009 | Migration tests     | Evidence | Current control | Gap | Severity | Recommendation |
| TEST-010 | Security tests      | Evidence | Current control | Gap | Severity | Recommendation |
| TEST-011 | Load/failure tests  | Evidence | Current control | Gap | Severity | Recommendation |
| TEST-012 | Smoke tests         | Evidence | Current control | Gap | Severity | Recommendation |

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
