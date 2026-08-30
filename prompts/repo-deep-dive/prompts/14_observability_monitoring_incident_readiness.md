# Prompt 14 - Observability, Monitoring, and Incident Readiness Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit whether operators can detect, triage, debug, and recover from production issues.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/14_observability_monitoring_incident_readiness.md`

## Area code

Use finding IDs beginning with `OBS`.

Examples:

- `OBS-P0-001`
- `OBS-P1-001`
- `OBS-P2-001`
- `OBS-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for structured logs?
2. What repository evidence proves the current behavior for request ids/correlation?
3. What repository evidence proves the current behavior for error tracking?
4. What repository evidence proves the current behavior for metrics?
5. What repository evidence proves the current behavior for tracing?
6. What repository evidence proves the current behavior for health/readiness?
7. What repository evidence proves the current behavior for client/api/worker errors?
8. What repository evidence proves the current behavior for job metrics?
9. What repository evidence proves the current behavior for db/queue/webhook/notification metrics?
10. What repository evidence proves the current behavior for uptime checks?

## Scope to analyze

- Structured logs
- Request IDs/correlation
- Error tracking
- Metrics
- Tracing
- Health/readiness
- Client/API/worker errors
- Job metrics
- DB/queue/webhook/notification metrics
- Uptime checks
- Alerts
- Dashboards
- Incident runbooks
- Audit/security logs
- Release markers
- User-impact signals
- Data-quality signals

## Required special checks

- Evaluate golden signals
- Identify missing alerting/dashboards
- Recommend incident checklist and alerts

## Required outputs and companion artifacts

- Observability inventory
- Logging/metrics/tracing review
- Golden signals
- Suggested alerts
- Incident checklist

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

- [ ] Reviewed Structured logs
- [ ] Reviewed Request IDs/correlation
- [ ] Reviewed Error tracking
- [ ] Reviewed Metrics
- [ ] Reviewed Tracing
- [ ] Reviewed Health/readiness
- [ ] Reviewed Client/API/worker errors
- [ ] Reviewed Job metrics
- [ ] Reviewed DB/queue/webhook/notification metrics
- [ ] Reviewed Uptime checks
- [ ] Reviewed Alerts
- [ ] Reviewed Dashboards
- [ ] Reviewed Incident runbooks
- [ ] Reviewed Audit/security logs
- [ ] Reviewed Release markers
- [ ] Reviewed User-impact signals
- [ ] Reviewed Data-quality signals

## Required report structure

```markdown
# Observability, Monitoring, and Incident Readiness Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: OBS
- Output path: docs/audits/{name}/{run}/14_observability_monitoring_incident_readiness.md
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

| Category                              | Score | Evidence | Gap | Recommended action |
| ------------------------------------- | ----: | -------- | --- | ------------------ |
| Structured logs                       |   0-5 | Evidence | Gap | Recommended action |
| Request IDs/correlation               |   0-5 | Evidence | Gap | Recommended action |
| Error tracking                        |   0-5 | Evidence | Gap | Recommended action |
| Metrics                               |   0-5 | Evidence | Gap | Recommended action |
| Tracing                               |   0-5 | Evidence | Gap | Recommended action |
| Health/readiness                      |   0-5 | Evidence | Gap | Recommended action |
| Client/API/worker errors              |   0-5 | Evidence | Gap | Recommended action |
| Job metrics                           |   0-5 | Evidence | Gap | Recommended action |
| DB/queue/webhook/notification metrics |   0-5 | Evidence | Gap | Recommended action |
| Uptime checks                         |   0-5 | Evidence | Gap | Recommended action |
| Alerts                                |   0-5 | Evidence | Gap | Recommended action |
| Dashboards                            |   0-5 | Evidence | Gap | Recommended action |

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

| ID      | Scenario or control                   | Evidence | Current control | Gap | Severity | Recommendation |
| ------- | ------------------------------------- | -------- | --------------- | --- | -------- | -------------- |
| OBS-001 | Structured logs                       | Evidence | Current control | Gap | Severity | Recommendation |
| OBS-002 | Request IDs/correlation               | Evidence | Current control | Gap | Severity | Recommendation |
| OBS-003 | Error tracking                        | Evidence | Current control | Gap | Severity | Recommendation |
| OBS-004 | Metrics                               | Evidence | Current control | Gap | Severity | Recommendation |
| OBS-005 | Tracing                               | Evidence | Current control | Gap | Severity | Recommendation |
| OBS-006 | Health/readiness                      | Evidence | Current control | Gap | Severity | Recommendation |
| OBS-007 | Client/API/worker errors              | Evidence | Current control | Gap | Severity | Recommendation |
| OBS-008 | Job metrics                           | Evidence | Current control | Gap | Severity | Recommendation |
| OBS-009 | DB/queue/webhook/notification metrics | Evidence | Current control | Gap | Severity | Recommendation |
| OBS-010 | Uptime checks                         | Evidence | Current control | Gap | Severity | Recommendation |
| OBS-011 | Alerts                                | Evidence | Current control | Gap | Severity | Recommendation |
| OBS-012 | Dashboards                            | Evidence | Current control | Gap | Severity | Recommendation |

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
