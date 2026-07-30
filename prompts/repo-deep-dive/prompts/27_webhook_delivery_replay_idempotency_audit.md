# Prompt 27 - Webhook Delivery, Replay, and Idempotency Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit inbound/outbound webhooks for auth, signatures, replay protection, idempotency, retries, DLQ, tenant scoping, and observability.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/27_webhook_delivery_replay_idempotency_audit.md`

## Area code

Use finding IDs beginning with `WH`.

Examples:

- `WH-P0-001`
- `WH-P1-001`
- `WH-P2-001`
- `WH-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for inbound endpoints?
2. What repository evidence proves the current behavior for outbound delivery?
3. What repository evidence proves the current behavior for event models?
4. What repository evidence proves the current behavior for signature verification?
5. What repository evidence proves the current behavior for timestamp tolerance?
6. What repository evidence proves the current behavior for replay nonce?
7. What repository evidence proves the current behavior for idempotency keys?
8. What repository evidence proves the current behavior for retry backoff?
9. What repository evidence proves the current behavior for dead-letter queues?
10. What repository evidence proves the current behavior for secrets?

## Scope to analyze

- Inbound endpoints
- Outbound delivery
- Event models
- Signature verification
- Timestamp tolerance
- Replay nonce
- Idempotency keys
- Retry backoff
- Dead-letter queues
- Secrets
- Tenant scoping
- Payload schema/size
- Timeouts
- Delivery logs
- Admin management
- Secret rotation
- Tests/docs

## Required special checks

- Webhooks without signature or timestamp are high risk
- Retries require idempotency
- Failures must be visible to admins/operators

## Required outputs and companion artifacts

- Webhook inventory
- Signature/replay/idempotency findings
- Retry/DLQ review
- Webhook tests

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

- [ ] Reviewed Inbound endpoints
- [ ] Reviewed Outbound delivery
- [ ] Reviewed Event models
- [ ] Reviewed Signature verification
- [ ] Reviewed Timestamp tolerance
- [ ] Reviewed Replay nonce
- [ ] Reviewed Idempotency keys
- [ ] Reviewed Retry backoff
- [ ] Reviewed Dead-letter queues
- [ ] Reviewed Secrets
- [ ] Reviewed Tenant scoping
- [ ] Reviewed Payload schema/size
- [ ] Reviewed Timeouts
- [ ] Reviewed Delivery logs
- [ ] Reviewed Admin management
- [ ] Reviewed Secret rotation
- [ ] Reviewed Tests/docs

## Required report structure

```markdown
# Webhook Delivery, Replay, and Idempotency Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: WH
- Output path: docs/audits/{name}/{run}/27_webhook_delivery_replay_idempotency_audit.md
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

| Category               | Score | Evidence | Gap | Recommended action |
| ---------------------- | ----: | -------- | --- | ------------------ |
| Inbound endpoints      |   0-5 | Evidence | Gap | Recommended action |
| Outbound delivery      |   0-5 | Evidence | Gap | Recommended action |
| Event models           |   0-5 | Evidence | Gap | Recommended action |
| Signature verification |   0-5 | Evidence | Gap | Recommended action |
| Timestamp tolerance    |   0-5 | Evidence | Gap | Recommended action |
| Replay nonce           |   0-5 | Evidence | Gap | Recommended action |
| Idempotency keys       |   0-5 | Evidence | Gap | Recommended action |
| Retry backoff          |   0-5 | Evidence | Gap | Recommended action |
| Dead-letter queues     |   0-5 | Evidence | Gap | Recommended action |
| Secrets                |   0-5 | Evidence | Gap | Recommended action |
| Tenant scoping         |   0-5 | Evidence | Gap | Recommended action |
| Payload schema/size    |   0-5 | Evidence | Gap | Recommended action |

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

| ID     | Scenario or control    | Evidence | Current control | Gap | Severity | Recommendation |
| ------ | ---------------------- | -------- | --------------- | --- | -------- | -------------- |
| WH-001 | Inbound endpoints      | Evidence | Current control | Gap | Severity | Recommendation |
| WH-002 | Outbound delivery      | Evidence | Current control | Gap | Severity | Recommendation |
| WH-003 | Event models           | Evidence | Current control | Gap | Severity | Recommendation |
| WH-004 | Signature verification | Evidence | Current control | Gap | Severity | Recommendation |
| WH-005 | Timestamp tolerance    | Evidence | Current control | Gap | Severity | Recommendation |
| WH-006 | Replay nonce           | Evidence | Current control | Gap | Severity | Recommendation |
| WH-007 | Idempotency keys       | Evidence | Current control | Gap | Severity | Recommendation |
| WH-008 | Retry backoff          | Evidence | Current control | Gap | Severity | Recommendation |
| WH-009 | Dead-letter queues     | Evidence | Current control | Gap | Severity | Recommendation |
| WH-010 | Secrets                | Evidence | Current control | Gap | Severity | Recommendation |
| WH-011 | Tenant scoping         | Evidence | Current control | Gap | Severity | Recommendation |
| WH-012 | Payload schema/size    | Evidence | Current control | Gap | Severity | Recommendation |

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
