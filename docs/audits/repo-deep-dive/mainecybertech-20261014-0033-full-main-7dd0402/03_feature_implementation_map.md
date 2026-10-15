# 03_feature_implementation_map — Prompt 03 - Feature Implementation and Gap Map

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `03_feature_implementation_map.md` (area FEAT, prompt)

## Verification Performed

Domain subagent produced 13 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| FEAT-P2-001 | P2 | API keys cannot authenticate; the feature is dead |
| FEAT-P2-002 | P2 | Demo/test data can be seeded into a fresh production database |
| FEAT-P2-003 | P2 | Store analytics is unwired end-to-end: no client call sites, no admin UI consumer, and the summary RPC is undefined |
| FEAT-P2-004 | P2 | Feature docs promise AI draft review gates, but `ai_draft_outputs` has no write path |
| FEAT-P2-005 | P2 | Three tables are served by two divergent API surfaces (sop_library, insurance_evidence, satisfaction_pulses) |
| FEAT-P3-001 | P3 | OpenAPI/Swagger surface is public and its UI is blocked by the API CSP |
| FEAT-P3-002 | P3 | Eleven admin Store pages are static JSON views with disabled 'Coming soon' actions but appear as first-class admin-nav features |
| FEAT-P3-003 | P3 | Duplicate scorecard docs; one documents a nonexistent /api/v1/scoreboard API and four tables |
| FEAT-P3-004 | P3 | `portal_module_settings` is an orphaned table: per-org module configuration is never read or written |
| FEAT-P3-005 | P3 | Dead server action `updateProjectBasics` remains exported but is never imported |
| FEAT-P3-006 | P3 | Ticket status has no transition validation; any state can jump to any other |
| FEAT-P3-007 | P3 | 2026-08-05 module audit docs still list fixed bugs and dead navigation as current |
| FEAT-P3-008 | P3 | Seven server actions in the admin project detail are exported but never imported by product code |
