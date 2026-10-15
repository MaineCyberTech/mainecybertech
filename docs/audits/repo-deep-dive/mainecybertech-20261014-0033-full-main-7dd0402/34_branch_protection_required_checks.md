# 34_branch_protection_required_checks — Prompt 34 - Branch Protection and Required Checks Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `34_branch_protection_required_checks.md` (area BP, prompt)

## Verification Performed

Domain subagent produced 16 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| BP-P1-001 | P1 | `main` requires a context (`Dependency Review`) that no job emits |
| BP-P1-002 | P1 | `enforce_admins:false` lets administrators bypass all required checks and reviews |
| BP-P1-003 | P1 | Production deploy path uses the unguarded `prod` environment, not `prod-approval` |
| BP-P2-001 | P2 | `require_code_owner_reviews:false` makes the committed CODEOWNERS advisory only |
| BP-P2-002 | P2 | No break-glass / bypass process for branch protection, and no bypass audit trail |
| BP-P2-003 | P2 | No drift detection between committed branch-protection JSON and live GitHub settings |
| BP-P2-004 | P2 | Path-filtered required checks can leave `main`/`develop` protected by checks that never run |
| BP-P2-005 | P2 | Required-check guard is not run on pull requests or on branch-protection-only changes |
| BP-P2-006 | P2 | `deploy-do` manual dispatch can target prod from an arbitrary ref, bypassing the develop->main promotion model |
| BP-P2-007 | P2 | Security scan jobs are not required checks, so failing scans do not block merges |
| BP-P3-001 | P3 | Hotfix and emergency-deploy documentation is a stub and partially stale |
| BP-P3-002 | P3 | Dependabot has no security-update separation or triage SLA, and PR template has no enforced link to required checks |
| BP-P3-003 | P3 | Operator checklists disagree on which prod environments need required reviewers (`prod` vs `prod-approval`) |
| BP-P3-004 | P3 | check-required-checks guard mis-models explicit job names combined with matrices |
| BP-P3-005 | P3 | No CODEOWNERS validation; invalid team handles silently disable owner-review enforcement |
| BP-P1-004 | P1 | PR #279 merged into main with required checks pending and zero reviews - live protection does not match the committed payloads (or an unrecorded bypass) |
