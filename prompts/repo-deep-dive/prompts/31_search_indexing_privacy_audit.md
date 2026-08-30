# Prompt 31 - Search, Indexing, and Privacy Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit search/indexing features for authorization, tenant isolation, sensitive fields, deletion, analytics, and privacy.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/31_search_indexing_privacy_audit.md`

## Area code

Use finding IDs beginning with `SEARCH`.

Examples:

- `SEARCH-P0-001`
- `SEARCH-P1-001`
- `SEARCH-P2-001`
- `SEARCH-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for search routes/ui?
2. What repository evidence proves the current behavior for indexes?
3. What repository evidence proves the current behavior for indexing jobs?
4. What repository evidence proves the current behavior for indexed fields?
5. What repository evidence proves the current behavior for tenant filters?
6. What repository evidence proves the current behavior for permission filters?
7. What repository evidence proves the current behavior for document/ticket/project/message search?
8. What repository evidence proves the current behavior for admin/global search?
9. What repository evidence proves the current behavior for autocomplete?
10. What repository evidence proves the current behavior for search logs?

## Scope to analyze

- Search routes/UI
- Indexes
- Indexing jobs
- Indexed fields
- Tenant filters
- Permission filters
- Document/ticket/project/message search
- Admin/global search
- Autocomplete
- Search logs
- Query analytics
- Deleted data removal
- Reindexing
- External provider
- Tests/docs

## Required special checks

- Search filters must be server-side
- Indexes need tenant scope
- Deleted/private sensitive data must not remain searchable

## Required outputs and companion artifacts

- Search surface inventory
- Indexed data inventory
- Authorization review
- Privacy tests

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

- [ ] Reviewed Search routes/UI
- [ ] Reviewed Indexes
- [ ] Reviewed Indexing jobs
- [ ] Reviewed Indexed fields
- [ ] Reviewed Tenant filters
- [ ] Reviewed Permission filters
- [ ] Reviewed Document/ticket/project/message search
- [ ] Reviewed Admin/global search
- [ ] Reviewed Autocomplete
- [ ] Reviewed Search logs
- [ ] Reviewed Query analytics
- [ ] Reviewed Deleted data removal
- [ ] Reviewed Reindexing
- [ ] Reviewed External provider
- [ ] Reviewed Tests/docs

## Required report structure

```markdown
# Search, Indexing, and Privacy Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: SEARCH
- Output path: docs/audits/{name}/{run}/31_search_indexing_privacy_audit.md
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

| Category                               | Score | Evidence | Gap | Recommended action |
| -------------------------------------- | ----: | -------- | --- | ------------------ |
| Search routes/UI                       |   0-5 | Evidence | Gap | Recommended action |
| Indexes                                |   0-5 | Evidence | Gap | Recommended action |
| Indexing jobs                          |   0-5 | Evidence | Gap | Recommended action |
| Indexed fields                         |   0-5 | Evidence | Gap | Recommended action |
| Tenant filters                         |   0-5 | Evidence | Gap | Recommended action |
| Permission filters                     |   0-5 | Evidence | Gap | Recommended action |
| Document/ticket/project/message search |   0-5 | Evidence | Gap | Recommended action |
| Admin/global search                    |   0-5 | Evidence | Gap | Recommended action |
| Autocomplete                           |   0-5 | Evidence | Gap | Recommended action |
| Search logs                            |   0-5 | Evidence | Gap | Recommended action |
| Query analytics                        |   0-5 | Evidence | Gap | Recommended action |
| Deleted data removal                   |   0-5 | Evidence | Gap | Recommended action |

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

| ID         | Scenario or control                    | Evidence | Current control | Gap | Severity | Recommendation |
| ---------- | -------------------------------------- | -------- | --------------- | --- | -------- | -------------- |
| SEARCH-001 | Search routes/UI                       | Evidence | Current control | Gap | Severity | Recommendation |
| SEARCH-002 | Indexes                                | Evidence | Current control | Gap | Severity | Recommendation |
| SEARCH-003 | Indexing jobs                          | Evidence | Current control | Gap | Severity | Recommendation |
| SEARCH-004 | Indexed fields                         | Evidence | Current control | Gap | Severity | Recommendation |
| SEARCH-005 | Tenant filters                         | Evidence | Current control | Gap | Severity | Recommendation |
| SEARCH-006 | Permission filters                     | Evidence | Current control | Gap | Severity | Recommendation |
| SEARCH-007 | Document/ticket/project/message search | Evidence | Current control | Gap | Severity | Recommendation |
| SEARCH-008 | Admin/global search                    | Evidence | Current control | Gap | Severity | Recommendation |
| SEARCH-009 | Autocomplete                           | Evidence | Current control | Gap | Severity | Recommendation |
| SEARCH-010 | Search logs                            | Evidence | Current control | Gap | Severity | Recommendation |
| SEARCH-011 | Query analytics                        | Evidence | Current control | Gap | Severity | Recommendation |
| SEARCH-012 | Deleted data removal                   | Evidence | Current control | Gap | Severity | Recommendation |

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
