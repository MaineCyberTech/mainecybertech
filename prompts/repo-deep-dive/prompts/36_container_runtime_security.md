# Prompt 36 - Container Runtime Security Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit Dockerfiles, image build hardening, runtime security, secrets, health checks, users, and deployment safety.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/36_container_runtime_security.md`

## Area code

Use finding IDs beginning with `CTR`.

Examples:

- `CTR-P0-001`
- `CTR-P1-001`
- `CTR-P2-001`
- `CTR-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for dockerfiles?
2. What repository evidence proves the current behavior for compose?
3. What repository evidence proves the current behavior for build stages?
4. What repository evidence proves the current behavior for base images/tags?
5. What repository evidence proves the current behavior for package installs?
6. What repository evidence proves the current behavior for non-root users?
7. What repository evidence proves the current behavior for file permissions?
8. What repository evidence proves the current behavior for entrypoints?
9. What repository evidence proves the current behavior for health checks?
10. What repository evidence proves the current behavior for ports?

## Scope to analyze

- Dockerfiles
- Compose
- Build stages
- Base images/tags
- Package installs
- Non-root users
- File permissions
- Entrypoints
- Health checks
- Ports
- Build args
- Runtime env
- Secrets injection
- .dockerignore
- Image size
- Multi-stage builds
- Caching
- Native binaries
- Graceful shutdown
- Stdout logging
- Read-only FS
- Capabilities
- Scanning
- SBOM
- Deploy docs

## Required special checks

- Flag root runtime and latest tags
- Check secrets copied into images
- Check dev deps in prod images
- Recommend runtime security profile

## Required outputs and companion artifacts

- Container inventory
- Build/runtime hardening findings
- Dockerfile improvements
- Validation tests

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
- [ ] Reviewed Build stages
- [ ] Reviewed Base images/tags
- [ ] Reviewed Package installs
- [ ] Reviewed Non-root users
- [ ] Reviewed File permissions
- [ ] Reviewed Entrypoints
- [ ] Reviewed Health checks
- [ ] Reviewed Ports
- [ ] Reviewed Build args
- [ ] Reviewed Runtime env
- [ ] Reviewed Secrets injection
- [ ] Reviewed .dockerignore
- [ ] Reviewed Image size
- [ ] Reviewed Multi-stage builds
- [ ] Reviewed Caching
- [ ] Reviewed Native binaries
- [ ] Reviewed Graceful shutdown
- [ ] Reviewed Stdout logging
- [ ] Reviewed Read-only FS
- [ ] Reviewed Capabilities
- [ ] Reviewed Scanning
- [ ] Reviewed SBOM
- [ ] Reviewed Deploy docs

## Required report structure

```markdown
# Container Runtime Security Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: CTR
- Output path: docs/audits/{name}/{run}/36_container_runtime_security.md
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

| Category         | Score | Evidence | Gap | Recommended action |
| ---------------- | ----: | -------- | --- | ------------------ |
| Dockerfiles      |   0-5 | Evidence | Gap | Recommended action |
| Compose          |   0-5 | Evidence | Gap | Recommended action |
| Build stages     |   0-5 | Evidence | Gap | Recommended action |
| Base images/tags |   0-5 | Evidence | Gap | Recommended action |
| Package installs |   0-5 | Evidence | Gap | Recommended action |
| Non-root users   |   0-5 | Evidence | Gap | Recommended action |
| File permissions |   0-5 | Evidence | Gap | Recommended action |
| Entrypoints      |   0-5 | Evidence | Gap | Recommended action |
| Health checks    |   0-5 | Evidence | Gap | Recommended action |
| Ports            |   0-5 | Evidence | Gap | Recommended action |
| Build args       |   0-5 | Evidence | Gap | Recommended action |
| Runtime env      |   0-5 | Evidence | Gap | Recommended action |

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

| ID      | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
| ------- | ------------------- | -------- | --------------- | --- | -------- | -------------- |
| CTR-001 | Dockerfiles         | Evidence | Current control | Gap | Severity | Recommendation |
| CTR-002 | Compose             | Evidence | Current control | Gap | Severity | Recommendation |
| CTR-003 | Build stages        | Evidence | Current control | Gap | Severity | Recommendation |
| CTR-004 | Base images/tags    | Evidence | Current control | Gap | Severity | Recommendation |
| CTR-005 | Package installs    | Evidence | Current control | Gap | Severity | Recommendation |
| CTR-006 | Non-root users      | Evidence | Current control | Gap | Severity | Recommendation |
| CTR-007 | File permissions    | Evidence | Current control | Gap | Severity | Recommendation |
| CTR-008 | Entrypoints         | Evidence | Current control | Gap | Severity | Recommendation |
| CTR-009 | Health checks       | Evidence | Current control | Gap | Severity | Recommendation |
| CTR-010 | Ports               | Evidence | Current control | Gap | Severity | Recommendation |
| CTR-011 | Build args          | Evidence | Current control | Gap | Severity | Recommendation |
| CTR-012 | Runtime env         | Evidence | Current control | Gap | Severity | Recommendation |

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
