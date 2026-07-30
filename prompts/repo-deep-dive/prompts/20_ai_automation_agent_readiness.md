# Prompt 20 - AI Automation and Agent Readiness Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit whether AI coding agents can safely contribute without breaking architecture, security, tests, docs, or release gates.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/20_ai_automation_agent_readiness.md`

## Area code

Use finding IDs beginning with `AI`.

Examples:

- `AI-P0-001`
- `AI-P1-001`
- `AI-P2-001`
- `AI-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for agent instructions?
2. What repository evidence proves the current behavior for copilot/cursor/windsurf/claude configs?
3. What repository evidence proves the current behavior for prompt packs?
4. What repository evidence proves the current behavior for repo maps?
5. What repository evidence proves the current behavior for conventions?
6. What repository evidence proves the current behavior for validation commands?
7. What repository evidence proves the current behavior for safe-change boundaries?
8. What repository evidence proves the current behavior for do-not-touch areas?
9. What repository evidence proves the current behavior for secrets guidance?
10. What repository evidence proves the current behavior for pr guidance?

## Scope to analyze

- Agent instructions
- Copilot/Cursor/Windsurf/Claude configs
- Prompt packs
- Repo maps
- Conventions
- Validation commands
- Safe-change boundaries
- Do-not-touch areas
- Secrets guidance
- PR guidance
- Audit output conventions
- Generated code risks
- CI gates
- Human approvals
- Rollback expectations
- Prompt injection risks
- AI code provenance

## Required special checks

- Warn about untrusted repo content and prompt injection
- Require small-batch PR rules
- Recommend agent instruction file

## Required outputs and companion artifacts

- Agent inventory
- Safe contribution rules
- Missing guardrails
- AI validation checklist

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

- [ ] Reviewed Agent instructions
- [ ] Reviewed Copilot/Cursor/Windsurf/Claude configs
- [ ] Reviewed Prompt packs
- [ ] Reviewed Repo maps
- [ ] Reviewed Conventions
- [ ] Reviewed Validation commands
- [ ] Reviewed Safe-change boundaries
- [ ] Reviewed Do-not-touch areas
- [ ] Reviewed Secrets guidance
- [ ] Reviewed PR guidance
- [ ] Reviewed Audit output conventions
- [ ] Reviewed Generated code risks
- [ ] Reviewed CI gates
- [ ] Reviewed Human approvals
- [ ] Reviewed Rollback expectations
- [ ] Reviewed Prompt injection risks
- [ ] Reviewed AI code provenance

## Required report structure

```markdown
# AI Automation and Agent Readiness Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: AI
- Output path: docs/audits/{name}/{run}/20_ai_automation_agent_readiness.md
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

| Category                               | Score | Evidence | Gap | Recommended action |
| -------------------------------------- | ----: | -------- | --- | ------------------ |
| Agent instructions                     |   0-5 | Evidence | Gap | Recommended action |
| Copilot/Cursor/Windsurf/Claude configs |   0-5 | Evidence | Gap | Recommended action |
| Prompt packs                           |   0-5 | Evidence | Gap | Recommended action |
| Repo maps                              |   0-5 | Evidence | Gap | Recommended action |
| Conventions                            |   0-5 | Evidence | Gap | Recommended action |
| Validation commands                    |   0-5 | Evidence | Gap | Recommended action |
| Safe-change boundaries                 |   0-5 | Evidence | Gap | Recommended action |
| Do-not-touch areas                     |   0-5 | Evidence | Gap | Recommended action |
| Secrets guidance                       |   0-5 | Evidence | Gap | Recommended action |
| PR guidance                            |   0-5 | Evidence | Gap | Recommended action |
| Audit output conventions               |   0-5 | Evidence | Gap | Recommended action |
| Generated code risks                   |   0-5 | Evidence | Gap | Recommended action |

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

| ID     | Scenario or control                    | Evidence | Current control | Gap | Severity | Recommendation |
| ------ | -------------------------------------- | -------- | --------------- | --- | -------- | -------------- |
| AI-001 | Agent instructions                     | Evidence | Current control | Gap | Severity | Recommendation |
| AI-002 | Copilot/Cursor/Windsurf/Claude configs | Evidence | Current control | Gap | Severity | Recommendation |
| AI-003 | Prompt packs                           | Evidence | Current control | Gap | Severity | Recommendation |
| AI-004 | Repo maps                              | Evidence | Current control | Gap | Severity | Recommendation |
| AI-005 | Conventions                            | Evidence | Current control | Gap | Severity | Recommendation |
| AI-006 | Validation commands                    | Evidence | Current control | Gap | Severity | Recommendation |
| AI-007 | Safe-change boundaries                 | Evidence | Current control | Gap | Severity | Recommendation |
| AI-008 | Do-not-touch areas                     | Evidence | Current control | Gap | Severity | Recommendation |
| AI-009 | Secrets guidance                       | Evidence | Current control | Gap | Severity | Recommendation |
| AI-010 | PR guidance                            | Evidence | Current control | Gap | Severity | Recommendation |
| AI-011 | Audit output conventions               | Evidence | Current control | Gap | Severity | Recommendation |
| AI-012 | Generated code risks                   | Evidence | Current control | Gap | Severity | Recommendation |

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
