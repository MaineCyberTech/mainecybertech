# Prompt 01 - Comprehensive Repository Inventory

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Create a narrated inventory explaining what each meaningful folder/file is, how it works, why it matters, and what risks it creates.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/01_repository_inventory.md`

## Area code

Use finding IDs beginning with `INV`.

Examples:

- `INV-P0-001`
- `INV-P1-001`
- `INV-P2-001`
- `INV-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for root configs?
2. What repository evidence proves the current behavior for package/workspace files?
3. What repository evidence proves the current behavior for applications?
4. What repository evidence proves the current behavior for api services?
5. What repository evidence proves the current behavior for workers?
6. What repository evidence proves the current behavior for shared packages?
7. What repository evidence proves the current behavior for database/migrations?
8. What repository evidence proves the current behavior for github metadata?
9. What repository evidence proves the current behavior for tests?
10. What repository evidence proves the current behavior for docs?

## Scope to analyze

- Root configs
- Package/workspace files
- Applications
- API services
- Workers
- Shared packages
- Database/migrations
- GitHub metadata
- Tests
- Docs
- Assets/public files
- Generated artifacts
- Docker/deploy/infra files
- Environment examples

## Required special checks

- Do not skip build, deploy, typing, env, docs, security, or CI files
- Separate source from generated artifacts
- Call out questionable committed artifacts
- Identify likely owners and runtime/build impact

## Required outputs and companion artifacts

- Inventory summary table
- Sensitive inventory table
- Generated/stale artifact table
- Unknowns table

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

- [ ] Reviewed Root configs
- [ ] Reviewed Package/workspace files
- [ ] Reviewed Applications
- [ ] Reviewed API services
- [ ] Reviewed Workers
- [ ] Reviewed Shared packages
- [ ] Reviewed Database/migrations
- [ ] Reviewed GitHub metadata
- [ ] Reviewed Tests
- [ ] Reviewed Docs
- [ ] Reviewed Assets/public files
- [ ] Reviewed Generated artifacts
- [ ] Reviewed Docker/deploy/infra files
- [ ] Reviewed Environment examples

## Required report structure

```markdown
# Comprehensive Repository Inventory

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: INV
- Output path: docs/audits/{name}/{run}/01_repository_inventory.md
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
| Root configs            |   0-5 | Evidence | Gap | Recommended action |
| Package/workspace files |   0-5 | Evidence | Gap | Recommended action |
| Applications            |   0-5 | Evidence | Gap | Recommended action |
| API services            |   0-5 | Evidence | Gap | Recommended action |
| Workers                 |   0-5 | Evidence | Gap | Recommended action |
| Shared packages         |   0-5 | Evidence | Gap | Recommended action |
| Database/migrations     |   0-5 | Evidence | Gap | Recommended action |
| GitHub metadata         |   0-5 | Evidence | Gap | Recommended action |
| Tests                   |   0-5 | Evidence | Gap | Recommended action |
| Docs                    |   0-5 | Evidence | Gap | Recommended action |
| Assets/public files     |   0-5 | Evidence | Gap | Recommended action |
| Generated artifacts     |   0-5 | Evidence | Gap | Recommended action |

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
| INV-001 | Root configs            | Evidence | Current control | Gap | Severity | Recommendation |
| INV-002 | Package/workspace files | Evidence | Current control | Gap | Severity | Recommendation |
| INV-003 | Applications            | Evidence | Current control | Gap | Severity | Recommendation |
| INV-004 | API services            | Evidence | Current control | Gap | Severity | Recommendation |
| INV-005 | Workers                 | Evidence | Current control | Gap | Severity | Recommendation |
| INV-006 | Shared packages         | Evidence | Current control | Gap | Severity | Recommendation |
| INV-007 | Database/migrations     | Evidence | Current control | Gap | Severity | Recommendation |
| INV-008 | GitHub metadata         | Evidence | Current control | Gap | Severity | Recommendation |
| INV-009 | Tests                   | Evidence | Current control | Gap | Severity | Recommendation |
| INV-010 | Docs                    | Evidence | Current control | Gap | Severity | Recommendation |
| INV-011 | Assets/public files     | Evidence | Current control | Gap | Severity | Recommendation |
| INV-012 | Generated artifacts     | Evidence | Current control | Gap | Severity | Recommendation |

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
