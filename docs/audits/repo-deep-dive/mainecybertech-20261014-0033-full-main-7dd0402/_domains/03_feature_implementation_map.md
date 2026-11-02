# Feature Implementation and Gap Map (Re-verification)

## Audit Metadata

- Audit name: mainecybertech
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: `github.com/MaineCyberTech/mainecybertech`
- Branch: `main`
- Commit SHA: `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097`
- Generated at: 2026-10-14
- Auditor: subagent (independent re-audit; read-only)
- Area code: FEAT
- Output path: `docs/audits/mainecybertech/mainecybertech-20261014-0033-full-main-7dd0402/03_feature_implementation_map.md`
- Scope limitations: static mapping of routes/SDK/actions/tables; no runtime execution of the features.

## Scope

Re-verification of the 12 `FEAT` findings from `mainecybertech-20261011-0426-full-main-8d299b8` against `origin/main` @ `7dd0402`: feature status vs code, UI↔backend mismatches, orphaned routes/modules/tables, dead code, workflow states, and docs vs implementation.

## Executive Summary

All 12 previous findings are **verified-fixed** at this commit. The previously dead or half-wired features now have real paths end-to-end: API-key authentication works with timing-safe verification and tests; demo seeding is uniformly gated on `app.seed_demo`; store analytics has call sites, a live admin consumer and the missing summary RPC; AI drafts have a real write/review path in `ai_draft_outputs`; each duplicated table has exactly one canonical API surface (the old paths are 410 stubs); the OpenAPI surface is production-disabled with a nonce-correct docs UI; the eleven bundled-JSON Store pages carry a visible Preview banner; the duplicate scoreboard doc and the orphaned `portal_module_settings` table are gone; `updateProjectBasics` is deleted; and ticket status transitions are validated by a shared transition map.

One new issue (`FEAT-P3-008`): seven server actions in the admin project detail are exported but never imported by product code (same class as the fixed `FEAT-P3-005`).

| Status | Count |
|---|---:|
| verified-fixed | 12 |
| partially-fixed | 0 |
| regressed | 0 |
| open (previous) | 0 |
| new | 1 (`FEAT-P3-008`, P3) |

## Verification Results

| ID | Sev | Re-verified status | Evidence at 7dd0402 |
|---|---|---|---|
| FEAT-P2-001 | P2 | verified-fixed | `authenticateApiKey` full flow (`middleware/api-key.ts:70-112`); dispatch in `auth.ts:67-68`; `api-key-auth.test.ts` |
| FEAT-P2-002 | P2 | verified-fixed | `app.seed_demo` gate in all 7 demo migrations |
| FEAT-P2-003 | P2 | verified-fixed | `get_analytics_summary` migration `5302440`; live admin page; `track()` call sites mounted on storefront |
| FEAT-P2-004 | P2 | verified-fixed | AI drafts create/list/get/review routes (`ai.ts:515-610`), OpenAPI documented |
| FEAT-P2-005 | P2 | verified-fixed | one canonical surface per table; 410 stubs for the old paths; no duplicate `crudRoute` table registration |
| FEAT-P3-001 | P3 | verified-fixed | docs 404 in prod (`docs.ts:25-30`); nonce CSP; `openapi-audit.js` exits 0 |
| FEAT-P3-002 | P3 | verified-fixed | `AdminPreviewNote` on all 11 bundled-JSON Store pages |
| FEAT-P3-003 | P3 | verified-fixed | duplicate `scoreboard-gamification.md` deleted; remaining doc matches the real surface |
| FEAT-P3-004 | P3 | verified-fixed | `5302460_drop_portal_module_settings.sql` |
| FEAT-P3-005 | P3 | verified-fixed | `updateProjectBasics` gone (grep 0) |
| FEAT-P3-006 | P3 | verified-fixed | `@mct/sdk/ticket-status` map enforced at `tickets.ts:262,632-636` |
| FEAT-P3-007 | P3 | verified-fixed | HISTORICAL banners on `MODULE_AUDIT.md` and `MODULE_SPECS_GAP_AUDIT_2026-08-05.md` |

## New Findings

### FEAT-P3-008 — Seven dead server actions remain exported in the admin project detail (P3)

- Evidence: `apps/web/app/(admin)/admin/projects/[projectId]/actions.ts` exports `updateProjectTask:175`, `resetProjectTaskApproval:206`, `deleteProjectTask:219`, `addProjectUpdate:297`, `updateProjectUpdate:315`, `deleteProjectUpdate:334`, `submitProjectUpdateForm:350`. No non-test file imports them: the page passes only 8 other actions to `ProjectTaskListV5` (`page.tsx:182-196`) and `ProjectTrackerPanels` uses the SDK client directly. The mocks in `page.test.tsx:90` keep them looking covered.
- Impact: dead exports inflate the admin surface, suggest a task/update-edit capability no UI reaches, and future agents may wire or duplicate them by mistake (the same defect class as `FEAT-P3-005`).
- Fix: delete the seven actions (and their test mocks) or wire them into the project detail UI as intended.

## Recommendations

- **This month:** remove the dead actions (`FEAT-P3-008`); consider a repo guard for exported server actions with no non-test importer (the current Jest mocks hide them).
- **This month:** when the first Store APIs land, replace the Preview banners with real CRUD one page at a time and delete the corresponding bundled loaders.
- **Later:** keep the "one canonical surface per table" rule and extend the duplicate-registration scan into CI (it currently exists only as a manual pattern).

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Are project updates/task edits meant to be editable from the admin UI? | Decides delete-vs-wire for the seven dead actions | Product owner decision |
| Which bundled-JSON Store pages get real APIs first? | Drives the Preview-banner retirement order | Store module owner |
