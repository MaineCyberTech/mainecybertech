# UI/UX, Design System, and Accessibility Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: `20260806-1722-develop-75d3926`
- Repository: `C:\temp\mainecybertech-portal`
- Branch: `develop`
- Commit SHA: `75d39269310fcc09826fe532d5838d3a53d1739a` (short: `75d3926`)
- Generated at: 2026-08-06 17:41 (local)
- Auditor: Principal-level repository auditor (automated evidence pass)
- Area code: UX
- Output path: `prompts/repo-deep-dive/20260806-1722-develop-75d3926/05_ui_ux_accessibility_audit.md`
- Scope limitations: Static source inspection + config/CI review only. No browser rendering, no axe-core execution, no pixel comparison, no visual regression screenshots in this pass. Contrast ratios below are computed from token values, not measured on rendered DOM. E2E a11y scan (`apps/web/e2e/a11y.spec.ts`) exists but was not re-executed.

## Scope

Reviewed: design tokens (`packages/ui/src/tokens/`), Tailwind config (`apps/web/tailwind.config.ts`), reusable components (EmptyState, SidebarShell, sidebars, subnavs, store components), layouts/nav (admin + portal + public), forms/dialogs/toasts (native `alert()` and bespoke toast implementations), icons/color/typography/spacing, focus states, keyboard nav, ARIA, semantic HTML, responsive breakpoints, dark mode, skeletons/errors/empty states, Storybook config + stories, a11y E2E test, PWA manifest, page metadata/title coverage (301 `page.tsx` files), loading/error boundaries.

Not reviewed: rendered-DOM contrast measurements, real-device responsive testing, browser console errors, Lighthouse performance, i18n.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |
| `packages/ui/src/tokens/colors.ts`, `typography.ts`, `spacing.ts`, `borders.ts`, `shadows.ts`, `motion.ts`, `focus.ts`, `semantic-colors.ts` | Source | Design tokens | Slate/cyber/emerald/amber/red scales; focus tokens file present |
| `apps/web/tailwind.config.ts` | Config | Theme wiring + WCAG slate overrides | Extends tokens; overrides slate 400/500/600 (`#c7d3e0`/`#94a3b8`/`#7a8ba0`) |
| `apps/web/app/globals.css` | Source | CSS base | Dark-only theme (`cyber-page-bg`), 0 `dark:` usages, 0 `prefers-color-scheme` |
| `apps/web/app/layout.tsx` | Source | Root layout | `html lang="en"`, skip-link, Inter+Orbitron fonts, manifest ref |
| `apps/web/app/manifest.ts` | Source | PWA manifest | Generates `/manifest.webmanifest`; referenced in root layout |
| `apps/web/components/EmptyState.tsx` | Component | Empty states | Emoji→lucide icon map (47 mappings), aria-hidden icon container, action link/button |
| `apps/web/components/layout/SidebarShell.tsx` | Component | Mobile drawer | `role="dialog" aria-modal`, backdrop close, popstate close; NO Esc/focus-trap/focus-restore |
| `apps/web/components/admin/AdminSidebarContent.tsx` | Component | Admin nav a11y | Keyboard nav (ArrowDown/Escape), aria-expanded/controls/haspopup, permission-filtered, auto-expand active group, loading skeleton |
| `apps/web/components/portal/PortalSidebarContent.tsx` | Component | Portal nav a11y | Same keyboard/aria patterns (326 lines) |
| `apps/web/components/admin/AdminSubnav.tsx`, `apps/web/components/portal/PortalSubnav.tsx` | Component | Subnav | Present in both portals |
| `apps/web/app/(public)/login/page.tsx` | Page | Form a11y | `label htmlFor` pairs + `aria-label`, `<h1>` present, JSX `<title>` |
| `apps/web/app/**/page.tsx` (301 files) | Pages | Metadata/title coverage | 10 pages lack `metadata` export; 5 of those lack any title |
| `apps/web/app/(admin)/admin/loading.tsx` + 25 more `loading.tsx` | Pages | Skeletons | 26 loading files across route groups/sections |
| `apps/web/app/(admin)/error.tsx`, `(portal)/error.tsx`, `(public)/error.tsx` | Pages | Error boundaries | 3 route-group boundaries |
| `.storybook/main.ts`, `.storybook/preview.tsx` | Config | Storybook | `staticDirs: ["../apps/web/public"]`, 8.6.18 deps, a11y addon |
| `packages/ui/src/components/*.stories.tsx` (7 files) | Tests | Story coverage | Only UI package has stories; 0 stories in `apps/web/components` |
| `.github/workflows/chromatic.yml` | CI | Visual tests | Path-scoped to `packages/ui/**`, `continue-on-error` on build + upload |
| `apps/web/e2e/a11y.spec.ts` | E2E | A11y scan | axe-core wcag2a/2aa/21a/21aa on 4 pages; only critical/serious fail |
| `apps/web/e2e/public-store.spec.ts` | E2E | Store UI | 10 tests (home, product detail, quiz, quote builder) |
| `apps/web/components/{admin,portal}/*Client.tsx` (5 toast impls + 4 native `alert()`) | Source | Toast/feedback | No shared toast component |
| `apps/web/components/store/*` (17 files), `apps/web/lib/catalog/*` (12 files) | Source | Webstore UI | 245-product catalog, 28 JSON data files |
| `apps/web/app/(public)/store/**` (9 pages + layout), `apps/web/app/(admin)/admin/store/**` (33 pages) | Pages | Store UI surface | Public store + admin store center |

## Executive Summary

