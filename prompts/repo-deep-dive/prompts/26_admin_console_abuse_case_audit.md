# Prompt 26 - Admin Console Abuse Case Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit admin/operator surfaces for misuse, accidental damage, privilege escalation, unsafe bulk actions, and weak audit logging.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/26_admin_console_abuse_case_audit.md`

## Area code

Use finding IDs beginning with `ADMIN`.

Examples:

- `ADMIN-P0-001`
- `ADMIN-P1-001`
- `ADMIN-P2-001`
- `ADMIN-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for admin pages/apis?
2. What repository evidence proves the current behavior for user/org/role management?
3. What repository evidence proves the current behavior for billing panels?
4. What repository evidence proves the current behavior for document/ticket admin?
5. What repository evidence proves the current behavior for webhook/api key admin?
6. What repository evidence proves the current behavior for bulk ops?
7. What repository evidence proves the current behavior for approval flows?
8. What repository evidence proves the current behavior for impersonation?
9. What repository evidence proves the current behavior for settings?
10. What repository evidence proves the current behavior for exports?

## Scope to analyze

- Admin pages/APIs
- User/org/role management
- Billing panels
- Document/ticket admin
- Webhook/API key admin
- Bulk ops
- Approval flows
- Impersonation
- Settings
- Exports
- Destructive actions
- Confirmations
- Permissions
- Rate limits
- Undo/recovery
- Tests

## Required special checks

- Find self-privilege escalation
- Flag bulk operations without preview
- Check audit logs for role/delete/export actions

## Required outputs and companion artifacts

- Admin surface inventory
- Abuse case matrix
- Destructive action review
- Guardrail recommendations

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

- [ ] Reviewed Admin pages/APIs
- [ ] Reviewed User/org/role management
- [ ] Reviewed Billing panels
- [ ] Reviewed Document/ticket admin
- [ ] Reviewed Webhook/API key admin
- [ ] Reviewed Bulk ops
- [ ] Reviewed Approval flows
- [ ] Reviewed Impersonation
- [ ] Reviewed Settings
- [ ] Reviewed Exports
- [ ] Reviewed Destructive actions
- [ ] Reviewed Confirmations
- [ ] Reviewed Permissions
- [ ] Reviewed Rate limits
- [ ] Reviewed Undo/recovery
- [ ] Reviewed Tests

## Required report structure

```markdown
# Admin Console Abuse Case Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: ADMIN
- Output path: docs/audits/{name}/{run}/26_admin_console_abuse_case_audit.md
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

| Category                 | Score | Evidence | Gap | Recommended action |
| ------------------------ | ----: | -------- | --- | ------------------ |
| Admin pages/APIs         |   0-5 | Evidence | Gap | Recommended action |
| User/org/role management |   0-5 | Evidence | Gap | Recommended action |
| Billing panels           |   0-5 | Evidence | Gap | Recommended action |
| Document/ticket admin    |   0-5 | Evidence | Gap | Recommended action |
| Webhook/API key admin    |   0-5 | Evidence | Gap | Recommended action |
| Bulk ops                 |   0-5 | Evidence | Gap | Recommended action |
| Approval flows           |   0-5 | Evidence | Gap | Recommended action |
| Impersonation            |   0-5 | Evidence | Gap | Recommended action |
| Settings                 |   0-5 | Evidence | Gap | Recommended action |
| Exports                  |   0-5 | Evidence | Gap | Recommended action |
| Destructive actions      |   0-5 | Evidence | Gap | Recommended action |
| Confirmations            |   0-5 | Evidence | Gap | Recommended action |

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

| ID        | Scenario or control      | Evidence | Current control | Gap | Severity | Recommendation |
| --------- | ------------------------ | -------- | --------------- | --- | -------- | -------------- |
| ADMIN-001 | Admin pages/APIs         | Evidence | Current control | Gap | Severity | Recommendation |
| ADMIN-002 | User/org/role management | Evidence | Current control | Gap | Severity | Recommendation |
| ADMIN-003 | Billing panels           | Evidence | Current control | Gap | Severity | Recommendation |
| ADMIN-004 | Document/ticket admin    | Evidence | Current control | Gap | Severity | Recommendation |
| ADMIN-005 | Webhook/API key admin    | Evidence | Current control | Gap | Severity | Recommendation |
| ADMIN-006 | Bulk ops                 | Evidence | Current control | Gap | Severity | Recommendation |
| ADMIN-007 | Approval flows           | Evidence | Current control | Gap | Severity | Recommendation |
| ADMIN-008 | Impersonation            | Evidence | Current control | Gap | Severity | Recommendation |
| ADMIN-009 | Settings                 | Evidence | Current control | Gap | Severity | Recommendation |
| ADMIN-010 | Exports                  | Evidence | Current control | Gap | Severity | Recommendation |
| ADMIN-011 | Destructive actions      | Evidence | Current control | Gap | Severity | Recommendation |
| ADMIN-012 | Confirmations            | Evidence | Current control | Gap | Severity | Recommendation |

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
