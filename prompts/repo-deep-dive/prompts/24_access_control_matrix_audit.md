# Prompt 24 - Access Control Matrix Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Create a complete access-control matrix across roles, permissions, routes, APIs, objects, actions, and data scopes.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/24_access_control_matrix_audit.md`

## Area code

Use finding IDs beginning with `ACM`.

Examples:

- `ACM-P0-001`
- `ACM-P1-001`
- `ACM-P2-001`
- `ACM-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for roles?
2. What repository evidence proves the current behavior for permissions?
3. What repository evidence proves the current behavior for org/tenant/workspace membership?
4. What repository evidence proves the current behavior for project/ticket/document/billing/api key/webhook permission?
5. What repository evidence proves the current behavior for admin console?
6. What repository evidence proves the current behavior for public/authenticated/internal routes?
7. What repository evidence proves the current behavior for server actions?
8. What repository evidence proves the current behavior for api endpoints?
9. What repository evidence proves the current behavior for background jobs?
10. What repository evidence proves the current behavior for db helpers?

## Scope to analyze

- Roles
- Permissions
- Org/tenant/workspace membership
- Project/ticket/document/billing/API key/webhook permission
- Admin console
- Public/authenticated/internal routes
- Server actions
- API endpoints
- Background jobs
- DB helpers
- Middleware
- Client-side hiding
- Server enforcement
- Audit logs
- Authz tests

## Required special checks

- Detect UI-only guards
- Detect object IDs accepted without tenant/member validation
- Find inconsistent permission model
- Suggest forbidden-access tests

## Required outputs and companion artifacts

- `access_control_matrix.md`
- Role inventory
- Permission inventory
- Route access matrix
- Sensitive action matrix

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

- [ ] Reviewed Roles
- [ ] Reviewed Permissions
- [ ] Reviewed Org/tenant/workspace membership
- [ ] Reviewed Project/ticket/document/billing/API key/webhook permission
- [ ] Reviewed Admin console
- [ ] Reviewed Public/authenticated/internal routes
- [ ] Reviewed Server actions
- [ ] Reviewed API endpoints
- [ ] Reviewed Background jobs
- [ ] Reviewed DB helpers
- [ ] Reviewed Middleware
- [ ] Reviewed Client-side hiding
- [ ] Reviewed Server enforcement
- [ ] Reviewed Audit logs
- [ ] Reviewed Authz tests

## Required report structure

```markdown
# Access Control Matrix Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: ACM
- Output path: docs/audits/{name}/{run}/24_access_control_matrix_audit.md
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

| Category                                                   | Score | Evidence | Gap | Recommended action |
| ---------------------------------------------------------- | ----: | -------- | --- | ------------------ |
| Roles                                                      |   0-5 | Evidence | Gap | Recommended action |
| Permissions                                                |   0-5 | Evidence | Gap | Recommended action |
| Org/tenant/workspace membership                            |   0-5 | Evidence | Gap | Recommended action |
| Project/ticket/document/billing/API key/webhook permission |   0-5 | Evidence | Gap | Recommended action |
| Admin console                                              |   0-5 | Evidence | Gap | Recommended action |
| Public/authenticated/internal routes                       |   0-5 | Evidence | Gap | Recommended action |
| Server actions                                             |   0-5 | Evidence | Gap | Recommended action |
| API endpoints                                              |   0-5 | Evidence | Gap | Recommended action |
| Background jobs                                            |   0-5 | Evidence | Gap | Recommended action |
| DB helpers                                                 |   0-5 | Evidence | Gap | Recommended action |
| Middleware                                                 |   0-5 | Evidence | Gap | Recommended action |
| Client-side hiding                                         |   0-5 | Evidence | Gap | Recommended action |

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

| ID      | Scenario or control                                        | Evidence | Current control | Gap | Severity | Recommendation |
| ------- | ---------------------------------------------------------- | -------- | --------------- | --- | -------- | -------------- |
| ACM-001 | Roles                                                      | Evidence | Current control | Gap | Severity | Recommendation |
| ACM-002 | Permissions                                                | Evidence | Current control | Gap | Severity | Recommendation |
| ACM-003 | Org/tenant/workspace membership                            | Evidence | Current control | Gap | Severity | Recommendation |
| ACM-004 | Project/ticket/document/billing/API key/webhook permission | Evidence | Current control | Gap | Severity | Recommendation |
| ACM-005 | Admin console                                              | Evidence | Current control | Gap | Severity | Recommendation |
| ACM-006 | Public/authenticated/internal routes                       | Evidence | Current control | Gap | Severity | Recommendation |
| ACM-007 | Server actions                                             | Evidence | Current control | Gap | Severity | Recommendation |
| ACM-008 | API endpoints                                              | Evidence | Current control | Gap | Severity | Recommendation |
| ACM-009 | Background jobs                                            | Evidence | Current control | Gap | Severity | Recommendation |
| ACM-010 | DB helpers                                                 | Evidence | Current control | Gap | Severity | Recommendation |
| ACM-011 | Middleware                                                 | Evidence | Current control | Gap | Severity | Recommendation |
| ACM-012 | Client-side hiding                                         | Evidence | Current control | Gap | Severity | Recommendation |

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
