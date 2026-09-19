# Prompt 16 - Documentation, Developer Experience, and Operator Readiness Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit whether developers, operators, and AI agents can understand, run, test, deploy, and maintain the repo safely.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/16_documentation_devex_operator_readiness.md`

## Area code

Use finding IDs beginning with `DOC`.

Examples:

- `DOC-P0-001`
- `DOC-P1-001`
- `DOC-P2-001`
- `DOC-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for readme?
2. What repository evidence proves the current behavior for local setup?
3. What repository evidence proves the current behavior for env docs?
4. What repository evidence proves the current behavior for architecture/api docs?
5. What repository evidence proves the current behavior for db/migration docs?
6. What repository evidence proves the current behavior for testing docs?
7. What repository evidence proves the current behavior for deploy/rollback docs?
8. What repository evidence proves the current behavior for incident/security docs?
9. What repository evidence proves the current behavior for contribution/coding standards?
10. What repository evidence proves the current behavior for pr/release process?

## Scope to analyze

- README
- Local setup
- Env docs
- Architecture/API docs
- DB/migration docs
- Testing docs
- Deploy/rollback docs
- Incident/security docs
- Contribution/coding standards
- PR/release process
- Operator manuals
- Troubleshooting
- ADRs/diagrams
- Onboarding
- Script docs
- Known limitations
- AI agent instructions
- Prompt packs
- Repo maps

## Required special checks

- Create a recommended documentation set
- Review new-developer journey
- Validate docs against existing scripts/configs

## Required outputs and companion artifacts

- Documentation inventory
- New developer journey
- Operator readiness checklist
- Rewrite suggestions

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

- [ ] Reviewed README
- [ ] Reviewed Local setup
- [ ] Reviewed Env docs
- [ ] Reviewed Architecture/API docs
- [ ] Reviewed DB/migration docs
- [ ] Reviewed Testing docs
- [ ] Reviewed Deploy/rollback docs
- [ ] Reviewed Incident/security docs
- [ ] Reviewed Contribution/coding standards
- [ ] Reviewed PR/release process
- [ ] Reviewed Operator manuals
- [ ] Reviewed Troubleshooting
- [ ] Reviewed ADRs/diagrams
- [ ] Reviewed Onboarding
- [ ] Reviewed Script docs
- [ ] Reviewed Known limitations
- [ ] Reviewed AI agent instructions
- [ ] Reviewed Prompt packs
- [ ] Reviewed Repo maps

## Required report structure

```markdown
# Documentation, Developer Experience, and Operator Readiness Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: DOC
- Output path: docs/audits/{name}/{run}/16_documentation_devex_operator_readiness.md
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

| Category                      | Score | Evidence | Gap | Recommended action |
| ----------------------------- | ----: | -------- | --- | ------------------ |
| README                        |   0-5 | Evidence | Gap | Recommended action |
| Local setup                   |   0-5 | Evidence | Gap | Recommended action |
| Env docs                      |   0-5 | Evidence | Gap | Recommended action |
| Architecture/API docs         |   0-5 | Evidence | Gap | Recommended action |
| DB/migration docs             |   0-5 | Evidence | Gap | Recommended action |
| Testing docs                  |   0-5 | Evidence | Gap | Recommended action |
| Deploy/rollback docs          |   0-5 | Evidence | Gap | Recommended action |
| Incident/security docs        |   0-5 | Evidence | Gap | Recommended action |
| Contribution/coding standards |   0-5 | Evidence | Gap | Recommended action |
| PR/release process            |   0-5 | Evidence | Gap | Recommended action |
| Operator manuals              |   0-5 | Evidence | Gap | Recommended action |
| Troubleshooting               |   0-5 | Evidence | Gap | Recommended action |

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

| ID      | Scenario or control           | Evidence | Current control | Gap | Severity | Recommendation |
| ------- | ----------------------------- | -------- | --------------- | --- | -------- | -------------- |
| DOC-001 | README                        | Evidence | Current control | Gap | Severity | Recommendation |
| DOC-002 | Local setup                   | Evidence | Current control | Gap | Severity | Recommendation |
| DOC-003 | Env docs                      | Evidence | Current control | Gap | Severity | Recommendation |
| DOC-004 | Architecture/API docs         | Evidence | Current control | Gap | Severity | Recommendation |
| DOC-005 | DB/migration docs             | Evidence | Current control | Gap | Severity | Recommendation |
| DOC-006 | Testing docs                  | Evidence | Current control | Gap | Severity | Recommendation |
| DOC-007 | Deploy/rollback docs          | Evidence | Current control | Gap | Severity | Recommendation |
| DOC-008 | Incident/security docs        | Evidence | Current control | Gap | Severity | Recommendation |
| DOC-009 | Contribution/coding standards | Evidence | Current control | Gap | Severity | Recommendation |
| DOC-010 | PR/release process            | Evidence | Current control | Gap | Severity | Recommendation |
| DOC-011 | Operator manuals              | Evidence | Current control | Gap | Severity | Recommendation |
| DOC-012 | Troubleshooting               | Evidence | Current control | Gap | Severity | Recommendation |

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
