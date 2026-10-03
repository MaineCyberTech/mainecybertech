# Prompt 11 - Supply Chain, Dependency, and Secrets Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit package dependencies, lockfiles, scripts, dependency updates, secret exposure, SBOM, provenance, and license risk.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/11_supply_chain_dependency_secrets.md`

## Area code

Use finding IDs beginning with `SC`.

Examples:

- `SC-P0-001`
- `SC-P1-001`
- `SC-P2-001`
- `SC-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for package manifests?
2. What repository evidence proves the current behavior for lockfiles?
3. What repository evidence proves the current behavior for workspace dependencies?
4. What repository evidence proves the current behavior for unused/duplicate/deprecated deps?
5. What repository evidence proves the current behavior for native/build deps?
6. What repository evidence proves the current behavior for transitive risk indicators?
7. What repository evidence proves the current behavior for dependabot/renovate?
8. What repository evidence proves the current behavior for package scripts/postinstall?
9. What repository evidence proves the current behavior for docker base images?
10. What repository evidence proves the current behavior for github actions deps?

## Scope to analyze

- Package manifests
- Lockfiles
- Workspace dependencies
- Unused/duplicate/deprecated deps
- Native/build deps
- Transitive risk indicators
- Dependabot/Renovate
- Package scripts/postinstall
- Docker base images
- GitHub Actions deps
- Environment examples
- Secret-like strings
- API keys/tokens/certs/SSH
- Service account files
- .env handling
- Secret rotation docs
- SBOM/provenance/signing
- Container scanning
- License risk

## Required special checks

- Do not print secret values
- Identify multiple lockfiles
- Check latest tags/unpinned actions
- Recommend dependency review/license gates

## Required outputs and companion artifacts

- Dependency inventory
- Script inventory
- Secrets exposure review
- SBOM/provenance recommendations

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
- [ ] Reviewed Workspace dependencies
- [ ] Reviewed Unused/duplicate/deprecated deps
- [ ] Reviewed Native/build deps
- [ ] Reviewed Transitive risk indicators
- [ ] Reviewed Dependabot/Renovate
- [ ] Reviewed Package scripts/postinstall
- [ ] Reviewed Docker base images
- [ ] Reviewed GitHub Actions deps
- [ ] Reviewed Environment examples
- [ ] Reviewed Secret-like strings
- [ ] Reviewed API keys/tokens/certs/SSH
- [ ] Reviewed Service account files
- [ ] Reviewed .env handling
- [ ] Reviewed Secret rotation docs
- [ ] Reviewed SBOM/provenance/signing
- [ ] Reviewed Container scanning
- [ ] Reviewed License risk

## Required report structure

```markdown
# Supply Chain, Dependency, and Secrets Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: SC
- Output path: docs/audits/{name}/{run}/11_supply_chain_dependency_secrets.md
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

| Category                         | Score | Evidence | Gap | Recommended action |
| -------------------------------- | ----: | -------- | --- | ------------------ |
| Package manifests                |   0-5 | Evidence | Gap | Recommended action |
| Lockfiles                        |   0-5 | Evidence | Gap | Recommended action |
| Workspace dependencies           |   0-5 | Evidence | Gap | Recommended action |
| Unused/duplicate/deprecated deps |   0-5 | Evidence | Gap | Recommended action |
| Native/build deps                |   0-5 | Evidence | Gap | Recommended action |
| Transitive risk indicators       |   0-5 | Evidence | Gap | Recommended action |
| Dependabot/Renovate              |   0-5 | Evidence | Gap | Recommended action |
| Package scripts/postinstall      |   0-5 | Evidence | Gap | Recommended action |
| Docker base images               |   0-5 | Evidence | Gap | Recommended action |
| GitHub Actions deps              |   0-5 | Evidence | Gap | Recommended action |
| Environment examples             |   0-5 | Evidence | Gap | Recommended action |
| Secret-like strings              |   0-5 | Evidence | Gap | Recommended action |

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

| ID     | Scenario or control              | Evidence | Current control | Gap | Severity | Recommendation |
| ------ | -------------------------------- | -------- | --------------- | --- | -------- | -------------- |
| SC-001 | Package manifests                | Evidence | Current control | Gap | Severity | Recommendation |
| SC-002 | Lockfiles                        | Evidence | Current control | Gap | Severity | Recommendation |
| SC-003 | Workspace dependencies           | Evidence | Current control | Gap | Severity | Recommendation |
| SC-004 | Unused/duplicate/deprecated deps | Evidence | Current control | Gap | Severity | Recommendation |
| SC-005 | Native/build deps                | Evidence | Current control | Gap | Severity | Recommendation |
| SC-006 | Transitive risk indicators       | Evidence | Current control | Gap | Severity | Recommendation |
| SC-007 | Dependabot/Renovate              | Evidence | Current control | Gap | Severity | Recommendation |
| SC-008 | Package scripts/postinstall      | Evidence | Current control | Gap | Severity | Recommendation |
| SC-009 | Docker base images               | Evidence | Current control | Gap | Severity | Recommendation |
| SC-010 | GitHub Actions deps              | Evidence | Current control | Gap | Severity | Recommendation |
| SC-011 | Environment examples             | Evidence | Current control | Gap | Severity | Recommendation |
| SC-012 | Secret-like strings              | Evidence | Current control | Gap | Severity | Recommendation |

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
