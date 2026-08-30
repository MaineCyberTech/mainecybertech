# Prompt 06 - Security, Authorization, and Tenancy Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Perform a deep security audit of authn, authz, tenant isolation, input validation, secrets, sessions, APIs, and secure defaults.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/06_security_authz_tenancy_audit.md`

## Area code

Use finding IDs beginning with `SEC`.

Examples:

- `SEC-P0-001`
- `SEC-P1-001`
- `SEC-P2-001`
- `SEC-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for auth provider?
2. What repository evidence proves the current behavior for session tokens/cookies?
3. What repository evidence proves the current behavior for jwt validation?
4. What repository evidence proves the current behavior for csrf/cors?
5. What repository evidence proves the current behavior for rate limits?
6. What repository evidence proves the current behavior for security headers?
7. What repository evidence proves the current behavior for input/output validation?
8. What repository evidence proves the current behavior for file handling?
9. What repository evidence proves the current behavior for api permissions?
10. What repository evidence proves the current behavior for admin permissions?

## Scope to analyze

- Auth provider
- Session tokens/cookies
- JWT validation
- CSRF/CORS
- Rate limits
- Security headers
- Input/output validation
- File handling
- API permissions
- Admin permissions
- Tenant/org/workspace isolation
- RLS policies
- Public/internal routes
- Webhooks
- API keys
- Secrets
- Reset/invite/account lifecycle
- Audit/security logging
- Dependency risk
- IDOR
- SSRF
- Mass assignment
- Sensitive logs

## Required special checks

- Verify server-side authorization independent of UI
- Check all object access is tenant scoped
- Check environment validation
- Identify P0/P1 release blockers

## Required outputs and companion artifacts

- Threat model
- Authn/Authz inventory
- Tenant isolation review
- OWASP-style findings
- Security regression checklist

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

- [ ] Reviewed Auth provider
- [ ] Reviewed Session tokens/cookies
- [ ] Reviewed JWT validation
- [ ] Reviewed CSRF/CORS
- [ ] Reviewed Rate limits
- [ ] Reviewed Security headers
- [ ] Reviewed Input/output validation
- [ ] Reviewed File handling
- [ ] Reviewed API permissions
- [ ] Reviewed Admin permissions
- [ ] Reviewed Tenant/org/workspace isolation
- [ ] Reviewed RLS policies
- [ ] Reviewed Public/internal routes
- [ ] Reviewed Webhooks
- [ ] Reviewed API keys
- [ ] Reviewed Secrets
- [ ] Reviewed Reset/invite/account lifecycle
- [ ] Reviewed Audit/security logging
- [ ] Reviewed Dependency risk
- [ ] Reviewed IDOR
- [ ] Reviewed SSRF
- [ ] Reviewed Mass assignment
- [ ] Reviewed Sensitive logs

## Required report structure

```markdown
# Security, Authorization, and Tenancy Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: SEC
- Output path: docs/audits/{name}/{run}/06_security_authz_tenancy_audit.md
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

| Category                       | Score | Evidence | Gap | Recommended action |
| ------------------------------ | ----: | -------- | --- | ------------------ |
| Auth provider                  |   0-5 | Evidence | Gap | Recommended action |
| Session tokens/cookies         |   0-5 | Evidence | Gap | Recommended action |
| JWT validation                 |   0-5 | Evidence | Gap | Recommended action |
| CSRF/CORS                      |   0-5 | Evidence | Gap | Recommended action |
| Rate limits                    |   0-5 | Evidence | Gap | Recommended action |
| Security headers               |   0-5 | Evidence | Gap | Recommended action |
| Input/output validation        |   0-5 | Evidence | Gap | Recommended action |
| File handling                  |   0-5 | Evidence | Gap | Recommended action |
| API permissions                |   0-5 | Evidence | Gap | Recommended action |
| Admin permissions              |   0-5 | Evidence | Gap | Recommended action |
| Tenant/org/workspace isolation |   0-5 | Evidence | Gap | Recommended action |
| RLS policies                   |   0-5 | Evidence | Gap | Recommended action |

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

| ID      | Scenario or control            | Evidence | Current control | Gap | Severity | Recommendation |
| ------- | ------------------------------ | -------- | --------------- | --- | -------- | -------------- |
| SEC-001 | Auth provider                  | Evidence | Current control | Gap | Severity | Recommendation |
| SEC-002 | Session tokens/cookies         | Evidence | Current control | Gap | Severity | Recommendation |
| SEC-003 | JWT validation                 | Evidence | Current control | Gap | Severity | Recommendation |
| SEC-004 | CSRF/CORS                      | Evidence | Current control | Gap | Severity | Recommendation |
| SEC-005 | Rate limits                    | Evidence | Current control | Gap | Severity | Recommendation |
| SEC-006 | Security headers               | Evidence | Current control | Gap | Severity | Recommendation |
| SEC-007 | Input/output validation        | Evidence | Current control | Gap | Severity | Recommendation |
| SEC-008 | File handling                  | Evidence | Current control | Gap | Severity | Recommendation |
| SEC-009 | API permissions                | Evidence | Current control | Gap | Severity | Recommendation |
| SEC-010 | Admin permissions              | Evidence | Current control | Gap | Severity | Recommendation |
| SEC-011 | Tenant/org/workspace isolation | Evidence | Current control | Gap | Severity | Recommendation |
| SEC-012 | RLS policies                   | Evidence | Current control | Gap | Severity | Recommendation |

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
