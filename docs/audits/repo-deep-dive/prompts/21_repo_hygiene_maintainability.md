# Prompt 21 - Repository Hygiene, Maintainability, and Code Health Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit maintainability, naming, duplication, complexity, stale files, config sprawl, typing, linting, and long-term burden.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/21_repo_hygiene_maintainability.md`

## Area code

Use finding IDs beginning with `HYGIENE`.

Examples:

- `HYGIENE-P0-001`
- `HYGIENE-P1-001`
- `HYGIENE-P2-001`
- `HYGIENE-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for folder/file naming?
2. What repository evidence proves the current behavior for duplicate/dead/unused code?
3. What repository evidence proves the current behavior for generated/build artifacts?
4. What repository evidence proves the current behavior for imports and circular deps?
5. What repository evidence proves the current behavior for large files/components?
6. What repository evidence proves the current behavior for type safety/any usage?
7. What repository evidence proves the current behavior for error handling?
8. What repository evidence proves the current behavior for todo/fixme?
9. What repository evidence proves the current behavior for logging consistency?
10. What repository evidence proves the current behavior for config sprawl?

## Scope to analyze

- Folder/file naming
- Duplicate/dead/unused code
- Generated/build artifacts
- Imports and circular deps
- Large files/components
- Type safety/any usage
- Error handling
- TODO/FIXME
- Logging consistency
- Config sprawl
- Competing patterns
- Package scripts
- Dependency boundaries
- Test utilities
- Docs drift
- Changelog/ADRs

## Required special checks

- Score maintainability categories 0-5
- Identify cleanup backlog
- Recommend repo standards

## Required outputs and companion artifacts

- Code health summary
- Duplicate/stale findings
- Complexity hotspots
- Maintainability scorecard

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

- [ ] Reviewed Folder/file naming
- [ ] Reviewed Duplicate/dead/unused code
- [ ] Reviewed Generated/build artifacts
- [ ] Reviewed Imports and circular deps
- [ ] Reviewed Large files/components
- [ ] Reviewed Type safety/any usage
- [ ] Reviewed Error handling
- [ ] Reviewed TODO/FIXME
- [ ] Reviewed Logging consistency
- [ ] Reviewed Config sprawl
- [ ] Reviewed Competing patterns
- [ ] Reviewed Package scripts
- [ ] Reviewed Dependency boundaries
- [ ] Reviewed Test utilities
- [ ] Reviewed Docs drift
- [ ] Reviewed Changelog/ADRs

## Required report structure

```markdown
# Repository Hygiene, Maintainability, and Code Health Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: HYGIENE
- Output path: docs/audits/{name}/{run}/21_repo_hygiene_maintainability.md
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
| Folder/file naming         |   0-5 | Evidence | Gap | Recommended action |
| Duplicate/dead/unused code |   0-5 | Evidence | Gap | Recommended action |
| Generated/build artifacts  |   0-5 | Evidence | Gap | Recommended action |
| Imports and circular deps  |   0-5 | Evidence | Gap | Recommended action |
| Large files/components     |   0-5 | Evidence | Gap | Recommended action |
| Type safety/any usage      |   0-5 | Evidence | Gap | Recommended action |
| Error handling             |   0-5 | Evidence | Gap | Recommended action |
| TODO/FIXME                 |   0-5 | Evidence | Gap | Recommended action |
| Logging consistency        |   0-5 | Evidence | Gap | Recommended action |
| Config sprawl              |   0-5 | Evidence | Gap | Recommended action |
| Competing patterns         |   0-5 | Evidence | Gap | Recommended action |
| Package scripts            |   0-5 | Evidence | Gap | Recommended action |

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

| ID          | Scenario or control        | Evidence | Current control | Gap | Severity | Recommendation |
| ----------- | -------------------------- | -------- | --------------- | --- | -------- | -------------- |
| HYGIENE-001 | Folder/file naming         | Evidence | Current control | Gap | Severity | Recommendation |
| HYGIENE-002 | Duplicate/dead/unused code | Evidence | Current control | Gap | Severity | Recommendation |
| HYGIENE-003 | Generated/build artifacts  | Evidence | Current control | Gap | Severity | Recommendation |
| HYGIENE-004 | Imports and circular deps  | Evidence | Current control | Gap | Severity | Recommendation |
| HYGIENE-005 | Large files/components     | Evidence | Current control | Gap | Severity | Recommendation |
| HYGIENE-006 | Type safety/any usage      | Evidence | Current control | Gap | Severity | Recommendation |
| HYGIENE-007 | Error handling             | Evidence | Current control | Gap | Severity | Recommendation |
| HYGIENE-008 | TODO/FIXME                 | Evidence | Current control | Gap | Severity | Recommendation |
| HYGIENE-009 | Logging consistency        | Evidence | Current control | Gap | Severity | Recommendation |
| HYGIENE-010 | Config sprawl              | Evidence | Current control | Gap | Severity | Recommendation |
| HYGIENE-011 | Competing patterns         | Evidence | Current control | Gap | Severity | Recommendation |
| HYGIENE-012 | Package scripts            | Evidence | Current control | Gap | Severity | Recommendation |

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