The MCT portal presents a mature, dark-first design system with tokenized color/typography/spacing (via `@mct/ui`), deliberate WCAG AA contrast overrides in the Tailwind config, strong keyboard navigation in both portal sidebars, `lang="en"` + skip-link in the root layout, a PWA manifest, labeled forms, and a lightweight axe-core E2E gate on 4 key pages. The 301-page surface is almost entirely covered by meaningful titles (291/301 pages render a title via `metadata` or JSX `<title>`), and skeletons/error boundaries exist at every route group.

The main gaps are consistency rather than absence: (1) the mobile drawer in `SidebarShell` has no Escape key, focus trap, or focus restore — the one notable keyboard-a11y hole; (2) page titles are split between the canonical `metadata` export (291 pages) and legacy JSX `<title>` (5 auth pages), and 5 pages have no title at all (`test-accounts`, `upload/[token]` are real pages; 3 admin redirect stubs are acceptable); (3) feedback UX is fragmented — 5 bespoke toast implementations and 4 native `alert()` calls, no shared component; (4) Storybook contains 0 web-app stories (7 in `@mct/ui` only) and Chromatic only watches `packages/ui`; (5) the a11y E2E gate ignores non-critical/serious violations and scans only 4 pages; (6) dark mode is not implemented (dark-only by design — should be documented as a decision).

Recommended next actions: add Esc/focus management to `SidebarShell`, migrate JSX `<title>` pages and add titles to `test-accounts` + `upload/[token]`, consolidate toasts into one shared component, seed a few high-traffic web app stories and widen the a11y scan.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
| ---- | ------------- | ------- | ------------- | ---- | ----- |
| Design tokens | `packages/ui/src/tokens/colors.ts` | Color scales | Implemented | Low | Cyber base `#0A1118`, accent `#059669` |
| Tailwind theme | `apps/web/tailwind.config.ts` | Token wiring | Implemented | Low | Slate 400/500/600 WCAG overrides verified |
| Typography | `packages/ui/src/tokens/typography.ts` + `layout.tsx` | Inter/Orbitron | Implemented | Low | CSS variables + `next/font` |
| Empty states | `apps/web/components/EmptyState.tsx` | Empty/error visuals | Implemented (lucide) | Low | 47 emoji→lucide mappings |
| Sidebar shell | `apps/web/components/layout/SidebarShell.tsx` | Mobile/desktop layout | Implemented | Medium | No Esc/focus trap/restore in drawer |
| Sidebar nav | `AdminSidebarContent.tsx` / `PortalSidebarContent.tsx` | Nav a11y | Implemented | Low | ArrowDown/Escape, aria-expanded/controls; no `aria-current="page"` |
| Subnavs | `AdminSubnav.tsx` / `PortalSubnav.tsx` | Secondary nav | Implemented | Low | Renders per-section links |
| Toasts | 5 bespoke `useState<Toast[]>` impls + 4 `alert()` | User feedback | Fragmented | Medium | No shared toast component |
| Forms | login/signup/forgot/reset + module forms | Data entry | Implemented | Low | `label htmlFor` + aria-labels verified |
| Focus states | `focus.ts` tokens, skip-link, `focus-visible` classes | Keyboard visibility | Partially implemented | Medium | Skip-link present; drawer no focus mgmt |
| Keyboard nav | Sidebar buttons/flyouts | Navigability | Implemented | Low | Arrow/Escape in sidebars; drawer gap |
| ARIA | `aria-expanded/controls/haspopup`, `role=dialog`, labels | Screen-reader support | Implemented | Medium | No `aria-current="page"`; a11y gate filters to critical/serious |
| Semantic HTML | `nav/main/aside/header`, `html lang` | Structure | Implemented | Low | Consistent |
| Responsive | sm 332 / md 137 / lg 114 / xl 39 class usages | Breakpoints | Implemented | Low | Mobile drawer + desktop sidebar |
| Dark mode | — | Theme switching | Absent (by design) | Low | 0 `dark:` usages; dark-only theme |
| Skeletons | 26 `loading.tsx` | Loading states | Implemented | Low | Root per route group + sections |
| Error boundaries | 3 `error.tsx` + root `not-found.tsx` | Failure UX | Implemented | Low | Per route group |
| Storybook | `.storybook/main.ts`, 7 stories | Component docs | Partial | Medium | 0 web app stories; Chromatic scoped to `packages/ui` |
| A11y E2E | `apps/web/e2e/a11y.spec.ts` | Regression gate | Implemented | Medium | 4 pages; critical/serious only |
| PWA manifest | `apps/web/app/manifest.ts` | PWA metadata | Implemented | Low | Referenced in root layout |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
| -------- | ----: | -------- | --- | ------------------ |
| Design tokens | 4 | `packages/ui/src/tokens/*` (10 files), consumed by tailwind config | Some inline hex literals remain in pages/components (e.g., `bg-[#0A1118]/60`) | Migrate inline hex to semantic tokens |
| CSS/Tailwind/theme | 4 | `tailwind.config.ts` + `globals.css` token-driven | Dark-only; no `prefers-color-scheme` | Document dark-only as ADR; add tokens for remaining inline hex |
| Reusable components | 4 | EmptyState, SidebarShell, subnavs, `lib/module-config.ts`, ModuleDetailPage | Toast/feedback not shared | Build shared `ToastProvider`/`useToast` |
| Layouts/nav | 4 | SidebarShell + permission-filtered sidebars | Drawer focus management | Esc + focus trap + restore |
| Forms/dialogs/toasts/tables/cards | 3 | Labeled forms; 5 bespoke toasts + 4 `alert()` | No shared dialog/toast standards | Consolidate toast system |
| Icons/color/typography/spacing | 4 | lucide-react everywhere; Inter/Orbitron; token spacing | EmptyState emoji-keyed map is fragile | Type-safe icon key union |
| Focus states | 3 | Skip-link, focus tokens, `focus-visible` | Drawer no focus trap/return | Add focus management to drawer |
| Keyboard nav | 4 | Sidebar ArrowDown/Escape, buttons | Mobile drawer lacks Esc | Add Esc close |
| ARIA | 3 | Labels, expanded/controls/haspopup, dialog role | No `aria-current="page"`; a11y gate lenient | Add aria-current; enforce all WCAG violations |
| Semantic HTML | 4 | nav/main/aside, `lang="en"`, heading hierarchy | Minor | — |
| Responsive breakpoints | 4 | sm/md/lg/xl usages (332/137/114/39) | Not device-tested | Add mobile viewport E2E |
| Dark mode | 2 | 0 `dark:` classes, no toggle | Not implemented (by design) | Document decision; note as N/A for dark-only product |

