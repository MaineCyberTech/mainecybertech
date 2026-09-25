# Prompt 13 - Resilience, Recovery, and Failure Modes Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit failure behavior under partial outages, retries, crashes, migration failures, and recovery events.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/13_resilience_recovery_failure_modes.md`

## Area code

Use finding IDs beginning with `RES`.

Examples:

- `RES-P0-001`
- `RES-P1-001`
- `RES-P2-001`
- `RES-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for timeouts?
2. What repository evidence proves the current behavior for retries/backoff?
3. What repository evidence proves the current behavior for idempotency?
4. What repository evidence proves the current behavior for circuit breakers?
5. What repository evidence proves the current behavior for queue dlq?
6. What repository evidence proves the current behavior for webhook recovery?
7. What repository evidence proves the current behavior for worker recovery?
8. What repository evidence proves the current behavior for graceful shutdown?
9. What repository evidence proves the current behavior for db/redis/api/email/file/realtime failure?
10. What repository evidence proves the current behavior for offline client?

## Scope to analyze

- Timeouts
- Retries/backoff
- Idempotency
- Circuit breakers
- Queue DLQ
- Webhook recovery
- Worker recovery
- Graceful shutdown
- DB/Redis/API/email/file/realtime failure
- Offline client
- Transactions
- Partial writes
- Duplicate events
- Backups/restore
- Rollback
- Incident runbooks
- Failure injection/load tests

## Required special checks

- Look for infinite retries/no idempotency/no DLQ
- Map critical failure modes
- Recommend chaos/failure tests

## Required outputs and companion artifacts

- Failure mode inventory
- Critical path resilience matrix
- Recovery readiness
- Chaos test plan

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

- [ ] Reviewed Timeouts
- [ ] Reviewed Retries/backoff
- [ ] Reviewed Idempotency
- [ ] Reviewed Circuit breakers
- [ ] Reviewed Queue DLQ
- [ ] Reviewed Webhook recovery
- [ ] Reviewed Worker recovery
- [ ] Reviewed Graceful shutdown
- [ ] Reviewed DB/Redis/API/email/file/realtime failure
- [ ] Reviewed Offline client
- [ ] Reviewed Transactions
- [ ] Reviewed Partial writes
- [ ] Reviewed Duplicate events
- [ ] Reviewed Backups/restore
- [ ] Reviewed Rollback
- [ ] Reviewed Incident runbooks
- [ ] Reviewed Failure injection/load tests

## Required report structure

```markdown
# Resilience, Recovery, and Failure Modes Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: RES
- Output path: docs/audits/{name}/{run}/13_resilience_recovery_failure_modes.md
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

| Category                                 | Score | Evidence | Gap | Recommended action |
| ---------------------------------------- | ----: | -------- | --- | ------------------ |
| Timeouts                                 |   0-5 | Evidence | Gap | Recommended action |
| Retries/backoff                          |   0-5 | Evidence | Gap | Recommended action |
| Idempotency                              |   0-5 | Evidence | Gap | Recommended action |
| Circuit breakers                         |   0-5 | Evidence | Gap | Recommended action |
| Queue DLQ                                |   0-5 | Evidence | Gap | Recommended action |
| Webhook recovery                         |   0-5 | Evidence | Gap | Recommended action |
| Worker recovery                          |   0-5 | Evidence | Gap | Recommended action |
| Graceful shutdown                        |   0-5 | Evidence | Gap | Recommended action |
| DB/Redis/API/email/file/realtime failure |   0-5 | Evidence | Gap | Recommended action |
| Offline client                           |   0-5 | Evidence | Gap | Recommended action |
| Transactions                             |   0-5 | Evidence | Gap | Recommended action |
| Partial writes                           |   0-5 | Evidence | Gap | Recommended action |

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

| ID      | Scenario or control                      | Evidence | Current control | Gap | Severity | Recommendation |
| ------- | ---------------------------------------- | -------- | --------------- | --- | -------- | -------------- |
| RES-001 | Timeouts                                 | Evidence | Current control | Gap | Severity | Recommendation |
| RES-002 | Retries/backoff                          | Evidence | Current control | Gap | Severity | Recommendation |
| RES-003 | Idempotency                              | Evidence | Current control | Gap | Severity | Recommendation |
| RES-004 | Circuit breakers                         | Evidence | Current control | Gap | Severity | Recommendation |
| RES-005 | Queue DLQ                                | Evidence | Current control | Gap | Severity | Recommendation |
| RES-006 | Webhook recovery                         | Evidence | Current control | Gap | Severity | Recommendation |
| RES-007 | Worker recovery                          | Evidence | Current control | Gap | Severity | Recommendation |
| RES-008 | Graceful shutdown                        | Evidence | Current control | Gap | Severity | Recommendation |
| RES-009 | DB/Redis/API/email/file/realtime failure | Evidence | Current control | Gap | Severity | Recommendation |
| RES-010 | Offline client                           | Evidence | Current control | Gap | Severity | Recommendation |
| RES-011 | Transactions                             | Evidence | Current control | Gap | Severity | Recommendation |
| RES-012 | Partial writes                           | Evidence | Current control | Gap | Severity | Recommendation |

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
