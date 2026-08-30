# Prompt 29 - Billing, Payments, and Reconciliation Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit billing/subscription/payment references, plan state, entitlements, webhooks, reconciliation, and sensitive payment data handling.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/29_billing_payments_reconciliation_audit.md`

## Area code

Use finding IDs beginning with `BILL`.

Examples:

- `BILL-P0-001`
- `BILL-P1-001`
- `BILL-P2-001`
- `BILL-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for billing pages?
2. What repository evidence proves the current behavior for subscription/plan models?
3. What repository evidence proves the current behavior for entitlement checks?
4. What repository evidence proves the current behavior for billing apis?
5. What repository evidence proves the current behavior for payment provider integration?
6. What repository evidence proves the current behavior for webhooks?
7. What repository evidence proves the current behavior for invoices/status records?
8. What repository evidence proves the current behavior for reconciliation jobs?
9. What repository evidence proves the current behavior for failed payments?
10. What repository evidence proves the current behavior for refund/cancel/trial states?

## Scope to analyze

- Billing pages
- Subscription/plan models
- Entitlement checks
- Billing APIs
- Payment provider integration
- Webhooks
- Invoices/status records
- Reconciliation jobs
- Failed payments
- Refund/cancel/trial states
- Seat counts
- Usage billing
- Admin/customer UI
- Sensitive data
- Audit logs
- Tests/docs

## Required special checks

- If absent, produce future readiness report
- Gate entitlements server-side
- Webhook events must be idempotent and reconciled

## Required outputs and companion artifacts

- Billing feature inventory
- Subscription state review
- Entitlement review
- Reconciliation tests

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

- [ ] Reviewed Billing pages
- [ ] Reviewed Subscription/plan models
- [ ] Reviewed Entitlement checks
- [ ] Reviewed Billing APIs
- [ ] Reviewed Payment provider integration
- [ ] Reviewed Webhooks
- [ ] Reviewed Invoices/status records
- [ ] Reviewed Reconciliation jobs
- [ ] Reviewed Failed payments
- [ ] Reviewed Refund/cancel/trial states
- [ ] Reviewed Seat counts
- [ ] Reviewed Usage billing
- [ ] Reviewed Admin/customer UI
- [ ] Reviewed Sensitive data
- [ ] Reviewed Audit logs
- [ ] Reviewed Tests/docs

## Required report structure

```markdown
# Billing, Payments, and Reconciliation Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: BILL
- Output path: docs/audits/{name}/{run}/29_billing_payments_reconciliation_audit.md
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

| Category                     | Score | Evidence | Gap | Recommended action |
| ---------------------------- | ----: | -------- | --- | ------------------ |
| Billing pages                |   0-5 | Evidence | Gap | Recommended action |
| Subscription/plan models     |   0-5 | Evidence | Gap | Recommended action |
| Entitlement checks           |   0-5 | Evidence | Gap | Recommended action |
| Billing APIs                 |   0-5 | Evidence | Gap | Recommended action |
| Payment provider integration |   0-5 | Evidence | Gap | Recommended action |
| Webhooks                     |   0-5 | Evidence | Gap | Recommended action |
| Invoices/status records      |   0-5 | Evidence | Gap | Recommended action |
| Reconciliation jobs          |   0-5 | Evidence | Gap | Recommended action |
| Failed payments              |   0-5 | Evidence | Gap | Recommended action |
| Refund/cancel/trial states   |   0-5 | Evidence | Gap | Recommended action |
| Seat counts                  |   0-5 | Evidence | Gap | Recommended action |
| Usage billing                |   0-5 | Evidence | Gap | Recommended action |

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

| ID       | Scenario or control          | Evidence | Current control | Gap | Severity | Recommendation |
| -------- | ---------------------------- | -------- | --------------- | --- | -------- | -------------- |
| BILL-001 | Billing pages                | Evidence | Current control | Gap | Severity | Recommendation |
| BILL-002 | Subscription/plan models     | Evidence | Current control | Gap | Severity | Recommendation |
| BILL-003 | Entitlement checks           | Evidence | Current control | Gap | Severity | Recommendation |
| BILL-004 | Billing APIs                 | Evidence | Current control | Gap | Severity | Recommendation |
| BILL-005 | Payment provider integration | Evidence | Current control | Gap | Severity | Recommendation |
| BILL-006 | Webhooks                     | Evidence | Current control | Gap | Severity | Recommendation |
| BILL-007 | Invoices/status records      | Evidence | Current control | Gap | Severity | Recommendation |
| BILL-008 | Reconciliation jobs          | Evidence | Current control | Gap | Severity | Recommendation |
| BILL-009 | Failed payments              | Evidence | Current control | Gap | Severity | Recommendation |
| BILL-010 | Refund/cancel/trial states   | Evidence | Current control | Gap | Severity | Recommendation |
| BILL-011 | Seat counts                  | Evidence | Current control | Gap | Severity | Recommendation |
| BILL-012 | Usage billing                | Evidence | Current control | Gap | Severity | Recommendation |

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
