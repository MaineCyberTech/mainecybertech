# Prompt 18 - Privacy, Compliance, and Data Governance Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit privacy, data governance, auditability, retention, consent, export/deletion, and compliance readiness.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/18_privacy_compliance_data_governance.md`

## Area code

Use finding IDs beginning with `PRIV`.

Examples:

- `PRIV-P0-001`
- `PRIV-P1-001`
- `PRIV-P2-001`
- `PRIV-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for personal/sensitive data?
2. What repository evidence proves the current behavior for auth records?
3. What repository evidence proves the current behavior for audit logs?
4. What repository evidence proves the current behavior for admin actions?
5. What repository evidence proves the current behavior for billing/payment refs?
6. What repository evidence proves the current behavior for uploaded docs?
7. What repository evidence proves the current behavior for user content?
8. What repository evidence proves the current behavior for export/deletion?
9. What repository evidence proves the current behavior for retention?
10. What repository evidence proves the current behavior for consent/cookie flows?

## Scope to analyze

- Personal/sensitive data
- Auth records
- Audit logs
- Admin actions
- Billing/payment refs
- Uploaded docs
- User content
- Export/deletion
- Retention
- Consent/cookie flows
- Policies/terms
- Access controls
- Encryption assumptions
- Backups
- Incident response
- Vendor data inventory
- Data processing integrations

## Required special checks

- Use SOC2/ISO27001/NIST/CIS/OWASP/CCPA/GDPR/HIPAA/PCI/CMMC as readiness lenses only
- Do not claim formal compliance
- Identify policy/docs needed

## Required outputs and companion artifacts

- Data classification inventory
- Control readiness matrix
- Privacy workflow review
- Governance recommendations

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

- [ ] Reviewed Personal/sensitive data
- [ ] Reviewed Auth records
- [ ] Reviewed Audit logs
- [ ] Reviewed Admin actions
- [ ] Reviewed Billing/payment refs
- [ ] Reviewed Uploaded docs
- [ ] Reviewed User content
- [ ] Reviewed Export/deletion
- [ ] Reviewed Retention
- [ ] Reviewed Consent/cookie flows
- [ ] Reviewed Policies/terms
- [ ] Reviewed Access controls
- [ ] Reviewed Encryption assumptions
- [ ] Reviewed Backups
- [ ] Reviewed Incident response
- [ ] Reviewed Vendor data inventory
- [ ] Reviewed Data processing integrations

## Required report structure

```markdown
# Privacy, Compliance, and Data Governance Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: PRIV
- Output path: docs/audits/{name}/{run}/18_privacy_compliance_data_governance.md
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
| Personal/sensitive data |   0-5 | Evidence | Gap | Recommended action |
| Auth records            |   0-5 | Evidence | Gap | Recommended action |
| Audit logs              |   0-5 | Evidence | Gap | Recommended action |
| Admin actions           |   0-5 | Evidence | Gap | Recommended action |
| Billing/payment refs    |   0-5 | Evidence | Gap | Recommended action |
| Uploaded docs           |   0-5 | Evidence | Gap | Recommended action |
| User content            |   0-5 | Evidence | Gap | Recommended action |
| Export/deletion         |   0-5 | Evidence | Gap | Recommended action |
| Retention               |   0-5 | Evidence | Gap | Recommended action |
| Consent/cookie flows    |   0-5 | Evidence | Gap | Recommended action |
| Policies/terms          |   0-5 | Evidence | Gap | Recommended action |
| Access controls         |   0-5 | Evidence | Gap | Recommended action |

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

| ID       | Scenario or control     | Evidence | Current control | Gap | Severity | Recommendation |
| -------- | ----------------------- | -------- | --------------- | --- | -------- | -------------- |
| PRIV-001 | Personal/sensitive data | Evidence | Current control | Gap | Severity | Recommendation |
| PRIV-002 | Auth records            | Evidence | Current control | Gap | Severity | Recommendation |
| PRIV-003 | Audit logs              | Evidence | Current control | Gap | Severity | Recommendation |
| PRIV-004 | Admin actions           | Evidence | Current control | Gap | Severity | Recommendation |
| PRIV-005 | Billing/payment refs    | Evidence | Current control | Gap | Severity | Recommendation |
| PRIV-006 | Uploaded docs           | Evidence | Current control | Gap | Severity | Recommendation |
| PRIV-007 | User content            | Evidence | Current control | Gap | Severity | Recommendation |
| PRIV-008 | Export/deletion         | Evidence | Current control | Gap | Severity | Recommendation |
| PRIV-009 | Retention               | Evidence | Current control | Gap | Severity | Recommendation |
| PRIV-010 | Consent/cookie flows    | Evidence | Current control | Gap | Severity | Recommendation |
| PRIV-011 | Policies/terms          | Evidence | Current control | Gap | Severity | Recommendation |
| PRIV-012 | Access controls         | Evidence | Current control | Gap | Severity | Recommendation |

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
