# 40_release_notes_changelog_generator — Prompt 40 - Release Notes and Changelog Generator

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `40_release_notes_changelog_generator.md` (area REL, prompt)

## Verification Performed

Domain subagent produced 12 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| REL-P1-001 | P1 | No version identity: no tags, no product version, no commit binding in generated artifacts |
| REL-P1-002 | P1 | Documented production deploy path is stated as non-functional and the approval gate claim is false |
| REL-P2-001 | P2 | `CHANGELOG.md` is stale relative to HEAD for the final commits in the delta |
| REL-P2-002 | P2 | No explicit Breaking Changes or upgrade manifest despite 34 migrations and RLS/entitlement behavior changes |
| REL-P2-003 | P2 | No release-notes or GitHub Release body template; release body must be authored ad hoc |
| REL-P2-004 | P2 | Rollback documentation is stale (Terraform push flow) and repeats the false approval claim |
| REL-P2-005 | P2 | Release docs claim `main` is far behind `develop`; the repo state is the opposite |
| REL-P3-001 | P3 | Commit history contains non-conventional noise commits and a single author, reducing automated-notes quality |
| REL-P3-002 | P3 | PR template lacks changelog and versioned-artifact checkboxes |
| REL-P3-003 | P3 | CRITICAL dependency fix (handlebars override) shipped without a CHANGELOG entry |
| REL-P3-004 | P3 | Delta changelog entries are filed under `Fixed` only, mislabelling features and operator changes |
| REL-P2-006 | P2 | Release workflow fails on every promotion push, so no tag or GitHub Release is ever created |
