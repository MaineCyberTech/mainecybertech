# Prompt 15 - Performance, Scalability, and Cost Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit performance bottlenecks, scalability risks, cost drivers, frontend/API/DB/worker efficiency, and CI cost.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/15_performance_scalability_cost.md`

## Area code

Use finding IDs beginning with `PERF`.

Examples:

- `PERF-P0-001`
- `PERF-P1-001`
- `PERF-P2-001`
- `PERF-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for bundle size indicators?
2. What repository evidence proves the current behavior for ssr/client hot spots?
3. What repository evidence proves the current behavior for heavy dependencies?
4. What repository evidence proves the current behavior for images/caching?
5. What repository evidence proves the current behavior for pagination?
6. What repository evidence proves the current behavior for n+1 risks?
7. What repository evidence proves the current behavior for indexes/query patterns?
8. What repository evidence proves the current behavior for worker throughput?
9. What repository evidence proves the current behavior for queue concurrency?
10. What repository evidence proves the current behavior for realtime scaling?

## Scope to analyze

- Bundle size indicators
- SSR/client hot spots
- Heavy dependencies
- Images/caching
- Pagination
- N+1 risks
- Indexes/query patterns
- Worker throughput
- Queue concurrency
- Realtime scaling
- Webhook volume
- Rate limiting
- CDN/proxy
- Container resources
- Build/test times
- CI caching
- Storage/log growth
- Third-party API cost

## Required special checks

- Find unbounded queries/lists
- Recommend performance budgets
- Identify cost-risk hotspots

## Required outputs and companion artifacts

- Performance inventory
- Frontend/API/DB/worker findings
- Cost risks
- Benchmark plan

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

- [ ] Reviewed Bundle size indicators
- [ ] Reviewed SSR/client hot spots
- [ ] Reviewed Heavy dependencies
- [ ] Reviewed Images/caching
- [ ] Reviewed Pagination
- [ ] Reviewed N+1 risks
- [ ] Reviewed Indexes/query patterns
- [ ] Reviewed Worker throughput
- [ ] Reviewed Queue concurrency
- [ ] Reviewed Realtime scaling
- [ ] Reviewed Webhook volume
- [ ] Reviewed Rate limiting
- [ ] Reviewed CDN/proxy
- [ ] Reviewed Container resources
- [ ] Reviewed Build/test times
- [ ] Reviewed CI caching
- [ ] Reviewed Storage/log growth
- [ ] Reviewed Third-party API cost

## Required report structure

```markdown
# Performance, Scalability, and Cost Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: PERF
- Output path: docs/audits/{name}/{run}/15_performance_scalability_cost.md
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

| Category               | Score | Evidence | Gap | Recommended action |
| ---------------------- | ----: | -------- | --- | ------------------ |
| Bundle size indicators |   0-5 | Evidence | Gap | Recommended action |
| SSR/client hot spots   |   0-5 | Evidence | Gap | Recommended action |
| Heavy dependencies     |   0-5 | Evidence | Gap | Recommended action |
| Images/caching         |   0-5 | Evidence | Gap | Recommended action |
| Pagination             |   0-5 | Evidence | Gap | Recommended action |
| N+1 risks              |   0-5 | Evidence | Gap | Recommended action |
| Indexes/query patterns |   0-5 | Evidence | Gap | Recommended action |
| Worker throughput      |   0-5 | Evidence | Gap | Recommended action |
| Queue concurrency      |   0-5 | Evidence | Gap | Recommended action |
| Realtime scaling       |   0-5 | Evidence | Gap | Recommended action |
| Webhook volume         |   0-5 | Evidence | Gap | Recommended action |
| Rate limiting          |   0-5 | Evidence | Gap | Recommended action |

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

| ID       | Scenario or control    | Evidence | Current control | Gap | Severity | Recommendation |
| -------- | ---------------------- | -------- | --------------- | --- | -------- | -------------- |
| PERF-001 | Bundle size indicators | Evidence | Current control | Gap | Severity | Recommendation |
| PERF-002 | SSR/client hot spots   | Evidence | Current control | Gap | Severity | Recommendation |
| PERF-003 | Heavy dependencies     | Evidence | Current control | Gap | Severity | Recommendation |
| PERF-004 | Images/caching         | Evidence | Current control | Gap | Severity | Recommendation |
| PERF-005 | Pagination             | Evidence | Current control | Gap | Severity | Recommendation |
| PERF-006 | N+1 risks              | Evidence | Current control | Gap | Severity | Recommendation |
| PERF-007 | Indexes/query patterns | Evidence | Current control | Gap | Severity | Recommendation |
| PERF-008 | Worker throughput      | Evidence | Current control | Gap | Severity | Recommendation |
| PERF-009 | Queue concurrency      | Evidence | Current control | Gap | Severity | Recommendation |
| PERF-010 | Realtime scaling       | Evidence | Current control | Gap | Severity | Recommendation |
| PERF-011 | Webhook volume         | Evidence | Current control | Gap | Severity | Recommendation |
| PERF-012 | Rate limiting          | Evidence | Current control | Gap | Severity | Recommendation |

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
