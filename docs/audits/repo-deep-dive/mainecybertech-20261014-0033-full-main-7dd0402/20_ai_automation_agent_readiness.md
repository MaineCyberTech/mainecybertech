# 20_ai_automation_agent_readiness — Prompt 20 - AI Automation and Agent Readiness Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `20_ai_automation_agent_readiness.md` (area AI, prompt)

## Verification Performed

Domain subagent produced 13 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| AI-P1-001 | P1 | Vendored audit prompt packs are stale and the run manifest references a prompt the pack does not contain |
| AI-P1-002 | P1 | `AGENTS.md` names a stale repository path and three developer docs state a stale accessibility gate size that no guard covers |
| AI-P2-001 | P2 | No machine-enforced agent guardrails: allowed paths, human-approval actions, and small-batch PR limits exist only as prose |
| AI-P2-002 | P2 | Prompt packs embed generated outputs alongside instructions without a machine-detectable not-instructions marker |
| AI-P2-003 | P2 | `.continue/` agent configuration defines models only and does not surface project rules or boundaries |
| AI-P3-001 | P3 | Embedded repo maps and historical pack outputs still reference the pre-rename repository path |
| AI-P3-002 | P3 | `AGENTS.md` retains a large self-contradicting snapshot history that an agent must disambiguate |
| AI-P3-003 | P3 | Secrets guidance is spread across instructions without a linked canonical runbook |
| AI-P3-004 | P3 | Committed audit corpus under docs/audits/ is outside the untrusted-data boundary and has no integrity pin |
| AI-P3-005 | P3 | Audit output conventions in docs/audits/README.md are stale vs the committed runs |
| AI-P3-006 | P3 | Prompt-pack provenance verification runs only at the deploy gate, not on PRs |
| AI-P3-007 | P3 | No AI-authorship disclosure or provenance policy in contribution guidance |
| AI-P3-008 | P3 | AGENTS.md Known Debt carries a stale promotion binding and a now-false branch-direction claim |
