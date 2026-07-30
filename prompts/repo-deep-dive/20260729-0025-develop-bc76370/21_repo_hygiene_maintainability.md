# Repository Hygiene, Maintainability, and Code Health Audit — Verification Run

## Audit Metadata

- **Run ID:** 20260729-0025-develop-bc76370
- **Previous Run:** 20260728-0142-develop-21a10d6
- **Finding Area Code:** HYG
- **Total commits:** 413 (395 → 413, +18 commits)

## Executive Summary

**Previous Score: 7.5/10** → **Current Score: 7.5/10** (no change)

The 18 remediation commits focused on functional fixes (webhook dispatcher, subnav, CAPTCHA, privacy pages, org-id filtering). **No hygiene-related fixes were applied.** All root-level stale files, dead configurations, ESLint issues, and code duplication concerns remain.

## Finding Resolution Status

### 1. Top-Level Directory Structure — Stale Files (HYG-001 to HYG-003)

| ID      | Description          | Severity | Status         | Evidence                                                                                                                                                     |
| ------- | -------------------- | -------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| HYG-001 | Stale root artifacts | MEDIUM   | **STILL OPEN** | erraform.exe (46 KB binary), est (32 KB), cleanup.bat (0 bytes), cleanup.sh (0 bytes), debug-storybook.log, lignment-audit-results.json — ALL still present. |
| HYG-002 | dashboards/ stale    | LOW      | **STILL OPEN** | Directory still exists with html/markdown/data subdirs.                                                                                                      |
| HYG-003 | adges/ stale         | LOW      | **STILL OPEN** | 7 SVG badges still version-controlled.                                                                                                                       |

### 2. Root package.json (HYG-004 to HYG-006)

| ID      | Description                  | Severity | Status         | Evidence                                                                           |
| ------- | ---------------------------- | -------- | -------------- | ---------------------------------------------------------------------------------- |
| HYG-004 | Dormant scripts              | LOW      | **STILL OPEN** | supabase:env:sync, dev:autoenv, storybook, chromatic all still present.            |
| HYG-005 | Questionable devDependencies | LOW      | **STILL OPEN** | pg, supabase-cli (^0.0.21 — unofficial), supabase (^2.107.0 — JS client, not CLI). |
| HYG-006 | Multer override              | LOW      | **STILL OPEN** | "multer": "2.2.0" override still present.                                          |

### 3. TypeScript Configuration (HYG-007 to HYG-008)

| ID                                  | Description | Severity       | Status                            | Evidence |
| ----------------------------------- | ----------- | -------------- | --------------------------------- | -------- |
| HYG-007                             |
| oUncheckedIndexedAccess dead config | MEDIUM      | **STILL OPEN** | packages/config/tsconfig.json has |

oUncheckedIndexedAccess: true (line 8) and
oUnusedLocals/
oUnusedParameters (lines 6-7). Apps extend sconfig.base.json which has none of these. The config file is never extended. |
| HYG-008 | SDK tsconfig standalone | LOW | **STILL OPEN** | packages/sdk/tsconfig.json — no extends clause. |

### 4. ESLint Configuration (HYG-009 to HYG-010)

| ID                                     | Description                  | Severity       | Status                                                                                                                                                 | Evidence                                              |
| -------------------------------------- | ---------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| HYG-009                                |
| o-explicit-any and assertions disabled | MEDIUM                       | **STILL OPEN** | All 3 apps: "@typescript-eslint/no-explicit-any": "off" and "@typescript-eslint/no-non-null-assertion": "off". Base config doesn't enable them either. |
| HYG-010                                | API/Worker ignores test dirs | LOW            | **STILL OPEN**                                                                                                                                         | src/**tests**/ ignored in both API and Worker ESLint. |

### 5. Dead Code and Duplication (HYG-011 to HYG-014)

| ID      | Description                   | Severity | Status         | Evidence                                                                                                |
| ------- | ----------------------------- | -------- | -------------- | ------------------------------------------------------------------------------------------------------- |
| HYG-011 | module-actions.ts 1,275 lines | MEDIUM   | **STILL OPEN** | File still 49,980 bytes (~1,275 lines). 60+ identical server action patterns.                           |
| HYG-012 | GlobalSearch 60% duplication  | MEDIUM   | **STILL OPEN** | Both PortalGlobalSearch (163 lines) and AdminGlobalSearch (213 lines) still exist with shared patterns. |
| HYG-013 | Swallowed catch blocks        | LOW      | **STILL OPEN** | client-logger.ts, circuit-breaker.ts, GlobalSearch components still have empty/ignored catch blocks.    |
| HYG-014 | No TODO/FIXME markers in API  | INFO     | ✅ Positive    | Still clean.                                                                                            |

### 6. Documentation Bloat (HYG-015 to HYG-016)

| ID      | Description       | Severity | Status         | Evidence                                                                     |
| ------- | ----------------- | -------- | -------------- | ---------------------------------------------------------------------------- |
| HYG-015 | Naming conflicts  | LOW      | **STILL OPEN** | docs/modules/ still has scoreboard-gamification vs scoreboards-gamification. |
| HYG-016 | Empty directories | LOW      | **STILL OPEN** | docs/developer-guide/, docs/audits/dashboard/ remain empty.                  |

### 7. Prettierignore (HYG-017)

| ID      | Description         | Severity | Status         | Evidence                                                            |
| ------- | ------------------- | -------- | -------------- | ------------------------------------------------------------------- |
| HYG-017 | Bare env/ too broad | MEDIUM   | **STILL OPEN** | .prettierignore line 15 still has env/ instead of \*_/env/_.tfvars. |

