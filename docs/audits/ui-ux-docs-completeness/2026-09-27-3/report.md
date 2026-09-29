# UI/UX + Documentation Completeness Audit — 2026-09-27 (run 3)

**Pack:** manual (UI/UX + docs completeness focus, fresh re-audit)
**Run:** 2026-09-27-3
**Branch:** `develop` (uncommitted working tree)
**Scope:** `apps/web` UI/UX + accessibility; root docs and `docs/` tree;
factual claims in README/AGENTS; CI doc guards.
**Method:** independent re-audit of the newest surfaces (dead-letter admin,
MFA recovery codes + step-up, async scrypt fix, RLS alignment, a11y breadth,
Sentry tuning, ADRs/RELEASING) with full source verification, count
enumeration, link resolution, and the complete guard battery. No prior run was
modified.
**Status:** all P1/P2 findings and the actionable P3s were fixed in the same
session; residual items are listed as open with reasons.

---

## Summary

- **0 P0; 1 P1; 8 P2; ~12 P3.** The P1 (SSR crash) and all P2s are fixed.
- The newest surfaces (dead-letter page, MFA recovery/step-up, Sentry envs,
  RLS migration) were verified correct apart from the findings below.
- **Docs:** all guards passed at audit time, but two operational secret docs
  (`README.dev.md`, `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`) were
  materially stale and are now corrected; the previously unguarded counts
  (nav entries, RLS policies, scripts) are now covered by an extended
  `scripts/check-docs-counts.mjs`, and a new `scripts/check-docs-links.mjs`
  gates link integrity in CI.

---

## UI/UX findings

