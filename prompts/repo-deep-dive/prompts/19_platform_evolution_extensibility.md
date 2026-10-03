# Prompt 19 - Platform Evolution and Extensibility Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit how easily the platform can evolve with new modules, integrations, tenants, AI features, mobile clients, billing plans, and operations tooling.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/19_platform_evolution_extensibility.md`

## Area code

Use finding IDs beginning with `EVOL`.

Examples:

- `EVOL-P0-001`
- `EVOL-P1-001`
- `EVOL-P2-001`
- `EVOL-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for module boundaries?
2. What repository evidence proves the current behavior for domain model?
3. What repository evidence proves the current behavior for shared packages?
4. What repository evidence proves the current behavior for extension points?
5. What repository evidence proves the current behavior for feature flags?
6. What repository evidence proves the current behavior for permission extensibility?
7. What repository evidence proves the current behavior for tenant/org model?
8. What repository evidence proves the current behavior for api versioning?
9. What repository evidence proves the current behavior for migration strategy?
10. What repository evidence proves the current behavior for eventing/webhooks?

## Scope to analyze

- Module boundaries
- Domain model
- Shared packages
- Extension points
- Feature flags
- Permission extensibility
- Tenant/org model
- API versioning
- Migration strategy
- Eventing/webhooks
- Integration framework
- UI reuse
- Admin tooling
- Background jobs
- Config model
- Observability extensibility
- Docs for adding modules
- AI agent compatibility
- Package extraction

## Required special checks

- Find hardcoded roles/plans/statuses
- Identify extension points and missing abstractions
- Recommend module template

## Required outputs and companion artifacts

- Evolution readiness summary
- Extension point inventory
- Refactor roadmap
- ADR recommendations

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

- [ ] Reviewed Module boundaries
- [ ] Reviewed Domain model
- [ ] Reviewed Shared packages
- [ ] Reviewed Extension points
- [ ] Reviewed Feature flags
- [ ] Reviewed Permission extensibility
- [ ] Reviewed Tenant/org model
- [ ] Reviewed API versioning
- [ ] Reviewed Migration strategy
- [ ] Reviewed Eventing/webhooks
- [ ] Reviewed Integration framework
- [ ] Reviewed UI reuse
- [ ] Reviewed Admin tooling
- [ ] Reviewed Background jobs
- [ ] Reviewed Config model
- [ ] Reviewed Observability extensibility
- [ ] Reviewed Docs for adding modules
- [ ] Reviewed AI agent compatibility
- [ ] Reviewed Package extraction

## Required report structure

```markdown
# Platform Evolution and Extensibility Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: EVOL
- Output path: docs/audits/{name}/{run}/19_platform_evolution_extensibility.md
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
| Module boundaries        |   0-5 | Evidence | Gap | Recommended action |
| Domain model             |   0-5 | Evidence | Gap | Recommended action |
| Shared packages          |   0-5 | Evidence | Gap | Recommended action |
| Extension points         |   0-5 | Evidence | Gap | Recommended action |
| Feature flags            |   0-5 | Evidence | Gap | Recommended action |
| Permission extensibility |   0-5 | Evidence | Gap | Recommended action |
| Tenant/org model         |   0-5 | Evidence | Gap | Recommended action |
| API versioning           |   0-5 | Evidence | Gap | Recommended action |
| Migration strategy       |   0-5 | Evidence | Gap | Recommended action |
| Eventing/webhooks        |   0-5 | Evidence | Gap | Recommended action |
| Integration framework    |   0-5 | Evidence | Gap | Recommended action |
| UI reuse                 |   0-5 | Evidence | Gap | Recommended action |

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

| ID       | Scenario or control      | Evidence | Current control | Gap | Severity | Recommendation |
| -------- | ------------------------ | -------- | --------------- | --- | -------- | -------------- |
| EVOL-001 | Module boundaries        | Evidence | Current control | Gap | Severity | Recommendation |
| EVOL-002 | Domain model             | Evidence | Current control | Gap | Severity | Recommendation |
| EVOL-003 | Shared packages          | Evidence | Current control | Gap | Severity | Recommendation |
| EVOL-004 | Extension points         | Evidence | Current control | Gap | Severity | Recommendation |
| EVOL-005 | Feature flags            | Evidence | Current control | Gap | Severity | Recommendation |
| EVOL-006 | Permission extensibility | Evidence | Current control | Gap | Severity | Recommendation |
| EVOL-007 | Tenant/org model         | Evidence | Current control | Gap | Severity | Recommendation |
| EVOL-008 | API versioning           | Evidence | Current control | Gap | Severity | Recommendation |
| EVOL-009 | Migration strategy       | Evidence | Current control | Gap | Severity | Recommendation |
| EVOL-010 | Eventing/webhooks        | Evidence | Current control | Gap | Severity | Recommendation |
| EVOL-011 | Integration framework    | Evidence | Current control | Gap | Severity | Recommendation |
| EVOL-012 | UI reuse                 | Evidence | Current control | Gap | Severity | Recommendation |

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
