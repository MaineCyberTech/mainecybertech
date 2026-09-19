# Prompt 30 - Notification, Email, and Push Delivery Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit in-app, email, push, reminders, alerts, preferences, retries, duplicates, and sensitive notification content.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/30_notification_email_push_delivery_audit.md`

## Area code

Use finding IDs beginning with `NOTIF`.

Examples:

- `NOTIF-P0-001`
- `NOTIF-P1-001`
- `NOTIF-P2-001`
- `NOTIF-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for notification models?
2. What repository evidence proves the current behavior for email templates?
3. What repository evidence proves the current behavior for push subscriptions?
4. What repository evidence proves the current behavior for vapid/config?
5. What repository evidence proves the current behavior for reminder jobs?
6. What repository evidence proves the current behavior for preferences?
7. What repository evidence proves the current behavior for tenant scoping?
8. What repository evidence proves the current behavior for unsubscribe/opt-out?
9. What repository evidence proves the current behavior for retries?
10. What repository evidence proves the current behavior for failure handling?

## Scope to analyze

- Notification models
- Email templates
- Push subscriptions
- VAPID/config
- Reminder jobs
- Preferences
- Tenant scoping
- Unsubscribe/opt-out
- Retries
- Failure handling
- Duplicate prevention
- Rate limiting
- Sensitive content
- Permission UX
- Sender config
- Worker queues
- Audit logs
- Tests/docs

## Required special checks

- Check preference/consent before sends
- Avoid sensitive content in previews
- Scheduled sends must be idempotent

## Required outputs and companion artifacts

- Notification channel inventory
- Preference review
- Delivery reliability review
- Push/email tests

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

- [ ] Reviewed Notification models
- [ ] Reviewed Email templates
- [ ] Reviewed Push subscriptions
- [ ] Reviewed VAPID/config
- [ ] Reviewed Reminder jobs
- [ ] Reviewed Preferences
- [ ] Reviewed Tenant scoping
- [ ] Reviewed Unsubscribe/opt-out
- [ ] Reviewed Retries
- [ ] Reviewed Failure handling
- [ ] Reviewed Duplicate prevention
- [ ] Reviewed Rate limiting
- [ ] Reviewed Sensitive content
- [ ] Reviewed Permission UX
- [ ] Reviewed Sender config
- [ ] Reviewed Worker queues
- [ ] Reviewed Audit logs
- [ ] Reviewed Tests/docs

## Required report structure

```markdown
# Notification, Email, and Push Delivery Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: NOTIF
- Output path: docs/audits/{name}/{run}/30_notification_email_push_delivery_audit.md
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

| Category             | Score | Evidence | Gap | Recommended action |
| -------------------- | ----: | -------- | --- | ------------------ |
| Notification models  |   0-5 | Evidence | Gap | Recommended action |
| Email templates      |   0-5 | Evidence | Gap | Recommended action |
| Push subscriptions   |   0-5 | Evidence | Gap | Recommended action |
| VAPID/config         |   0-5 | Evidence | Gap | Recommended action |
| Reminder jobs        |   0-5 | Evidence | Gap | Recommended action |
| Preferences          |   0-5 | Evidence | Gap | Recommended action |
| Tenant scoping       |   0-5 | Evidence | Gap | Recommended action |
| Unsubscribe/opt-out  |   0-5 | Evidence | Gap | Recommended action |
| Retries              |   0-5 | Evidence | Gap | Recommended action |
| Failure handling     |   0-5 | Evidence | Gap | Recommended action |
| Duplicate prevention |   0-5 | Evidence | Gap | Recommended action |
| Rate limiting        |   0-5 | Evidence | Gap | Recommended action |

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

| ID        | Scenario or control  | Evidence | Current control | Gap | Severity | Recommendation |
| --------- | -------------------- | -------- | --------------- | --- | -------- | -------------- |
| NOTIF-001 | Notification models  | Evidence | Current control | Gap | Severity | Recommendation |
| NOTIF-002 | Email templates      | Evidence | Current control | Gap | Severity | Recommendation |
| NOTIF-003 | Push subscriptions   | Evidence | Current control | Gap | Severity | Recommendation |
| NOTIF-004 | VAPID/config         | Evidence | Current control | Gap | Severity | Recommendation |
| NOTIF-005 | Reminder jobs        | Evidence | Current control | Gap | Severity | Recommendation |
| NOTIF-006 | Preferences          | Evidence | Current control | Gap | Severity | Recommendation |
| NOTIF-007 | Tenant scoping       | Evidence | Current control | Gap | Severity | Recommendation |
| NOTIF-008 | Unsubscribe/opt-out  | Evidence | Current control | Gap | Severity | Recommendation |
| NOTIF-009 | Retries              | Evidence | Current control | Gap | Severity | Recommendation |
| NOTIF-010 | Failure handling     | Evidence | Current control | Gap | Severity | Recommendation |
| NOTIF-011 | Duplicate prevention | Evidence | Current control | Gap | Severity | Recommendation |
| NOTIF-012 | Rate limiting        | Evidence | Current control | Gap | Severity | Recommendation |

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
