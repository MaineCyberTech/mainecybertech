# 00_audit_orchestrator — Prompt 00 - Audit Orchestrator

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `00_audit_orchestrator.md` (area ORCH, prompt)

## Verification Performed

Domain subagent produced 3 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| ORCH-P1-001 | P1 | Published main audit run is internally inconsistent (report/register ID divergence; full-domain metadata over a one-report inventory) |
| ORCH-P2-001 | P2 | docs/audits/README.md documents a run contract that contradicts the pack and the actual runs, and its Runs table omits all three repo-deep-dive runs |
| ORCH-P3-001 | P3 | Finding identity is not stable across runs (deterministic IDs reused; legacy area codes persist), so verification status does not carry |
