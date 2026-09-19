# Portal Alignment Engine v3

Autonomous 7-phase system alignment audit for the MCT Portal monorepo.

## Features

- **Phase 1:** Full codebase inventory (1419 files, 97K+ lines)
- **Phase 2:** Database schema drift detection
- **Phase 3:** API contract validation (Express vs SDK)
- **Phase 4:** Frontend system alignment (UX, IA, components)
- **Phase 5:** Cross-domain reconciliation (end-to-end data flow)
- **Phase 6:** Remediation mapping (patch sets + effort estimation)
- **Phase 7:** Release gate (readiness score + go/no-go)

## Quick Start

```bash
cd prompts/portal-alignment
python engine/run_alignment_engine.py
```

## Outputs

All JSON outputs in `engine/outputs/`:

- `inventory.json` — system map
- `schema_alignment.json` — DB drift
- `api_contract.json` — API/SDK parity
- `frontend_alignment.json` — frontend health
- `cross_domain.json` — cross-layer issues
- `remediation_plan.json` — prioritized fix plan
- `release_decision.json` — score + gate decision

## Prompt Upgrades (2026-06-30)

- All 7 phase prompts rewritten with full structure: schema refs, severity defs, `automation:` checks
- Stub prompts removed (`PHASE*_ULTRA.md`)
- Operator manual expanded with execution tables and troubleshooting
- Master prompt now defines the cross-phase orchestration rules
- Remediation prompts support patch-set generation with verification commands
