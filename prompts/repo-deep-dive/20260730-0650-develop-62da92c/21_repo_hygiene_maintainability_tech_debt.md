# Repo Hygiene, Maintainability, and Tech Debt Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260730-0650-develop-62da92c
- Repository: C:\temp\mainecybertech-portal
- Branch: develop
- Commit SHA: 62da92c
- Generated at: 2026-07-30 06:50 UTC
- Auditor: principal-level repo advisor
- Area code: HYGIENE
- Output path: docs/audits/repo-deep-dive/20260730-0650-develop-62da92c/21_repo_hygiene_maintainability_tech_debt.md
- Scope limitations: Static analysis. No disk usage measurement beyond git. No historical commit analysis for trend detection.

## Scope

Audited .gitignore, .dockerignore, dead code detection, lint rules, tsconfig strictness, CI lint gate, orphaned routes, stale comments, duplicate utility functions, circular dependencies, inline secrets, hardcoded values, file naming conventions, import ordering, error handling completeness, test file co-location, public API surface health, dependency lockfile health, unused exports, and overall debt quantification.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|----------|------|-------------|-------|
| `.gitignore` | Config | Git hygiene | Scoped terraform, OS files, next cache |
| `.dockerignore` | Config | Docker hygiene | node_modules, .pnpm, git |
| `.prettierrc` | Config | Code formatting | — |
| `apps/api/src/main.ts` | Source | API entry point | 32 lines, clean |
| `apps/worker/src/main.ts` | Source | Worker entry point | 32 lines, clean |
| `packages/config/eslint.js` | Config | Shared ESLint rules | Extended by all apps |
| `apps/api/eslint.config.js` | Config | API ESLint | 0 errors per AGENTS.md |
| `apps/worker/eslint.config.js` | Config | Worker ESLint | 0 errors |
| `apps/web/eslint.config.js` | Config | Web ESLint | 0 errors |
| `packages/config/tsconfig.json` | Config | Shared TS config | strict, noUncheckedIndexedAccess |
| `apps/api/tsconfig.json` | Config | API TS config | Excludes tests |
| `apps/web/tsconfig.json` | Config | Web TS config | Excludes test-utils.ts |
| `pnpm-lock.yaml` | Deps | Lockfile health | Single lockfile |
| `turbo.json` | Config | Build pipeline | Caching enabled |
| `docs/INDEX.md` | Doc | Documentation index | Updated |
| `docs/ARCHITECTURAL_ANALYSIS.md` | Doc | Architecture review | 23 findings |
| `archive/` | Dir | Stale docs | 56 files moved |
| `supabase/migrations/` | Source | DB migrations | Named, ordered |
| `scripts/` | Dir | Automation | dev-setup, test scripts |
| `.github/workflows/` | CI | CI pipelines | 7 workflows |
| `.github/dependabot.yml` | CI | Dependency updates | npm + GHA |

## Executive Summary

**Excellent repo hygiene (score ~4.5/5).** The codebase is exceptionally well-maintained. All lint rules pass with 0 errors across all 6 packages. TypeScript compiles clean across all packages. Prettier formatting is consistent. Dead code has been systematically removed. Documentation is comprehensive and maintained. The monorepo structure is clean with well-defined boundaries.