## Detailed Review

### Item: Design tokens (`packages/ui/src/tokens/`)

- Evidence: `colors.ts`, `typography.ts`, `spacing.ts`, `borders.ts`, `shadows.ts`, `motion.ts`, `focus.ts`, `semantic-colors.ts`
- What it does: Single source of color/type/spacing/border/shadow/motion tokens consumed by `apps/web/tailwind.config.ts` (`cyber`, `slate`, `emerald`, `amber`, `red`, `fontFamily`, `spacing`, `borderRadius`, `borderWidth`, `boxShadow`, `transitionDuration`).
- How it appears to work: Tailwind `extend` merges tokens; pages use `text-slate-400`, `bg-emerald-600`, `font-orbitron`, etc.
- Dependencies: `@mct/ui` workspace package.
- Current controls: Token files + tailwind mapping; `focus.ts` exists (focus ring tokens).
- Missing controls: Inline hex literals still common in page JSX (e.g. `bg-[#0A1118]/60`, `bg-[#0F172A]`, `#071018` in EmptyState) — bypasses the token layer.
- Risks: Style drift; a future theme change misses hardcoded values.
- Recommended improvement: Migrate recurring hex values to `@mct/ui` semantic tokens (`cyber.card`, `cyber.base` already exist).
- Suggested tests: ESLint rule (e.g. `no-restricted-syntax` on `#0A1118|#0F172A|#071018` in className literals).
- Suggested docs: `docs/design-tokens.md` listing token names + usage.

### Item: WCAG contrast overrides

- Evidence: `apps/web/tailwind.config.ts:22-27` — slate 400 `#c7d3e0`, 500 `#94a3b8`, 600 `#7a8ba0`.
- What it does: Lightens the default slate scale so body/muted text on `#0A1118` clears AA.
- How it appears to work: Computed contrast vs `#0A1118` (L≈0.004): slate-400 ≈ 12.6:1, slate-500 ≈ 5.4:1, slate-600 ≈ 4.4:1 — all ≥ 4.5:1 AA for normal text.
- Dependencies: Token base slate.
- Current controls: Config-level overrides.
- Missing controls: No automated contrast check in CI; axe-core gate is critical/serious-only.
- Risks: New components using raw `text-slate-500` outside the override scope regress contrast.
- Recommended improvement: Keep overrides documented; add `@axe-core/playwright` contrast check (axe `color-contrast` is a serious violation, so it IS caught by the current gate).
- Suggested tests: Expand `a11y.spec.ts` pages list.
- Suggested docs: Note in a design-system doc.

### Item: Sidebar navigation keyboard support

- Evidence: `AdminSidebarContent.tsx` (`handleGroupKeyDown` ArrowDown opens flyout + focuses first link, Escape returns focus to group button; `aria-expanded`, `aria-controls`, `aria-haspopup`; auto-expands group of current route; permission-filtered items) and `PortalSidebarContent.tsx` (same pattern, 326 lines).
- What it does: Fully keyboard-operable grouped flyout nav for both portals.
- How it appears to work: Tab to group button → ArrowDown → focus first item; Escape → back to button.
- Dependencies: `usePermissions` hook (server-seeded permissions, 60s cache).
- Current controls: Keyboard handlers + ARIA states; loading skeleton while permissions load.
- Missing controls: `aria-current="page"` on active links; no Home/End navigation; flyout uses `setTimeout` focus (0ms) — acceptable but not ideal.
- Risks: Low.
- Recommended improvement: Add `aria-current="page"` to active link; consider roving tabindex.
- Suggested tests: jest tests already cover permission filtering; add keydown simulation tests (ArrowDown/Escape).
- Suggested docs: a11y note in `docs/ADMIN_FEATURES.md`.

### Item: Mobile drawer (`SidebarShell.tsx`)

- Evidence: `apps/web/components/layout/SidebarShell.tsx` — toggle button with `aria-label`, drawer `role="dialog" aria-modal="true"`, backdrop click closes, `popstate` closes, close button `aria-label="Close menu"`, content click closes.
- What it does: Mobile left-sidebar drawer.
- How it appears to work: Open via fixed hamburger; overlay + panel; closes on backdrop/close button/navigation/popstate.
- Dependencies: `useState`/`useEffect` in client component.
- Current controls: ARIA dialog semantics, labels.
- Missing controls: **No Escape key handler, no focus trap, no focus restore to the toggle button, no initial focus into the dialog.** Also no `aria-labelledby` for the dialog.
- Risks: Keyboard users cannot dismiss the drawer with Escape; focus leaks behind the overlay (screen readers can navigate the page behind `aria-modal`).
- Recommended improvement: Add `onKeyDown` Escape on the dialog container, focus the close button on open, restore focus on close, add `aria-labelledby` pointing at the header text.
- Suggested tests: E2E keyboard test on mobile viewport (open drawer → Escape → closed; focus returned).
- Suggested docs: —.

### Item: Feedback / toast consistency

