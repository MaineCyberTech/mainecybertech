# UI/UX + Documentation Completeness Audit — 2026-09-27 (run 2)

**Pack:** manual (UI/UX + docs completeness focus, fresh re-audit)
**Run:** 2026-09-27-2
**Branch:** `develop` (uncommitted working tree on top of `f4d5073`)
**Scope:** `apps/web` UI/UX + accessibility; root docs (`README.md`, `AGENTS.md`,
`README.dev.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, `LICENSE`,
`review.md`), `docs/` tree, CI docs gates; count claims across all of them.
**Method:** independent re-audit after the first remediation round — full route
and component enumeration, convention diffing against
`docs/WEB_UI_CONVENTIONS.md`, source verification of every recent change
(ToastProvider, StatusPill tones, `lib/format.ts`, EmptyState adoption,
404/5xx detail handling, MFA login, Dialog), executed test suites
(3,333 tests / 386 suites), `node scripts/openapi-audit.js`,
`node scripts/verify-prompts.js verify`,
`node scripts/sync-review-md.mjs --check`, and a link/path resolver over the
primary docs.
**Status:** all P2 findings and the actionable P3s were fixed in the same
session; residual items are listed as open with reasons.

---

## Summary

- **0 P0, 0 P1.** The first remediation held: no broken links, no missing
  artifacts, auth/MFA flows and detail-page semantics verified correct.
- **4 P2 findings**, all fixed: admin empty states on load failure, one
  remaining 5xx-masking detail page, a login stuck-loading path, and missing
  status tones for outage/incident states.
- **12 P3 findings**, fixed except two documented residuals (local
  relative-time helpers; empty-state CTA coverage).
- **Docs drift** (stale counts across README/AGENTS/INDEX) fixed, and a new
  `scripts/check-docs-counts.mjs` now gates those numbers in CI so the defect
  class cannot recur silently.
- **Improvements added:** `RouteAnnouncer` (screen-reader navigation
  announcements), invalid-safe `lib/format.ts` with tests, `docs/ui-kit.md`,
  MFA recovery docs, OpenAPI sign-in/header polish, dialog/toast accessibility
  hardening.

---

## UI/UX findings

| #   | Sev | Finding                                                                                                                                                                                                                           | Status | Evidence / resolution                                                                                                                                                                                                   |
| --- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U1  | P2  | ~70 pages rendered an "no data" empty state while `loadFailed` was true, so an outage showed both "Could not load X" and "No X".                                                                                                  | fixed  | 66 admin pages + 3 portal pages now gate empty branches on `!loadFailed`; `AdminListPage` gained a `loadFailed` prop; 11 grid empties wrapped in `col-span-2`.                                                          |
| U2  | P2  | `admin/governance/risks/[id]` caught every failure and rendered "Record not found" (HTTP 200) for 5xx.                                                                                                                            | fixed  | Standard `notFound()` on 404 / rethrow otherwise (`page.tsx`).                                                                                                                                                          |
| U3  | P2  | `/login` could get permanently stuck in the loading state if a server action rejected (no `finally`), and "Use a different account" could not reset.                                                                              | fixed  | Both handlers now `try/catch/finally` with `NEXT_REDIRECT` rethrow; cancel clears email/password/code and always returns to step 1; expired-pending message returns to step 1; `autoComplete` hints added.              |
| U4  | P2  | `StatusPill` had no tones for `partial_outage`/`major_outage`/`investigating`/`identified`/`monitoring`/`scheduled`/`archived`/`live`/`hidden`/`not_started`, and local store maps disagreed with the shared map.                 | fixed  | Tones added and store overrides normalized (promotions removed its map; quotes only special-cases `converted_to_project`; products keeps the `draft*` prefix). New `StatusPill` tests.                                  |
| U5  | P3  | Toasts rendered behind two dialogs (`z-[70]` vs `z-[80]`/`z-[90]`), error toasts announced politely, dismiss labels were identical.                                                                                               | fixed  | Viewport raised to `z-[100]`; separate `role="alert" aria-live="assertive"` region for errors; per-toast dismiss labels.                                                                                                |
| U6  | P3  | `lib/format.ts` threw on invalid dates (`RangeError`), rendered "Invalid Date" for other helpers, returned `$NaN` for non-finite currency; 11 raw `toISOString().slice` sites and one `toLocaleTimeString` remained.              | fixed  | All helpers return `—` for missing/invalid input; `formatCurrency` guards non-finite; `formatDateTimeMinutesUtc`/`formatTime` added and the raw sites migrated; unit tests added (valid, invalid, UTC, currency cases). |
| U7  | P3  | 7 detail pages rendered inline HTTP-200 "not found" panels; activity pages swallowed 404; org billing treated 404 as a load error; `portal/network-diagrams/[id]` had no metadata; two `any` types remained.                      | fixed  | All converted to `notFound()`; activity/billing 404 semantics corrected; id-based `generateMetadata` added; `any` replaced with SDK-derived types.                                                                      |
| U8  | P3  | `packages/ui` Dialog had no scroll lock, no close button on title-less dialogs, didn't handle the zero-focusable case; `ConfirmDialog` used a static `aria-labelledby` id; root `not-found`/`forbidden` lacked skip-link targets. | fixed  | Scroll lock + restore; always-visible close button; `tabIndex={-1}` fallback focus; optional `ariaLabel`; `useId()` in `ConfirmDialog`; `id="main-content"` added. New Dialog tests.                                    |
| U9  | P3  | No mechanism announces client-side navigation to screen readers (focus/heading not announced).                                                                                                                                    | fixed  | `components/RouteAnnouncer.tsx` (aria-live, heading → document title fallback) mounted in the root layout; tests added.                                                                                                 |
| U10 | P3  | Store status pills in compact tables used `min-h-8 px-3` sizes and could wrap; verified all tables have `overflow-x-auto` wrappers and mobile card fallbacks.                                                                     | ok     | Verified acceptable; no change needed.                                                                                                                                                                                  |
| U11 | P3  | ~20 components still keep local `formatRelativeTime`/null-safe wrappers instead of `lib/format.ts`.                                                                                                                               | open   | Documented in AGENTS Known Debt (low); relative-time logic is varied and not purely formatting.                                                                                                                         |
| U12 | P3  | 142/154 empty states have no CTA (next-step) action.                                                                                                                                                                              | open   | Product/UX opportunity; tracked in AGENTS/report as follow-up rather than forced across all pages.                                                                                                                      |
| U13 | P3  | Success feedback for server-action forms is inconsistent (only toast-capable components confirm; most rely on redirect/revalidate).                                                                                               | open   | Documented opportunity; wiring toasts into every form action is a larger feature.                                                                                                                                       |

**Verified correct again (do not re-audit):** ToastProvider timer cleanup,
single mount, no `window` access; all five legacy toast implementations gone;
all 11 `role="dialog"` files focus-trapped; `alert()`/`window.confirm`/`href="#"`
all zero; `AdminPagination` `aria-current`; `ModuleDetailPage` and sampled
detail pages 404/5xx; MFA code input a11y and cookie security; 94/94 dynamic
pages covered by a loading boundary; 23 tables all scroll-wrapped.

---

## Documentation findings

| #   | Sev | Finding                                                                                                                      | Status | Resolution                                                                                                                                                                                   |
| --- | --- | ---------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | P2  | `README.md` claimed 1,186 API tests (actual 1,188), breaking the page's own total arithmetic.                                | fixed  | Updated; README now sums to the verified 3,333.                                                                                                                                              |
| D2  | P2  | `AGENTS.md` claimed "408 paths" for the OpenAPI spec (actual 406).                                                           | fixed  | Corrected to 406 (matches `CHANGELOG` and the generated yaml).                                                                                                                               |
| D3  | P2  | `docs/INDEX.md` said "(317 paths)" for `openapi.yaml` and still carried the 2026-09-24 reconciliation date.                  | fixed  | Updated to 406 paths / 2026-09-27.                                                                                                                                                           |
| D4  | P2  | The first audit report's status table quoted stale counts (3,280 tests, 408 paths).                                          | done   | Left immutable per the audit contract; superseded by this run's status table and verification block.                                                                                         |
| D5  | P3  | `AGENTS.md` said 100 web components (actual 102 with ToastProvider + RouteAnnouncer).                                        | fixed  | Updated to 102.                                                                                                                                                                              |
| D6  | P3  | Wording drift: `colorMap` (now `STATUS_TONES`), "Root 1" page label (actually `forbidden`), stale "now 3,262 / 380" pointer. | fixed  | All corrected.                                                                                                                                                                               |
| D7  | P3  | `.env.example` didn't mention `NEXT_PUBLIC_TEST_ACCOUNT_PASSWORD` (deliberately test-only).                                  | fixed  | Added as a commented line with a "never set in production/CI" note.                                                                                                                          |
| D8  | P3  | `CONTRIBUTING.md` didn't reference the new community files.                                                                  | fixed  | Links to `CODE_OF_CONDUCT.md`, PR template and issue forms added.                                                                                                                            |
| D9  | P3  | No automated guard existed for doc counts — the recurring defect class.                                                      | fixed  | New `scripts/check-docs-counts.mjs` (components, test totals vs per-package rows, README/AGENTS/INDEX agreement, OpenAPI path count, latest migration) gated in `test.yml` + `validate.yml`. |
| D10 | P3  | `docs/openapi.yaml` didn't state the dynamic-factory caveat; `/auth/sign-in` didn't mention `mfaRequired`.                   | fixed  | Generator header note + sign-in summary updated; spec regenerated (406 paths, 0 missing).                                                                                                    |
| D11 | P3  | `docs/MFA.md` had no recovery guidance.                                                                                      | fixed  | New "Recovery / lost device" section (no backup codes; self-service factor removal works under enforcement; operator path when sign-in is impossible).                                       |
| D12 | P3  | No browsable inventory of the shared UI kit.                                                                                 | fixed  | New `docs/ui-kit.md` (13 sections, every path verified) linked from INDEX and WEB_UI_CONVENTIONS.                                                                                            |

**Verified accurate:** all 173 relative links resolve; `review.md` in sync;
prompt provenance passes (789 files / 787 pinned); OpenAPI audit exits 0 with
0 missing; `docs/modules` (75) all linked with 0 broken path refs;
`docs/module-matrix-mapping.md` 215 paths exist; ENVIRONMENT_VARIABLES matches
all four service schemas; no stale `1,693`/`1,706`/`3,267`/`3,280` occurrences
remain in primary docs.

---

## Improvements added this run

1. **`scripts/check-docs-counts.mjs`** — CI gate for doc/repo count drift
   (root cause of the bulk of this audit's findings).
2. **`docs/ui-kit.md`** — component/utility inventory with "use when" guidance.
3. **`RouteAnnouncer`** — assistive-tech navigation announcements, with tests.
4. **`lib/format.ts` hardening + tests** — invalid/NaN safe; UTC and
   local-format behavior locked in.
5. **MFA recovery runbook** and OpenAPI sign-in/header polish.
6. **UI component hardening** — toast z-index/assertive errors/dismiss labels;
   Dialog scroll lock, always-visible close, `ariaLabel`, fallback focus;
   `ConfirmDialog` `useId`; skip-link targets on error pages.

## Remaining opportunities (tracked in AGENTS Known Debt)

- Local `formatRelativeTime`/null-safe wrappers (~20 components).
- Empty-state CTAs and consistent server-action success feedback.
- Axe breadth expansion (19 of 318 pages) — must run where the E2E stack runs.
- Store catalog JSON reconciliation and `client_portal_entitlements` RLS
  (product decisions); SSO and credential-dependent infra items.

---

## Verification

| Check                                     | Result                          |
| ----------------------------------------- | ------------------------------- |
| API tests                                 | **1,188 passed / 109 suites**   |
| Web tests                                 | **1,757 passed / 265 suites**   |
| SDK tests                                 | **289 passed / 3 suites**       |
| Worker tests                              | **99 passed / 9 suites**        |
| Total                                     | **3,333 tests / 386 suites**    |
| `pnpm lint` / typechecks                  | clean                           |
| `node scripts/openapi-audit.js`           | exit 0, `MISSING from spec (0)` |
| `node scripts/check-docs-counts.mjs`      | `docs counts OK`                |
| `node scripts/sync-review-md.mjs --check` | in sync                         |
| `node scripts/verify-prompts.js verify`   | all files match manifest        |

## Audit-contract notes

- Run directory: `docs/audits/ui-ux-docs-completeness/2026-09-27-2/`.
- The previous run (`2026-09-27/`) was not modified.
- `findings.json` not emitted (optional per `docs/audits/README.md`).

---

## Post-audit additions (Tier 1, same session)

The recommendations below were implemented immediately after this audit and
supersede its counts (kept above as the audit snapshot):

- **MFA recovery codes** — migration `5302427`, `POST/GET/DELETE
/auth/mfa/recovery-codes` + `POST /auth/mfa/recovery`, SDK methods, login
  "Use a recovery code" path, and a security-page generate/reveal/revoke panel.
- **OpenAPI response schemas + contract tests** — schemas on 14 high-value
  routes, `successStatus` builder support, `openapi-contracts.test.ts`;
  spec now **409 paths, 0 missing**.
- **CI schema guards** — `scripts/generate-db-types.js --check` and
  `scripts/verify-rls.mjs` (136 tables, 1009 policies) gated in
  `test.yml` + `validate.yml`.
- **CSP reporting + CodeQL** — `POST /api/v1/public/csp-report` (+ sanitizer
  exemption) with `report-uri`/`report-to`/`Reporting-Endpoints`, and a new
  `codeql.yml` SAST workflow (15 workflows total).

**Updated verification baseline:** API 1,241 / 113 suites · Web 1,775 / 265 ·
SDK 293 / 3 · Worker 99 / 9 → **3,408 tests / 390 suites**, all green; 126
migrations; `docs counts OK`; OpenAPI audit 0 missing.

### Tier 2 (same session, post-Tier-1)

- **Dead-letter webhook deliveries** gained an admin surface: list/retry/dismiss
  API, SDK methods and `/admin/webhooks/dead-letters` (nav entry included).
- **Sentry tracing/release tuning** via `SENTRY_TRACES_SAMPLE_RATE` /
  `SENTRY_RELEASE` across API, worker and web.
- **Accessibility breadth triage**: `A11Y_FULL=1` scans 68 routes with
  `wcag22aa` tags; `a11y-breadth.yml` runs it weekly/manually without gating.
- **ADRs 008–011** and `docs/RELEASING.md` added.

**Final baseline (supersedes the above):** API 1,256 / 114 · Web 1,790 / 267 ·
SDK 296 / 3 · Worker 104 / 9 → **3,446 tests / 393 suites**, all green; 319
pages, 127 migrations, 16 workflows; spec **412 paths, 0 missing**; all guards
green.

### Security follow-through (same session)

- **`client_portal_entitlements` RLS least-privilege** (migration `5302428`):
  insert/update policies now match the API's platform-admin gate
  (`client_admin` dropped, `with check` added to update) — the PostgREST
  privilege gap noted in AGENTS Known Debt is closed.
- **MFA recovery-code step-up UX**: generating/revoking codes from
  `/portal/profile/security` now prompts for the authenticator code inline when
  the session is `aal1` and stores the resulting `aal2` token.
