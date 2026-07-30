# Prompt 04 - Usability and Workflow Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit core workflows from the perspective of real users, admins, operators, support staff, and mobile users.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/04_usability_workflow_audit.md`

## Area code

Use finding IDs beginning with `USE`.

Examples:

- `USE-P0-001`
- `USE-P1-001`
- `USE-P2-001`
- `USE-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for onboarding?
2. What repository evidence proves the current behavior for login/signup/reset?
3. What repository evidence proves the current behavior for navigation?
4. What repository evidence proves the current behavior for dashboards?
5. What repository evidence proves the current behavior for forms?
6. What repository evidence proves the current behavior for search/filter/sort?
7. What repository evidence proves the current behavior for bulk workflows?
8. What repository evidence proves the current behavior for admin/support workflows?
9. What repository evidence proves the current behavior for notifications?
10. What repository evidence proves the current behavior for preferences?

## Scope to analyze

- Onboarding
- Login/signup/reset
- Navigation
- Dashboards
- Forms
- Search/filter/sort
- Bulk workflows
- Admin/support workflows
- Notifications
- Preferences
- Error recovery
- Empty/loading states
- Destructive actions
- Session expiry
- Offline/poor network
- Help/support paths

## Required special checks

- Evaluate personas
- Review every critical workflow for clarity, recovery, required fields, and feedback
- Suggest UX copy improvements

## Required outputs and companion artifacts

- Persona table
- Workflow friction table
- High-friction areas
- UX copy suggestions
- Manual QA scenarios

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

- [ ] Reviewed Onboarding
- [ ] Reviewed Login/signup/reset
- [ ] Reviewed Navigation
- [ ] Reviewed Dashboards
- [ ] Reviewed Forms
- [ ] Reviewed Search/filter/sort
- [ ] Reviewed Bulk workflows
- [ ] Reviewed Admin/support workflows
- [ ] Reviewed Notifications
- [ ] Reviewed Preferences
- [ ] Reviewed Error recovery
- [ ] Reviewed Empty/loading states
- [ ] Reviewed Destructive actions
- [ ] Reviewed Session expiry
- [ ] Reviewed Offline/poor network
- [ ] Reviewed Help/support paths

## Required report structure

```markdown
# Usability and Workflow Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: USE
- Output path: docs/audits/{name}/{run}/04_usability_workflow_audit.md
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

| Category                | Score | Evidence | Gap | Recommended action |
| ----------------------- | ----: | -------- | --- | ------------------ |
| Onboarding              |   0-5 | Evidence | Gap | Recommended action |
| Login/signup/reset      |   0-5 | Evidence | Gap | Recommended action |
| Navigation              |   0-5 | Evidence | Gap | Recommended action |
| Dashboards              |   0-5 | Evidence | Gap | Recommended action |
| Forms                   |   0-5 | Evidence | Gap | Recommended action |
| Search/filter/sort      |   0-5 | Evidence | Gap | Recommended action |
| Bulk workflows          |   0-5 | Evidence | Gap | Recommended action |
| Admin/support workflows |   0-5 | Evidence | Gap | Recommended action |
| Notifications           |   0-5 | Evidence | Gap | Recommended action |
| Preferences             |   0-5 | Evidence | Gap | Recommended action |
| Error recovery          |   0-5 | Evidence | Gap | Recommended action |
| Empty/loading states    |   0-5 | Evidence | Gap | Recommended action |

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

| ID      | Scenario or control     | Evidence | Current control | Gap | Severity | Recommendation |
| ------- | ----------------------- | -------- | --------------- | --- | -------- | -------------- |
| USE-001 | Onboarding              | Evidence | Current control | Gap | Severity | Recommendation |
| USE-002 | Login/signup/reset      | Evidence | Current control | Gap | Severity | Recommendation |
| USE-003 | Navigation              | Evidence | Current control | Gap | Severity | Recommendation |
| USE-004 | Dashboards              | Evidence | Current control | Gap | Severity | Recommendation |
| USE-005 | Forms                   | Evidence | Current control | Gap | Severity | Recommendation |
| USE-006 | Search/filter/sort      | Evidence | Current control | Gap | Severity | Recommendation |
| USE-007 | Bulk workflows          | Evidence | Current control | Gap | Severity | Recommendation |
| USE-008 | Admin/support workflows | Evidence | Current control | Gap | Severity | Recommendation |
| USE-009 | Notifications           | Evidence | Current control | Gap | Severity | Recommendation |
| USE-010 | Preferences             | Evidence | Current control | Gap | Severity | Recommendation |
| USE-011 | Error recovery          | Evidence | Current control | Gap | Severity | Recommendation |
| USE-012 | Empty/loading states    | Evidence | Current control | Gap | Severity | Recommendation |

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
