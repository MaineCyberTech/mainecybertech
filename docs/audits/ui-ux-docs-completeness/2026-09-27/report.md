# UI/UX + Documentation Completeness Audit — 2026-09-27

**Pack:** manual (UI/UX + docs completeness focus)
**Run:** 2026-09-27
**Branch:** `develop` @ `f4d5073`
**Scope:** `apps/web` UI/UX and accessibility; root docs (`README.md`, `AGENTS.md`,
`README.dev.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, `LICENSE`,
`review.md`), `docs/` tree; factual claims in README/AGENTS.
**Method:** file/route enumeration and count verification, convention diffing
against `docs/WEB_UI_CONVENTIONS.md`, targeted source reads, link resolution
(`Test-Path` over every relative markdown link), UTF-8 byte scans for encoding
corruption, `node scripts/sync-review-md.mjs --check`, and
`rg`/`Select-String` sweeps. The highest-impact findings below were re-verified
in source by the auditing session; line references were accurate at `f4d5073`.
**Status:** all findings were remediated in the same session — see
**Remediation status (2026-09-27, same session)** at the end. Finding text below
records the pre-remediation state as found at `f4d5073`.

---

## Executive summary

The repo is in good overall shape. No P0. The documentation set is unusually
complete: **every relative link in the 7 root docs and `docs/INDEX.md` (168
links) resolves**, `review.md` is genuinely in sync with `AGENTS.md`, the
AGENTS/README numeric tables are near-perfect, and the known-debt ledger is
mostly still true.

The real problems concentrate in three areas:

1. **Detail-page error semantics (P1, web).** The 404-vs-5xx pattern fixed for
   11 pages in `1ba219e` was never applied to ~19 remaining admin detail pages;
   outages render as "Record not found".
2. **Auth redirects on transient failures (P1, web).** API 5xx/429 on
   `users.me()`/membership lookups redirect authenticated users to `/login`,
   `/portal/dashboard` or `/pending`.
3. **Docs drift (P2).** `docs/openapi.yaml` is materially stale (all MFA
   endpoints and most of the store module missing), 19/75 module docs cite
   non-existent paths, README.dev names the wrong DigitalOcean secret, 6 web
   env vars are undocumented, AGENTS.md has a corrupted markdown block, and
   there is real mojibake in seeded catalog JSON plus a garbage
   `infra/digitalocean/README.md`.

---

## Part A — UI/UX findings

### A1 — P1 — 19 detail pages mask API failures as "record not found"

`docs/WEB_UI_CONVENTIONS.md:40-42` requires `notFound()` only on a real 404 and
rethrow otherwise. 18 admin pages use `loadFailed` + `RecordDetail` with no
`notFound()` call and no status check, so **any** failure (401/500/timeout)
renders the "not found" panel, and a genuinely missing record returns HTTP 200:

- `apps/web/app/(admin)/admin/assets/[id]/page.tsx:19-26,43-45`
- `apps/web/app/(admin)/admin/break-glass/[id]/page.tsx`
- `apps/web/app/(admin)/admin/dmarc/[id]/page.tsx`
- `apps/web/app/(admin)/admin/domain-monitors/[id]/page.tsx`
- `apps/web/app/(admin)/admin/endpoint-security/[id]/page.tsx`
- `apps/web/app/(admin)/admin/file-requests/[id]/page.tsx`
- `apps/web/app/(admin)/admin/id-verify/[id]/page.tsx`
- `apps/web/app/(admin)/admin/incidents/[id]/page.tsx`
- `apps/web/app/(admin)/admin/licenses/[id]/page.tsx`
- `apps/web/app/(admin)/admin/m365-hardening/[id]/page.tsx`
- `apps/web/app/(admin)/admin/offboarding/[id]/page.tsx`
- `apps/web/app/(admin)/admin/onboarding/[id]/page.tsx`
- `apps/web/app/(admin)/admin/patch-compliance/[id]/page.tsx`
- `apps/web/app/(admin)/admin/service-catalog/[id]/page.tsx`
- `apps/web/app/(admin)/admin/status/[id]/page.tsx`
- `apps/web/app/(admin)/admin/vendor-contacts/[id]/page.tsx`
- `apps/web/app/(admin)/admin/vendor-contracts/[id]/page.tsx`
- `apps/web/app/(admin)/admin/website-monitors/[id]/page.tsx`

Plus a 19th with a custom panel: `apps/web/app/(admin)/admin/store/products/[id]/page.tsx:17-26`
catches everything and renders "Product Not Found" (`:54-57`).

**Correct reference implementations:** `apps/web/components/admin/ModuleDetailPage.tsx:46-50`
(404 → `notFound()`, else rethrow — applied to 11 pages in `1ba219e`),
`apps/web/app/(portal)/portal/documents/[documentId]/page.tsx:47-53` and
`apps/web/app/(admin)/admin/webhooks/[webhookId]/page.tsx:32-39` (status-checked;
both still render the not-found panel inline with HTTP 200 — worth aligning to
`notFound()`, P3).

**Fix:** apply the `ModuleDetailPage` pattern to the 19 pages: rethrow non-404,
`notFound()` on 404.

### A2 — P1 — Transient API failures redirect authenticated users

- `apps/web/lib/auth/admin.ts:14-18` — any `api.users.me()` failure → `redirect("/login")`.
- `apps/web/lib/auth/admin.ts:24-29` — any `memberships.list` failure → `redirect("/portal/dashboard")`.
- `apps/web/app/(portal)/layout.tsx:106` — `getApprovedMembership().catch(() => null)` then
  `:123-125` `redirect("/pending")`; `lib/auth/membership.ts` deliberately
  rethrows transient errors for exactly this reason.

A 500/429 on a healthy session therefore looks like "signed out", "not an
admin", or "pending approval". Compare `apps/web/app/(portal)/layout.tsx:94-105`,
which correctly distinguishes 401/403 from transient failures for `users.me()`
(and handles `MFA_REQUIRED`). `requireAdminAccess` is called by essentially every
admin page, so the blast radius is the whole admin surface.

### A3 — P2 — Empty/zero state still rendered alongside the error banner

`DataErrorNote` is used in 164 page files, but only 2 guard the empty branch
(`(portal)/portal/status/page.tsx:63`, `(public)/status/[orgId]/page.tsx:62`).
Examples where an outage shows both the amber "Could not load" note **and** a
misleading zero/empty state:

- `apps/web/app/(portal)/portal/approvals/page.tsx:64` (error note) + `:67`
  ("0 approval requests") + `:89-91` ("No approval requests found.") — verified.
- `apps/web/app/(portal)/portal/budgets/page.tsx:55,57,85`
- `apps/web/app/(admin)/admin/findings/page.tsx:86` + empty list
- `apps/web/app/(admin)/admin/edu-automation/ai-policy/page.tsx:42,67-72`

~131 pages share the shape. The convention ("Do not render an empty/zero state
on failure", `WEB_UI_CONVENTIONS.md:40-41`) is explicitly violated; the fix is
`{!loadFailed && items.length === 0 && ...}` (or render the note _instead of_
the list). Note `DataErrorNote`'s own copy already hedges ("figures below may be
incomplete"), but a bare "No X found" is still indistinguishable from real
absence.

### A4 — P2 — `packages/ui` `Dialog` has no focus trap and no Escape

`packages/ui/src/components/Dialog.tsx:46-49` sets `role="dialog"`/`aria-modal`,
but there is no `useFocusTrap`, no Escape handler, and `aria-labelledby="dialog-title"`
is hardcoded for every instance. `WEB_UI_CONVENTIONS.md:51-55` requires all three.
Used in `apps/web/components/portal/DocumentShareClient.tsx:176-235`. The 13
other web dialogs use `useFocusTrap` correctly.

### A5 — P2 — Toasts and alerts are not announced; native `alert()` remains

- No `ToastProvider`/`useToast` exists; 5 ad-hoc implementations remain
  (`pushToast`, `addToast`, `onToast` prop) and none has `role="status"`/`aria-live`
  (`AdminDocumentsCenterClient.tsx:1118-1128`, `ProjectTaskListV5.tsx:244-259`,
  `RolePermissionsEditor.tsx:167-178`, `UserPermissionOverridesClient.tsx:147`,
  `PortalDocumentsCenterClient.tsx:173-180`). Matches the AGENTS known-debt entry.
- 4 native `alert()` calls: `apps/web/components/admin/AdminTicketCenterClient.tsx:332`,
  `apps/web/components/admin/NewWebhookForm.tsx:27,39`,
  `apps/web/components/admin/TriageAnalyzeClient.tsx:81`.
- Positive: `window.confirm` is gone from live code (only comments in
  `ConfirmDialog.tsx:7`, `ConfirmIntentButton.tsx:41`).

### A6 — P2 — Three undefined CSS utility classes are still used

`packages/ui/src/styles.css` defines `cyber-button`/`cyber-button-secondary` only;
these usages therefore render unstyled:

- `cyber-button-sm` — `apps/web/app/(admin)/admin/governance/page.tsx:70,73`
- `cyber-button-danger` — `apps/web/app/(admin)/admin/webhooks/[webhookId]/WebhookDetailClient.tsx:206`
- `cyber-text` — 15 uses across `(public)/privacy/page.tsx` (9) and
  `(public)/terms/page.tsx` (6) — body-copy text falls back to browser defaults.

### A7 — P2 — Silent error swallowing in several server pages/components

- `apps/web/app/(admin)/admin/organizations/[orgId]/activity/page.tsx:20` (`.catch(() => null)`)
- `apps/web/app/(admin)/admin/organizations/[orgId]/billing/page.tsx:17-22` (6 calls caught to null/empty)
- `apps/web/app/(admin)/admin/users/[userId]/activity/page.tsx:20`
- `apps/web/components/admin/InviteUserForm.tsx:32,41` — dropdowns silently empty
- `apps/web/components/admin/SuperAdminOrgSwitcher.tsx:44-46,70-71` — failure → "No tenants"
- `apps/web/components/admin/AdminGlobalSearch.tsx:49-53,203-209` — failure → "No results found"
- `apps/web/app/(portal)/portal/dashboard/page.tsx:136` — on failure the org name shows "Loading..." forever

### A8 — P3 — Theming surface is dead/unreachable

`ThemeProvider` wraps the app (`apps/web/app/layout.tsx:41`, `defaultTheme="system"`)
and writes `data-theme` (`packages/ui/src/hooks/use-theme.tsx:49-65`), but there is
**no `useTheme` consumer anywhere in `apps/web`** (verified: 0 matches) — no theme
toggle. The app is hardcoded dark (`styles.css:28-30`, static `colors.cyber.base`),
and the light theme only overrides 4 CSS vars (`styles.css:148-153`), so
`data-theme="light"` (auto-set on a light-OS machine) produces a partially-themed,
unreadable UI on the paths that do use the vars. Decide: finish light mode or
remove the provider (and the FOUC risk, since `data-theme` is set post-mount with
no blocking script).

### A9 — P3 — Consistency: pagination, badges, date/currency formatting

- 20 local status-badge functions re-implement `StatusPill`/`SeverityPill`
  (e.g. `(portal)/approvals/page.tsx:11,27`, `ai-triage/page.tsx:12`,
  `domain-monitors/page.tsx:24`, `budgets/page.tsx:28`, `qbr/page.tsx:26`).
- No shared `formatDate`/`formatCurrency` helper: 85 raw
  `new Date(...).toISOString().slice(0, 10)` (UTC display), 20 `toLocaleDateString`,
  15 inline `Intl.NumberFormat`.
- `AdminPagination` (15 uses) has **no `aria-current`** on the active page
  (`apps/web/components/admin/AdminPagination.tsx:74-79`); custom pagination
  remains in `admin/audit`, `NotificationsPageClient`, `AdminOrganizationsClient`.

### A10 — P3 — Empty-state component exists but adoption is skewed

`components/EmptyState.tsx` is imported by 101 files, but ~30 pages render bare
"No X found" paragraphs (spot-checked `(portal)/approvals/page.tsx:89-91`,
`(portal)/budgets/page.tsx:85`, `(portal)/domain-monitors/page.tsx:99`,
`(admin)/admin/roles/page.tsx:26`, `(admin)/admin/webhooks/page.tsx:25`); only
7 of 86 portal pages use it. `AdminListPage.tsx:105-112` falls back to a bare div
unless `emptyState` is passed (only 3 pages use the component at all).

### A11 — P3 — Metadata and semantics gaps

- Only 8 files use `generateMetadata`, all public; dynamic admin/portal detail
  pages share one static title.
- `apps/web/app/(admin)/admin/page.tsx` has no `h1` (first heading is `h2` at `:181`).
- Two public pages have two `h1`s (`(public)/password-reset/page.tsx`,
  `(public)/test-accounts/page.tsx`).
- Root-only `not-found.tsx` — no boundary in `(admin)`/`(portal)`/`(public)`,
  so a missing in-app record drops workspace chrome.
- `NotificationBell.tsx:190`, `NotificationsPageClient.tsx:93,97` emit `href="#"`.
- `EmailTestClient.tsx:38-46` is the one genuinely unassociated `<label>`.

### A12 — P3 — Responsive and a11y foundations are otherwise solid (verified)

All 23 `<table>` elements sit in `overflow-x-auto` wrappers; mobile nav exists in
all four shells (admin/portal/public/store, with focus traps); zero unprefixed
`grid-cols-3/4`; skip link exists (`app/layout.tsx:34-39`); 184 `aria-label`s and
no handler-less/icon-only unnamed buttons found; `prefers-reduced-motion` is
handled (`styles.css:161-171`).

---

## Part B — Documentation completeness findings

### B1 — P2 — `docs/openapi.yaml` is materially stale

317 paths / 461 operations (matches `INDEX.md:198`), but `buildSpec()` is a
hand-authored list (`apps/api/src/openapi/spec.ts`, 2,662 lines) with **no
coverage validation**:

- **All MFA endpoints missing**: `/auth/mfa/factors`, `/enroll`, `/challenge`,
  `/verify` (`apps/api/src/routes/auth.ts:359,386,422,...`) — 0 occurrences of
  `/auth/mfa` in the spec, even though MFA shipped 2026-09-18.
- **Store module incomplete**: 34 route definitions under
  `apps/api/src/routes/store/` vs 12 `/store` paths in the spec. Missing:
  `/store/campaigns`, `/store/visual-assets`, `/store/quote-requests`,
  `/store/leads`, `/store/proposal-drafts` (2026-09-21 features).
- `scripts/openapi-audit.js` checks registration coverage conceptually but the
  spec generation is manual; README.md:44,53's "OpenAPI/Swagger documentation"
  claim is only partially true.

### B2 — P2 — 19 of 75 module docs cite non-existent source paths

The `**API Routes:**` / `**SDK:**` lines in 19 files point at aspirational
1-file-per-module paths (34 broken references verified): `api-documentation`,
`automation-workflows`, `backup-dr`, `camera-calculator`, `change-requests`,
`client-onboarding`, `compliance-readiness`, `dynamic-client-forms`,
`identity-verification`, `incident-response`, `offboarding`,
`phishing-simulation`, `port-maps`, `powershell-policy`, `satisfaction-pulse`,
`scoreboard-gamification`, `scoreboards-gamification`, `sla-metrics`,
`unifi-survey`. Example: `docs/modules/backup-dr.md:4-5` → `apps/api/src/routes/backup-dr.ts`
(actual: `routes/final/backups.ts`); `docs/modules/scoreboards-gamification.md`
→ `routes/edu-automation/scorecards.ts` (does not exist). Same pack path drift
AGENTS.md:496-501 documents, but module docs actively mislead contributors.

### B3 — P2 — `README.dev.md` names the wrong DO secret and the wrong compose file

- `README.dev.md:472` lists `DO_TOKEN`; workflows use **`DO_API_TOKEN`**
  (`deploy-do.yml:116`, `terraform-do.yml:60`,
  `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md:15`).
- `README.dev.md:85` points developers at
  `infra/digitalocean/docker-compose.yml` for the local stack — that is the
  **production** compose (GHCR images, required `IMAGE_TAG`, redis/caddy/prometheus);
  the local stack is root `docker-compose.yml`.
- `README.dev.md:466` prescribes required reviewers for the `prod-approval`
  gate; AGENTS Known Debt says prod/prod-approval currently have no protection
  rules (prescriptive vs actual state; add a note).

### B4 — P2 — 6 used-but-undocumented web env vars

Used in code but absent from `docs/ENVIRONMENT_VARIABLES.md` and
`apps/web/.env.example`:

- `NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_BUILD_TIME`, `NEXT_PUBLIC_GIT_SHA`
  (`apps/web/lib/version.ts:3-10`, `scripts/generate-version.js`)
- `NEXT_PUBLIC_LOG_ENDPOINT`, `NEXT_PUBLIC_LOG_LEVEL`
  (`apps/web/lib/client-logger.ts:13,70`)
- `NEXT_PUBLIC_TEST_ACCOUNT_PASSWORD` (`(public)/test-accounts/page.tsx:481,506`)
  — the most sensitive of the six.

Also: `apps/web/lib/env.ts:3-9` validates only 5 of the 12 public vars, and
`.env.example` omits the documented `NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED`.

### B5 — P2 — `AGENTS.md` contains a corrupted markdown block

`AGENTS.md:502-508` is malformed (stray `~~`, missing spaces, broken code
fences), so a "FIXED" debt item renders as garbage and the fences break the
surrounding list:

````
- ```7 admin pages still swallow~~ **FIXED 2026-09-21** — `approval-requests`,
`cab`, ...`now set a`loadFailed`flag and
render`DataErrorNote` ...
````

```

```

Fix: one clean bullet ending in the real sentence, deleting the stray fences.

### B6 — P2 — Encoding corruption (mojibake) in tracked files

A UTF-8 replacement/mojibake scan found 19 hits; user-visible ones:

- **Seeded/fallback store catalog**: `apps/api/src/data/products.json` (8
  mojibake apostrophes, e.g. `"Computer Wonâ€™t Boot Support"`) and
  `apps/web/lib/catalog/data/products.json` (2). `scripts/seed-store.ts:65`
  reads the API JSON, so the corrupted names seed the DB and render on the
  public storefront when the JSON fallback is used.
- `apps/api/src/routes/documents.ts:134,320,334,360,721` (`â€”`),
  `apps/api/src/routes/projects.ts:382` (double-encoded `Ã¢â‚¬â€`),
  `apps/worker/src/tasks/module-tasks.ts:527` (`�?"` U+FFFD),
  `.github/workflows/e2e.yml:92` — comments, cosmetic.
- `infra/digitalocean/README.md` — 84 bytes of UTF-16LE garbage
  (`EF BF BD EF BF BD 23 00 20 00 74 00...` = `��# trigger` plus blank lines),
  committed by "chore: trigger deploy-do" commits (`27b439a`, `3b89fb3`,
  `b0a27fe`, `d667a04`, `7be49d7`). Tracked and effectively unreadable.

### B7 — P2/P3 — Root-doc freshness items

| #   | Sev | Finding                                                                                                                                                                                                                                                               | Evidence                                                           |
| --- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | P3  | AGENTS.md:102 "Build/dev/utility scripts — 67"; actual is 68 (`scripts/sync-review-md.mjs` added after the 2026-09-21 count).                                                                                                                                         | `Get-ChildItem scripts -Recurse -File` = 68                        |
| 2   | P3  | README.md:55-57 "Still in progress: shared package consolidation" is stale — unchanged since the initial commit (`4a87279`); `packages/{sdk,ui,config}` are the consolidated packages and `@mct/ui` is imported 43× in web.                                           | `git blame -L 55,58 README.md`                                     |
| 3   | P3  | README.md:289-294 Docker table image names (`mainecybertech-portal-*`) exist in no compose file; the sizes (~331/287/278 MB) are unverifiable, and the compose file builds locally.                                                                                   | `docker-compose.yml` (no `image:` keys); prod compose uses `mct-*` |
| 4   | P3  | Playwright drift: README.md:294 and `docker-compose.yml:57` pin `v1.60.0`; root `package.json:31` requires `@playwright/test 1.61.0`.                                                                                                                                 | version strings                                                    |
| 5   | P3  | README.md:312 under-describes `validate.yml` (also audit, secrets scan, OpenAPI validate, prompt provenance, review.md sync).                                                                                                                                         | `validate.yml:32-38,81-106,166-179`                                |
| 6   | P3  | CHANGELOG misses the 3 commits after 2026-09-24 (`e6bb073` Turnstile deploy, `9698315` API fixes, `f4d5073` worker email escaping); no `CODE_OF_CONDUCT.md`; no `.github/PULL_REQUEST_TEMPLATE.md` or `ISSUE_TEMPLATE/`.                                              | CHANGELOG.md; `.github/` listing                                   |
| 7   | P3  | `docs/API_RATE_LIMITING.md:27,80` still describes the rate-limit key as the decoded JWT `sub` claim; the code explicitly removed `sub` decoding (`apps/api/src/middleware/rate-limit.ts:7-12`). (The 300/15-min global and 600/15-min per-user numbers are accurate.) | doc vs code                                                        |
| 8   | P3  | AGENTS.md:496 calls the file `implementation-matrix.csv`; actual is `prompts/mct-portal-os-expanded-60-modules-deep-prompts-pack/docs/04-implementation-matrix.csv`.                                                                                                  | basename search                                                    |
| 9   | P3  | 42/60 implementation-matrix slugs have no same-named `docs/features/*.md`/`runbooks/*.md` (naming drift — coverage exists under shorter names).                                                                                                                       | matrix vs `docs/features`                                          |
| 10  | P3  | `docs/audits/comprehensive-audit/2026-08-26/report.md` is not linked from `docs/audits/README.md`'s "Runs" table body; 118 feature/runbook docs are unlinked by design (disclosed at INDEX.md:181-182).                                                               | INDEX/runs table                                                   |

### B8 — Repo hygiene

- Root artifact files (`terraform.exe` 91 MB, `session-2026-09-21.txt`,
  `repomix-*.xml`, `debug-storybook.log`, `cleanup.bat/.sh`, `sbom.cdx.json`,
  `.playwright-report/`, `.playwright-results/`) are **all untracked and
  `.gitignore`-covered** — no tracked junk except `repomix-session.config.json`
  (small, intentionally committed per `.gitignore:63`) and the corrupted
  `infra/digitalocean/README.md` (B6).
- Duplicate multi-MB product catalogs are tracked in 3+ places
  (`apps/api/src/data/products.json` 3.6 MB, `apps/web/lib/catalog/data/products.json`
  2.6 MB, prompt-pack copies) — maintenance/size smell, P3.

### B9 — Verified accurate (do not re-audit)

- **All 168 relative links** in README.md, README.dev.md, AGENTS.md,
  CONTRIBUTING.md, SECURITY.md, docs/INDEX.md, review.md resolve; INDEX.md:4's
  reconciliation claim is true.
- **Counts**: AGENTS File Counts — API routes 62 (75 incl. `final/` + `store/`),
  SDK modules 60, worker task files 12 (+ `index.ts`), web pages 318
  (Admin 202 / Portal 86 / Public 29 / `forbidden` 1 — the "Root 1" label is
  actually `app/forbidden/page.tsx`), components 100, migrations 125 (latest
  `5302426_status_actions.sql`), seeds 9 `.sql`, workflows 14, prompts 789
  (manifest pins 787) — all exact.
- README: 3,262-test arithmetic and 380 suites (test files 109 API + 259 web +
  3 SDK + 9 worker = 380), 90 E2E specs, 28 `registerTask` handlers, CI table
  14/14 with correct triggers, auth-callback design description — all verified.
- `review.md` mirror: `node scripts/sync-review-md.mjs --check` → in sync
  (banner-only diff); wired into `validate.yml:178-179`.
- `docs/ENVIRONMENT_VARIABLES.md` fully covers the API (37) and Worker (31) Zod
  schemas; `.env.example` present for all three apps; API/Worker call
  `dotenv.config()`.
- docs counts: modules 75, features 60, runbooks 60, seo 10, ADR 7 decisions.
- `docs/modules/store.md` is current (campaigns, leads, proposal drafts,
  quote-requests, visual assets documented).
- E2E axe coverage is 19 pages (`apps/web/e2e/a11y.spec.ts:5-25`) — matches
  AGENTS' stated axe-breadth debt; MFA enforcement flag exists
  (`apps/api/src/env.ts:44`); worker `ping` is registered
  (`task-registry.ts:74`) and never enqueued; `client_portal_entitlements` RLS
  still admits `client_admin` (migration `5302420:13,18`) vs API platform-admin
  gate — all Known Debt entries still true.
- No `window.confirm` in live code; all tables have overflow wrappers; mobile
  nav exists in all shells.

---

## Remediation status (2026-09-27, same session)

All remediation below was completed and verified in the same session (plus a
second round for the consistency items): `pnpm lint`,
`pnpm --filter={web,api,worker} typecheck`,
`pnpm --filter={web,api,@mct/sdk,worker} test` (3,280 tests / 382 suites, all
green), `node scripts/openapi-audit.js` → **0 missing**, and
`node scripts/sync-review-md.mjs --check` → in sync.

| Finding | Status   | What changed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1      | fixed    | 19 detail pages now `notFound()` on 404 and rethrow otherwise; `webhooks/[webhookId]`, `portal/documents/[documentId]` and `store/products/[id]` inline HTTP-200 panels converted; `(admin)`/`(portal)` `not-found.tsx` added.                                                                                                                                                                                                                                                                                    |
| A2      | fixed    | `lib/auth/admin.ts` + `(portal)/layout.tsx` redirect only on 401/403 (and `MFA_REQUIRED` step-up); transient failures rethrow; tests added.                                                                                                                                                                                                                                                                                                                                                                       |
| A3      | fixed    | 56 list pages and 8 store/client-portal ternaries now guard empty/zero branches with `!loadFailed`; tests updated to assert the error note instead of a misleading empty state.                                                                                                                                                                                                                                                                                                                                   |
| A4      | fixed    | `packages/ui` `Dialog` focus-traps, closes on Escape, restores focus, and uses `useId()` labels.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| A5      | fixed    | All five toast renderers carry `role="status"`/`aria-live="polite"`; the 4 native `alert()` calls replaced with inline `role="alert"`/`role="status"` messages (bulk update now also respects the `{ok,error}` return). Toast provider consolidation completed in the second round (`components/ui/ToastProvider` + `useToast()`, 7 new tests).                                                                                                                                                                   |
| A6      | fixed    | `cyber-button-sm`, `cyber-button-danger`, `cyber-text` defined in `packages/ui/src/styles.css`.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| A7      | fixed    | Org/user activity 404 fallback + transient rethrow; org billing surfaces `DataErrorNote`; invite form, tenant switcher, both global searches and portal dashboard no longer hide failures.                                                                                                                                                                                                                                                                                                                        |
| A8      | fixed    | Theme pinned dark (`defaultTheme="dark"`, fresh storage key); dead light-mode surface no longer applied.                                                                                                                                                                                                                                                                                                                                                                                                          |
| A9      | fixed    | `AdminPagination` gains `aria-current`; `lib/format.ts` (`formatDate`/`formatDateShort`/`formatDateTime`/`formatDateUtc`/`formatDateTimeUtc`/`formatMonthDay`/`formatMonthDayYear`/`formatCurrency`) is now the single source of formatting — every local currency helper, `$X.toLocaleString()` money display and `toLocale*` date call was migrated (the four legacy store badge helpers included, via the new `StatusPill` `tone`/`label` API). No `toLocale*`/`Intl.NumberFormat` remains outside the helper. |
| A10     | fixed    | Empty/zero states are suppressed on failure (A3) and page-level empties now use `EmptyState` across 55 files; nested section/sub-list fallbacks remain short inline text by design.                                                                                                                                                                                                                                                                                                                               |
| A11     | fixed    | Admin dashboard `h1`, `EmailTestClient` label association, group-level `not-found` boundaries and notification fallback links fixed; all 83 dynamic admin/portal pages now export `generateMetadata` with id-distinguishable titles (double-`h1` flags were false positives — mutually exclusive branches).                                                                                                                                                                                                       |
| A12     | verified | No action needed (responsive/a11y foundations verified sound).                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| B1      | fixed    | `docs/openapi.yaml` completed to **408 paths, 0 missing** (MFA, store, 45 explicit + 254 dynamic-factory entries; 67 phantom/stale entries removed); `scripts/openapi-audit.js` rewritten (mount/subdir/trailing-slash/param fixes) and gated in `test.yml` + `validate.yml`.                                                                                                                                                                                                                                     |
| B2      | fixed    | All 19 stale `docs/modules/*.md` path headers corrected to the real consolidated routes/SDK modules (validation: 0 broken refs).                                                                                                                                                                                                                                                                                                                                                                                  |
| B3      | fixed    | `README.dev.md`: `DO_API_TOKEN`, root compose for local dev, prod-approval note.                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| B4      | fixed    | Six `NEXT_PUBLIC_*` vars documented + added to `.env.example`; `lib/env.ts` validates them as optional.                                                                                                                                                                                                                                                                                                                                                                                                           |
| B5      | fixed    | AGENTS.md malformed block replaced with a clean bullet.                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| B6      | fixed    | Mojibake purged from both `products.json` catalogs, route comments and `e2e.yml`; `infra/digitalocean/README.md` rewritten from 84 bytes of UTF-16 garbage to a real README.                                                                                                                                                                                                                                                                                                                                      |
| B7      | fixed    | Items 1-10 fixed (scripts count, README "still in progress", Docker table, Playwright 1.61.0, validate description, CHANGELOG, rate-limit doc, matrix filename, community files, audits link). Item 9 (42/60 matrix slug vs docs naming) resolved by `docs/module-matrix-mapping.md`, which maps all 60 modules to their real feature/runbook/API/SDK/UI paths.                                                                                                                                                   |
| B8      | fixed    | Tracked root artifacts reviewed; the only broken tracked file (`infra/digitalocean/README.md`) fixed. The two catalog JSONs are intentionally different content generations (web = enriched marketing/fulfillment copy, API = the reverted shorter set) and are documented in AGENTS for reconciliation when the catalog content workflow is defined rather than force-merged.                                                                                                                                    |
| B9      | verified | No action needed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

Verification note: the report's raw counts in finding text reflect the
pre-remediation state (`f4d5073`); the status table above is the post-remediation
state.

---

## Audit-contract notes

- Run directory: `docs/audits/ui-ux-docs-completeness/2026-09-27/`.
- `findings.json` not emitted (optional per `docs/audits/README.md`).
- Previous runs were not modified.
