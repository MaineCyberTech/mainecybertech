# Prompt 35 - SBOM and License Policy Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit SBOM readiness, license risk, dependency review, vulnerable dependency handling, and release provenance.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/35_sbom_license_policy.md`

## Area code

Use finding IDs beginning with `SBOM`.

Examples:

- `SBOM-P0-001`
- `SBOM-P1-001`
- `SBOM-P2-001`
- `SBOM-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for package manifests?
2. What repository evidence proves the current behavior for lockfiles?
3. What repository evidence proves the current behavior for docker images?
4. What repository evidence proves the current behavior for github actions?
5. What repository evidence proves the current behavior for dependency updates?
6. What repository evidence proves the current behavior for license fields?
7. What repository evidence proves the current behavior for third-party/transitive deps?
8. What repository evidence proves the current behavior for sbom workflows?
9. What repository evidence proves the current behavior for container sbom?
10. What repository evidence proves the current behavior for dependency review?

## Scope to analyze

- Package manifests
- Lockfiles
- Docker images
- GitHub Actions
- Dependency updates
- License fields
- Third-party/transitive deps
- SBOM workflows
- Container SBOM
- Dependency review
- Vulnerability alerts
- Release provenance
- Signing/attestation
- License policy
- Exception process

## Required special checks

- Recommend allow/deny license policy
- Include CI gates
- Include Docker and GitHub Actions dependencies

## Required outputs and companion artifacts

- `sbom_license_policy_recommendation.md`
- Dependency source inventory
- License risk review
- SBOM workflow

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

- [ ] Reviewed Package manifests
- [ ] Reviewed Lockfiles
- [ ] Reviewed Docker images
- [ ] Reviewed GitHub Actions
- [ ] Reviewed Dependency updates
- [ ] Reviewed License fields
- [ ] Reviewed Third-party/transitive deps
- [ ] Reviewed SBOM workflows
- [ ] Reviewed Container SBOM
- [ ] Reviewed Dependency review
- [ ] Reviewed Vulnerability alerts
- [ ] Reviewed Release provenance
- [ ] Reviewed Signing/attestation
- [ ] Reviewed License policy
- [ ] Reviewed Exception process

## Required report structure

```markdown
# SBOM and License Policy Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: SBOM
- Output path: docs/audits/{name}/{run}/35_sbom_license_policy.md
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

| Category                    | Score | Evidence | Gap | Recommended action |
| --------------------------- | ----: | -------- | --- | ------------------ |
| Package manifests           |   0-5 | Evidence | Gap | Recommended action |
| Lockfiles                   |   0-5 | Evidence | Gap | Recommended action |
| Docker images               |   0-5 | Evidence | Gap | Recommended action |
| GitHub Actions              |   0-5 | Evidence | Gap | Recommended action |
| Dependency updates          |   0-5 | Evidence | Gap | Recommended action |
| License fields              |   0-5 | Evidence | Gap | Recommended action |
| Third-party/transitive deps |   0-5 | Evidence | Gap | Recommended action |
| SBOM workflows              |   0-5 | Evidence | Gap | Recommended action |
| Container SBOM              |   0-5 | Evidence | Gap | Recommended action |
| Dependency review           |   0-5 | Evidence | Gap | Recommended action |
| Vulnerability alerts        |   0-5 | Evidence | Gap | Recommended action |
| Release provenance          |   0-5 | Evidence | Gap | Recommended action |

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

| ID       | Scenario or control         | Evidence | Current control | Gap | Severity | Recommendation |
| -------- | --------------------------- | -------- | --------------- | --- | -------- | -------------- |
| SBOM-001 | Package manifests           | Evidence | Current control | Gap | Severity | Recommendation |
| SBOM-002 | Lockfiles                   | Evidence | Current control | Gap | Severity | Recommendation |
| SBOM-003 | Docker images               | Evidence | Current control | Gap | Severity | Recommendation |
| SBOM-004 | GitHub Actions              | Evidence | Current control | Gap | Severity | Recommendation |
| SBOM-005 | Dependency updates          | Evidence | Current control | Gap | Severity | Recommendation |
| SBOM-006 | License fields              | Evidence | Current control | Gap | Severity | Recommendation |
| SBOM-007 | Third-party/transitive deps | Evidence | Current control | Gap | Severity | Recommendation |
| SBOM-008 | SBOM workflows              | Evidence | Current control | Gap | Severity | Recommendation |
| SBOM-009 | Container SBOM              | Evidence | Current control | Gap | Severity | Recommendation |
| SBOM-010 | Dependency review           | Evidence | Current control | Gap | Severity | Recommendation |
| SBOM-011 | Vulnerability alerts        | Evidence | Current control | Gap | Severity | Recommendation |
| SBOM-012 | Release provenance          | Evidence | Current control | Gap | Severity | Recommendation |

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
