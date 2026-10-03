# Repository Hygiene, Maintainability, and Code Health Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20261003-0018-fix-p2-batch-31-2295958d
- Repository: C:\temp\mainecybertech
- Branch: fix/p2-batch-31
- Commit SHA: 2295958d
- Generated at: 2026-10-03
- Auditor: repo-deep-dive subagent (base profile)
- Area code: HYG
- Output path: docs/audits/repo-deep-dive/20261003-0018-fix-p2-batch-31-2295958d/21_repo_hygiene_maintainability.md
- Scope limitations: Static; no lint/typecheck execution.

## Scope

Repo layout/bloat, dead code/duplication, config consistency, generated artifacts, documentation drift, tooling, and maintainability risks.

## Evidence Reviewed

- `inventory.json` `largest_dirs`; `prompts/`, `docs/`, `.turbo/`.
- `review.md`, `AGENTS.md`, `README*.md`, `CHANGELOG.md`.
- `licenses.json`, `sbom.cdx.json`, `repomix*.config.json`.
- Duplicate catalogs: `apps/api/src/data/products.json`, `apps/web/lib/catalog/data/products.json`.
- This branch's diff (`git diff --stat develop...HEAD`).

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| inventory `largest_dirs` | artifact | bloat | prompts 782, .turbo 159, docs 285 |
| `git diff --stat develop...HEAD` | command | branch scope | 19 files, +13,367/−135 (dominated by `licenses.json`) |
| grep product catalogs | source | duplication | API + web copies diverge (review.md) |
| read `review.md` | doc | claims | mirror-checked generated doc |
| `.gitignore` read | config | generated artifacts | sbom ignored; licenses tracked |

## Executive Summary

Maintainability is mixed: the codebase is consistently structured (workspaces, typed SDK, lint-staged/husky, Prettier) and CI guards docs counts, links, DB types, RLS, and the `review.md` mirror. But the repo carries a large committed AI-prompt/audit corpus (782 files) and prior audit run outputs, a committed generated `licenses.json`, duplicate product catalogs that have already diverged, and stale/machine-specific content in `review.md`. The net effect is increased review noise and a higher chance of editing the wrong artifact.

## Inventory

| Item | Path | State | Risk |
|---|---|---|---|
| Prompt/audit corpus | `prompts/` (782 files) | committed | Medium |
| Prior audit runs | `prompts/repo-deep-dive/**` | committed | Medium |
| Licenses aggregate | `licenses.json` | committed generated | Medium |
| SBOM | `sbom.cdx.json` | untracked generated | Low |
| review mirror | `review.md` | generated, checked | Low |
| Product catalogs | `apps/api/src/data/products.json`, `apps/web/lib/catalog/data/products.json` | duplicated | Medium |
| Turbo cache | `.turbo/` | ignored | Low |
| Docs | `docs/` (285) | mixed | Medium |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Layout/organisation | 4 | workspaces | prompt corpus | externalize |
| Dead/duplicate content | 2 | catalogs, bootstrap SQL | divergence | dedupe |
| Generated artifacts | 2 | licenses/sbom/review | policy | gate |
| Config consistency | 4 | prettier/eslint/turbo | — | keep |
| Documentation accuracy | 3 | CI counts/links | stale path | fix |
| Tooling/hooks | 4 | husky/lint-staged | — | keep |

## Detailed Review

- Branch diff is dominated by `licenses.json` (+12,354), which hides the ~19 real source/config changes and makes review harder.
- Duplicate catalogs are acknowledged in `review.md`: “API fallback … and web offline fallback … are different content generations … Reconcile to one canonical catalog.”
- `review.md:9` hard-codes `C:\temp\mainecybertech-portal`.

## Findings

### Finding ID: HYG-P2-001 - Committed prompt/audit corpus bloats the repo and review surface

- Severity: P2
- Confidence: High
- Area: HYG
- Evidence:
  - `inventory.json` `largest_dirs` — `prompts` 782 files (second only to `apps` 1,366)
  - `prompts/repo-deep-dive/**` — multiple dated audit run report sets
  - totals — 910 `.md` files of 3,017
