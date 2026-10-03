# Prompt 39 - Analytics, Tracking, and Privacy Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit analytics, telemetry, tracking scripts, event capture, cookies, consent, PII handling, and data minimization.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/39_analytics_tracking_privacy.md`

## Area code

Use finding IDs beginning with `AN`.

Examples:

- `AN-P0-001`
- `AN-P1-001`
- `AN-P2-001`
- `AN-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for analytics scripts?
2. What repository evidence proves the current behavior for tracking pixels?
3. What repository evidence proves the current behavior for events?
4. What repository evidence proves the current behavior for product analytics?
5. What repository evidence proves the current behavior for error telemetry?
6. What repository evidence proves the current behavior for session replay?
7. What repository evidence proves the current behavior for cookie banner?
8. What repository evidence proves the current behavior for consent?
9. What repository evidence proves the current behavior for opt-in/out?
10. What repository evidence proves the current behavior for user/tenant ids?

## Scope to analyze

- Analytics scripts
- Tracking pixels
- Events
- Product analytics
- Error telemetry
- Session replay
- Cookie banner
- Consent
- Opt-in/out
- User/tenant IDs
- Sensitive payloads
- Page views
- Admin tracking
- Marketing lead tracking
- Policies
- Retention
- Vendor list
- Do-not-track
- Tests/docs

## Required special checks

- If absent, produce future readiness report
- Third-party scripts should honor consent
- Avoid PII/sensitive event payloads

## Required outputs and companion artifacts

- Analytics inventory
- Event payload review
- Consent review
- Governance policy
- Tests

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

- [ ] Reviewed Analytics scripts
- [ ] Reviewed Tracking pixels
- [ ] Reviewed Events
- [ ] Reviewed Product analytics
- [ ] Reviewed Error telemetry
- [ ] Reviewed Session replay
- [ ] Reviewed Cookie banner
- [ ] Reviewed Consent
- [ ] Reviewed Opt-in/out
- [ ] Reviewed User/tenant IDs
- [ ] Reviewed Sensitive payloads
- [ ] Reviewed Page views
- [ ] Reviewed Admin tracking
- [ ] Reviewed Marketing lead tracking
- [ ] Reviewed Policies
- [ ] Reviewed Retention
- [ ] Reviewed Vendor list
- [ ] Reviewed Do-not-track
- [ ] Reviewed Tests/docs

## Required report structure

```markdown
# Analytics, Tracking, and Privacy Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: AN
- Output path: docs/audits/{name}/{run}/39_analytics_tracking_privacy.md
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
| Analytics scripts  |   0-5 | Evidence | Gap | Recommended action |
| Tracking pixels    |   0-5 | Evidence | Gap | Recommended action |
| Events             |   0-5 | Evidence | Gap | Recommended action |
| Product analytics  |   0-5 | Evidence | Gap | Recommended action |
| Error telemetry    |   0-5 | Evidence | Gap | Recommended action |
| Session replay     |   0-5 | Evidence | Gap | Recommended action |
| Cookie banner      |   0-5 | Evidence | Gap | Recommended action |
| Consent            |   0-5 | Evidence | Gap | Recommended action |
| Opt-in/out         |   0-5 | Evidence | Gap | Recommended action |
| User/tenant IDs    |   0-5 | Evidence | Gap | Recommended action |
| Sensitive payloads |   0-5 | Evidence | Gap | Recommended action |
| Page views         |   0-5 | Evidence | Gap | Recommended action |

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

| ID     | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
| ------ | ------------------- | -------- | --------------- | --- | -------- | -------------- |
| AN-001 | Analytics scripts   | Evidence | Current control | Gap | Severity | Recommendation |
| AN-002 | Tracking pixels     | Evidence | Current control | Gap | Severity | Recommendation |
| AN-003 | Events              | Evidence | Current control | Gap | Severity | Recommendation |
| AN-004 | Product analytics   | Evidence | Current control | Gap | Severity | Recommendation |
| AN-005 | Error telemetry     | Evidence | Current control | Gap | Severity | Recommendation |
| AN-006 | Session replay      | Evidence | Current control | Gap | Severity | Recommendation |
| AN-007 | Cookie banner       | Evidence | Current control | Gap | Severity | Recommendation |
| AN-008 | Consent             | Evidence | Current control | Gap | Severity | Recommendation |
| AN-009 | Opt-in/out          | Evidence | Current control | Gap | Severity | Recommendation |
| AN-010 | User/tenant IDs     | Evidence | Current control | Gap | Severity | Recommendation |
| AN-011 | Sensitive payloads  | Evidence | Current control | Gap | Severity | Recommendation |
| AN-012 | Page views          | Evidence | Current control | Gap | Severity | Recommendation |

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