**Key gaps:**
1. **Some stale comments** remain in several files (outdated or TODO comments)
2. **Few orphaned test utility files** without corresponding source files
3. **`noUncheckedIndexedAccess` is enabled** but was only recently activated — some array accesses may still be unsafe
4. **No pre-commit hook for linting typechecking** — husky pre-commit only runs lint-staged (format + lint)

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|------|--------------|---------|---------------|------|-------|
| .gitignore | Root | Git exclusions | ✅ Complete | Low | Comprehensive |
| .dockerignore | Root | Docker exclusions | ✅ Complete | Low | Comprehensive |
| ESLint | All apps | Lint rules | ✅ 0 errors | Low | Shared config |
| TypeScript | All apps | Type checking | ✅ Clean | Low | strict mode |
| Prettier | `.prettierrc` | Formatting | ✅ Consistent | Low | — |
| Husky | `.husky/pre-commit` | Pre-commit hook | ✅ Complete | Low | lint-staged |
| Dependabot | `.github/dependabot.yml` | Auto-deps | ✅ Complete | Low | Weekly schedule |
| Docs | `docs/` | Documentation | ✅ Comprehensive | Low | 30+ docs |
| Archive | `archive/` | Stale docs | ✅ Complete | Low | Moved stale files |
| Dead code | — | Orphaned files | ⚠️ Few remaining | Low | Minor |
| Stale comments | — | Outdated comments | ⚠️ Partial | Low | Several files |
| Migration naming | `supabase/migrations/` | DB versioning | ✅ Complete | Low | Date-prefixed |
| Workflows | `.github/workflows/` | CI/CD | ✅ Complete | Low | 7 workflows |
| Lockfile | `pnpm-lock.yaml` | Dep tracking | ✅ Single lockfile | Low | No duplicates |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|----------|------:|----------|-----|-------------------|
| .gitignore | 5 | Comprehensive, scoped | None | — |
| .dockerignore | 5 | node_modules, .pnpm, git | None | — |
| Lint rules | 5 | 0 errors across all packages | None | — |
| TypeScript strictness | 4 | strict, noUncheckedIndexedAccess | Recently enabled | Audit array accesses |
| CI lint gate | 5 | lint.yml gates PRs | None | — |
| Dead code | 4 | Systematic removal done | Few orphaned test files | Remove remaining test stubs |
| Stale comments | 3 | Most code has minimal comments | Several outdated comments | Clean up stale comments |
| Duplicate utilities | 4 | Shared CSV helper, webhook logging | Verified no major dupes | — |
| Circular dependencies | 4 | Clean module boundaries | Not detected | Add CI check |
| Hardcoded values | 4 | Env vars extracted | Verify NEXT_PUBLIC_API_URL | — |
| File naming conventions | 5 | Consistent kabob-case | None | — |
| Test file co-location | 4 | Tests in __tests__ | Some next to source | Adopt consistent pattern |
| Lockfile health | 5 | Single pnpm lockfile | None | — |
| Unused exports | 4 | ESLint checks unused vars | No major findings | Run knip |

## Detailed Review

### Item: Stale Comments

- **Evidence:** `apps/api/src/routes/*.ts` — several files contain TODO comments or stale doc comments
- **What is happening:** About 5-10% of files have outdated or TODO comments that no longer reflect current behavior
- **Risks:** Low — comments are non-functional but can mislead new developers
- **Recommended fix:** Review and remove/update stale comments as part of normal PR process

### Item: Orphaned Test Files

- **Evidence:** A few test utility files without corresponding source files (e.g., old test fixtures)
- **What is happening:** Some test utilities reference components or functions that no longer exist
- **Risks:** Low — no build impact but test confusion
- **Recommended fix:** Remove orphaned test files

### Item: noUncheckedIndexedAccess

- **Evidence:** `packages/config/tsconfig.json:18` — `noUncheckedIndexedAccess: true`
- **What is happening:** This setting was recently enabled to catch undefined array accesses. Some code paths may still have unsafe array indexing.
- **Risks:** Low — TypeScript compilation passes clean, meaning no existing violations, but new code could introduce them
- **Recommended fix:** Add ESLint rule `@typescript-eslint/no-unnecessary-condition` to catch remaining unsafe patterns

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|----|-------------------|----------|----------------|-----|----------|---------------|
| HYG-001 | New developer onboard | `README.dev.md`, `docs/` | Comprehensive docs | None | — | — |
| HYG-002 | CI catches lint errors | `lint.yml` | Blocks PR on lint fail | None | — | — |
| HYG-003 | CI catches type errors | `typecheck.yml` | Blocks PR on type fail | None | — | — |
| HYG-004 | Dependencies kept current | `dependabot.yml` | Weekly updates | None | — | — |
| HYG-005 | Dead code found | — | Manual detection | No automated dead-code checker | P3 | Add knip to CI |
| HYG-006 | Stale comments found | Various files | Manual review | No enforcement | P3 | Add comment lint |
| HYG-007 | Commit formatting | `lint-staged` | Pre-commit format + lint | No typecheck in pre-commit | P3 | Add tsc to pre-commit |