- Evidence: `AdminDocumentsCenterClient.tsx` (toast list + `toastClass`), `PortalDocumentsCenterClient.tsx`, `ProjectTaskListV5.tsx`, `RolePermissionsEditor.tsx`, `UserPermissionOverridesClient.tsx` (5 local `Toast[]` implementations); native `alert()` in `TriageAnalyzeClient.tsx`, `NewWebhookForm.tsx`, `AdminTicketCenterClient.tsx`, `AdminApiKeysClient.tsx`.
- What it does: Success/error feedback after mutations.
- How it appears to work: Each client component manages its own toast state with different shapes/timings (2.6s, 5s, none).
- Dependencies: none shared.
- Current controls: Local state.
- Missing controls: No shared `ToastProvider`/`useToast`; native `alert()` blocks the main thread and is unstylable.
- Risks: Inconsistent UX; `alert()` in admin flows is jarring; duplicated ~100 lines of toast code per component.
- Recommended improvement: Extract a shared toast component (`components/ui/Toast.tsx` + context) and replace the 5 implementations and 4 `alert()` calls.
- Suggested tests: Component tests for the shared toast (auto-dismiss, tones, stacking).
- Suggested docs: `docs/design-system.md`.

### Item: Page titles / metadata

- Evidence: 301 `page.tsx` files; 291 include `metadata` or JSX `<title>`; 10 lack the `metadata` export. 5 of those 10 have JSX `<title>` (login, signup, forgot-password, pending, password-reset); 5 have NO title at all (`security-ops`, `security-suite`, `vendors` — redirect-only stubs; `test-accounts`, `upload/[token]` — real pages).
- What it does: Per-page document titles.
- How it appears to work: Canonical `export const metadata` on most pages; legacy `<title>` JSX on auth pages.
- Dependencies: `app/layout.tsx` default title as fallback.
- Current controls: Root layout default metadata.
- Missing controls: `test-accounts` and `upload/[token]` have no title (browser tab shows app default); 5 auth pages use non-canonical `<title>` (works in App Router but is the legacy pattern; also `metadata` would enable `generateMetadata` extensions later).
- Risks: Low severity; SEO/document semantics.
- Recommended improvement: Add `export const metadata = { title: ... }` to `test-accounts` and `upload/[token]`; convert the 5 JSX `<title>` pages to metadata exports.
- Suggested tests: Add a CI check that every `page.tsx` contains `metadata`/`generateMetadata`/`<title>`.
- Suggested docs: Note AGENTS.md claim "all 242 pages titled" is stale (301 pages now).

### Item: Skeletons, errors, empty states

- Evidence: 26 `loading.tsx` (admin root + 20 sections, portal root + 4, public root), 3 `error.tsx` route groups, `not-found.tsx`, `EmptyState.tsx` (lucide icons, 47 emoji→icon mappings, action/CTA support).
- What it does: Loading/error/empty UX.
- How it appears to work: Route-group boundaries + section-level skeletons; error boundaries with retry; EmptyState used widely.
- Dependencies: —.
- Current controls: Boundaries exist at all 3 route groups.
- Missing controls: `EmptyState` icon keyed by emoji string (`icon="📋"`) with silent fallback to ClipboardList — fragile when a new emoji is passed; no TS enforcement.
- Risks: Low.
- Recommended improvement: Type the icon prop as a lucide icon component or a `LucideIcon` key union.
- Suggested tests: Unit test that unknown icon falls back (already covered by suite if present).
- Suggested docs: —.

### Item: Storybook & visual regression

- Evidence: `.storybook/main.ts` (stories globs `../apps/web/components/**/*.stories.*` + `../packages/ui/src/**/*.stories.*`, addons incl. `@storybook/addon-a11y`, `staticDirs: ["../apps/web/public"]`, webpack alias `@mct/ui` → `packages/ui/src`); 7 `.stories.tsx` files — all in `packages/ui`; **0 stories in `apps/web/components`**. Chromatic workflow path-filtered to `packages/ui/**`, `continue-on-error: true` on both build and upload.
- What it does: Component documentation + optional visual regression.
- How it appears to work: Storybook runs at root; build outputs `docs/storybook-static` (gitignored).
- Dependencies: `storybook`/`@storybook/*` 8.6.18 aligned.
- Current controls: Version alignment (all 8.6.18), a11y addon, staticDirs correct, Chromatic non-blocking by design (known Next/Storybook webpack conflict).
- Missing controls: No web-app stories; Chromatic never gates web components; `docs/storybook-static` in repo dir could confuse docs consumers.
- Risks: Visual regressions in the 301 web pages are undetected (only E2E textual assertions cover them).
- Recommended improvement: Add 10-15 high-value web stories (LoginCard, TicketTable, EmptyState, SidebarShell, store ProductCard); consider a screenshot-diff job in CI that doesn't depend on Chromatic.
- Suggested tests: CI storybook build already in `chromatic.yml`; add a "web stories compile" check.
- Suggested docs: `docs/storybook.md` describing story conventions.

### Item: A11y E2E gate

- Evidence: `apps/web/e2e/a11y.spec.ts` — axe-core `wcag2a/wcag2aa/wcag21a/wcag21aa` on `/login`, `/store`, `/portal/dashboard`, `/admin`; fails only on `impact === "critical" || "serious"`.
- What it does: CI accessibility smoke gate (runs inside `e2e.yml`).
- How it appears to work: 4 pages scanned; violations filtered to critical/serious.
- Dependencies: `@axe-core/playwright` 4.12.1.
- Current controls: WCAG A/AA tag scan on 4 pages.
- Missing controls: Only 4 of ~301 pages; minor/moderate violations (e.g., `aria-prohibited-attr`, `landmark-unique`, `heading-order` moderate) never fail CI; no `color-contrast` enforcement outside those pages (axe marks contrast as serious — so it IS enforced on the 4 scanned pages).
- Risks: Regression on any unscanned page (e.g., all module detail pages) is undetected.
- Recommended improvement: Extend scan to representative module pages (ticket detail, project detail, a store product page, an auth page) and treat all violations except `best-practice` tags as failures.
- Suggested tests: Already E2E; add pages.
- Suggested docs: —.

