# Repository Hygiene, Maintainability, and Code Health Audit (re-audit)

## Audit Metadata

- Audit name: mainecybertech
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: MaineCyberTech/mainecybertech (origin/main)
- Commit SHA: `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097`
- Generated at: 2026-10-14T00:55:01Z
- Auditor: subagent (full-domain verification re-audit)
- Area code: HYGIENE
- Previous run: `mainecybertech-20261011-0426-full-main-8d299b8`

## Executive Summary

The phase-5/6 hygiene wave is largely verified: the dead modules are deleted,
the one-off catalog pipeline is gone, .pyc and version.json are untracked, the
catalog copies are byte-identical and guarded, the scripts index is rebuilt,
the circular-dependency guard is green, the `supabase as any` casts are gone,
AGENTS.md is slim, the audit layout contract is fixed, and Redis is consolidated
on ioredis. Residuals: the prompt corpus is still large (budget-guarded but not
externalized), one dead-ish module (feature-flags) remains unconsumed, one
machine path remains in a live doc, and the scripts index has a duplicate row.
New: the docs/audits corpus is now the growing half of the repo's historical
data (4.0 MB, +46% in 3 days) with no size/retention policy.

Counts: 14 verified-fixed, 3 partially-fixed, 2 new open.

## Findings

| ID | Sev | Title | Status | Evidence |
|---|---:|---|---|---|
| HYGIENE-P2-001 | P2 | Prompt/audit corpus bloat | partially-fixed | 625 prompts files/9.4 MB, budget 640/10 MiB (verify-prompts.js:29-31); audits 115/3.98 MB |
| HYGIENE-P2-002 | P2 | Duplicate product catalogs diverged | verified-fixed | md5-identical; sync-product-catalog.mjs check; action.yml:175-180 |
| HYGIENE-P2-003 | P2 | 17 scripts lacked exec bit | verified-fixed | 30/30 *.sh at 100755; validate.yml:20-31 |
| HYGIENE-P2-004 | P2 | 2,322-line AdminDocumentsCenterClient | verified-fixed | 309 lines + 15 files under components/admin/documents/ |
| HYGIENE-P3-001 | P3 | Stale machine-specific docs | partially-fixed | MT-P0-001-RLS-remediation-design.md:5 still C:\temp\... |
| HYGIENE-P3-002 | P3 | Generated artifacts inconsistently tracked | verified-fixed | untracked + .gitignore:65-69 + dependency-audit guard |
| HYGIENE-P3-003 | P3 | Dead modules/component | partially-fixed | 3 of 4 deleted; feature-flags.ts retained, still no production consumers |
| HYGIENE-P3-004 | P3 | Orphan catalog scripts + content-map | verified-fixed | all 7 scripts + both dirs gone |
| HYGIENE-P3-005 | P3 | Committed .pyc + stale version.json | verified-fixed | 0 tracked; .gitignore:72-73,76 |
| HYGIENE-P3-006 | P3 | Stray snippet with dev auth seed | verified-fixed | supabase/snippets/ gone |
| HYGIENE-P3-007 | P3 | sbom:licenses broken on pnpm | verified-fixed | package.json:27 collect-licenses.mjs |
| HYGIENE-P3-008 | P3 | scripts/README stale | verified-fixed | 14/14 documented (duplicate row: P3-015) |
| HYGIENE-P3-009 | P3 | No circular-dep guard | verified-fixed | 0 cycles; guard + self-test in shared gate |
| HYGIENE-P3-010 | P3 | supabase as any casts | verified-fixed | 0 casts; no-explicit-any = warn |
| HYGIENE-P3-011 | P3 | AGENTS.md as changelog | verified-fixed | 407 lines; docs/HISTORY.md |
| HYGIENE-P3-012 | P3 | Audit run layout contract | verified-fixed | docs/audits/README.md:13-99 + Runs table |
| HYGIENE-P3-013 | P3 | Two Redis libraries | verified-fixed | apps/api/package.json:30 only ioredis |
| HYGIENE-P3-014 | P3 | docs/audits growth unbounded | open (new) | 75→115 files, 2.73→3.98 MB since 8d299b8 |
| HYGIENE-P3-015 | P3 | Duplicate scripts index row | open (new) | scripts/README.md:49,89 |

## Recommendations

### This week

- HYGIENE-P3-015: delete the duplicate `sync-product-catalog.mjs` row.
- HYGIENE-P3-001: fix the last machine path (`docs/MT-P0-001-RLS-remediation-design.md:5`).

### This month

- HYGIENE-P2-001 / HYGIENE-P3-014: decide the historical-data policy once for
  both corpora - keep prompts/ pinned with its budget and give docs/audits a
  retention rule (last N runs, archive the rest) or a documented ceiling.
- HYGIENE-P3-003: wire one real consumer of `isFeatureEnabled` or record the
  flags as intentionally dormant.

### This quarter

- Keep the circular-dependency and product-catalog guards; add the scripts-index
  uniqueness check when the index lint is next touched.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| What retention does the audit corpus need? | 4 MB and growing per run | owner decision |
| Are the feature flags planned for near-term use? | Decides delete vs wire-up | product/API decision |
