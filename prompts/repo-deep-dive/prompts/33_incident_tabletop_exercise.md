# Prompt 33 - Incident Tabletop Exercise

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Create and evaluate incident response tabletop exercises based on repository architecture, risks, and operations model.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/33_incident_tabletop_exercise.md`

## Area code

Use finding IDs beginning with `IR`.

Examples:

- `IR-P0-001`
- `IR-P1-001`
- `IR-P2-001`
- `IR-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for incident docs?
2. What repository evidence proves the current behavior for monitoring/alerting?
3. What repository evidence proves the current behavior for rollback?
4. What repository evidence proves the current behavior for security docs?
5. What repository evidence proves the current behavior for deployment docs?
6. What repository evidence proves the current behavior for operator docs?
7. What repository evidence proves the current behavior for data breach process?
8. What repository evidence proves the current behavior for backups?
9. What repository evidence proves the current behavior for audit logs?
10. What repository evidence proves the current behavior for observability?

## Scope to analyze

- Incident docs
- Monitoring/alerting
- Rollback
- Security docs
- Deployment docs
- Operator docs
- Data breach process
- Backups
- Audit logs
- Observability
- CI/CD failures
- Admin abuse
- Tenant isolation
- Webhook/payment/notification failures

## Required special checks

- Include roles, severity, containment, communication, postmortem
- Cover at least eight scenarios
- Provide templates

## Required outputs and companion artifacts

- `incident_tabletop_scenarios.md`
- Incident readiness inventory
- Scenario catalog
- Communication templates

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

- [ ] Reviewed Incident docs
- [ ] Reviewed Monitoring/alerting
- [ ] Reviewed Rollback
- [ ] Reviewed Security docs
- [ ] Reviewed Deployment docs
- [ ] Reviewed Operator docs
- [ ] Reviewed Data breach process
- [ ] Reviewed Backups
- [ ] Reviewed Audit logs
- [ ] Reviewed Observability
- [ ] Reviewed CI/CD failures
- [ ] Reviewed Admin abuse
- [ ] Reviewed Tenant isolation
- [ ] Reviewed Webhook/payment/notification failures

## Required report structure

```markdown
# Incident Tabletop Exercise

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: IR
- Output path: docs/audits/{name}/{run}/33_incident_tabletop_exercise.md
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

| Category            | Score | Evidence | Gap | Recommended action |
| ------------------- | ----: | -------- | --- | ------------------ |
| Incident docs       |   0-5 | Evidence | Gap | Recommended action |
| Monitoring/alerting |   0-5 | Evidence | Gap | Recommended action |
| Rollback            |   0-5 | Evidence | Gap | Recommended action |
| Security docs       |   0-5 | Evidence | Gap | Recommended action |
| Deployment docs     |   0-5 | Evidence | Gap | Recommended action |
| Operator docs       |   0-5 | Evidence | Gap | Recommended action |
| Data breach process |   0-5 | Evidence | Gap | Recommended action |
| Backups             |   0-5 | Evidence | Gap | Recommended action |
| Audit logs          |   0-5 | Evidence | Gap | Recommended action |
| Observability       |   0-5 | Evidence | Gap | Recommended action |
| CI/CD failures      |   0-5 | Evidence | Gap | Recommended action |
| Admin abuse         |   0-5 | Evidence | Gap | Recommended action |

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
| IR-001 | Incident docs       | Evidence | Current control | Gap | Severity | Recommendation |
| IR-002 | Monitoring/alerting | Evidence | Current control | Gap | Severity | Recommendation |
| IR-003 | Rollback            | Evidence | Current control | Gap | Severity | Recommendation |
| IR-004 | Security docs       | Evidence | Current control | Gap | Severity | Recommendation |
| IR-005 | Deployment docs     | Evidence | Current control | Gap | Severity | Recommendation |
| IR-006 | Operator docs       | Evidence | Current control | Gap | Severity | Recommendation |
| IR-007 | Data breach process | Evidence | Current control | Gap | Severity | Recommendation |
| IR-008 | Backups             | Evidence | Current control | Gap | Severity | Recommendation |
| IR-009 | Audit logs          | Evidence | Current control | Gap | Severity | Recommendation |
| IR-010 | Observability       | Evidence | Current control | Gap | Severity | Recommendation |
| IR-011 | CI/CD failures      | Evidence | Current control | Gap | Severity | Recommendation |
| IR-012 | Admin abuse         | Evidence | Current control | Gap | Severity | Recommendation |

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