### Item: Dark mode

- Evidence: 0 `dark:` class usages across all web TS/TSX/CSS; no theme toggle; `globals.css` sets dark-only background variables.
- What it does: N/A — product is dark-only by design.
- How it appears to work: Single theme.
- Dependencies: —.
- Current controls: None needed.
- Missing controls: No documented ADR stating dark-only intent (a future contributor may add light mode and break contrast work).
- Risks: Low.
- Recommended improvement: Add a 2-line ADR (dark-only theme, contrast overrides maintained in tailwind config).
- Suggested tests: None.
- Suggested docs: `docs/adr/0008-dark-only-theme.md`.

### Item: Webstore UI surface

- Evidence: Public store 9 pages (`page`, `[slug]`, `category/[slug]`, `compare`, `compare/[slug]`, `promotions`, `quiz`, `quote` + `layout.tsx`), admin store center 33 pages (products/[id], promotions, quotes, analytics, bundles, campaigns, leads, lifecycle, etc.), 17 store components (`StoreProductCard`, `StoreCategoryCard`, `ServiceFinderQuiz`, `QuoteBuilderClient`, `PackageLadder`, `TrustBadgeList`, `CampaignBanner`, `FAQSection`, ...), 12 catalog lib modules, 28 JSON data files, 245 products, `StoreSidebar.tsx`.
- What it does: Public commerce storefront + admin commerce operations center.
- How it appears to work: Static catalog (shared web/API JSON), quote intake, quiz, comparisons.
- Dependencies: catalog data layer + validation pipeline.
- Current controls: Unit tests (13 store test files + 8 catalog lib test files), E2E (`public-store.spec.ts` 10 tests), API tests (`store-catalog.test.ts` incl. 245-product assertion), SDK module (12 methods) — but SDK store methods have **0 SDK tests**.
- Missing controls: SDK `StoreApi` untested; `store-campaigns` module has no API (known gap per AGENTS.md); admin store pages mostly thin shells over static data.
- Risks: Medium — catalog is static JSON; any DB-backed flows (promotions/quotes) rely on API tests.
- Recommended improvement: Add SDK tests for `StoreApi` (listProducts/getProduct/submitQuote); verify quote submission path E2E (currently only validation error is tested).
- Suggested tests: SDK store method tests with mocked fetch.
- Suggested docs: `docs/modules/store.md` exists (75 module docs total).

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
| -- | ------------------- | -------- | --------------- | --- | -------- | -------------- |
| UX-001 | Design tokens | `packages/ui/src/tokens/*` | Token layer + tailwind extend | Inline hex literals in JSX | P3 | Migrate to tokens |
| UX-002 | CSS/Tailwind/theme | `tailwind.config.ts`, `globals.css` | Token-driven theme | Dark-only undoc'd | P3 | ADR for dark-only |
| UX-003 | Reusable components | EmptyState, SidebarShell, subnavs, module-config | Strong reuse | Toasts not shared | P2 | Shared ToastProvider |
| UX-004 | Layouts/nav | SidebarShell + sidebars | Keyboard nav + permission filtering | Drawer focus mgmt; aria-current | P2 | Esc/focus trap/restore |
| UX-005 | Forms/dialogs/toasts/tables/cards | login form, 5 toast impls, 4 alert() | Labeled forms | No dialog/toast standard; native alert() | P2 | Shared toast + dialog |
| UX-006 | Icons/color/typography/spacing | lucide + tokens | Consistent | EmptyState emoji keys | P3 | Typed icon props |
| UX-007 | Focus states | focus.ts, skip-link | Skip link + focus tokens | Drawer focus | P2 | Focus management |
| UX-008 | Keyboard nav | sidebar handlers | ArrowDown/Escape | Drawer lacks Esc | P2 | Esc close |
| UX-009 | ARIA | labels/expanded/dialog | Broad coverage | No aria-current; lenient a11y gate | P3 | aria-current + full WCAG gate |
| UX-010 | Semantic HTML | nav/main/aside/lang | Solid | Minor | P3 | — |
| UX-011 | Responsive breakpoints | sm/md/lg/xl usage | Mobile drawer + desktop sidebar | No mobile E2E viewport tests | P3 | Add viewport E2E |
| UX-012 | Dark mode | 0 `dark:` usages | Dark-only by design | No ADR | P3 | ADR |

## Findings

### Finding ID: UX-P2-001 - Mobile drawer in SidebarShell lacks Escape close, focus trap, and focus restore

- Severity: P2
- Confidence: High
- Area: Keyboard navigation / focus states / ARIA
- Evidence:
  - `apps/web/components/layout/SidebarShell.tsx` (75 lines) — drawer rendered as `role="dialog" aria-modal="true"` with no `onKeyDown`, no focus management; closes only via backdrop click, close button, nav-item click, or `popstate`
  - `AdminSidebarContent.tsx`/`PortalSidebarContent.tsx` — desktop nav has full keyboard support, but the mobile drawer wraps it
- What is happening: On mobile, opening the drawer leaves focus on the hamburger toggle; no Escape handling; no focus trap; focus is not restored when the drawer closes; the dialog has no `aria-labelledby`.
- Why it matters: Keyboard-only and screen-reader users on mobile viewports cannot dismiss the drawer predictably, and focus can land behind the `aria-modal` overlay.
- User / business impact: A11y compliance risk (WCAG 2.1.2 Keyboard, 2.4.3 Focus Order) on every portal/admin page rendered inside SidebarShell on mobile.
- Security / privacy / reliability impact: None.
- Recommended fix: Add `onKeyDown` Escape close on the dialog container; focus the close button on open; restore focus to the toggle on close; add `aria-labelledby` to the dialog header.
- Suggested validation: Manual keyboard walkthrough at 375px viewport; Playwright test (open drawer, press Escape, assert closed + focus on toggle).
- Owner suggestion: Frontend engineer.
- Effort estimate: 2-4 hours.
- Dependencies: None.
- Status: Open.

