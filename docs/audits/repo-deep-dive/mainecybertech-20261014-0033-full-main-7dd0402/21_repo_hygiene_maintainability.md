# 21_repo_hygiene_maintainability — Prompt 21 - Repository Hygiene, Maintainability, and Code Health Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `21_repo_hygiene_maintainability.md` (area HYGIENE, prompt)

## Verification Performed

Domain subagent produced 19 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| HYGIENE-P2-001 | P2 | Committed prompt/audit corpus bloats the repo and review surface |
| HYGIENE-P2-002 | P2 | Duplicate product catalogs have diverged |
| HYGIENE-P2-003 | P2 | 17 tracked shell scripts lack the exec bit; documented ./scripts/... commands fail |
| HYGIENE-P2-004 | P2 | AdminDocumentsCenterClient.tsx is a 2,322-line single component |
| HYGIENE-P3-001 | P3 | Stale and machine-specific generated documentation |
| HYGIENE-P3-002 | P3 | Generated artifacts are inconsistently tracked |
| HYGIENE-P3-003 | P3 | Dead modules and a dead component with zero references |
| HYGIENE-P3-004 | P3 | Orphaned one-off catalog scripts and their 1.2 MB content-map pipeline |
| HYGIENE-P3-005 | P3 | Committed Python bytecode and a stale build artifact are tracked |
| HYGIENE-P3-006 | P3 | Stray duplicate snippet file with local dev auth seed data |
| HYGIENE-P3-007 | P3 | Root package script `sbom:licenses` is known-broken on the pinned pnpm |
| HYGIENE-P3-008 | P3 | scripts/README.md index is stale: 14 scripts (10 active CI guards) are undocumented |
| HYGIENE-P3-009 | P3 | No circular-dependency guard; one live import cycle in the worker |
| HYGIENE-P3-010 | P3 | Explicit `any` is lint-disabled and 63 `supabase as any` casts sit at the typed-client boundary |
| HYGIENE-P3-011 | P3 | AGENTS.md (120 KB) doubles as a historical changelog and is mirrored into review.md |
| HYGIENE-P3-012 | P3 | Audit run layout contract is not met by the committed repo-deep-dive runs |
| HYGIENE-P3-013 | P3 | Two Redis client libraries coexist in apps/api |
| HYGIENE-P3-014 | P3 | docs/audits corpus grows unbounded with no size or retention policy (prompts/ is budget-guarded, audits are not) |
| HYGIENE-P3-015 | P3 | scripts/README.md lists sync-product-catalog.mjs twice |
