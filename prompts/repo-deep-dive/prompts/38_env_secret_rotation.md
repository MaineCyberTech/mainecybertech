# Prompt 38 - Environment and Secret Rotation Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit env vars, secrets, key rotation, scope boundaries, startup validation, exposure risk, and emergency revocation.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/38_env_secret_rotation.md`

## Area code

Use finding IDs beginning with `SECRET`.

Examples:

- `SECRET-P0-001`
- `SECRET-P1-001`
- `SECRET-P2-001`
- `SECRET-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for .env.example?
2. What repository evidence proves the current behavior for env docs?
3. What repository evidence proves the current behavior for runtime validators?
4. What repository evidence proves the current behavior for ci/deploy/local secrets?
5. What repository evidence proves the current behavior for api/jwt/db/supabase/webhook/oauth/email/push/sentry/payment/cloud/github keys?
6. What repository evidence proves the current behavior for naming consistency?
7. What repository evidence proves the current behavior for client-exposed vars?
8. What repository evidence proves the current behavior for rotation/revocation docs?
9. What repository evidence proves the current behavior for break-glass?

## Scope to analyze

- .env.example
- Env docs
- Runtime validators
- CI/deploy/local secrets
- API/JWT/DB/Supabase/webhook/OAuth/email/push/Sentry/payment/cloud/GitHub keys
- Naming consistency
- Client-exposed vars
- Rotation/revocation docs
- Break-glass

## Required special checks

- Do not print secret values
- Identify client exposure
- Identify shared cross-environment secrets
- Create rotation runbook

## Required outputs and companion artifacts

- `secret_rotation_runbook.md`
- Environment variable inventory
- Secret classification
- Emergency revocation plan

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

- [ ] Reviewed .env.example
- [ ] Reviewed Env docs
- [ ] Reviewed Runtime validators
- [ ] Reviewed CI/deploy/local secrets
- [ ] Reviewed API/JWT/DB/Supabase/webhook/OAuth/email/push/Sentry/payment/cloud/GitHub keys
- [ ] Reviewed Naming consistency
- [ ] Reviewed Client-exposed vars
- [ ] Reviewed Rotation/revocation docs
- [ ] Reviewed Break-glass

## Required report structure

```markdown
# Environment and Secret Rotation Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: SECRET
- Output path: docs/audits/{name}/{run}/38_env_secret_rotation.md
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

| Category                                                                      | Score | Evidence | Gap | Recommended action |
| ----------------------------------------------------------------------------- | ----: | -------- | --- | ------------------ |
| .env.example                                                                  |   0-5 | Evidence | Gap | Recommended action |
| Env docs                                                                      |   0-5 | Evidence | Gap | Recommended action |
| Runtime validators                                                            |   0-5 | Evidence | Gap | Recommended action |
| CI/deploy/local secrets                                                       |   0-5 | Evidence | Gap | Recommended action |
| API/JWT/DB/Supabase/webhook/OAuth/email/push/Sentry/payment/cloud/GitHub keys |   0-5 | Evidence | Gap | Recommended action |
| Naming consistency                                                            |   0-5 | Evidence | Gap | Recommended action |
| Client-exposed vars                                                           |   0-5 | Evidence | Gap | Recommended action |
| Rotation/revocation docs                                                      |   0-5 | Evidence | Gap | Recommended action |
| Break-glass                                                                   |   0-5 | Evidence | Gap | Recommended action |

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

| ID         | Scenario or control                                                           | Evidence | Current control | Gap | Severity | Recommendation |
| ---------- | ----------------------------------------------------------------------------- | -------- | --------------- | --- | -------- | -------------- |
| SECRET-001 | .env.example                                                                  | Evidence | Current control | Gap | Severity | Recommendation |
| SECRET-002 | Env docs                                                                      | Evidence | Current control | Gap | Severity | Recommendation |
| SECRET-003 | Runtime validators                                                            | Evidence | Current control | Gap | Severity | Recommendation |
| SECRET-004 | CI/deploy/local secrets                                                       | Evidence | Current control | Gap | Severity | Recommendation |
| SECRET-005 | API/JWT/DB/Supabase/webhook/OAuth/email/push/Sentry/payment/cloud/GitHub keys | Evidence | Current control | Gap | Severity | Recommendation |
| SECRET-006 | Naming consistency                                                            | Evidence | Current control | Gap | Severity | Recommendation |
| SECRET-007 | Client-exposed vars                                                           | Evidence | Current control | Gap | Severity | Recommendation |
| SECRET-008 | Rotation/revocation docs                                                      | Evidence | Current control | Gap | Severity | Recommendation |
| SECRET-009 | Break-glass                                                                   | Evidence | Current control | Gap | Severity | Recommendation |

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
