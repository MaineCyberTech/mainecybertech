# Repository Hygiene, Maintainability, and Code Health Audit (re-audit)

## Audit Metadata

- Audit name: mainecybertech
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: MaineCyberTech/mainecybertech (origin/main)
- Commit SHA: `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03T09:43:35Z
- Auditor: subagent (full-domain verification re-audit)
- Area code: HYGIENE
- Previous run: `mainecybertech-20261014-0033-full-main-7dd0402`

## Executive Summary

Most hygiene findings remain fixed: the product catalogs are byte-identical and
guarded, all shell scripts carry the exec bit, AdminDocumentsCenterClient is
309 lines, generated artifacts stay untracked, the circular-dependency guard is
green, AGENTS.md is slim, the audit layout contract is documented, Redis is
consolidated on ioredis, and the scripts-index duplicate is gone.

Residuals: the prompt corpus is still large (budget-guarded, not externalized),
the feature-flags module is still unconsumed, one live doc keeps the
pre-rename name, and the audit corpus now has a documented budget but is already
over its 180-file ceiling. Two regressions/new issues: the scripts index is
stale again (four scripts missing), and docs/INDEX.md states stale ADR and
module-doc counts that no guard checks.

Counts: 14 verified-fixed, 4 partially-fixed, 1 regressed, 1 new open.

## Findings

| ID | Sev | Title | Status | Evidence |
|---|---:|---|---|---|
| HYGIENE-P2-001 | P2 | Prompt/audit corpus bloat | partially-fixed | prompts 626/9.43 MB (budget 640/10 MiB); audits 249/5.86 MB |
| HYGIENE-P2-002 | P2 | Duplicate product catalogs diverged | verified-fixed | md5-identical; sync-product-catalog.mjs; action.yml:193-196 |
| HYGIENE-P2-003 | P2 | Scripts lacked exec bit | verified-fixed | 31/31 *.sh at 100755; validate.yml:20-31 |
| HYGIENE-P2-004 | P2 | 2,322-line AdminDocumentsCenterClient | verified-fixed | 309 lines + 15 files under components/admin/documents/ |
| HYGIENE-P3-001 | P3 | Stale machine-specific docs | partially-fixed | MT-P0-001 doc:5 now pre-rename name, machine path gone |
| HYGIENE-P3-002 | P3 | Generated artifacts inconsistently tracked | verified-fixed | .gitignore:65-69; dependency-audit action:39-50 |
| HYGIENE-P3-003 | P3 | Dead modules/component | partially-fixed | 3 of 4 deleted; feature-flags.ts still zero production consumers |
| HYGIENE-P3-004 | P3 | Orphan catalog scripts + content-map | verified-fixed | all 7 scripts + both dirs gone |
| HYGIENE-P3-005 | P3 | Committed .pyc + stale version.json | verified-fixed | 0 tracked; .gitignore:72-76 |
| HYGIENE-P3-006 | P3 | Stray snippet with dev auth seed | verified-fixed | supabase/snippets/ gone |
| HYGIENE-P3-007 | P3 | sbom:licenses broken on pnpm | verified-fixed | package.json:27 collect-licenses.mjs |
| HYGIENE-P3-008 | P3 | scripts/README stale | regressed | 4 scripts undocumented (3 CI-executed) |
| HYGIENE-P3-009 | P3 | No circular-dep guard | verified-fixed | 0 cycles / 1004 files; guard + self-test |
| HYGIENE-P3-010 | P3 | supabase as any casts | verified-fixed | 0 casts; no-explicit-any = warn |
| HYGIENE-P3-011 | P3 | AGENTS.md as changelog | verified-fixed | 407 lines / 40.5 KB; docs/HISTORY.md |
| HYGIENE-P3-012 | P3 | Audit run layout contract | verified-fixed | docs/audits/README.md:22-118 |
| HYGIENE-P3-013 | P3 | Two Redis libraries | verified-fixed | apps/api/package.json:30 only ioredis |
| HYGIENE-P3-014 | P3 | docs/audits growth unbounded | partially-fixed | budget added, 249 files > 180; advisory only |
| HYGIENE-P3-015 | P3 | Duplicate scripts index row | verified-fixed | scripts/README.md:49 single row |
| HYGIENE-P3-016 | P3 | docs/INDEX stale ADR/module counts | open (new) | INDEX:28 (11 vs 12), :141 (75 vs 74) |

## Detailed verification

### Corpus size (HYGIENE-P2-001 / P3-014)

- `prompts/`: 626 tracked files, 9,429,802 bytes (8.99 MiB); the pin covers 624
  files / 8.9 MiB against a 640-file / 10 MiB budget
  (`scripts/verify-prompts.js:29-31`). Current `verify` passes.
- `docs/audits/`: 249 files, 6,139,604 bytes (5.86 MiB), 11 run directories.
  The documented budget is 12 runs / 180 files / 7 MiB
  (`docs/audits/README.md:80`; `scripts/check-audits-budget.mjs:30-32`).
  The file ceiling is already exceeded and the guard is advisory, so the corpus
  keeps growing until an operator archives runs.

### scripts/README.md (HYGIENE-P3-008, regressed)

The index was repaired at 7dd0402 but has drifted again. Missing entries:
`check-changelog-checkbox.mjs` (required PR guard, action.yml:87-90),
`check-bundle-budget.mjs` (e2e.yml:211), `exercise-storage-restore.sh`
(validate.yml:74 and the shellcheck action), and `check-no-dotenv.sh` (the
pre-commit helper). Three of the four run in CI.

### docs/INDEX counts (HYGIENE-P3-016, new)

- `docs/INDEX.md:28` says 11 ADRs; `docs/adr/README.md:20-31` lists 12 rows
  (ADR-012 added 2026-10-12).
- `docs/INDEX.md:141` says 75 module files; `docs/modules/` contains 74
  markdown files and the index links exactly 74.
- `scripts/check-docs-counts.mjs` does not assert either count; the link guard
  passes because every linked target exists.

### Regression note

HYGIENE-P3-008 is the only status regression: the same index finding was
verified-fixed at 7dd0402 and is stale again at 6b7aa1a.

## Recommendations

### This week

- HYGIENE-P3-008: add the four missing rows to scripts/README.md (and bump the
  "Last updated" line); consider a uniqueness + coverage check for the index.
- HYGIENE-P3-016: correct the ADR and module-doc counts and add both to
  `check-docs-counts.mjs`.

### This month

- HYGIENE-P2-001 / HYGIENE-P3-014: decide the historical-data policy once for
  both corpora - archive the oldest audit runs (the documented path) and keep
  prompts/ pinned, or raise the budget deliberately.
- HYGIENE-P3-003: wire one real consumer of `isFeatureEnabled` or record the
  flags as intentionally dormant.
- HYGIENE-P3-001: rename the repo/branch in the MT-P0-001 design doc or move it
  into the historical corpus.

### This quarter

- Keep the circular-dependency and product-catalog guards; add a scripts-index
  coverage check when the index lint is next touched.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Which audit runs should be archived first? | The 180-file budget is already crossed | owner retention decision |
| Are the feature flags planned for near-term use? | Decides delete vs wire-up | product/API decision |
