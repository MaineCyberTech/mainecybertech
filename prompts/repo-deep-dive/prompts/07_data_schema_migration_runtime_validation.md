# Prompt 07 - Data, Schema, Migration, and Runtime Validation Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit schema design, migrations, constraints, indexes, runtime validators, config validation, and data lifecycle safety.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/07_data_schema_migration_runtime_validation.md`

## Area code

Use finding IDs beginning with `DATA`.

Examples:

- `DATA-P0-001`
- `DATA-P1-001`
- `DATA-P2-001`
- `DATA-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for database schema?
2. What repository evidence proves the current behavior for migrations?
3. What repository evidence proves the current behavior for constraints?
4. What repository evidence proves the current behavior for indexes?
5. What repository evidence proves the current behavior for foreign keys/cascades?
6. What repository evidence proves the current behavior for rls?
7. What repository evidence proves the current behavior for tenant columns?
8. What repository evidence proves the current behavior for soft deletes?
9. What repository evidence proves the current behavior for audit fields?
10. What repository evidence proves the current behavior for retention?

## Scope to analyze

- Database schema
- Migrations
- Constraints
- Indexes
- Foreign keys/cascades
- RLS
- Tenant columns
- Soft deletes
- Audit fields
- Retention
- Seeds/fixtures
- Generated DB types
- ORM/client usage
- Request/response validators
- Env/config validation
- JSON schema
- Migration CI
- Rollback/drift/backup

## Required special checks

- Find app assumptions not enforced by DB
- Detect nullable/enum drift
- Review migration reversibility and lock risk
- Recommend validation tests

## Required outputs and companion artifacts

- Data model inventory
- Migration inventory
- Runtime validation inventory
- Schema evolution roadmap

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

- [ ] Reviewed Database schema
- [ ] Reviewed Migrations
- [ ] Reviewed Constraints
- [ ] Reviewed Indexes
- [ ] Reviewed Foreign keys/cascades
- [ ] Reviewed RLS
- [ ] Reviewed Tenant columns
- [ ] Reviewed Soft deletes
- [ ] Reviewed Audit fields
- [ ] Reviewed Retention
- [ ] Reviewed Seeds/fixtures
- [ ] Reviewed Generated DB types
- [ ] Reviewed ORM/client usage
- [ ] Reviewed Request/response validators
- [ ] Reviewed Env/config validation
- [ ] Reviewed JSON schema
- [ ] Reviewed Migration CI
- [ ] Reviewed Rollback/drift/backup

## Required report structure

```markdown
# Data, Schema, Migration, and Runtime Validation Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: DATA
- Output path: docs/audits/{name}/{run}/07_data_schema_migration_runtime_validation.md
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

| Category              | Score | Evidence | Gap | Recommended action |
| --------------------- | ----: | -------- | --- | ------------------ |
| Database schema       |   0-5 | Evidence | Gap | Recommended action |
| Migrations            |   0-5 | Evidence | Gap | Recommended action |
| Constraints           |   0-5 | Evidence | Gap | Recommended action |
| Indexes               |   0-5 | Evidence | Gap | Recommended action |
| Foreign keys/cascades |   0-5 | Evidence | Gap | Recommended action |
| RLS                   |   0-5 | Evidence | Gap | Recommended action |
| Tenant columns        |   0-5 | Evidence | Gap | Recommended action |
| Soft deletes          |   0-5 | Evidence | Gap | Recommended action |
| Audit fields          |   0-5 | Evidence | Gap | Recommended action |
| Retention             |   0-5 | Evidence | Gap | Recommended action |
| Seeds/fixtures        |   0-5 | Evidence | Gap | Recommended action |
| Generated DB types    |   0-5 | Evidence | Gap | Recommended action |

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

| ID       | Scenario or control   | Evidence | Current control | Gap | Severity | Recommendation |
| -------- | --------------------- | -------- | --------------- | --- | -------- | -------------- |
| DATA-001 | Database schema       | Evidence | Current control | Gap | Severity | Recommendation |
| DATA-002 | Migrations            | Evidence | Current control | Gap | Severity | Recommendation |
| DATA-003 | Constraints           | Evidence | Current control | Gap | Severity | Recommendation |
| DATA-004 | Indexes               | Evidence | Current control | Gap | Severity | Recommendation |
| DATA-005 | Foreign keys/cascades | Evidence | Current control | Gap | Severity | Recommendation |
| DATA-006 | RLS                   | Evidence | Current control | Gap | Severity | Recommendation |
| DATA-007 | Tenant columns        | Evidence | Current control | Gap | Severity | Recommendation |
| DATA-008 | Soft deletes          | Evidence | Current control | Gap | Severity | Recommendation |
| DATA-009 | Audit fields          | Evidence | Current control | Gap | Severity | Recommendation |
| DATA-010 | Retention             | Evidence | Current control | Gap | Severity | Recommendation |
| DATA-011 | Seeds/fixtures        | Evidence | Current control | Gap | Severity | Recommendation |
| DATA-012 | Generated DB types    | Evidence | Current control | Gap | Severity | Recommendation |

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
