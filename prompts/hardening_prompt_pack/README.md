# Hardening Prompt Pack

8-domain autonomous adversarial audit system for the MCT Portal monorepo.

## Domains

| Domain             | Prompt                                         | Focus                                      |
| ------------------ | ---------------------------------------------- | ------------------------------------------ |
| Security           | `prompts/security/security_ultra.md`           | Auth, tenancy, validation, rate limiting   |
| Data Integrity     | `prompts/data/data_ultra.md`                   | Schema drift, optimistic locking, CASCADE  |
| Resilience         | `prompts/resilience/chaos_ultra.md`            | Timeouts, circuit breakers, retry logic    |
| Observability      | `prompts/observability/observability_ultra.md` | Logging, Sentry, health endpoints, metrics |
| Supply Chain       | `prompts/supply_chain/supply_chain_ultra.md`   | Dependencies, Docker hygiene, Dependabot   |
| Privacy            | `prompts/privacy/privacy_ultra.md`             | PII handling, retention, log exposure      |
| CI/CD              | `prompts/ci_cd/ci_cd_security_ultra.md`        | Workflow security, secret handling, gates  |
| Platform Evolution | `prompts/evolution/evolution_ultra.md`         | UX gaps, performance, tech debt, roadmap   |

## Runners

- `runner/run_all.py` — sequential 8-domain scan + merger + reconciliation + global risk scoring
- `runner/deep_adversarial_audit.py` — exploit chain modeling with attack trees
- `runner/harden_run_all.py` — fast auto-patch mode against known patterns

## Outputs

All in `runner/outputs/`:

- `security_findings.json` — per-domain finding files
- `merged_findings.json` — deduplicated across all domains
- `reconciliation_report.json` — cross-domain issue chains
- `global_risk_assessment.json` — score + go/no-go
- `deep_adversarial_audit.json` — exploit chain findings

## Prompt Upgrades (2026-06-30)

- All 8 domain prompts rewritten with `automation:` check sections (grep/glob/read)
- v2 versions added with augmented checks beyond v1
- Stub `*_principal_ultra_prompt.md` files deleted
- Schemas updated: `findings_schema.json`, `output_schema.json`, `global_risk_schema.json` — now aligned
- Templates updated: `global_report.md` and `remediation_template.md` with filled examples
- CI workflow (`ci/hardening_runner.yml`) fixed with full dependency setup, both runners, artifact upload, P0 gating
- `phase_config.json` now lists all 8 domains + post-phases (merger, reconciliation)

## CI Integration

```bash
# Manual run
python runner/run_all.py
python runner/deep_adversarial_audit.py

# Fast harden mode
python runner/harden_run_all.py
```

## Schema Reference

See `schemas/findings_schema.json` for the canonical finding format.
