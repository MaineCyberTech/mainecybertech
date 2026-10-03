# Prompt 40 - Release Notes and Changelog Generator

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Generate release notes and changelog drafts from git history, diffs, audit evidence, migrations, docs, and changed files.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/40_release_notes_changelog_generator.md`

## Area code

Use finding IDs beginning with `REL`.

Examples:

- `REL-P0-001`
- `REL-P1-001`
- `REL-P2-001`
- `REL-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for git history?
2. What repository evidence proves the current behavior for pr templates?
3. What repository evidence proves the current behavior for changelog/release notes templates?
4. What repository evidence proves the current behavior for version files?
5. What repository evidence proves the current behavior for package versions?
6. What repository evidence proves the current behavior for migrations?
7. What repository evidence proves the current behavior for api/ui/security/bug/dependency/infra/docs changes?
8. What repository evidence proves the current behavior for breaking changes?
9. What repository evidence proves the current behavior for known issues?
10. What repository evidence proves the current behavior for operator actions?

## Scope to analyze

- Git history
- PR templates
- Changelog/release notes templates
- Version files
- Package versions
- Migrations
- API/UI/security/bug/dependency/infra/docs changes
- Breaking changes
- Known issues
- Operator actions
- Migration steps
- Rollback notes
- Test evidence
- Audit outputs

## Required special checks

- Do not invent changes
- If git history unavailable, state limitation and use diffs/audit evidence only
- Separate user/admin/operator/security notes

## Required outputs and companion artifacts

- `release_notes_draft.md`
- `changelog_draft.md`
- GitHub release body
- Upgrade/rollback notes

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

- [ ] Reviewed Git history
- [ ] Reviewed PR templates
- [ ] Reviewed Changelog/release notes templates
- [ ] Reviewed Version files
- [ ] Reviewed Package versions
- [ ] Reviewed Migrations
- [ ] Reviewed API/UI/security/bug/dependency/infra/docs changes
- [ ] Reviewed Breaking changes
- [ ] Reviewed Known issues
- [ ] Reviewed Operator actions
- [ ] Reviewed Migration steps
- [ ] Reviewed Rollback notes
- [ ] Reviewed Test evidence
- [ ] Reviewed Audit outputs

## Required report structure

```markdown
# Release Notes and Changelog Generator

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: REL
- Output path: docs/audits/{name}/{run}/40_release_notes_changelog_generator.md
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

| Category                                          | Score | Evidence | Gap | Recommended action |
| ------------------------------------------------- | ----: | -------- | --- | ------------------ |
| Git history                                       |   0-5 | Evidence | Gap | Recommended action |
| PR templates                                      |   0-5 | Evidence | Gap | Recommended action |
| Changelog/release notes templates                 |   0-5 | Evidence | Gap | Recommended action |
| Version files                                     |   0-5 | Evidence | Gap | Recommended action |
| Package versions                                  |   0-5 | Evidence | Gap | Recommended action |
| Migrations                                        |   0-5 | Evidence | Gap | Recommended action |
| API/UI/security/bug/dependency/infra/docs changes |   0-5 | Evidence | Gap | Recommended action |
| Breaking changes                                  |   0-5 | Evidence | Gap | Recommended action |
| Known issues                                      |   0-5 | Evidence | Gap | Recommended action |
| Operator actions                                  |   0-5 | Evidence | Gap | Recommended action |
| Migration steps                                   |   0-5 | Evidence | Gap | Recommended action |
| Rollback notes                                    |   0-5 | Evidence | Gap | Recommended action |

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

| ID      | Scenario or control                               | Evidence | Current control | Gap | Severity | Recommendation |
| ------- | ------------------------------------------------- | -------- | --------------- | --- | -------- | -------------- |
| REL-001 | Git history                                       | Evidence | Current control | Gap | Severity | Recommendation |
| REL-002 | PR templates                                      | Evidence | Current control | Gap | Severity | Recommendation |
| REL-003 | Changelog/release notes templates                 | Evidence | Current control | Gap | Severity | Recommendation |
| REL-004 | Version files                                     | Evidence | Current control | Gap | Severity | Recommendation |
| REL-005 | Package versions                                  | Evidence | Current control | Gap | Severity | Recommendation |
| REL-006 | Migrations                                        | Evidence | Current control | Gap | Severity | Recommendation |
| REL-007 | API/UI/security/bug/dependency/infra/docs changes | Evidence | Current control | Gap | Severity | Recommendation |
| REL-008 | Breaking changes                                  | Evidence | Current control | Gap | Severity | Recommendation |
| REL-009 | Known issues                                      | Evidence | Current control | Gap | Severity | Recommendation |
| REL-010 | Operator actions                                  | Evidence | Current control | Gap | Severity | Recommendation |
| REL-011 | Migration steps                                   | Evidence | Current control | Gap | Severity | Recommendation |
| REL-012 | Rollback notes                                    | Evidence | Current control | Gap | Severity | Recommendation |

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
