# Prompt 37 - Supabase RLS Policy Deep-Dive Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit Supabase/Postgres RLS policies, grants, storage policies, functions, triggers, service role usage, and app consistency.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/37_supabase_rls_policy_deep_dive.md`

## Area code

Use finding IDs beginning with `RLS`.

Examples:

- `RLS-P0-001`
- `RLS-P1-001`
- `RLS-P2-001`
- `RLS-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for supabase migrations?
2. What repository evidence proves the current behavior for sql schema?
3. What repository evidence proves the current behavior for rls enablement?
4. What repository evidence proves the current behavior for policies?
5. What repository evidence proves the current behavior for grants/roles?
6. What repository evidence proves the current behavior for storage bucket policies?
7. What repository evidence proves the current behavior for functions/triggers?
8. What repository evidence proves the current behavior for security definer?
9. What repository evidence proves the current behavior for generated types?
10. What repository evidence proves the current behavior for app queries?

## Scope to analyze

- Supabase migrations
- SQL schema
- RLS enablement
- Policies
- Grants/roles
- Storage bucket policies
- Functions/triggers
- Security definer
- Generated types
- App queries
- Tenant/user matching
- Admin bypass
- Service role usage
- Client/server Supabase
- RLS tests
- Migration CI
- Docs

## Required special checks

- If not Supabase/Postgres RLS, produce equivalent-control readiness report
- Check WITH CHECK on writes
- Check security definer search_path
- Flag service role misuse

## Required outputs and companion artifacts

- Table policy inventory
- Storage policy inventory
- Function review
- RLS test plan
- Migration patch suggestions

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

- [ ] Reviewed Supabase migrations
- [ ] Reviewed SQL schema
- [ ] Reviewed RLS enablement
- [ ] Reviewed Policies
- [ ] Reviewed Grants/roles
- [ ] Reviewed Storage bucket policies
- [ ] Reviewed Functions/triggers
- [ ] Reviewed Security definer
- [ ] Reviewed Generated types
- [ ] Reviewed App queries
- [ ] Reviewed Tenant/user matching
- [ ] Reviewed Admin bypass
- [ ] Reviewed Service role usage
- [ ] Reviewed Client/server Supabase
- [ ] Reviewed RLS tests
- [ ] Reviewed Migration CI
- [ ] Reviewed Docs

## Required report structure

```markdown
# Supabase RLS Policy Deep-Dive Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: RLS
- Output path: docs/audits/{name}/{run}/37_supabase_rls_policy_deep_dive.md
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
| Supabase migrations     |   0-5 | Evidence | Gap | Recommended action |
| SQL schema              |   0-5 | Evidence | Gap | Recommended action |
| RLS enablement          |   0-5 | Evidence | Gap | Recommended action |
| Policies                |   0-5 | Evidence | Gap | Recommended action |
| Grants/roles            |   0-5 | Evidence | Gap | Recommended action |
| Storage bucket policies |   0-5 | Evidence | Gap | Recommended action |
| Functions/triggers      |   0-5 | Evidence | Gap | Recommended action |
| Security definer        |   0-5 | Evidence | Gap | Recommended action |
| Generated types         |   0-5 | Evidence | Gap | Recommended action |
| App queries             |   0-5 | Evidence | Gap | Recommended action |
| Tenant/user matching    |   0-5 | Evidence | Gap | Recommended action |
| Admin bypass            |   0-5 | Evidence | Gap | Recommended action |

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

| ID      | Scenario or control     | Evidence | Current control | Gap | Severity | Recommendation |
| ------- | ----------------------- | -------- | --------------- | --- | -------- | -------------- |
| RLS-001 | Supabase migrations     | Evidence | Current control | Gap | Severity | Recommendation |
| RLS-002 | SQL schema              | Evidence | Current control | Gap | Severity | Recommendation |
| RLS-003 | RLS enablement          | Evidence | Current control | Gap | Severity | Recommendation |
| RLS-004 | Policies                | Evidence | Current control | Gap | Severity | Recommendation |
| RLS-005 | Grants/roles            | Evidence | Current control | Gap | Severity | Recommendation |
| RLS-006 | Storage bucket policies | Evidence | Current control | Gap | Severity | Recommendation |
| RLS-007 | Functions/triggers      | Evidence | Current control | Gap | Severity | Recommendation |
| RLS-008 | Security definer        | Evidence | Current control | Gap | Severity | Recommendation |
| RLS-009 | Generated types         | Evidence | Current control | Gap | Severity | Recommendation |
| RLS-010 | App queries             | Evidence | Current control | Gap | Severity | Recommendation |
| RLS-011 | Tenant/user matching    | Evidence | Current control | Gap | Severity | Recommendation |
| RLS-012 | Admin bypass            | Evidence | Current control | Gap | Severity | Recommendation |

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