### 8. Database Migration Count (HYG-018 to HYG-019)

| ID      | Description        | Severity | Status                 | Evidence                                                                                                   |
| ------- | ------------------ | -------- | ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| HYG-018 | 76 migration files | LOW      | **PARTIALLY RESOLVED** | Now 67 migrations (5302026-5302102). A cleanup of 9 migration files occurred (likely dead table cleanups). |
| HYG-019 | Seed sprawl        | LOW      | **PARTIALLY RESOLVED** | 5 seed SQL files (was 6). Markdown notes file removed. .corrected.v2 naming still present in 2 files.      |

### 9. Binary Files (HYG-020 to HYG-022)

| ID      | Description                    | Severity | Status         | Evidence                                                                                                                          |
| ------- | ------------------------------ | -------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| HYG-020 | erraform.exe tracked           | MEDIUM   | **STILL OPEN** | File still physically present. .gitignore line 42 now has erraform.exe entry (was missing). Verifying git tracking status needed. |
| HYG-021 | supabase/.temp/ tracked        | MEDIUM   | **STILL OPEN** | .gitignore line 33 now excludes it. File physically present.                                                                      |
| HYG-022 | Untitled query 314.sql tracked | LOW      | **STILL OPEN** | supabase/snippets/Untitled query 314.sql still physically present. No .gitignore entry for supabase/snippets/.                    |

### 10. Gitignore (HYG-023)

| ID      | Description         | Severity | Status         | Evidence                                                                                             |
| ------- | ------------------- | -------- | -------------- | ---------------------------------------------------------------------------------------------------- |
| HYG-023 | Broken glob pattern | LOW      | **STILL OPEN** | .gitignore lines 26-28: _.swp (only matched), _.swo and \*~ on same line without newline separators. |

### 11. Code Complexity (HYG-024)

**STILL OPEN** — All 4 high-complexity files unchanged: module-actions.ts (1,275 lines), NotificationBell.tsx (326 lines), NotificationsPageClient.tsx (264 lines), AdminGlobalSearch.tsx (213 lines).

### 12. Naming Conventions (HYG-025 to HYG-026)

| ID      | Description                   | Severity | Status         | Evidence                                                                                                          |
| ------- | ----------------------------- | -------- | -------------- | ----------------------------------------------------------------------------------------------------------------- |
| HYG-025 | .corrected.v2 filenames       | LOW      | **STILL OPEN** | Two seed files still have .corrected.v2 suffix.                                                                   |
| HYG-026 | External prompt packs at root | LOW      | **STILL OPEN** | maine-cyber-tech-seo-implementation-pack/ and mct-portal-os-expanded-60-modules-deep-prompts-pack/ still at root. |

## Scoring Summary

| Dimension         | Previous   | Current    | Delta | Notes                                           |
| ----------------- | ---------- | ---------- | ----- | ----------------------------------------------- |
| Stale files       | 6/10       | 6/10       | —     | No cleanup applied                              |
| Code duplication  | 5/10       | 5/10       | —     | module-actions.ts, GlobalSearch unchanged       |
| TS strictness     | 6/10       | 6/10       | —     | dead config still dead                          |
| ESLint rigor      | 5/10       | 5/10       | —     | Critical rules still disabled                   |
| Config health     | 7/10       | 7/10       | —     | prettierignore/gitignore unfixed                |
| Doc hygiene       | 6/10       | 6/10       | —     | Unchanged                                       |
| Migration hygiene | 7/10       | 7.5/10     | +0.5  | 67 migrations (was 76), 5 seeds (was 6)         |
| Binary tracking   | 4/10       | 5/10       | +1.0  | .gitignore now excludes terraform.exe and .temp |
| **Overall**       | **7.5/10** | **7.5/10** | —     |                                                 |

## Priority Recommendations

### P0 — Immediate

| ID      | Finding                        | Fix                                                   |
| ------- | ------------------------------ | ----------------------------------------------------- |
| HYG-020 | erraform.exe present           | git rm --cached terraform.exe                         |
| HYG-022 | Untitled query 314.sql tracked | git rm --cached, add supabase/snippets/ to .gitignore |

### P1 — High

| ID                                   | Finding                       | Fix                                  |
| ------------------------------------ | ----------------------------- | ------------------------------------ |
| HYG-011                              | module-actions.ts 1,275 lines | Factor into generic factory function |
| HYG-012                              | GlobalSearch 60% duplication  | Shared component with scope prop     |
| HYG-009                              |
| o-explicit-any + assertions disabled | Enable at warn level          |
| HYG-001                              | 6 stale root artifacts        | Remove or .gitignore                 |
| HYG-017                              | .prettierignore bare env/     | Replace with \*_/env/_.tfvars        |
| HYG-026                              | External prompt packs at root | Move under docs/ or archive          |

### P2 — Medium

| ID                                  | Finding                   | Fix                              |
| ----------------------------------- | ------------------------- | -------------------------------- |
| HYG-007                             |
| oUncheckedIndexedAccess dead config | Move to sconfig.base.json |
| HYG-018                             | 67 migrations             | Plan squash after next milestone |
| HYG-023                             | .gitignore line 26 broken | Fix globs on separate lines      |

---

_Report generated for run 20260729-0025-develop-bc76370. Cross-referenced against previous run 20260728-0142-develop-21a10d6._