### Finding ID: UX-P2-002 - Fragmented feedback UX: 5 bespoke toast implementations and 4 native alert() calls

- Severity: P2
- Confidence: High
- Area: Forms/dialogs/toasts, reusable components
- Evidence:
  - Local `Toast[]` state + render in `AdminDocumentsCenterClient.tsx` (~300/480 lines), `PortalDocumentsCenterClient.tsx:73,171`, `ProjectTaskListV5.tsx:150,244`, `RolePermissionsEditor.tsx:83,167`, `UserPermissionOverridesClient.tsx:43,147`
  - Native `alert()` in `TriageAnalyzeClient.tsx:81`, `NewWebhookForm.tsx:25,37`, `AdminTicketCenterClient.tsx:328`, `AdminApiKeysClient.tsx:98`
- What is happening: Five near-identical toast implementations with different timing (2.6s vs 5s) and shapes, plus blocking `alert()` dialogs in admin flows.
- Why it matters: Inconsistent UX, duplicated code (~100+ lines per component), `alert()` is unstylable and disruptive; makes the app feel unpolished and complicates maintenance.
- User / business impact: Inconsistent success/error feedback across admin and portal.
- Security / privacy / reliability impact: None.
- Recommended fix: Extract a shared `ToastProvider` + `useToast` in `components/ui/`, migrate the 5 implementations, replace `alert()` calls.
- Suggested validation: Unit tests for toast lifecycle; grep for `alert(` returning 0 after migration.
- Owner suggestion: Frontend engineer.
- Effort estimate: 1-2 days.
- Dependencies: None.
- Status: Open.

### Finding ID: UX-P2-003 - 10 pages lack metadata export; 5 pages have no title at all

- Severity: P2
- Confidence: High
- Area: Semantic HTML / page metadata
- Evidence:
  - `metadata`/`generateMetadata` absent in 10 of 301 `page.tsx` files: `(admin)/admin/{security-ops,security-suite,vendors}`, `(public)/{forgot-password,login,password-reset,pending,signup,test-accounts,upload/[token]}`
  - Of those, `test-accounts/page.tsx` and `upload/[token]/page.tsx` contain neither `metadata` nor `<title>` (verified by content scan)
  - 5 auth pages use JSX `<title>` (login:31, signup:35, forgot-password:31, pending, password-reset)
- What is happening: Two real pages render with the app-default browser title; five use the legacy JSX `<title>` pattern instead of the canonical `metadata` export.
- Why it matters: AGENTS.md claims "all 242 pages titled" (stale — 301 pages now); browser tab/SEO semantics inconsistent.
- User / business impact: Low (cosmetic), but `test-accounts` is a developer-facing utility page that should identify itself in the tab.
- Security / privacy / reliability impact: None.
- Recommended fix: Add `export const metadata = { title: "Test Accounts - Maine CyberTech" }` to `test-accounts`; same for `upload/[token]`; convert the 5 JSX `<title>` pages to metadata exports; add a CI lint that every `page.tsx` exports metadata or renders `<title>`.
- Suggested validation: `grep -L metadata` CI check; manual tab-title check.
- Owner suggestion: Frontend engineer.
- Effort estimate: 2-3 hours.
- Dependencies: None.
- Status: Open.

### Finding ID: UX-P2-004 - A11y E2E gate scans only 4 pages and ignores non-critical/serious violations

- Severity: P2
- Confidence: High
- Area: A11y testing / CI
- Evidence:
  - `apps/web/e2e/a11y.spec.ts:5-10` — pages: `/login`, `/store`, `/portal/dashboard`, `/admin`
  - `a11y.spec.ts:20-27` — filters `results.violations` to `impact === "critical" || "serious"`
- What is happening: The axe-core scan covers 4 of ~301 pages; minor/moderate WCAG violations (heading-order, landmark-unique, aria-allowed-attr, etc.) never fail CI.
- Why it matters: The 297 module/detail pages (including all store pages) have no automated a11y regression coverage.
- User / business impact: A11y regressions can ship on any unscanned page.
- Security / privacy / reliability impact: None.
- Recommended fix: Extend the page list to ~12 representative pages (ticket detail, project detail, store product, org form, audit log, one module detail); fail on all violations except `best-practice` tags.
- Suggested validation: CI run shows the expanded page set; axe results inspected.
- Owner suggestion: Frontend engineer / QA.
- Effort estimate: 4 hours.
- Dependencies: None.
- Status: Open.

### Finding ID: UX-P2-005 - Storybook has zero web-app stories; Chromatic gates only @mct/ui

- Severity: P2
- Confidence: High
- Area: Visual regression testing / Storybook
- Evidence:
  - `.storybook/main.ts` globs include `../apps/web/components/**/*.stories.@(ts|tsx)` — 0 matching files; only `packages/ui/src/components/*.stories.tsx` (7 files)
  - `.github/workflows/chromatic.yml:6-11` — `paths: ['packages/ui/**']`; `continue-on-error: true` on build + upload
