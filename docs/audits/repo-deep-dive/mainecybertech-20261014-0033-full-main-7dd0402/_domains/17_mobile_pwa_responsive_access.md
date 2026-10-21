# Mobile, PWA, and Responsive Access Audit (Re-verification)

## Audit Metadata

- Audit name: mainecybertech
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: `github.com/MaineCyberTech/mainecybertech`
- Branch: `main`
- Commit SHA: `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097`
- Generated at: 2026-10-14
- Auditor: subagent (independent re-audit; read-only)
- Area code: MOB
- Output path: `docs/audits/mainecybertech/mainecybertech-20261014-0033-full-main-7dd0402/17_mobile_pwa_responsive_access.md`
- Scope limitations: static analysis + test inspection; no device/browser execution, no Lighthouse run, no push-notification delivery.

## Scope

Re-verification of the 10 `MOB` findings from `mainecybertech-20261011-0426-full-main-8d299b8` against `origin/main` @ `7dd0402`: viewport, responsive layouts, mobile nav, touch targets, mobile forms, dialogs, PWA manifest/icons, service worker and cache strategy, offline fallback, install/theme metadata, and mobile test coverage.

## Executive Summary

The PWA/mobile remediation landed: the service worker is registered (production-only) with a rewritten, API-safe cache policy, the manifest has 192/512/maskable PNG icons from a single source, `themeColor` moved to the viewport export, a real ICO and 180px apple-touch-icon ship, notification panel/touch targets/modal scrolling were fixed, and Playwright now has Pixel 7 + iPhone 13 projects covering overflow, the 16px form floor, touch targets, SW caching, offline fallback and dialog scrolling.

Nine of ten findings are **verified-fixed**. `MOB-P2-004` is **partially-fixed**: the shared `.cyber-input` and the two public funnels now enforce the 16px mobile floor, but 82 ad-hoc controls (76 `text-sm` + 6 `text-xs`) remain — mostly admin pages — and the mobile E2E only visits `/store/quote` and `/contact`. One new issue (`MOB-P3-006`): the mobile-WebKit horizontal overflow on `/login`, `/store` and `/store/quote` is acknowledged in the spec but excluded via `test.fixme`, so the mobile no-overflow gate does not enforce those routes.

| Status | Count |
|---|---:|
| verified-fixed | 9 |
| partially-fixed | 1 (`MOB-P2-004`) |
| regressed | 0 |
| open (previous) | 0 |
| new | 1 (`MOB-P3-006`, P3) |

## Verification Results

| ID | Sev | Re-verified status | Evidence at 7dd0402 |
|---|---|---|---|
| MOB-P2-001 | P2 | verified-fixed | `ServiceWorkerRegistrar` registers `/sw.js` in production, mounted in `app/layout.tsx:59`; E2E asserts registration |
| MOB-P2-002 | P2 | verified-fixed | `sw.js` allowlists static destinations, bypasses `/api/`, respects `no-store/private`, network-first navigation with precached offline HTML; served `no-cache` (`next.config.mjs:34-39`) |
| MOB-P2-003 | P2 | verified-fixed | `mobile-chrome` (Pixel 7) + `mobile-safari` (iPhone 13) projects; `e2e.yml` installs webkit; `mobile.spec.ts` 12 tests |
| MOB-P2-004 | P2 | partially-fixed | `.cyber-input` `text-base sm:text-sm` (`styles.css:72-74`); funnels fixed (`QuoteBuilderClient.tsx:315`, `IntakeFormRenderer.tsx:153`); **82 ad-hoc controls remain below 16px** (mostly admin); E2E covers only 2 public routes |
| MOB-P2-005 | P2 | verified-fixed | shared Dialog + migrated modals have `max-h-[90vh] overflow-y-auto`; `mobile.spec.ts:259-300` asserts scroll at phone width |
| MOB-P3-001 | P3 | verified-fixed | single manifest source with 192/512/maskable PNGs (`app/manifest.ts`); duplicate public manifests deleted |
| MOB-P3-002 | P3 | verified-fixed | hamburger/close/toast/bell controls carry ≥44px hit areas; `mobile.spec.ts:177-200` asserts 44px |
| MOB-P3-003 | P3 | verified-fixed | viewport-anchored panel below `sm` (`NotificationBell.tsx:311-314`); E2E asserts no clipping |
| MOB-P3-004 | P3 | verified-fixed | `export const viewport` with `themeColor` (`layout.tsx:37-41`); E2E asserts the meta tag |
| MOB-P3-005 | P3 | verified-fixed | real multi-size ICO + 180x180 apple-touch-icon declared (`layout.tsx:26-33`); E2E asserts magic bytes |

## New Findings

### MOB-P3-006 — Mobile-WebKit horizontal overflow on three public routes is excluded from the gate (P3)

- Evidence: `apps/web/e2e/mobile.spec.ts:55-71` records `scrollWidth` 369 vs 360 on `/login`, 372 vs 360 on `/store` and `/store/quote` in mobile WebKit (Chromium passes; `/store/quote` intermittent) and calls `test.fixme` for those three, so the no-overflow assertion never runs on them.
- Impact: phones can pan horizontally on the login and storefront shell; the mobile gate cannot catch a regression there.
- Fix: close the overflow on the public marketing shell (likely a fixed-width/`min-w` element) and remove `KNOWN_OVERFLOW_ROUTES` so the mobile projects enforce all four routes.
- Note: not independently re-measured here (no browser run); evidence is the in-repo measurement and the exclusion.

## Recommendations

- **This week (MOB-P3-006):** reproduce the three overflows at 360x800 in WebKit, fix, remove the `fixme`s.
- **This month (MOB-P2-004):** sweep the remaining 82 `text-sm`/`text-xs` controls to `text-base sm:text-sm` (or add a CSS layer rule for form controls) and extend the mobile spec to one admin route.
- **Later:** add a push-subscription E2E (permission denied/granted states) and a SW update-flow check; keep the icon set generated by `scripts/generate-pwa-icons.js`.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Does iOS Safari zoom on the remaining admin forms in practice? | Prioritises the remaining `text-sm` sweep | Device test or Lighthouse mobile audit |
| Is push delivery exercised end-to-end in any environment? | The UI + worker exist; delivery is unproven | Operator push test with VAPID configured |
