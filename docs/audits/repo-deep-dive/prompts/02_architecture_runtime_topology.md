# Prompt 02 - Architecture and Runtime Topology Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Explain system architecture, runtime components, data flow, trust boundaries, deployment topology, and operational model.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/02_architecture_runtime_topology.md`

## Area code

Use finding IDs beginning with `ARCH`.

Examples:

- `ARCH-P0-001`
- `ARCH-P1-001`
- `ARCH-P2-001`
- `ARCH-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for monorepo structure?
2. What repository evidence proves the current behavior for frontend/backend/worker boundaries?
3. What repository evidence proves the current behavior for auth/session flow?
4. What repository evidence proves the current behavior for authorization and tenant boundaries?
5. What repository evidence proves the current behavior for request lifecycle?
6. What repository evidence proves the current behavior for data flow?
7. What repository evidence proves the current behavior for background jobs?
8. What repository evidence proves the current behavior for queues?
9. What repository evidence proves the current behavior for webhooks?
10. What repository evidence proves the current behavior for realtime?

## Scope to analyze

- Monorepo structure
- Frontend/backend/worker boundaries
- Auth/session flow
- Authorization and tenant boundaries
- Request lifecycle
- Data flow
- Background jobs
- Queues
- Webhooks
- Realtime
- Notifications
- External integrations
- Deployment topology
- Environment parity
- Error handling
- Runtime validation

## Required special checks

- Include Mermaid diagrams
- Call out coupling and hidden runtime assumptions
- Identify single points of failure
- Map service-to-service dependencies

## Required outputs and companion artifacts

- System context diagram
- Container diagram
- Request sequence
- Auth sequence
- Data flow diagram
- Worker/job flow
- Deployment topology
- Tenant boundary map

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

- [ ] Reviewed Monorepo structure
- [ ] Reviewed Frontend/backend/worker boundaries
- [ ] Reviewed Auth/session flow
- [ ] Reviewed Authorization and tenant boundaries
- [ ] Reviewed Request lifecycle
- [ ] Reviewed Data flow
- [ ] Reviewed Background jobs
- [ ] Reviewed Queues
- [ ] Reviewed Webhooks
- [ ] Reviewed Realtime
- [ ] Reviewed Notifications
- [ ] Reviewed External integrations
- [ ] Reviewed Deployment topology
- [ ] Reviewed Environment parity
- [ ] Reviewed Error handling
- [ ] Reviewed Runtime validation

## Required report structure

```markdown
# Architecture and Runtime Topology Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: ARCH
- Output path: docs/audits/{name}/{run}/02_architecture_runtime_topology.md
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

| Category                            | Score | Evidence | Gap | Recommended action |
| ----------------------------------- | ----: | -------- | --- | ------------------ |
| Monorepo structure                  |   0-5 | Evidence | Gap | Recommended action |
| Frontend/backend/worker boundaries  |   0-5 | Evidence | Gap | Recommended action |
| Auth/session flow                   |   0-5 | Evidence | Gap | Recommended action |
| Authorization and tenant boundaries |   0-5 | Evidence | Gap | Recommended action |
| Request lifecycle                   |   0-5 | Evidence | Gap | Recommended action |
| Data flow                           |   0-5 | Evidence | Gap | Recommended action |
| Background jobs                     |   0-5 | Evidence | Gap | Recommended action |
| Queues                              |   0-5 | Evidence | Gap | Recommended action |
| Webhooks                            |   0-5 | Evidence | Gap | Recommended action |
| Realtime                            |   0-5 | Evidence | Gap | Recommended action |
| Notifications                       |   0-5 | Evidence | Gap | Recommended action |
| External integrations               |   0-5 | Evidence | Gap | Recommended action |

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

| ID       | Scenario or control                 | Evidence | Current control | Gap | Severity | Recommendation |
| -------- | ----------------------------------- | -------- | --------------- | --- | -------- | -------------- |
| ARCH-001 | Monorepo structure                  | Evidence | Current control | Gap | Severity | Recommendation |
| ARCH-002 | Frontend/backend/worker boundaries  | Evidence | Current control | Gap | Severity | Recommendation |
| ARCH-003 | Auth/session flow                   | Evidence | Current control | Gap | Severity | Recommendation |
| ARCH-004 | Authorization and tenant boundaries | Evidence | Current control | Gap | Severity | Recommendation |
| ARCH-005 | Request lifecycle                   | Evidence | Current control | Gap | Severity | Recommendation |
| ARCH-006 | Data flow                           | Evidence | Current control | Gap | Severity | Recommendation |
| ARCH-007 | Background jobs                     | Evidence | Current control | Gap | Severity | Recommendation |
| ARCH-008 | Queues                              | Evidence | Current control | Gap | Severity | Recommendation |
| ARCH-009 | Webhooks                            | Evidence | Current control | Gap | Severity | Recommendation |
| ARCH-010 | Realtime                            | Evidence | Current control | Gap | Severity | Recommendation |
| ARCH-011 | Notifications                       | Evidence | Current control | Gap | Severity | Recommendation |
| ARCH-012 | External integrations               | Evidence | Current control | Gap | Severity | Recommendation |

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