| #   | Sev | Finding                                                                                                                                                                                           | Status    | Resolution                                                                                                                                                                |
| --- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----- | -------------- | -------- | --------- | --------- | -------------------------------------------------------------- |
| U1  | P1  | `DocumentShareClient` evaluated `window.location.origin` during render; any document with share links crashed SSR with `ReferenceError` (HTTP 500) and had no tests.                              | fixed     | Origin derived after mount; full URL renders post-hydration; new `DocumentShareClient` tests cover SSR render (with `window` undefined), mounted link and clipboard copy. |
| U2  | P2  | Portal automation page read non-existent fields (`status`, `last_run`, `frequency`), so every card showed "unknown"/"N/A".                                                                        | fixed     | Uses the real `last_run_status`/`last_run_at`/`script_type` columns; pills and formatting corrected; tests updated.                                                       |
| U3  | P2  | `/admin/store/quotes` mapped/labelled statuses (`draft                                                                                                                                            | submitted | reviewing                                                                                                                                                                 | converted_to_project`) that the `store_quotes` CHECK never produces, and its legend showed them. | fixed | Mapped to `new | reviewed | contacted | converted | closed` with correct labels/tones and legend; page test added. |
| U4  | P2  | Dead-letter row buttons were named only "Retry"/"Dismiss" for every row; a rejected action could leave `busy` stuck.                                                                              | fixed     | Contextual `aria-label`s and confirm copy include the event; `try/catch/finally` + `aria-busy`; page logs swallowed errors.                                               |
| U5  | P2  | MFA security page's `message`/`error` banners had no live-region roles; the Revoke button persisted after revoking all codes; the step-up prompt did not take focus; page load error had no role. | fixed     | `role="status"`/`role="alert"` added; `hasRecoveryCodes` keyed on `remaining`; step-up input focused on open; page error role added.                                      |
| U6  | P2  | 18 real statuses (e.g. `implemented`, `needs_review`, `planned`, `overdue`, `contacted`) fell through `StatusPill` to slate across 11 modules.                                                    | fixed     | All added to `STATUS_TONES` (emerald/amber/blue/red per semantics); tests extended.                                                                                       |
| U7  | P3  | `packages/ui` Dialog re-ran its effect on inline `onOpenChange` re-renders (re-focusing the close X, re-toggling scroll lock); initial focus was the close button.                                | fixed     | Callback held in a ref (effect keyed on `open`); initial focus prefers the first input/textarea/select; tests added.                                                      |
| U8  | P3  | Login polish: `handleCancelMfa` had no catch; recovery input lacked mobile hints; switching modes left stale codes.                                                                               | fixed     | Catch + state reset; `autoCapitalize`/`spellCheck`; mode switches clear both inputs.                                                                                      |
| U9  | P3  | `RouteAnnouncer` announced on initial page load (duplicating the browser's own announcement).                                                                                                     | fixed     | First effect run skipped via ref; tests cover skip + navigation.                                                                                                          |
| U10 | P3  | All 102 `<th>` lacked `scope="col"` across 22 files.                                                                                                                                              | fixed     | Codemod added `scope="col"` to every data header (0 remaining); `<thead>` untouched.                                                                                      |
| U11 | P3  | ~24 files still keep local date helpers, including `formatRelativeTime` in 9 files — the single-source goal is incomplete.                                                                        | open      | Documented in AGENTS Known Debt (relative-time logic is varied); not forced this round.                                                                                   |
| U12 | P3  | Error toasts auto-dismiss after 5s like informational ones.                                                                                                                                       | open      | Accepted; persistence/pause-on-hover is a UX decision, tracked as an opportunity.                                                                                         |
| U13 | P3  | Empty-state CTAs cover only 12 of ~155 empty states.                                                                                                                                              | open      | Opportunity (product copy), tracked.                                                                                                                                      |

**False positive corrected:** the sweep flagged `SidebarShell`'s mobile drawer as
an untrapped `role="dialog"`; it has an inline Tab trap, Escape, focus restore
and scroll lock (`SidebarShell.tsx:35-68`). Verified correct.

**Verified correct (newest surfaces):** dead-letter page states/ConfirmDialog/
toasts/tenant-404 handling; MFA login + security step-up state machines with
`aal2` token persistence (no retry loop); `lib/format.ts` invalid-safe "—" with
zero raw `toLocale*`/slices outside it; ToastProvider stacking/assertive
region/single mount; Dialog scroll lock/close/Escape/restore; RouteAnnouncer
single region; 0 `alert()`/`window.confirm`/`href="#"`; 149 `loadFailed` pages
with 0 ungated empties; 0 detail pages masking 5xx; 94/94 dynamic pages with
metadata.

---

## Documentation findings

| #   | Sev | Finding                                                                                                                                                                                               | Status | Resolution                                                                                                                                                                                                                                                                 |
| --- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | P2  | `README.dev.md`'s environments/secrets section listed names no workflow uses (`SSH_PRIVATE_KEY`, `GHCR_TOKEN`, `TF_VAR_DB_PASSWORD`, `DO_REGION`, …) and described a non-existent "preview workflow". | fixed  | Rewritten from the actual workflows (`CI_SSH_PRIVATE_KEY`, built-in `GITHUB_TOKEN`, real DO/Cloudflare/Supabase/Stripe names) with a pointer to the canonical matrix; stale boilerplate removed.                                                                           |
| D2  | P2  | `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md` documented the unused `AWS_ROLE_ARN` and omitted secrets/vars forwarded by current workflows.                                                           | fixed  | Row removed; `FIELD_ENCRYPTION_KEY`, `TURNSTILE_SECRET_KEY`, `RLS_*`, `REDIS_PASSWORD`, `CHROMATIC_PROJECT_TOKEN`, `SUPABASE_ACCESS_TOKEN`, `E2E_JWT_SECRET`, `DROPLET_IP`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` added; `prod-approval` wording corrected to "not configured". |
| D3  | P3  | RLS policy count stale (1009 vs live 1011) and not covered by any guard.                                                                                                                              | fixed  | Corrected; `check-docs-counts.mjs` now imports `collectRlsStats()` from `verify-rls.mjs` and checks AGENTS + review.md.                                                                                                                                                    |
| D4  | P3  | `WEB_UI_CONVENTIONS.md` claimed "admin-nav 60 sections"; actual is 94.                                                                                                                                | fixed  | Corrected (admin 94 / portal 70) and now guarded against `admin-nav.ts`/`portal-nav.ts`.                                                                                                                                                                                   |
| D5  | P3  | `module-matrix-mapping.md` said "50 route files"; actual 62 (75 recursive).                                                                                                                           | fixed  | Corrected, with the distinct number the table references.                                                                                                                                                                                                                  |
| D6  | P3  | `docs/MFA.md` claimed revocation returns 400 without a factor; it returns 200 (only generation requires a factor).                                                                                    | fixed  | Semantics corrected against `routes/auth.ts`.                                                                                                                                                                                                                              |
| D7  | P3  | `docs/adr/README.md` claimed every ADR follows the standard format, but 001–007 are table rows only.                                                                                                  | fixed  | Claim now notes 001–007 are summaries.                                                                                                                                                                                                                                     |
| D8  | P3  | `e2e.yml`'s manual input description said `A11Y_BREADTH`; the variable is `A11Y_FULL`.                                                                                                                | fixed  | Description corrected.                                                                                                                                                                                                                                                     |
| D9  | P3  | UI docs listed 8 format helpers; `lib/format.ts` exports 10, and `ui-kit.md` missed several real components.                                                                                          | fixed  | `formatDateTimeMinutesUtc`/`formatTime` added to both docs; `AdminPageShell`, `RouteGuard`, `useFocusTrap`, `AdminSubnav`/`PortalSubnav`, `RouteAnnouncer` added to the kit.                                                                                               |
| D10 | P3  | README CI-table descriptions omitted the docs-counts/DB-types/RLS guards and Chromatic's path filter/`continue-on-error`.                                                                             | fixed  | Descriptions updated from the workflows.                                                                                                                                                                                                                                   |
| D11 | P3  | Env examples omitted documented vars; no CI-only variable section.                                                                                                                                    | fixed  | `apps/api/.env.example`, `infra/digitalocean/.env.example` filled; `docs/ENVIRONMENT_VARIABLES.md` gained a CI-only section.                                                                                                                                               |
| D12 | P3  | This run was not yet on disk.                                                                                                                                                                         | done   | This report + runs-table row.                                                                                                                                                                                                                                              |

**Guard/verification results at audit time:** all six guards green; 184/184
relative links resolved; every headline count exact except the RLS policy
number (now fixed); 351/351 paths in the module-matrix mapping exist; release
docs match the workflows.

---

## Improvements added

1. **`scripts/check-docs-counts.mjs` widened**: pages (total + groups),
   workflows, scripts, migrations (total + latest), E2E specs, API route files,
   SDK modules, seeds, worker tasks, prompt files, nav entries and RLS policies
   — the drift classes this audit found are now self-detecting.
2. **`scripts/check-docs-links.mjs`** + CI wiring: link integrity is now gated
   in `test.yml` and `validate.yml` (was manual-only).
3. **New canonical docs**: `docs/testing.md`, `docs/CI.md`,
   `docs/PERFORMANCE.md`, plus full `docs/runbooks/README.md` and
   `docs/features/README.md` indexes (all linked from `docs/INDEX.md`).
4. **UI fixes**: SSR-safe share links with regression tests, real automation
   fields, correct quote statuses, contextual action labels, complete status
   tones, better Dialog focus, table header semantics.

## Remaining opportunities (tracked, not defects)

- Centralize `formatRelativeTime` (9 files / 27 matches) into `lib/format.ts`.
- Empty-state CTAs for the highest-traffic dead-ends.
- Error-toast persistence / pause-on-hover.
- ADR bodies for 001–007 (currently summaries).
- Generated test-count snapshot so docs quote machine-produced numbers.

---

## Verification

| Check                                  | Result                                          |
| -------------------------------------- | ----------------------------------------------- |
| API tests                              | **1,256 passed / 114 suites**                   |
| Web tests                              | **1,820 passed / 270 suites**                   |
| SDK tests                              | **296 passed / 3 suites**                       |
| Worker tests                           | **104 passed / 9 suites**                       |
| Total                                  | **3,476 tests / 396 suites**                    |
| `pnpm lint` / typechecks               | clean                                           |
| `scripts/check-docs-counts.mjs`        | `docs counts OK`                                |
| `scripts/check-docs-links.mjs`         | `docs links OK`                                 |
| `scripts/verify-rls.mjs`               | 136 tables, 1,011 policies, 0 failures/warnings |
| `scripts/generate-db-types.js --check` | `database types up to date`                     |
| `scripts/openapi-audit.js`             | exit 0, `MISSING from spec (0)` (412 paths)     |
| `scripts/verify-prompts.js verify`     | all files match manifest                        |
| `scripts/sync-review-md.mjs --check`   | in sync                                         |

## Audit-contract notes

- Run directory: `docs/audits/ui-ux-docs-completeness/2026-09-27-3/`.
- Previous runs (`2026-09-27/`, `2026-09-27-2/`) were not modified.
- `findings.json` not emitted (optional per `docs/audits/README.md`).
