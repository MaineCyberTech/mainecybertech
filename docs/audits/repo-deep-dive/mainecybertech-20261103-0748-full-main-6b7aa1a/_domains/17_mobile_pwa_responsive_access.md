# Mobile, PWA, and Responsive Access Audit (Re-verification)

## Audit Metadata

- Audit name: mainecybertech
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `github.com/MaineCyberTech/mainecybertech`
- Branch: `main`
- Commit SHA: `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03T09:29:24Z
- Auditor: subagent (independent re-audit; read-only)
- Area code: MOB
- Output path: `docs/audits/mainecybertech/mainecybertech-20261103-0748-full-main-6b7aa1a/17_mobile_pwa_responsive_access.md`
- Scope limitations: static analysis and test inspection; no device/browser execution, no Lighthouse run, no push-notification delivery.

## Scope

Re-verification of the 11 `MOB` findings from `mainecybertech-20261014-0033-full-main-7dd0402` against `origin/main` @ `6b7aa1a`: viewport, responsive layouts, mobile nav, touch targets, mobile forms, dialogs/tables, auth/dashboard/admin mobile, PWA manifest, service worker, offline fallback, install metadata, push, cache strategy and mobile E2E. The new client request/detail pages were checked for responsive patterns and mobile-test coverage.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `apps/web/app/layout.tsx` | Metadata | viewport/theme/icons/manifest | Re-read |
| `apps/web/app/manifest.ts` | PWA manifest | Icons/start_url/display | 192/512/maskable |
| `apps/web/public/sw.js` | Service worker | Cache policy/offline/push | Full read |
| `apps/web/components/ServiceWorkerRegistrar.tsx` | Registration | Production-only | Mounted in root layout |
| `apps/web/playwright.config.ts` | Mobile projects | Pixel 7 + iPhone 13 | testMatch mobile.spec |
| `apps/web/e2e/mobile.spec.ts` | Mobile gate | Overflow/16px/touch/dialog/SW | 12 tests |
| `packages/ui/src/styles.css` | Mobile floor | `.cyber-input` 16px | `text-base sm:text-sm` |
| New portal pages | Responsive patterns | grids + `cyber-input` | Mostly compliant |

## Verification Performed

| Check | Method | Result |
|---|---|---|
| 16px floor | Python scan of input/select/textarea tags with `text-sm`/`text-xs` | 79 matches; 3 use `.cyber-input`; **76 unprotected** |
| Mobile E2E routes | Read `mobile.spec.ts` | Public routes + dashboard + two admin dialogs only |
| Overflow exemptions | grep `fixme`/`KNOWN_OVERFLOW` | None remain |
| Manifest/icons | `file` + PNG dimension parse | ICO 16/32, apple 180×180, icons 192/512 |
| SW cache policy | Read `sw.js` | API/non-GET bypassed; no-store/private skipped |
| Touch targets | Read named controls | ≥44px hit areas |

## Executive Summary

The mobile/PWA remediation still holds. The service worker is registered (production-only) with an API-safe cache policy; the manifest has 192/512/maskable PNGs from one source; `themeColor` lives in the viewport export; a real ICO and 180×180 apple-touch-icon ship; the notification panel is viewport-anchored below `sm`; modal dialogs scroll; and Playwright runs Pixel 7 + iPhone 13 projects with overflow, 16px, touch-target, SW and offline assertions. The last open finding, `MOB-P3-006` (WebKit overflow excluded via `test.fixme`), is now **verified-fixed**: the exemptions are gone, the tests clear the authenticated cookie, wait for fonts, and log the offending elements.

One previous finding remains partial: `MOB-P2-004` still has **76 ad-hoc controls** declaring `text-sm`/`text-xs` outside `.cyber-input` (45 input + 23 select + 11 textarea), and the mobile spec still only visits `/store/quote` and `/contact` for the 16px check.

One new issue: `MOB-P3-007` — the mobile projects only run `mobile.spec.ts`, so none of the new client request/detail pages are checked at a phone viewport.

| Status | Count |
|---|---:|
| verified-fixed | 10 |
| partially-fixed | 1 (`MOB-P2-004`) |
| regressed | 0 |
| open (previous) | 0 |
| new | 1 (`MOB-P3-007`) |

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|---|---|---|---|---|---|
| Viewport/meta | `app/layout.tsx:37-41` | theme + viewport | Correct | — | E2E asserted |
| Manifest | `app/manifest.ts:13-38` | Installability | Correct | — | PNG + maskable |
| SW | `public/sw.js` | Offline/static cache | Correct | Low | No API caching |
| Registrar | `ServiceWorkerRegistrar.tsx` | Register SW | Production only | — | Mounted |
| Mobile gate | `e2e/mobile.spec.ts` | 12 tests | Green scope | Medium | New flows absent |
| Form floor | `styles.css:72-74` | iOS zoom | Partial | Medium | 76 ad-hoc controls |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Viewport | 5 | `viewport` export + meta assertion | — | Keep |
| Responsive layouts | 4 | sm/md/lg grids | New flows untested | MOB-P3-007 |
| Mobile nav | 4 | drawer + Escape + aria-expanded | — | Keep |
| Touch targets | 4 | ≥44px named controls | — | Keep |
| Mobile forms | 3 | `.cyber-input` floor | 76 ad-hoc controls | MOB-P2-004 |
| Mobile dialogs/tables | 4 | Dialog max-h + E2E | — | Keep |
| Auth/dashboard/admin mobile | 4 | Responsive shells | New detail pages uncovered | MOB-P3-007 |
| PWA manifest | 5 | 192/512/maskable | — | Keep |
| Service worker | 5 | API-safe policy | — | Keep |
| Offline fallback | 4 | Precached offline HTML | Not exercised offline | Add E2E |
| Install prompt | 4 | Manifest + icons | No custom prompt | Optional |
| Push notifications | 4 | SW push + deep link | Delivery unproven | Operator test |

## Detailed Review

### Item: 16px form floor

- Evidence: `.cyber-input` is `text-base sm:text-sm` (`packages/ui/src/styles.css:72-74`). The scan of 557 tsx finds 79 controls with `text-sm`/`text-xs`; only 3 also use `cyber-input`. 76 remain unprotected.
- Impact: iOS Safari zooms the page on focus for those controls, mostly admin and some portal pages. The mobile spec cannot catch them because it only visits two public forms.
- Recommendation: replace `text-sm` with `text-base sm:text-sm` on form controls or add a global `@media (max-width: 639px)` rule for `input, select, textarea`; extend the spec to one admin route.

### Item: Mobile coverage of new flows

- Evidence: `playwright.config.ts:45-66` sets `testMatch: /mobile\.spec\.ts/` for both mobile projects; `mobile.spec.ts` visits four public routes and `/portal/dashboard` plus two admin store dialogs.
- Impact: the new approvals/change-request/DNS/identity/insurance/offboarding create and detail pages have no phone-viewport assertion.

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|---|---|---|---|---|---|---|
| MOB-001 | Viewport | `layout.tsx:37-41` | Correct | — | — | Keep |
| MOB-002 | Responsive layouts | Tailwind grids | Present | New flows untested | P3 | MOB-P3-007 |
| MOB-003 | Mobile nav | drawers | Escape + aria | — | — | Keep |
| MOB-004 | Touch targets | p-3/p-3.5 | ≥44px | — | — | Keep |
| MOB-005 | Mobile forms | `cyber-input` | 16px floor | 76 ad-hoc | P2 | MOB-P2-004 |
| MOB-006 | Dialogs/tables | Dialog | Scroll | — | — | Keep |
| MOB-007 | Auth/dashboard/admin | layouts | Responsive | New detail pages | P3 | MOB-P3-007 |
| MOB-008 | PWA manifest | `manifest.ts` | PNG + maskable | — | — | Keep |
| MOB-009 | Service worker | `sw.js` | Safe policy | — | — | Keep |
| MOB-010 | Offline fallback | `sw.js` + E2E | Precached | Not exercised offline | P3 | Add E2E |
| MOB-011 | Install prompt | manifest | Installable | No prompt | — | Optional |
| MOB-012 | Push | `sw.js` push | Deep-link safe | Delivery unproven | P3 | Operator test |

## Findings

### Re-verification of previous findings

| ID | Sev | Previous status | Re-verified status | Evidence at 6b7aa1a |
|---|---|---|---|---|
| MOB-P2-001 | P2 | verified-fixed | verified-fixed | `ServiceWorkerRegistrar.tsx:17-28`; `layout.tsx:59`; `mobile.spec.ts:245-300` |
| MOB-P2-002 | P2 | verified-fixed | verified-fixed | `sw.js:110-200`; no API/non-GET caching; `next.config.mjs:31-39` |
| MOB-P2-003 | P2 | verified-fixed | verified-fixed | `playwright.config.ts:45-66`; `e2e.yml:67-72` |
| MOB-P2-004 | P2 | partially-fixed | partially-fixed | **76** unprotected `text-sm/xs` controls; spec checks only `/store/quote` + `/contact` |
| MOB-P2-005 | P2 | verified-fixed | verified-fixed | `Dialog.tsx:116`; 0 scroll-less modals; `mobile.spec.ts:302-340` |
| MOB-P3-001 | P3 | verified-fixed | verified-fixed | `manifest.ts:13-38`; icons 192/512/512 |
| MOB-P3-002 | P3 | verified-fixed | verified-fixed | p-3/p-3.5 hit areas; `mobile.spec.ts:220-243` |
| MOB-P3-003 | P3 | verified-fixed | verified-fixed | `NotificationBell.tsx:311-314`; `mobile.spec.ts:199-218` |
| MOB-P3-004 | P3 | verified-fixed | verified-fixed | `layout.tsx:37-41`; `mobile.spec.ts:148-152` |
| MOB-P3-005 | P3 | verified-fixed | verified-fixed | ICO magic bytes; 180×180 apple icon; `mobile.spec.ts:154-196` |
| MOB-P3-006 | P3 | open | verified-fixed | `KNOWN_OVERFLOW_ROUTES`/`test.fixme` removed; `mobile.spec.ts:90-124` enforces every route |

### Finding ID: MOB-P2-004 — About 41% of form controls render below 16px and trigger iOS Safari focus zoom (partial)

- Severity: P2
- Confidence: High
- Area: MOB
- Evidence:
  - `.cyber-input` floor: `packages/ui/src/styles.css:72-74` (`text-base sm:text-sm`)
  - Public funnels: `QuoteBuilderClient.tsx`, `IntakeFormRenderer.tsx` use `text-base sm:text-sm`
  - 76 unprotected controls, e.g. `apps/web/app/(admin)/admin/dmarc-coach/DmarcAnalyzeForm.tsx:39-73` (5 inputs), `apps/web/app/(admin)/admin/store/promotions/PromoForm.tsx:108-250` (9), `apps/web/app/(admin)/admin/proposals/new/ProposalForm.tsx:26-73` (5), `apps/web/app/(admin)/admin/qbr/new/QbrGenerateForm.tsx:26-73` (5), `apps/web/app/(admin)/admin/store/products/page.tsx:127-149` (3), `apps/web/app/(portal)/portal/client-knowledge-base/page.tsx:83-102` (3)
  - Mobile spec coverage: `apps/web/e2e/mobile.spec.ts:128-146` only `/store/quote` and `/contact`
- What is happening: ad-hoc controls declare `text-sm`/`text-xs` and are not `.cyber-input`, so the 16px mobile floor does not apply.
- Why it matters: iOS Safari zooms on focus below 16px, breaking layout and requiring a manual zoom-out.
- User / business impact: admin and some portal forms are harder to use on a phone.
- Security / privacy / reliability impact: none.
- Recommended fix: use `text-base sm:text-sm` on all form controls, or add a global `@media (max-width: 639px)` font-size rule; extend the mobile spec to one admin route.
- Suggested validation: extend `expectNoControlBelow16px` to `/admin/qbr/new` and `/portal/client-knowledge-base`; CI mobile project.
- Owner suggestion: @web
- Effort estimate: M (mechanical)
- Dependencies: none
- Status: partially-fixed

### Finding ID: MOB-P3-006 — Mobile-WebKit overflow exemptions removed (closed)

- Severity: P3
- Confidence: High (code), Medium (runtime)
- Area: MOB
- Evidence: `apps/web/e2e/mobile.spec.ts:90-124` — no `KNOWN_OVERFLOW_ROUTES`, no `test.fixme`; each public-route test clears cookies, waits for `document.fonts.ready`, asserts `scrollWidth <= innerWidth+1`, and logs offending elements via `overflowingElements()`.
- What is happening: the three previously exempted routes now run the no-overflow assertion in both mobile projects.
- Why it matters: the gate can catch a recurrence.
- Residual: the audit did not run a browser, so the actual 360px measurement is still only evidenced by the comment's 2026-10-14 deployed-build note.
- Status: verified-fixed (with runtime note)

### Finding ID: MOB-P3-007 — Mobile projects run only mobile.spec.ts, so the new request/detail flows have no phone-viewport coverage

- Severity: P3
- Confidence: High
- Area: MOB
- Evidence:
  - `apps/web/playwright.config.ts:45-66` — `mobile-chrome` and `mobile-safari` use `testMatch: /mobile\.spec\.ts/`; the desktop project ignores that file.
  - `apps/web/e2e/mobile.spec.ts` routes: `/store`, `/store/quote`, `/contact`, `/login` (`PUBLIC_ROUTES:15`), `/portal/dashboard` (`:200,231,246`), `/admin/store/promotions` (`:303`), `/admin/store/categories` (`:326`).
  - New flows absent: `apps/web/app/(portal)/portal/{approvals,change-requests,dns-changes,identity-verification,insurance-binder,offboarding,training-hub,qbr,client-knowledge-base}` — their e2e specs are desktop smoke tests only.
- What is happening: the mobile matrix does not visit any of the flows added in this window.
- Why it matters: horizontal overflow, sub-16px controls, clipped dialogs or unreachable actions on these new pages would ship undetected.
- User / business impact: mobile clients may be unable to complete a request.
- Security / privacy / reliability impact: none.
- Recommended fix: add at least one new create form and one detail page per group to the mobile no-overflow and 16px checks (e.g. `/portal/approvals/new`, `/portal/change-requests/[id]` with seeded data).
- Suggested validation: run the mobile projects against the new routes; assert no overflow + 16px.
- Owner suggestion: @web / QA
- Effort estimate: S
- Dependencies: seed data for [id] routes
- Status: open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| iOS zoom on admin/portal forms | P2 | Medium | Usability | MOB-P2-004 | 16px sweep |
| New flows broken on phones | P3 | Medium | Abandoned requests | MOB-P3-007 | Mobile coverage |
| Offline path never exercised in prod | P3 | Low | Poor offline UX | SW tests | Real offline drill |
| Push delivery unproven | P3 | Low | Silent notifications | VAPID | Operator push test |

## Recommendations

### Immediate / Release Blocking

None.

### This Week

- Extend the 16px check to one admin route and clean the highest-traffic admin forms (`MOB-P2-004`).

### This Month

- Add the new request/detail pages to the mobile project (`MOB-P3-007`).

### Later / Platform Evolution

- Add a custom install prompt (optional) and a real pushed-notification exercise.
- Keep the SW cache policy under review when new static asset types appear.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Global mobile font-size rule | Fixes 76 controls at once | `styles.css` | Mobile E2E |
| Add 2 new routes to mobile spec | Covers the new flows | `mobile.spec.ts` | CI |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| 16px control sweep | P2 | @web | M | none |
| New-flow mobile coverage | P3 | QA | S | seed data |
| Offline drill | P3 | operator | S | device |
| Push delivery test | P3 | operator | S | VAPID |

## Suggested Tests

- Mobile E2E: `/portal/approvals/new` and one `[id]` page at 360×800 — no overflow, controls ≥16px, dialog scroll.
- Offline: navigate to a new detail page, go offline, confirm the offline page.
- SW: assert Cache Storage has no `/api/` entries after visiting a new detail page.

## Suggested Documentation Updates

- `docs/WEB_UI_CONVENTIONS.md`: state the 16px form-control rule and the `text-base sm:text-sm` pattern.
- `docs/testing.md`: list the mobile routes covered by `mobile.spec.ts`.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Do the new detail pages overflow at 360px in WebKit? | Not measured | Browser run |
| Is push delivery exercised anywhere? | UI/worker exist; delivery unproven | Operator push test |

## Appendix

- 16px scan: 79 controls with `text-sm/xs`; 3 `.cyber-input`; 76 unprotected.
- Mobile projects: `mobile-chrome` Pixel 7, `mobile-safari` iPhone 13, `testMatch: /mobile\.spec\.ts/`.
- Icons: `icon-192.png` 192×192, `icon-512.png` 512×512, `icon-512-maskable.png` 512×512, apple 180×180, ICO 16/32.