- What is happening: agent prompts and historical audit outputs live in the application repo.
- Why it matters: noisy diffs, larger clones, more secret-scan/secret-exposure surface, and duplicated findings.
- User / business impact: slower reviews/onboarding.
- Security / privacy / reliability impact: low/medium.
- Recommended fix: move packs/audit outputs to a separate repository or artifact store; keep one canonical, provenance-verified pack.
- Suggested validation: `node scripts/verify-prompts.js verify` still passes for the retained pack.
- Owner suggestion: DevEx
- Effort estimate: M
- Dependencies: provenance tooling
- Status: open

### Finding ID: HYG-P2-002 - Duplicate product catalogs have diverged

- Severity: P2
- Confidence: High
- Area: HYG
- Evidence:
  - `apps/api/src/data/products.json` (API fallback + `scripts/seed-store.ts` source)
  - `apps/web/lib/catalog/data/products.json` (web offline fallback)
  - `review.md` Known Debt — “different content generations … Reconcile to one canonical catalog”
- What is happening: the same logical dataset exists twice with different content.
- Why it matters: seeded DB content can differ from what the web offline fallback shows; bug reports become ambiguous.
- User / business impact: inconsistent store content.
- Recommended fix: designate one canonical source, generate the other or remove it.
- Suggested validation: content-hash equality or a generator check in CI.
- Owner suggestion: store/commerce
- Effort estimate: M
- Dependencies: catalog workflow
- Status: open

### Finding ID: HYG-P3-001 - Stale and machine-specific generated documentation

- Severity: P3
- Confidence: High
- Area: HYG
- Evidence:
  - `review.md:9` — `**Repo:** C:\temp\mainecybertech-portal`
  - `review.md` is generated from `AGENTS.md`; CI checks the mirror but not the path’s validity
- What is happening: environment-specific content is baked into generated docs.
- Recommended fix: use the canonical repo slug; fix CI count/path checks.
- Owner suggestion: DevEx
- Effort estimate: S
- Dependencies: none
- Status: open

### Finding ID: HYG-P3-002 - Generated artifacts are inconsistently tracked

- Severity: P3
- Confidence: High
- Area: HYG
- Evidence:
  - `.gitignore` ignores `sbom.cdx.json` but `sbom.cdx.json` exists on disk
  - `licenses.json` is tracked while being a generated aggregate
- What is happening: two generated artifacts are handled differently.
- Recommended fix: pick one policy — track and verify, or ignore and regenerate.
- Owner suggestion: DevEx
- Effort estimate: S
- Dependencies: INV-P2-001
- Status: open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Repo bloat/noise | P2 | High | Slow review | HYG-P2-001 | externalize |
| Catalog divergence | P2 | High | Content bugs | HYG-P2-002 | canonical source |
| Stale docs | P3 | High | Confusion | HYG-P3-001 | fix |
| Artifact policy | P3 | Medium | Drift | HYG-P3-002 | policy |

## Recommendations

### This Week
- Fix `review.md` path; decide generated-artifact policy.

### This Month
- Reconcile catalogs; externalize prompt/audit corpus.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Fix repo path | accurate docs | `AGENTS.md` | mirror check |
| Generated-file policy note | consistency | `CONTRIBUTING.md` | review |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| Corpus externalization | P2 | DevEx | M | provenance |
| Catalog reconciliation | P2 | store | M | workflow |
| Artifact policy | P3 | DevEx | S | none |

## Suggested Tests

- Catalog generator/hash CI check; docs path validation.

## Suggested Documentation Updates

- `CONTRIBUTING.md` generated-artifact policy; catalog source-of-truth note.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Which catalog is canonical? | product correctness | commerce decision |
| Are prompts needed at runtime/build? | externalization safety | build grep |

## Appendix

- `.turbo/` (159 files) is ignored cache. `apps/` 1,366 files; `docs/` 285.