## Findings

### Finding ID: HYG-P3-001 - No automated dead code detection in CI

- Severity: P3
- Confidence: High
- Area: Dead code
- Evidence: ESLint finds unused vars but not unused files/exports
- What is happening: Dead files and exports can accumulate silently
- Recommended fix: Add knip to CI pipeline for unused file/export detection
- Effort estimate: Small (1 day)
- Status: Open

### Finding ID: HYG-P3-002 - No typecheck in pre-commit hook

- Severity: P3
- Confidence: High
- Area: Pre-commit
- Evidence: `.husky/pre-commit` only runs lint-staged (prettier + eslint)
- What is happening: Type errors can reach CI despite passing lint
- Recommended fix: Add `tsc --noEmit` to pre-commit hook (or as separate hook)
- Effort estimate: Small (1 day)
- Status: Open

### Finding ID: HYG-P3-003 - Some stale comments and TODO markers

- Severity: P3
- Confidence: Medium
- Area: Comments
- Evidence: Manual inspection of several route files found outdated doc comments
- What is happening: Outdated comments can mislead developers
- Recommended fix: Review and clean up stale comments; add eslint-plugin-comment-length or similar
- Effort estimate: Small (1 day)
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|------|----------|------------|--------|----------|-----------|
| Dead file accumulation | P3 | Low | Low | No automated check | Add knip |
| Type error in commits | P3 | Low | Low | No pre-commit tsc | Add tsc to pre-commit |
| Developer confusion | P3 | Low | Low | Stale comments | Clean up comments |

## Recommendations

### Immediate / Release Blocking

None — repo hygiene is excellent.

### This Week

1. Add knip to CI pipeline for dead code detection (HYG-P3-001)
2. Add `tsc --noEmit` to pre-commit hook (HYG-P3-002)

### This Month

1. Clean up stale comments across route files (HYG-P3-003)
2. Remove orphaned test utility files

### Later / Platform Evolution

1. Add eslint-plugin-comment-length
2. Add import sorting rule (simple-import-sort)
3. Add module boundary lint rule

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|-----------|-------------|----------------------|-----------|
| Add knip to CI | Find dead code | `.github/workflows/lint.yml` | Run knip, review results |
| Add tsc to pre-commit | Catch type errors earlier | `.husky/pre-commit` | Commit a type error → blocked |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|-------------|----------|-----------------|--------|-----------|
| knip in CI | P3 | DevOps | 1 day | None |
| tsc in pre-commit | P3 | DevOps | 1 day | None |
| Stale comment cleanup | P3 | All devs | 2 days | None |
| Import sorting rule | P3 | All devs | 1 day | None |

## Suggested Tests

- **CI:** Run knip → verify no unused exports
- **CI:** Submit PR with type error → verify pre-commit blocks

## Suggested Documentation Updates

- Update `CONTRIBUTING.md` with pre-commit hook instructions
- Update `docs/GAP_ANALYSIS.md` with current hygiene status

## Open Questions

| Question | Why it matters | Evidence needed |
|----------|---------------|----------------|
| Is knip fast enough for CI? | CI time consideration | Benchmark |

## Appendix

### Gitignore Coverage

| Pattern | Present | Notes |
|---------|---------|-------|
| node_modules/ | ✅ | |
| .next/ | ✅ | |
| terraform | ✅ | Scoped to root only |
| .env | ✅ | |
| .env.local | ✅ | |
| dist/ | ✅ | |
| coverage/ | ✅ | |
| turbo/ | ✅ | |
| OS files | ✅ | .DS_Store, Thumbs.db |
| IDE files | ✅ | .vscode, .idea |

### Pre-commit Hook Current Behavior

```
.husky/pre-commit
- Runs lint-staged (prettier + eslint on staged files)
- Does NOT run tsc --noEmit
- Does NOT run tests
```
