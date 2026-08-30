# Portal Alignment Engine — Operator Manual

## Execution

```bash
# Full 7-phase run
python engine/run_alignment_engine.py

# Single phase
python engine/run_alignment_engine.py --phase 3

# With diff comparison
python engine/run_alignment_engine.py --diff
```

## Phase Sequence

| Phase | Name                | Output                                   | Depends On |
| ----- | ------------------- | ---------------------------------------- | ---------- |
| 1     | Inventory           | `engine/outputs/inventory.json`          | —          |
| 2     | Schema Alignment    | `engine/outputs/schema_alignment.json`   | Phase 1    |
| 3     | API Contract        | `engine/outputs/api_contract.json`       | Phase 1    |
| 4     | Frontend Alignment  | `engine/outputs/frontend_alignment.json` | Phase 1    |
| 5     | Cross-Domain        | `engine/outputs/cross_domain.json`       | Phases 2-4 |
| 6     | Remediation Mapping | `engine/outputs/remediation_plan.json`   | Phase 5    |
| 7     | Release Gate        | `engine/outputs/release_decision.json`   | Phase 6    |

## Prompt Structure

- Each `prompts/phase{N}/` folder has a single authoritative prompt (no stubs)
- `prompts/master/MASTER_ALIGNMENT_PROMPT.md` — global context for all phases
- `prompts/remediation/` — patch-generation prompts for auto-fixing

## Schema Reference

- All findings conform to `engine/schemas/finding_schema.json` (see schema file)
- Severity: P0 (blocker) / P1 (critical) / P2 (medium) / P3 (low)
- Output files always include `generated_at` timestamp

## Automation Checks

Each prompt has an `automation:` section at the bottom defining grep/glob/read checks that validate the output. These run automatically after each phase.

## Troubleshooting

- **Phase fails:** Check the prompt's `automation.checks` — the issue is usually missing data in the scan scope
- **Release gate blocked:** Run `--phase 6` first to generate a remediation plan, then `--phase 7`
- **Duplicate findings:** Phase 6 deduplicates — check that phase 5 output doesn't duplicate phases 2-4
