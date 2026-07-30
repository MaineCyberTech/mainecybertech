# Prompt 10 - GitHub Actions, CI/CD, and Governance Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit workflows, PR gates, deployments, release process, environment promotion, permissions, and governance controls.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/10_github_actions_cicd_governance.md`

## Area code

Use finding IDs beginning with `CI`.

Examples:

- `CI-P0-001`
- `CI-P1-001`
- `CI-P2-001`
- `CI-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for .github/workflows?
2. What repository evidence proves the current behavior for pr validation?
3. What repository evidence proves the current behavior for lint/typecheck/test/build?
4. What repository evidence proves the current behavior for deploy workflows?
5. What repository evidence proves the current behavior for migration workflows?
6. What repository evidence proves the current behavior for docker build/push?
7. What repository evidence proves the current behavior for releases?
8. What repository evidence proves the current behavior for badge/report generation?
9. What repository evidence proves the current behavior for secrets?
10. What repository evidence proves the current behavior for permissions blocks?

## Scope to analyze

- .github/workflows
- PR validation
- Lint/typecheck/test/build
- Deploy workflows
- Migration workflows
- Docker build/push
- Releases
- Badge/report generation
- Secrets
- permissions blocks
- OIDC
- Environment protection
- Manual approval
- Concurrency
- Caching
- Artifacts
- PR comments
- Branch protection
- CODEOWNERS
- Dependabot
- Security/SBOM/container scans
- Triggers
- Pinned actions

## Required special checks

- Check pull_request_target danger
- Check broad permissions and unpinned actions
- Check deploy trigger safety
- Recommend required checks

## Required outputs and companion artifacts

- Workflow inventory
- CI gate map
- Deployment flow
- Branch protection recommendations
- Workflow patch plan

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

- [ ] Reviewed .github/workflows
- [ ] Reviewed PR validation
- [ ] Reviewed Lint/typecheck/test/build
- [ ] Reviewed Deploy workflows
- [ ] Reviewed Migration workflows
- [ ] Reviewed Docker build/push
- [ ] Reviewed Releases
- [ ] Reviewed Badge/report generation
- [ ] Reviewed Secrets
- [ ] Reviewed permissions blocks
- [ ] Reviewed OIDC
- [ ] Reviewed Environment protection
- [ ] Reviewed Manual approval
- [ ] Reviewed Concurrency
- [ ] Reviewed Caching
- [ ] Reviewed Artifacts
- [ ] Reviewed PR comments
- [ ] Reviewed Branch protection
- [ ] Reviewed CODEOWNERS
- [ ] Reviewed Dependabot
- [ ] Reviewed Security/SBOM/container scans
- [ ] Reviewed Triggers
- [ ] Reviewed Pinned actions

## Required report structure

```markdown
# GitHub Actions, CI/CD, and Governance Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: CI
- Output path: docs/audits/{name}/{run}/10_github_actions_cicd_governance.md
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

| Category                  | Score | Evidence | Gap | Recommended action |
| ------------------------- | ----: | -------- | --- | ------------------ |
| .github/workflows         |   0-5 | Evidence | Gap | Recommended action |
| PR validation             |   0-5 | Evidence | Gap | Recommended action |
| Lint/typecheck/test/build |   0-5 | Evidence | Gap | Recommended action |
| Deploy workflows          |   0-5 | Evidence | Gap | Recommended action |
| Migration workflows       |   0-5 | Evidence | Gap | Recommended action |
| Docker build/push         |   0-5 | Evidence | Gap | Recommended action |
| Releases                  |   0-5 | Evidence | Gap | Recommended action |
| Badge/report generation   |   0-5 | Evidence | Gap | Recommended action |
| Secrets                   |   0-5 | Evidence | Gap | Recommended action |
| permissions blocks        |   0-5 | Evidence | Gap | Recommended action |
| OIDC                      |   0-5 | Evidence | Gap | Recommended action |
| Environment protection    |   0-5 | Evidence | Gap | Recommended action |

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

| ID     | Scenario or control       | Evidence | Current control | Gap | Severity | Recommendation |
| ------ | ------------------------- | -------- | --------------- | --- | -------- | -------------- |
| CI-001 | .github/workflows         | Evidence | Current control | Gap | Severity | Recommendation |
| CI-002 | PR validation             | Evidence | Current control | Gap | Severity | Recommendation |
| CI-003 | Lint/typecheck/test/build | Evidence | Current control | Gap | Severity | Recommendation |
| CI-004 | Deploy workflows          | Evidence | Current control | Gap | Severity | Recommendation |
| CI-005 | Migration workflows       | Evidence | Current control | Gap | Severity | Recommendation |
| CI-006 | Docker build/push         | Evidence | Current control | Gap | Severity | Recommendation |
| CI-007 | Releases                  | Evidence | Current control | Gap | Severity | Recommendation |
| CI-008 | Badge/report generation   | Evidence | Current control | Gap | Severity | Recommendation |
| CI-009 | Secrets                   | Evidence | Current control | Gap | Severity | Recommendation |
| CI-010 | permissions blocks        | Evidence | Current control | Gap | Severity | Recommendation |
| CI-011 | OIDC                      | Evidence | Current control | Gap | Severity | Recommendation |
| CI-012 | Environment protection    | Evidence | Current control | Gap | Severity | Recommendation |

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
