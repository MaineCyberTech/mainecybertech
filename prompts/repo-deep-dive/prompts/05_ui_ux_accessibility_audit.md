# Prompt 05 - UI/UX, Design System, and Accessibility Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit visual consistency, component reuse, responsive layouts, design-system maturity, and accessibility readiness.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/05_ui_ux_accessibility_audit.md`

## Area code

Use finding IDs beginning with `UX`.

Examples:

- `UX-P0-001`
- `UX-P1-001`
- `UX-P2-001`
- `UX-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for design tokens?
2. What repository evidence proves the current behavior for css/tailwind/theme?
3. What repository evidence proves the current behavior for reusable components?
4. What repository evidence proves the current behavior for layouts/nav?
5. What repository evidence proves the current behavior for forms/dialogs/toasts/tables/cards?
6. What repository evidence proves the current behavior for icons/color/typography/spacing?
7. What repository evidence proves the current behavior for focus states?
8. What repository evidence proves the current behavior for keyboard nav?
9. What repository evidence proves the current behavior for aria?
10. What repository evidence proves the current behavior for semantic html?

## Scope to analyze

- Design tokens
- CSS/Tailwind/theme
- Reusable components
- Layouts/nav
- Forms/dialogs/toasts/tables/cards
- Icons/color/typography/spacing
- Focus states
- Keyboard nav
- ARIA
- Semantic HTML
- Responsive breakpoints
- Dark mode
- Skeletons/errors/empty states
- Storybook
- Visual/A11y tests

## Required special checks

- Use WCAG-style checks
- Call out mobile/table/modal issues
- Identify missing component standards
- Recommend regression tests

## Required outputs and companion artifacts

- Design-system inventory
- Component inventory
- A11y findings
- Responsive findings
- UI regression plan

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

- [ ] Reviewed Design tokens
- [ ] Reviewed CSS/Tailwind/theme
- [ ] Reviewed Reusable components
- [ ] Reviewed Layouts/nav
- [ ] Reviewed Forms/dialogs/toasts/tables/cards
- [ ] Reviewed Icons/color/typography/spacing
- [ ] Reviewed Focus states
- [ ] Reviewed Keyboard nav
- [ ] Reviewed ARIA
- [ ] Reviewed Semantic HTML
- [ ] Reviewed Responsive breakpoints
- [ ] Reviewed Dark mode
- [ ] Reviewed Skeletons/errors/empty states
- [ ] Reviewed Storybook
- [ ] Reviewed Visual/A11y tests

## Required report structure

```markdown
# UI/UX, Design System, and Accessibility Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: UX
- Output path: docs/audits/{name}/{run}/05_ui_ux_accessibility_audit.md
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
| Design tokens                     |   0-5 | Evidence | Gap | Recommended action |
| CSS/Tailwind/theme                |   0-5 | Evidence | Gap | Recommended action |
| Reusable components               |   0-5 | Evidence | Gap | Recommended action |
| Layouts/nav                       |   0-5 | Evidence | Gap | Recommended action |
| Forms/dialogs/toasts/tables/cards |   0-5 | Evidence | Gap | Recommended action |
| Icons/color/typography/spacing    |   0-5 | Evidence | Gap | Recommended action |
| Focus states                      |   0-5 | Evidence | Gap | Recommended action |
| Keyboard nav                      |   0-5 | Evidence | Gap | Recommended action |
| ARIA                              |   0-5 | Evidence | Gap | Recommended action |
| Semantic HTML                     |   0-5 | Evidence | Gap | Recommended action |
| Responsive breakpoints            |   0-5 | Evidence | Gap | Recommended action |
| Dark mode                         |   0-5 | Evidence | Gap | Recommended action |

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

| ID     | Scenario or control               | Evidence | Current control | Gap | Severity | Recommendation |
| ------ | --------------------------------- | -------- | --------------- | --- | -------- | -------------- |
| UX-001 | Design tokens                     | Evidence | Current control | Gap | Severity | Recommendation |
| UX-002 | CSS/Tailwind/theme                | Evidence | Current control | Gap | Severity | Recommendation |
| UX-003 | Reusable components               | Evidence | Current control | Gap | Severity | Recommendation |
| UX-004 | Layouts/nav                       | Evidence | Current control | Gap | Severity | Recommendation |
| UX-005 | Forms/dialogs/toasts/tables/cards | Evidence | Current control | Gap | Severity | Recommendation |
| UX-006 | Icons/color/typography/spacing    | Evidence | Current control | Gap | Severity | Recommendation |
| UX-007 | Focus states                      | Evidence | Current control | Gap | Severity | Recommendation |
| UX-008 | Keyboard nav                      | Evidence | Current control | Gap | Severity | Recommendation |
| UX-009 | ARIA                              | Evidence | Current control | Gap | Severity | Recommendation |
| UX-010 | Semantic HTML                     | Evidence | Current control | Gap | Severity | Recommendation |
| UX-011 | Responsive breakpoints            | Evidence | Current control | Gap | Severity | Recommendation |
| UX-012 | Dark mode                         | Evidence | Current control | Gap | Severity | Recommendation |

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
