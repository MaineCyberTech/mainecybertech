# Executive Summary

- Target: `mainecybertech` @ `905ed63` (branch `develop`)
- Run: `mainecybertech-20261013-0126-fast-develop-905ed63` (fast mode, full-domain)
- Verdict: **GO WITH CONDITIONS**

## Findings

- 94 total: P0 0, P1 14, P2 39, P3 41.
- Domains covered: deterministic, 06_security_authz_tenancy_audit, 10_github_actions_cicd_governance, 11_supply_chain_dependency_secrets.

## P1 disposition (re-audit at 905ed63)

- **Verified fixed (12):** CI-P1-002, SC-P1-001, SEC-P1-001..010 — code references in the register rows.
- **Still open / operator-gated (2):** CI-P1-001 (prod-approval reviewers not configured in GitHub) and CI-P1-003 (prod environment secrets not provisioned). The workflow side of both is complete; neither can be set from the repo.

## Other current-state items

- `CI-P3-004` **regressed**: `origin/main` is 311 commits behind `develop`, so the 11 new scheduled workflows cannot fire from the default branch until the next promotion; `origin/main` also still carries the retired `backup-dispatch.yml` (CI-P2-010 residual).
- `CI-P3-013` **open** (new): `deploy-do.yml:75,82` interpolates workflow_dispatch inputs into `run:` scripts before validation — pass them via `env:`.
- Partially fixed (10): SEC-P2-002/012, SEC-P3-012, CI-P2-005/008/010, CI-P3-001/005, SC-P3-009/010.

## Domain outcomes

- **deterministic:** 2 machine findings (gitleaks-not-installed locally; app image refs in the prod compose) — both verified fixed at the CI layer with code references.
- **06 security/authz/tenancy:** 40 rows re-checked — 37 verified-fixed, 3 partially-fixed; no new security regression found.
- **10 CI/CD governance:** 26 rows — 17 verified-fixed, 5 partially-fixed, 2 still-open, 1 regressed, 1 new open.
- **11 supply chain:** 26 rows — 24 verified-fixed, 2 partially-fixed; no new regression.
