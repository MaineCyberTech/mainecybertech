# Prompt 03 - Feature Implementation and Gap Map

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Map all implemented and partial features to UI, API, data, worker, permissions, tests, docs, and missing work.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/03_feature_implementation_map.md`

## Area code

Use finding IDs beginning with `FEAT`.

Examples:

- `FEAT-P0-001`
- `FEAT-P1-001`
- `FEAT-P2-001`
- `FEAT-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for pages/routes?
2. What repository evidence proves the current behavior for components?
3. What repository evidence proves the current behavior for api endpoints?
4. What repository evidence proves the current behavior for server actions?
5. What repository evidence proves the current behavior for workers/jobs?
6. What repository evidence proves the current behavior for database entities?
7. What repository evidence proves the current behavior for permissions?
8. What repository evidence proves the current behavior for audit logs?
9. What repository evidence proves the current behavior for tests?
10. What repository evidence proves the current behavior for docs?

## Scope to analyze

- Pages/routes
- Components
- API endpoints
- Server actions
- Workers/jobs
- Database entities
- Permissions
- Audit logs
- Tests
- Docs
- Workflow states
- Failure states
- Mobile behavior
- Observability hooks

## Required special checks

- Detect UI without backend and backend without UI
- Score completeness 0-5
- Find orphaned routes/modules
- Identify missing tests/docs per feature

## Required outputs and companion artifacts

- Feature inventory table
- Workflow maps
- Completeness scorecard
- Gap backlog

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

- [ ] Reviewed Pages/routes
- [ ] Reviewed Components
- [ ] Reviewed API endpoints
- [ ] Reviewed Server actions
- [ ] Reviewed Workers/jobs
- [ ] Reviewed Database entities
- [ ] Reviewed Permissions
- [ ] Reviewed Audit logs
- [ ] Reviewed Tests
- [ ] Reviewed Docs
- [ ] Reviewed Workflow states
- [ ] Reviewed Failure states
- [ ] Reviewed Mobile behavior
- [ ] Reviewed Observability hooks

## Required report structure

```markdown
# Feature Implementation and Gap Map

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: FEAT
- Output path: docs/audits/{name}/{run}/03_feature_implementation_map.md
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

| Category          | Score | Evidence | Gap | Recommended action |
| ----------------- | ----: | -------- | --- | ------------------ |
| Pages/routes      |   0-5 | Evidence | Gap | Recommended action |
| Components        |   0-5 | Evidence | Gap | Recommended action |
| API endpoints     |   0-5 | Evidence | Gap | Recommended action |
| Server actions    |   0-5 | Evidence | Gap | Recommended action |
| Workers/jobs      |   0-5 | Evidence | Gap | Recommended action |
| Database entities |   0-5 | Evidence | Gap | Recommended action |
| Permissions       |   0-5 | Evidence | Gap | Recommended action |
| Audit logs        |   0-5 | Evidence | Gap | Recommended action |
| Tests             |   0-5 | Evidence | Gap | Recommended action |
| Docs              |   0-5 | Evidence | Gap | Recommended action |
| Workflow states   |   0-5 | Evidence | Gap | Recommended action |
| Failure states    |   0-5 | Evidence | Gap | Recommended action |

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
| FEAT-001 | Pages/routes        | Evidence | Current control | Gap | Severity | Recommendation |
| FEAT-002 | Components          | Evidence | Current control | Gap | Severity | Recommendation |
| FEAT-003 | API endpoints       | Evidence | Current control | Gap | Severity | Recommendation |
| FEAT-004 | Server actions      | Evidence | Current control | Gap | Severity | Recommendation |
| FEAT-005 | Workers/jobs        | Evidence | Current control | Gap | Severity | Recommendation |
| FEAT-006 | Database entities   | Evidence | Current control | Gap | Severity | Recommendation |
| FEAT-007 | Permissions         | Evidence | Current control | Gap | Severity | Recommendation |
| FEAT-008 | Audit logs          | Evidence | Current control | Gap | Severity | Recommendation |
| FEAT-009 | Tests               | Evidence | Current control | Gap | Severity | Recommendation |
| FEAT-010 | Docs                | Evidence | Current control | Gap | Severity | Recommendation |
| FEAT-011 | Workflow states     | Evidence | Current control | Gap | Severity | Recommendation |
| FEAT-012 | Failure states      | Evidence | Current control | Gap | Severity | Recommendation |

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