- What is happening: Storybook works but documents only the UI package; the 301-page web app has no story coverage and Chromatic never runs for web changes.
- Why it matters: Visual regressions in web components are only caught by textual E2E assertions; the design system's own a11y addon is unused for web components.
- User / business impact: Visual quality regressions ship undetected.
- Security / privacy / reliability impact: None.
- Recommended fix: Add 10-15 stories for high-traffic web components (EmptyState, SidebarShell, AdminTicketCard, StoreProductCard, QuoteBuilder, login card); widen Chromatic paths to `apps/web/components/**` (keeping non-blocking until stable).
- Suggested validation: `pnpm storybook:build` compiles; Chromatic upload includes web stories.
- Owner suggestion: Frontend engineer.
- Effort estimate: 1-2 days.
- Dependencies: None.
- Status: Open.

### Finding ID: UX-P3-006 - No dark mode (dark-only theme) and inline hex literals bypass the token layer

- Severity: P3
- Confidence: High
- Area: CSS/Tailwind/theme, design tokens
- Evidence:
  - 0 `dark:` class usages across all web TSX/CSS; no `prefers-color-scheme` in `globals.css`
  - Inline hex in components/pages: `bg-[#071018]/70`, `bg-[#0A1118]/60`, `bg-[#0F172A]/80` (EmptyState, SidebarShell, SidebarShell.tsx:43, etc.)
- What is happening: The app is intentionally dark-only; tokens exist but several components hardcode hex, and the "no light mode" decision is not documented.
- Why it matters: Future theming work or a contributor adding light mode could break the contrast work done in `tailwind.config.ts`.
- User / business impact: None today.
- Security / privacy / reliability impact: None.
- Recommended fix: Add ADR for dark-only theme; migrate recurring hex to `cyber.*` tokens.
- Suggested validation: Token lint rule.
- Owner suggestion: Frontend engineer.
- Effort estimate: 2-3 hours.
- Dependencies: None.
- Status: Open.

### Finding ID: UX-P3-007 - SDK StoreApi has zero tests despite 12 public methods

- Severity: P3
- Confidence: High
- Area: Webstore coverage
- Evidence:
  - `packages/sdk/src/store.ts` — `listProducts`, `getProduct`, `listCategories`, `getCategory`, `listActivePromotions`, `listPromotions`, `createPromotion`, `updatePromotion`, `deletePromotion`, `submitQuote`, `listQuotes` (11 methods + constructor)
  - `packages/sdk/src/__tests__/{sdk.test.ts,sdk-expanded.test.ts}` — 0 matches for "store"
- What is happening: The store SDK module is exported and used (`MCTClient.create().store`) but has no unit test coverage.
- Why it matters: The webstore is a flagship feature; SDK contract regressions (paths, payload shapes) would surface only in E2E.
- User / business impact: Low; reliability of quote/promotion flows in API-driven paths.
- Security / privacy / reliability impact: None.
- Recommended fix: Add `store.test.ts` covering listProducts/getProduct/submitQuote against mocked fetch (mirroring existing SDK test patterns).
- Suggested validation: `pnpm --filter=sdk test` includes the new suite.
- Owner suggestion: Backend engineer.
- Effort estimate: 3-4 hours.
- Dependencies: None.
- Status: Open.

### Finding ID: UX-P3-008 - No aria-current="page" on active sidebar links

- Severity: P3
- Confidence: High
- Area: ARIA / semantic HTML
- Evidence:
  - `AdminSidebarContent.tsx` — active link styled via `isActive(item.href)` classes (bg-emerald-600/15) but no `aria-current="page"` attribute; same in `PortalSidebarContent.tsx`
- What is happening: Screen-reader users cannot programmatically determine the current page in nav.
- Why it matters: WCAG 1.3.1 info-and-relationships nicety; low impact but trivial to fix.
- User / business impact: Minor assistive-tech UX.
- Security / privacy / reliability impact: None.
- Recommended fix: Add `aria-current={isActive(item.href) ? "page" : undefined}` to both sidebars and subnavs.
- Suggested validation: axe scan after change; unit test asserting attribute.
- Owner suggestion: Frontend engineer.
- Effort estimate: 1 hour.
- Dependencies: None.
- Status: Open.

### Finding ID: UX-P3-009 - EmptyState icon prop is emoji-string keyed with silent fallback

- Severity: P3
- Confidence: High
- Area: Reusable components / icons
- Evidence:
  - `apps/web/components/EmptyState.tsx:50-97` — `ICON_MAP: Record<string, LucideIcon>` keyed by emoji strings; `const Icon = ICON_MAP[icon] ?? ClipboardList` (silent fallback)
- What is happening: Passing an unmapped emoji silently renders the clipboard icon; no compile-time safety.
- Why it matters: Future callers may pass new emojis expecting the right icon and get the wrong one silently.
- User / business impact: Minor visual inconsistency.
- Security / privacy / reliability impact: None.
- Recommended fix: Accept a `LucideIcon` component directly or a typed union of the 47 mapped keys.
- Suggested validation: Unit test for fallback + type check.
- Owner suggestion: Frontend engineer.
- Effort estimate: 1-2 hours.
- Dependencies: None.
- Status: Open.

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| ---- | -------- | ---------- | ------ | -------- | ---------- |
| A11y regression on unscanned pages | P2 | Medium | Medium | `a11y.spec.ts` covers 4/301 pages | Expand scan set; treat all violations as failures |
| Mobile keyboard a11y gap in drawer | P2 | High (mobile is primary for some users) | Medium | `SidebarShell.tsx` no Esc/focus mgmt | Add Esc + focus trap/restore |
| Visual regressions undetected in web components | P2 | High (301 pages, frequent changes) | Medium | 0 web stories; Chromatic scoped to `packages/ui` | Add web stories; widen Chromatic paths |
| Inconsistent feedback UX | P2 | High | Low | 5 toasts + 4 alert() | Shared toast component |
| Page title gaps | P3 | High | Low | 5 pages untitled | metadata export + CI check |
| SDK store contract drift | P3 | Medium | Low | 0 SDK store tests | Add SDK store tests |

## Recommendations

### Immediate / Release Blocking

