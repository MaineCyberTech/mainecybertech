# Audit Run Index

## Metadata

- Name: mainecybertech
- Run: `mainecybertech-20261013-0126-fast-develop-905ed63`
- Mode: fast
- Profile: base
- Target repo: ``
- Branch: `develop`
- Commit: `905ed63`
- Release gate: **GO WITH CONDITIONS**
- Findings: 94 total — P0 0, P1 14, P2 39, P3 41

## Domains

| Domain | Area | Findings | Status |
|---|---|---:|---|
| deterministic | DET | 2 | done |
| 06_security_authz_tenancy_audit | SEC | 40 | done |
| 10_github_actions_cicd_governance | CI | 26 | done |
| 11_supply_chain_dependency_secrets | SC | 26 | done |

## Key Outputs

- Executive summary: `EXECUTIVE_SUMMARY.md`
- Risk register: `risk_register.md`
- Follow-up register: `follow_up_register.md`
- Coverage: `coverage.md`
- Roadmap: `roadmap.md`
- Patch plan: `patch_plan.md`
- Release gate: `RELEASE_GATE.md` — **GO WITH CONDITIONS**

## Next Actions

1. Validate: `tools/check_run.sh mainecybertech-20261013-0126-fast-develop-905ed63`.
2. Publish: `tools/publish_audit.py --repo mainecybertech ...` (see runbook).
3. Remediate unresolved P0/P1/P2 per `patch_plan.md`.

