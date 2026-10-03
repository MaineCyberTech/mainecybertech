# Audit Run Index

## Metadata

- Name: mainecybertech
- Run: 20261003-0018-fix-p2-batch-31-2295958d
- Profile: base
- Target repo: C:\temp\mainecybertech
- Branch: fix/p2-batch-31
- Commit: 2295958d
- Generated: 2026-10-03T04:18:38Z
- Release gate: **NO-GO**

## Reports

| Order | Report | Status |
|---:|---|---|
| 1 | 01_repository_inventory.md | done |
| 2 | 02_architecture_runtime_topology.md | done |
| 3 | 03_feature_implementation_map.md | done |
| 4 | 06_security_authz_tenancy_audit.md | done |
| 5 | 07_data_schema_migration_runtime_validation.md | done |
| 6 | 08_api_contracts_realtime_integrations.md | done |
| 7 | 09_testing_quality_release_confidence.md | done |
| 8 | 10_github_actions_cicd_governance.md | done |
| 9 | 11_supply_chain_dependency_secrets.md | done |
| 10 | 14_observability_monitoring_incident_readiness.md | done |
| 11 | 21_repo_hygiene_maintainability.md | done |
| 12 | 22_final_risk_register_roadmap.md | done |
| 13 | 23_executive_summary_release_gate.md | done |
| — | all other pack prompts (04,05,12,13,15-20,24-45) | not-in-base-scope |

## Key Outputs

- Executive summary: `EXECUTIVE_SUMMARY.md` — done
- Risk register: `risk_register.md` — done
- Roadmap: `roadmap.md` — done
- Patch plan: `patch_plan.md` — done
- Release gate: `RELEASE_GATE.md` — **NO-GO**

## Finding Summary

| Severity | Count |
|---|---:|
| P0 | 1 |
| P1 | 3 |
| P2 | 26 |
| P3 | 14 |
| Total | 44 |

By area: INV 4, ARCH 4, FEAT 3, SEC 5, DATA 3, API 3, TEST 3, CI 4, SUPPLY 4, OBS 4, HYG 4, FINAL 3.

## Top Risks

1. **P0** DATA-P0-001 — orphan cleanup can recursively delete documents/avatars.
2. **P1** SEC-P1-001 — PII encryption falls back to reversible plaintext without a key.
3. **P1** CI-P1-001 — production deploy path cannot run (prod env lacks secrets/protection).
4. **P2** OBS-P2-001 — Prometheus alerts are not routed anywhere.
5. **P2** API-P2-001 — `/api/v1/search` is fail-open when an admin resolves to zero orgs.
6. **P2** FEAT-P2-002 — demo/test data (weak password) can seed a fresh prod DB.
7. **P2** FEAT-P2-001 — API keys cannot authenticate.
8. **P2** ARCH-P2-001 — single-droplet stack is a SPOF.
9. **P2** CI-P2-001 — branch protection bypass / CODEOWNERS ignored.
10. **P2** OBS-P2-003 — backups not verified.

## Next Actions

1. Fix DATA-P0-001 + TEST-P2-001 (correctness gate).
2. Make SEC-P1-001 / SEC-P2-002 fail closed and provision the prod environment (CI-P1-001).
3. Complete a restore drill (OBS-P2-003) and wire alerting (OBS-P2-001).
4. Validate when done: `python tools/run_toolchain.py C:\temp\proxmox-vm\audits\runs\mainecybertech\20261003-0018-fix-p2-batch-31-2295958d --write --dashboard` (orchestrator).
