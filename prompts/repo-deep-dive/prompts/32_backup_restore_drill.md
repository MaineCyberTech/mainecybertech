# Prompt 32 - Backup and Restore Drill Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit backup/restore readiness and produce practical disaster recovery drill plan.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/32_backup_restore_drill.md`

## Area code

Use finding IDs beginning with `DR`.

Examples:

- `DR-P0-001`
- `DR-P1-001`
- `DR-P2-001`
- `DR-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for database backups?
2. What repository evidence proves the current behavior for supabase restore docs?
3. What repository evidence proves the current behavior for storage backups?
4. What repository evidence proves the current behavior for uploaded docs/files?
5. What repository evidence proves the current behavior for secrets backup?
6. What repository evidence proves the current behavior for infra config?
7. What repository evidence proves the current behavior for migration rollback?
8. What repository evidence proves the current behavior for export tools?
9. What repository evidence proves the current behavior for seeds?
10. What repository evidence proves the current behavior for restore scripts?

## Scope to analyze

- Database backups
- Supabase restore docs
- Storage backups
- Uploaded docs/files
- Secrets backup
- Infra config
- Migration rollback
- Export tools
- Seeds
- Restore scripts
- DR runbooks
- RPO/RTO
- Validation tests
- Backup access controls
- Encryption
- Local/staging/prod restore guardrails

## Required special checks

- Backups are insufficient unless restore is tested
- Include tenant integrity validation after restore
- Include bad migration drill

## Required outputs and companion artifacts

- `backup_restore_drill_plan.md`
- Backup inventory
- Restore dependency inventory
- Drill plans
- Verification checklist

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

- [ ] Reviewed Database backups
- [ ] Reviewed Supabase restore docs
- [ ] Reviewed Storage backups
- [ ] Reviewed Uploaded docs/files
- [ ] Reviewed Secrets backup
- [ ] Reviewed Infra config
- [ ] Reviewed Migration rollback
- [ ] Reviewed Export tools
- [ ] Reviewed Seeds
- [ ] Reviewed Restore scripts
- [ ] Reviewed DR runbooks
- [ ] Reviewed RPO/RTO
- [ ] Reviewed Validation tests
- [ ] Reviewed Backup access controls
- [ ] Reviewed Encryption
- [ ] Reviewed Local/staging/prod restore guardrails

## Required report structure

```markdown
# Backup and Restore Drill Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: DR
- Output path: docs/audits/{name}/{run}/32_backup_restore_drill.md
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
| Database backups      |   0-5 | Evidence | Gap | Recommended action |
| Supabase restore docs |   0-5 | Evidence | Gap | Recommended action |
| Storage backups       |   0-5 | Evidence | Gap | Recommended action |
| Uploaded docs/files   |   0-5 | Evidence | Gap | Recommended action |
| Secrets backup        |   0-5 | Evidence | Gap | Recommended action |
| Infra config          |   0-5 | Evidence | Gap | Recommended action |
| Migration rollback    |   0-5 | Evidence | Gap | Recommended action |
| Export tools          |   0-5 | Evidence | Gap | Recommended action |
| Seeds                 |   0-5 | Evidence | Gap | Recommended action |
| Restore scripts       |   0-5 | Evidence | Gap | Recommended action |
| DR runbooks           |   0-5 | Evidence | Gap | Recommended action |
| RPO/RTO               |   0-5 | Evidence | Gap | Recommended action |

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

| ID     | Scenario or control   | Evidence | Current control | Gap | Severity | Recommendation |
| ------ | --------------------- | -------- | --------------- | --- | -------- | -------------- |
| DR-001 | Database backups      | Evidence | Current control | Gap | Severity | Recommendation |
| DR-002 | Supabase restore docs | Evidence | Current control | Gap | Severity | Recommendation |
| DR-003 | Storage backups       | Evidence | Current control | Gap | Severity | Recommendation |
| DR-004 | Uploaded docs/files   | Evidence | Current control | Gap | Severity | Recommendation |
| DR-005 | Secrets backup        | Evidence | Current control | Gap | Severity | Recommendation |
| DR-006 | Infra config          | Evidence | Current control | Gap | Severity | Recommendation |
| DR-007 | Migration rollback    | Evidence | Current control | Gap | Severity | Recommendation |
| DR-008 | Export tools          | Evidence | Current control | Gap | Severity | Recommendation |
| DR-009 | Seeds                 | Evidence | Current control | Gap | Severity | Recommendation |
| DR-010 | Restore scripts       | Evidence | Current control | Gap | Severity | Recommendation |
| DR-011 | DR runbooks           | Evidence | Current control | Gap | Severity | Recommendation |
| DR-012 | RPO/RTO               | Evidence | Current control | Gap | Severity | Recommendation |

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
