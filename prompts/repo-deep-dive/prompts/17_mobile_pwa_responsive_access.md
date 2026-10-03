# Prompt 17 - Mobile, PWA, and Responsive Access Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit mobile usability, responsive layouts, PWA behavior, offline readiness, installability, push, and touch workflows.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/17_mobile_pwa_responsive_access.md`

## Area code

Use finding IDs beginning with `MOB`.

Examples:

- `MOB-P0-001`
- `MOB-P1-001`
- `MOB-P2-001`
- `MOB-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for viewport?
2. What repository evidence proves the current behavior for responsive layouts?
3. What repository evidence proves the current behavior for mobile nav?
4. What repository evidence proves the current behavior for touch targets?
5. What repository evidence proves the current behavior for mobile forms?
6. What repository evidence proves the current behavior for mobile dialogs/tables?
7. What repository evidence proves the current behavior for auth/dashboard/admin mobile?
8. What repository evidence proves the current behavior for pwa manifest?
9. What repository evidence proves the current behavior for service worker?
10. What repository evidence proves the current behavior for offline fallback?

## Scope to analyze

- Viewport
- Responsive layouts
- Mobile nav
- Touch targets
- Mobile forms
- Mobile dialogs/tables
- Auth/dashboard/admin mobile
- PWA manifest
- Service worker
- Offline fallback
- Install prompt
- Push notifications
- Icons
- Cache strategy
- Update flow
- Background sync
- Mobile E2E
- Touch accessibility

## Required special checks

- Detect horizontal overflow and desktop-only layouts
- Review service worker cache risks
- Check notification permission UX

## Required outputs and companion artifacts

- Mobile workflow inventory
- PWA inventory
- Responsive findings
- Push/offline test plan

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

- [ ] Reviewed Viewport
- [ ] Reviewed Responsive layouts
- [ ] Reviewed Mobile nav
- [ ] Reviewed Touch targets
- [ ] Reviewed Mobile forms
- [ ] Reviewed Mobile dialogs/tables
- [ ] Reviewed Auth/dashboard/admin mobile
- [ ] Reviewed PWA manifest
- [ ] Reviewed Service worker
- [ ] Reviewed Offline fallback
- [ ] Reviewed Install prompt
- [ ] Reviewed Push notifications
- [ ] Reviewed Icons
- [ ] Reviewed Cache strategy
- [ ] Reviewed Update flow
- [ ] Reviewed Background sync
- [ ] Reviewed Mobile E2E
- [ ] Reviewed Touch accessibility

## Required report structure

```markdown
# Mobile, PWA, and Responsive Access Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: MOB
- Output path: docs/audits/{name}/{run}/17_mobile_pwa_responsive_access.md
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
| Viewport                    |   0-5 | Evidence | Gap | Recommended action |
| Responsive layouts          |   0-5 | Evidence | Gap | Recommended action |
| Mobile nav                  |   0-5 | Evidence | Gap | Recommended action |
| Touch targets               |   0-5 | Evidence | Gap | Recommended action |
| Mobile forms                |   0-5 | Evidence | Gap | Recommended action |
| Mobile dialogs/tables       |   0-5 | Evidence | Gap | Recommended action |
| Auth/dashboard/admin mobile |   0-5 | Evidence | Gap | Recommended action |
| PWA manifest                |   0-5 | Evidence | Gap | Recommended action |
| Service worker              |   0-5 | Evidence | Gap | Recommended action |
| Offline fallback            |   0-5 | Evidence | Gap | Recommended action |
| Install prompt              |   0-5 | Evidence | Gap | Recommended action |
| Push notifications          |   0-5 | Evidence | Gap | Recommended action |

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

| ID      | Scenario or control         | Evidence | Current control | Gap | Severity | Recommendation |
| ------- | --------------------------- | -------- | --------------- | --- | -------- | -------------- |
| MOB-001 | Viewport                    | Evidence | Current control | Gap | Severity | Recommendation |
| MOB-002 | Responsive layouts          | Evidence | Current control | Gap | Severity | Recommendation |
| MOB-003 | Mobile nav                  | Evidence | Current control | Gap | Severity | Recommendation |
| MOB-004 | Touch targets               | Evidence | Current control | Gap | Severity | Recommendation |
| MOB-005 | Mobile forms                | Evidence | Current control | Gap | Severity | Recommendation |
| MOB-006 | Mobile dialogs/tables       | Evidence | Current control | Gap | Severity | Recommendation |
| MOB-007 | Auth/dashboard/admin mobile | Evidence | Current control | Gap | Severity | Recommendation |
| MOB-008 | PWA manifest                | Evidence | Current control | Gap | Severity | Recommendation |
| MOB-009 | Service worker              | Evidence | Current control | Gap | Severity | Recommendation |
| MOB-010 | Offline fallback            | Evidence | Current control | Gap | Severity | Recommendation |
| MOB-011 | Install prompt              | Evidence | Current control | Gap | Severity | Recommendation |
| MOB-012 | Push notifications          | Evidence | Current control | Gap | Severity | Recommendation |

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
