# Prompt 25 - Multi-Tenant Isolation Attack Simulation

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Simulate safe code-level abuse cases for cross-tenant data access through IDs, routes, APIs, realtime, files, jobs, cache, and search.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/25_multi_tenant_isolation_attack_simulation.md`

## Area code

Use finding IDs beginning with `MT`.

Examples:

- `MT-P0-001`
- `MT-P1-001`
- `MT-P2-001`
- `MT-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for tenant/org/workspace ids?
2. What repository evidence proves the current behavior for membership checks?
3. What repository evidence proves the current behavior for db queries?
4. What repository evidence proves the current behavior for api routes?
5. What repository evidence proves the current behavior for server actions?
6. What repository evidence proves the current behavior for client fetchers?
7. What repository evidence proves the current behavior for rls?
8. What repository evidence proves the current behavior for storage/file access?
9. What repository evidence proves the current behavior for realtime channels?
10. What repository evidence proves the current behavior for search/export?

## Scope to analyze

- Tenant/org/workspace IDs
- Membership checks
- DB queries
- API routes
- Server actions
- Client fetchers
- RLS
- Storage/file access
- Realtime channels
- Search/export
- Admin overrides
- Invitations
- Notifications
- Background jobs
- Webhooks
- Audit logs
- Caching

## Required special checks

- No destructive actions or data exfiltration
- Focus on repository evidence
- Create attack scenarios MT-001..MT-008
- Require regression tests

## Required outputs and companion artifacts

- Attack surface inventory
- Scenario results
- Tenant isolation checklist
- Required fixes/tests

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

- [ ] Reviewed Tenant/org/workspace IDs
- [ ] Reviewed Membership checks
- [ ] Reviewed DB queries
- [ ] Reviewed API routes
- [ ] Reviewed Server actions
- [ ] Reviewed Client fetchers
- [ ] Reviewed RLS
- [ ] Reviewed Storage/file access
- [ ] Reviewed Realtime channels
- [ ] Reviewed Search/export
- [ ] Reviewed Admin overrides
- [ ] Reviewed Invitations
- [ ] Reviewed Notifications
- [ ] Reviewed Background jobs
- [ ] Reviewed Webhooks
- [ ] Reviewed Audit logs
- [ ] Reviewed Caching

## Required report structure

```markdown
# Multi-Tenant Isolation Attack Simulation

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: MT
- Output path: docs/audits/{name}/{run}/25_multi_tenant_isolation_attack_simulation.md
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

| Category                 | Score | Evidence | Gap | Recommended action |
| ------------------------ | ----: | -------- | --- | ------------------ |
| Tenant/org/workspace IDs |   0-5 | Evidence | Gap | Recommended action |
| Membership checks        |   0-5 | Evidence | Gap | Recommended action |
| DB queries               |   0-5 | Evidence | Gap | Recommended action |
| API routes               |   0-5 | Evidence | Gap | Recommended action |
| Server actions           |   0-5 | Evidence | Gap | Recommended action |
| Client fetchers          |   0-5 | Evidence | Gap | Recommended action |
| RLS                      |   0-5 | Evidence | Gap | Recommended action |
| Storage/file access      |   0-5 | Evidence | Gap | Recommended action |
| Realtime channels        |   0-5 | Evidence | Gap | Recommended action |
| Search/export            |   0-5 | Evidence | Gap | Recommended action |
| Admin overrides          |   0-5 | Evidence | Gap | Recommended action |
| Invitations              |   0-5 | Evidence | Gap | Recommended action |

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

| ID     | Scenario or control      | Evidence | Current control | Gap | Severity | Recommendation |
| ------ | ------------------------ | -------- | --------------- | --- | -------- | -------------- |
| MT-001 | Tenant/org/workspace IDs | Evidence | Current control | Gap | Severity | Recommendation |
| MT-002 | Membership checks        | Evidence | Current control | Gap | Severity | Recommendation |
| MT-003 | DB queries               | Evidence | Current control | Gap | Severity | Recommendation |
| MT-004 | API routes               | Evidence | Current control | Gap | Severity | Recommendation |
| MT-005 | Server actions           | Evidence | Current control | Gap | Severity | Recommendation |
| MT-006 | Client fetchers          | Evidence | Current control | Gap | Severity | Recommendation |
| MT-007 | RLS                      | Evidence | Current control | Gap | Severity | Recommendation |
| MT-008 | Storage/file access      | Evidence | Current control | Gap | Severity | Recommendation |
| MT-009 | Realtime channels        | Evidence | Current control | Gap | Severity | Recommendation |
| MT-010 | Search/export            | Evidence | Current control | Gap | Severity | Recommendation |
| MT-011 | Admin overrides          | Evidence | Current control | Gap | Severity | Recommendation |
| MT-012 | Invitations              | Evidence | Current control | Gap | Severity | Recommendation |

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