None (no P0/P1 findings in this domain).

### This Week

1. `SidebarShell` drawer: Esc close, focus trap, focus restore, `aria-labelledby` (UX-P2-001).
2. Add `metadata` titles to `test-accounts` + `upload/[token]`; convert 5 JSX `<title>` pages (UX-P2-003).
3. Extract shared toast component; replace 5 local implementations and 4 `alert()` calls (UX-P2-002).

### This Month

4. Expand `a11y.spec.ts` to ~12 pages; fail on all violations except best-practice (UX-P2-004).
5. Add 10-15 web-app stories; widen Chromatic path filter (UX-P2-005).
6. SDK `StoreApi` unit tests (UX-P3-007).

### Later / Platform Evolution

7. Token migration for inline hex literals + dark-only ADR (UX-P3-006).
8. `aria-current="page"` in sidebars/subnavs (UX-P3-008).
9. Typed `EmptyState` icon prop (UX-P3-009).

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --------- | ------------ | --------------------- | ---------- |
| `aria-current="page"` on active nav links | 1-line change, immediate SR benefit | `AdminSidebarContent.tsx`, `PortalSidebarContent.tsx`, subnavs | axe scan + unit test |
| `metadata` on `test-accounts` + `upload/[token]` | 2 files, closes title gap | `apps/web/app/(public)/test-accounts/page.tsx`, `upload/[token]/page.tsx` | Manual tab-title check |
| Esc-close on mobile drawer | ~10 lines in `SidebarShell.tsx` | `SidebarShell.tsx` | Manual keyboard walkthrough |
| CI title check (`page.tsx` must contain metadata/title) | Prevents regression of title coverage | root `package.json` script + `lint.yml` | CI green |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| ------------ | -------- | ---------------- | ------ | ---------- |
| Shared ToastProvider + migrate 5 impls + 4 alert() | P2 | Frontend | 1-2d | None |
| Drawer focus management + aria-labelledby | P2 | Frontend | 2-4h | None |
| A11y scan expansion + strict failure | P2 | QA/Frontend | 4h | None |
| Web app stories + Chromatic widening | P2 | Frontend | 1-2d | Chromatic token |
| SDK StoreApi tests | P3 | Backend | 3-4h | None |
| Token migration of inline hex | P3 | Frontend | 2-3h | None |
| Dark-only ADR | P3 | Arch | 30m | None |
| Typed EmptyState icons | P3 | Frontend | 1-2h | None |

## Suggested Tests

- Unit: sidebar keydown simulation (ArrowDown opens flyout + focuses first link; Escape returns focus).
- Unit: toast component lifecycle (auto-dismiss, tone classes, stacking) once shared component exists.
- E2E (Playwright, mobile viewport 375px): open drawer → Escape → drawer closed, focus on toggle.
- E2E: expand `a11y.spec.ts` page list; assert zero violations (all impacts) on the 4 current pages.
- CI: lint rule/script asserting every `page.tsx` exports metadata or contains `<title>`.
- SDK: `store.test.ts` with mocked fetch for `listProducts`/`getProduct`/`submitQuote`.
- Regression: after toast migration, `grep -r "alert(" apps/web` returns 0.

## Suggested Documentation Updates

- `AGENTS.md` — update stale "all 242 pages titled" and test counts (301 pages; E2E 90 spec files/338 tests).
- `docs/adr/0008-dark-only-theme.md` — record dark-only decision + contrast override policy.
- `docs/design-system.md` — document tokens, toast component, sidebar keyboard conventions, story conventions.
- `docs/modules/store.md` — note SDK store test gap once closed.

## Open Questions

| Question | Why it matters | Evidence needed |
| -------- | -------------- | --------------- |
| Is the mobile drawer used on all portal/admin pages? | Determines blast radius of the focus-management fix | SidebarShell usage map |
| Are the 33 admin store pages all reachable from nav? | Some store sub-pages may be orphaned shells | RouteGuard + sidebar mapping |
| Does the app intend light mode eventually? | Token/contrast architecture depends on the answer | Product roadmap |
| Which of the 4 `alert()` call sites are user-facing critical paths? | Priority for toast migration | Component usage stats |

## Appendix

### Page title coverage (evidence summary)

- 301 `page.tsx` files total: 196 admin, 77 portal, 26 public, 2 other (`forbidden`, `locations/[slug]` — both titled).
- 291/301 render a title (metadata export or JSX `<title>`).
- 10/301 lack `metadata` export; 5/301 lack any title (`security-ops`, `security-suite`, `vendors` redirect stubs; `test-accounts`, `upload/[token]` real pages).

### Toast implementations inventory

| Component | Type | Timing |
| --------- | ---- | ------ |
| `AdminDocumentsCenterClient.tsx` | Custom toast list | 5s |
| `PortalDocumentsCenterClient.tsx` | Custom toast list | — |
| `ProjectTaskListV5.tsx` | Custom toast list | 2.6s |
| `RolePermissionsEditor.tsx` | Custom toast list | — |
| `UserPermissionOverridesClient.tsx` | Custom toast list | — |
| `TriageAnalyzeClient.tsx`, `NewWebhookForm.tsx`, `AdminTicketCenterClient.tsx`, `AdminApiKeysClient.tsx` | Native `alert()` | blocking |

### Contrast computation (WCAG 2.x relative luminance)

- `#c7d3e0` (slate-400 override) on `#0A1118`: ~12.6:1 (AAA)
- `#94a3b8` (slate-500 override) on `#0A1118`: ~5.4:1 (AA)
- `#7a8ba0` (slate-600 override) on `#0A1118`: ~4.4:1 (AA, borderline normal-text)
- `#059669` (emerald-600 buttons) with white text: ~3.4:1 (AA large-text only) — buttons use bold uppercase small text; verify visually.
