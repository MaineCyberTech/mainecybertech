# Prompt 08 - API Contracts, Realtime, and Integrations Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit API correctness, contracts, realtime channels, webhooks, external integrations, pagination, errors, retries, and idempotency.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/08_api_contracts_realtime_integrations.md`

## Area code

Use finding IDs beginning with `API`.

Examples:

- `API-P0-001`
- `API-P1-001`
- `API-P2-001`
- `API-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for rest/rpc routes?
2. What repository evidence proves the current behavior for server actions?
3. What repository evidence proves the current behavior for websocket/realtime?
4. What repository evidence proves the current behavior for subscriptions/events?
5. What repository evidence proves the current behavior for webhooks?
6. What repository evidence proves the current behavior for external clients?
7. What repository evidence proves the current behavior for retries/timeouts/circuit breakers?
8. What repository evidence proves the current behavior for pagination/filter/sort?
9. What repository evidence proves the current behavior for error response format?
10. What repository evidence proves the current behavior for openapi/versioning?

## Scope to analyze

- REST/RPC routes
- Server actions
- WebSocket/realtime
- Subscriptions/events
- Webhooks
- External clients
- Retries/timeouts/circuit breakers
- Pagination/filter/sort
- Error response format
- OpenAPI/versioning
- Request/response validation
- Auth/rate limit
- Background delivery
- Dead-letter handling
- Duplicate event behavior
- Integration secrets
- Tests/docs

## Required special checks

- Every route should have validation and auth intent
- Realtime must be authorized
- External calls need timeout/retry/idempotency
- Integration failures must not corrupt local state

## Required outputs and companion artifacts

- API inventory
- Realtime inventory
- Integration inventory
- Contract test plan

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

- [ ] Reviewed REST/RPC routes
- [ ] Reviewed Server actions
- [ ] Reviewed WebSocket/realtime
- [ ] Reviewed Subscriptions/events
- [ ] Reviewed Webhooks
- [ ] Reviewed External clients
- [ ] Reviewed Retries/timeouts/circuit breakers
- [ ] Reviewed Pagination/filter/sort
- [ ] Reviewed Error response format
- [ ] Reviewed OpenAPI/versioning
- [ ] Reviewed Request/response validation
- [ ] Reviewed Auth/rate limit
- [ ] Reviewed Background delivery
- [ ] Reviewed Dead-letter handling
- [ ] Reviewed Duplicate event behavior
- [ ] Reviewed Integration secrets
- [ ] Reviewed Tests/docs

## Required report structure

```markdown
# API Contracts, Realtime, and Integrations Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: API
- Output path: docs/audits/{name}/{run}/08_api_contracts_realtime_integrations.md
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

| Category                          | Score | Evidence | Gap | Recommended action |
| --------------------------------- | ----: | -------- | --- | ------------------ |
| REST/RPC routes                   |   0-5 | Evidence | Gap | Recommended action |
| Server actions                    |   0-5 | Evidence | Gap | Recommended action |
| WebSocket/realtime                |   0-5 | Evidence | Gap | Recommended action |
| Subscriptions/events              |   0-5 | Evidence | Gap | Recommended action |
| Webhooks                          |   0-5 | Evidence | Gap | Recommended action |
| External clients                  |   0-5 | Evidence | Gap | Recommended action |
| Retries/timeouts/circuit breakers |   0-5 | Evidence | Gap | Recommended action |
| Pagination/filter/sort            |   0-5 | Evidence | Gap | Recommended action |
| Error response format             |   0-5 | Evidence | Gap | Recommended action |
| OpenAPI/versioning                |   0-5 | Evidence | Gap | Recommended action |
| Request/response validation       |   0-5 | Evidence | Gap | Recommended action |
| Auth/rate limit                   |   0-5 | Evidence | Gap | Recommended action |

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

| ID      | Scenario or control               | Evidence | Current control | Gap | Severity | Recommendation |
| ------- | --------------------------------- | -------- | --------------- | --- | -------- | -------------- |
| API-001 | REST/RPC routes                   | Evidence | Current control | Gap | Severity | Recommendation |
| API-002 | Server actions                    | Evidence | Current control | Gap | Severity | Recommendation |
| API-003 | WebSocket/realtime                | Evidence | Current control | Gap | Severity | Recommendation |
| API-004 | Subscriptions/events              | Evidence | Current control | Gap | Severity | Recommendation |
| API-005 | Webhooks                          | Evidence | Current control | Gap | Severity | Recommendation |
| API-006 | External clients                  | Evidence | Current control | Gap | Severity | Recommendation |
| API-007 | Retries/timeouts/circuit breakers | Evidence | Current control | Gap | Severity | Recommendation |
| API-008 | Pagination/filter/sort            | Evidence | Current control | Gap | Severity | Recommendation |
| API-009 | Error response format             | Evidence | Current control | Gap | Severity | Recommendation |
| API-010 | OpenAPI/versioning                | Evidence | Current control | Gap | Severity | Recommendation |
| API-011 | Request/response validation       | Evidence | Current control | Gap | Severity | Recommendation |
| API-012 | Auth/rate limit                   | Evidence | Current control | Gap | Severity | Recommendation |

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
