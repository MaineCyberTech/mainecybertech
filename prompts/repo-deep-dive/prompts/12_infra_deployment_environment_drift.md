# Prompt 12 - Infrastructure, Deployment, and Environment Drift Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit infrastructure/deploy config, Docker/container setup, env vars, runtime config, hosting assumptions, and drift risks.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/12_infra_deployment_environment_drift.md`

## Area code

Use finding IDs beginning with `INFRA`.

Examples:

- `INFRA-P0-001`
- `INFRA-P1-001`
- `INFRA-P2-001`
- `INFRA-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for dockerfiles?
2. What repository evidence proves the current behavior for compose?
3. What repository evidence proves the current behavior for terraform/opentofu?
4. What repository evidence proves the current behavior for cloud/hosting config?
5. What repository evidence proves the current behavior for deploy scripts?
6. What repository evidence proves the current behavior for reverse proxy?
7. What repository evidence proves the current behavior for environment examples?
8. What repository evidence proves the current behavior for runtime validators?
9. What repository evidence proves the current behavior for secret references?
10. What repository evidence proves the current behavior for build args?

## Scope to analyze

- Dockerfiles
- Compose
- Terraform/OpenTofu
- Cloud/hosting config
- Deploy scripts
- Reverse proxy
- Environment examples
- Runtime validators
- Secret references
- Build args
- Container users
- Health/readiness/liveness
- Logging
- Volumes/networks
- Database/queue/storage settings
- Feature flags
- Rollback
- Blue/green/canary
- Backup hooks

## Required special checks

- Detect client-exposed secrets
- Find env name drift
- Check container root/healthchecks
- Check migrations coupled unsafely to deploy

## Required outputs and companion artifacts

- Environment inventory
- Runtime config inventory
- Deployment inventory
- Environment matrix
- Hardening checklist

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

- [ ] Reviewed Dockerfiles
- [ ] Reviewed Compose
- [ ] Reviewed Terraform/OpenTofu
- [ ] Reviewed Cloud/hosting config
- [ ] Reviewed Deploy scripts
- [ ] Reviewed Reverse proxy
- [ ] Reviewed Environment examples
- [ ] Reviewed Runtime validators
- [ ] Reviewed Secret references
- [ ] Reviewed Build args
- [ ] Reviewed Container users
- [ ] Reviewed Health/readiness/liveness
- [ ] Reviewed Logging
- [ ] Reviewed Volumes/networks
- [ ] Reviewed Database/queue/storage settings
- [ ] Reviewed Feature flags
- [ ] Reviewed Rollback
- [ ] Reviewed Blue/green/canary
- [ ] Reviewed Backup hooks

## Required report structure

```markdown
# Infrastructure, Deployment, and Environment Drift Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: INFRA
- Output path: docs/audits/{name}/{run}/12_infra_deployment_environment_drift.md
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
| Dockerfiles               |   0-5 | Evidence | Gap | Recommended action |
| Compose                   |   0-5 | Evidence | Gap | Recommended action |
| Terraform/OpenTofu        |   0-5 | Evidence | Gap | Recommended action |
| Cloud/hosting config      |   0-5 | Evidence | Gap | Recommended action |
| Deploy scripts            |   0-5 | Evidence | Gap | Recommended action |
| Reverse proxy             |   0-5 | Evidence | Gap | Recommended action |
| Environment examples      |   0-5 | Evidence | Gap | Recommended action |
| Runtime validators        |   0-5 | Evidence | Gap | Recommended action |
| Secret references         |   0-5 | Evidence | Gap | Recommended action |
| Build args                |   0-5 | Evidence | Gap | Recommended action |
| Container users           |   0-5 | Evidence | Gap | Recommended action |
| Health/readiness/liveness |   0-5 | Evidence | Gap | Recommended action |

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

| ID        | Scenario or control       | Evidence | Current control | Gap | Severity | Recommendation |
| --------- | ------------------------- | -------- | --------------- | --- | -------- | -------------- |
| INFRA-001 | Dockerfiles               | Evidence | Current control | Gap | Severity | Recommendation |
| INFRA-002 | Compose                   | Evidence | Current control | Gap | Severity | Recommendation |
| INFRA-003 | Terraform/OpenTofu        | Evidence | Current control | Gap | Severity | Recommendation |
| INFRA-004 | Cloud/hosting config      | Evidence | Current control | Gap | Severity | Recommendation |
| INFRA-005 | Deploy scripts            | Evidence | Current control | Gap | Severity | Recommendation |
| INFRA-006 | Reverse proxy             | Evidence | Current control | Gap | Severity | Recommendation |
| INFRA-007 | Environment examples      | Evidence | Current control | Gap | Severity | Recommendation |
| INFRA-008 | Runtime validators        | Evidence | Current control | Gap | Severity | Recommendation |
| INFRA-009 | Secret references         | Evidence | Current control | Gap | Severity | Recommendation |
| INFRA-010 | Build args                | Evidence | Current control | Gap | Severity | Recommendation |
| INFRA-011 | Container users           | Evidence | Current control | Gap | Severity | Recommendation |
| INFRA-012 | Health/readiness/liveness | Evidence | Current control | Gap | Severity | Recommendation |

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
