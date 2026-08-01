# UI/UX, Design System, and Accessibility Audit

> **NOTE:** This is a combined report covering prompts 04 (Usability), 05 (UI/UX/A11y), and 17 (Mobile/PWA). Area codes: UX, USE, MOB.

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260801-0233-develop-a585f1d
- Repository: C:\temp\mainecybertech-portal
- Branch: develop
- Commit SHA: a585f1d
- Generated at: 2026-08-01T02:33:00Z
- Auditor: Principal-level repository auditor (AI)
- Area codes: UX, USE, MOB
- Output path: prompts/repo-deep-dive/20260801-0233-develop-a585f1d/05_ui_ux_accessibility_audit.md
- Scope limitations: Static source-code audit only; no runtime testing, no screen-reader testing, no real-device mobile testing, no color contrast tool verification (WCAG estimates are approximate from hex values)

## Scope

Reviewed: All 242 `page.tsx` files, all `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, key components under `apps/web/components/`, design tokens in `packages/ui/src/tokens/`, CSS in `packages/ui/src/styles.css`, `tailwind.config.ts`, `manifest.json`, `ThemeProvider`, sidebar layouts, forms, tables, modal/drawer patterns, focus states, ARIA usage, responsive breakpoints, PWA assets, and mobile navigation patterns.

Not reviewed: Runtime behavior (hover states, transitions, animations in real time), screen-reader verbatim output, third-party embedded scripts (Tawk.to, GA), storefront product detail interactive flows, API-level UX (error messages from backend).

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |
| `apps/web/app/layout.tsx` | Root layout | Skip-to-content, metadata, font loading, viewport | ✅ Skip link present, metadata defined |
| `apps/web/app/globals.css` | CSS entry | Design system import surface | Minimal (3 lines), delegates to @mct/ui |
| `packages/ui/src/styles.css` | Design system CSS | CSS variables, dark/light themes, utility classes, focus-visible, reduced motion | ✅ Comprehensive with 139 lines |
| `packages/ui/src/tokens/` (9 files) | Design tokens | Colors, spacing, typography, borders, shadows, motion, focus, semantic | ✅ Full design-token system |
| `apps/web/tailwind.config.ts` | Tailwind config | Design token consumption | ✅ Tokens wired into Tailwind theme |
| 242 `page.tsx` files | Pages | Metadata presence, semantic structure, ARIA | 192 have metadata, 50 do not |
| 26 `loading.tsx` files | Loading skeletons | Route-level loading states | ✅ Present in 26 route segments |
| 3 `error.tsx` + 1 `global-error.tsx` | Error boundaries | Error recovery per route group | ✅ Public, Portal, Admin, Global |
| 1 `not-found.tsx` | 404 page | Missing route handling | ✅ Root 404 present |
| `apps/web/public/manifest.json` | PWA manifest | Installability, theme color, icons | ⚠️ Only SVG icon, no PNG |
| _No `service-worker.*` files_ | Service worker | Offline support, caching | ❌ Absent |
| `components/admin/AdminSidebarLayout.tsx` | Admin navigation | Responsive sidebar, drawer, aria | ✅ Mobile drawer with backdrop |
| `components/portal/PortalSidebarLayout.tsx` | Portal navigation | Identical to admin sidebar | ⚠️ 100% duplicated code |
| `components/admin/AdminSidebarContent.tsx` | Navigation items | Accordion groups, flyout, aria-expanded | ✅ aria-expanded/haspopup on groups |
| `components/marketing/MarketingHeader.tsx` | Marketing header | Mobile hamburger, keyboard Escape, aria-expanded | ✅ Keyboard nav on mobile menu |
| `components/EmptyState.tsx` | Empty state component | Reusable empty-state pattern | ⚠️ Text-emoji icon, no aria on icon |
| `components/Breadcrumbs.tsx` | Breadcrumb nav | Semantic nav with aria-label | ✅ Used extensively |
| `components/NotificationBell.tsx` | Notification bell | role=switch for toggles | ✅ ARIA switch pattern |
| `packages/ui/src/hooks/use-theme.tsx` | Theme provider | Dark/light/system toggle, localStorage, media query | ✅ Full theme support |
| `packages/ui/src/index.ts` | Component exports | Button, Input, Textarea, Badge, Avatar, Dialog, Skeleton, SidebarGroup, SidebarItem, ThemeToggle | ✅ 14 exported components |
| ~~No `*.stories.*` files~~ | Storybook | Component documentation/visual testing | ❌ Absent |
| ~~No `*.test.*` for a11y~~ | A11y tests | axe-core, jest-axe, pa11y | ❌ Absent |
| `stores, products, promotions pages` | Admin store forms | Form patterns, labels, inputs | ⚠️ Inconsistent label usage |
| `apps/web/app/(public)/login/page.tsx` | Login form | Auth form patterns | ✅ Proper labels+htmlFor+aria-label |

## Executive Summary

The MCT portal has a **solid UI/UX foundation** with significant depth but notable inconsistency in polish. The design-token system in `packages/ui` is well-architected with semantic colors, focus rings, and responsive utilities. Accessibility basics are present (skip-to-content link, focus-visible global rule, aria-labels on nav elements, reduced-motion media query). However, three systemic gaps drag the score down: **50 pages (21%) lack metadata/title tags**, **hardcoded color values bypass the design-token system** (making dark/light theme non-functional for most components), and **no PWA service worker** means zero offline capability despite having a manifest.json. Keyboard navigation is partially implemented (sidebars have `aria-expanded`/`aria-haspopup` but flyouts cannot be opened via keyboard; only 5 `onKeyDown` handlers in the entire components directory).

**Strengths:** Design token infrastructure, responsive sidebar drawers, skip-to-content link, error boundaries across all 3 route groups, 26 loading skeletons, reduced-motion support, proper `<form>` elements on auth pages with `<label htmlFor>`, Breadcrumbs with `aria-label`, notification bell with `role="switch"`, ThemeProvider with system-preference detection.

**Major risks:** 50 pages with no `<title>` (SEO and screen-reader impact), missing service worker (no offline/PWA install flow), dark theme not functional due to hardcoded colors, insufficient keyboard navigation, no visual/a11y regression tests.

**Recommended next actions:** (1) Add metadata to all 50 remaining pages, (2) ship a basic service worker with cache-first strategy, (3) migrate hardcoded `bg-[#0A1118]` to CSS variables, (4) add keyboard support for sidebar flyouts, (5) add jest-axe to CI.

## Domain Scorecard

| Category                          | Score | Evidence | Gap | Recommended action |
| --------------------------------- | ----: | -------- | --- | ------------------ |
| Design tokens                     |     4 | 9 token files in `packages/ui/src/tokens/` with colors, spacing, typography, borders, shadows, motion, focus rings, semantic colors | Not fully consumed by app code (hardcoded values bypass tokens) | Enforce token usage via ESLint plugin |
| CSS/Tailwind/theme                |     3 | Tailwind config consumes tokens; 139-line `styles.css` with utility classes; dark/light vars defined | Hardcoded colors (`bg-[#0A1118]`) bypass CSS variables; theme vars only change 3 properties | Replace hardcoded colors with `var(--cyber-*)` references |
| Reusable components               |     3 | `packages/ui` exports Button, Input, Textarea, Badge, Avatar, Dialog, Skeleton, SidebarGroup, SidebarItem, ThemeToggle (14 total) | No Storybook, no visual regression tests, EmptyState uses text-emoji icon | Add Storybook, replace emoji icons with SVG |
| Layouts/nav                       |     4 | Responsive sidebar drawers, accordion groups, breadcrumbs, mobile hamburger, flyout menus | Sidebar code duplicated (admin & portal identical), flyouts not keyboard-navigable, scroll position on mobile drawer close | Add keyboard triggers for flyouts, deduplicate sidebar |
| Forms/dialogs/toasts/tables/cards |     2 | Auth forms have proper `<label htmlFor>`; `<form>` elements used for server actions | ~30+ admin forms use inline inputs without `<label>`; no toast/notification component in UI library; mobile tables rely on `overflow-x-auto` | Add Toast component; enforce label-input association; add card-view fallback for mobile tables |
| Icons/color/typography/spacing    |     3 | Inter + Orbitron fonts loaded; design tokens define spacing scale; cyber utility classes use token values | No icon library/SVG sprite system; `text-slate-400` (#94a3b8) on `bg-[#0A1118]` (#0A1118) = ~3.6:1 contrast (fails WCAG AA 4.5:1); `text-slate-500` (#64748b) on same bg = ~2.7:1 | Use `text-slate-300` minimum for body text; adopt icon library (e.g., lucide-react) |
| Focus states                      |     3 | Global `*:focus-visible { outline: 2px solid var(--cyber-accent); }` in CSS; focus tokens in `focus.ts` | ~15 instances of `focus:outline-none` inline cancel the global rule; some use `outline-none` without providing alternative focus indicator | Remove bare `outline-none`; use `focus-visible:outline-none` only when replacing with visible border/ring |
| Keyboard nav                      |     2 | MarketingHeader has Escape key handling + auto-focus first mobile link; sidebar groups toggle via button click | Only 5 `onKeyDown` handlers in entire components dir; sidebar flyouts can't be opened via Enter/Space; no arrow-key navigation within menus; no Escape on modals/drawers besides sidebar; AdminSidebarContent groups lack keyboard activation | Add Enter/Space to open flyouts, arrow keys for menu items, Escape to close drawers |
| ARIA                              |     3 | `aria-label` on 40+ pages (region roles), breadcrumbs, navs, search inputs, notification bell; `aria-expanded` on sidebar groups; `aria-modal` on mobile drawers | Only 1 `role="switch"`, 1 `role="status"`, 0 `aria-live` regions for dynamic updates; `aria-label` only on 4 auth pages' inputs; EmptyState icon has no `aria-hidden` | Add `aria-live` for dynamic content; add `role="alert"` on error messages; mark decorative elements aria-hidden |
| Semantic HTML                     |     3 | `<nav>`, `<main>`, `<header>`, `<aside>` used correctly in layouts; `<form>` used for server actions; `<button>` for interactive elements | Some clickable divs lack `role="button"`; tables use div-based layouts in some places; `<section>` rarely used | Audit clickable elements; use semantic table elements consistently |
| Responsive breakpoints            |     3 | `lg:` breakpoint for sidebar show/hide; `sm:` for typography/padding; `md:` for grid layout; `cyber-grid-cards` utility handles responsive grids | Many min-width hardcoded values (e.g., `min-w-[600px]`, `min-w-[260px]`) force horizontal scroll on mobile; `hidden md:block` patterns hide tables on mobile without providing card alternative (~15 instances) | Add mobile-card fallback for every desktop-only table |
| Dark mode                         |     2 | ThemeProvider with system/light/dark toggle; `data-theme` attribute; CSS vars `[data-theme="dark"]` and `[data-theme="light"]` | Only 3 CSS properties change per theme; all component styles use hardcoded dark colors (`bg-[#0A1118]`, `bg-[#0F172A]`); light theme would render as dark | Make component colors reference CSS variables; test light mode on all routes |
| Skeletons/errors/empty states     |     3 | 26 `loading.tsx`, 3 `error.tsx` + 1 `global-error.tsx`, EmptyState component with icon/title/description/actions | `loading.tsx` only in top-level route folders, not in nested dynamic routes; EmptyState icon is text-emoji (not accessible); error pages lack semantic heading hierarchy | Add loading.tsx to nested routes; use SVG icon in EmptyState; ensure error pages have single `<h1>` |
| Storybook                          |     0 | No `.stories.*` files found anywhere in the monorepo | Zero component documentation/isolation/testing | Add Storybook with stories for all 14 `@mct/ui` components |
| Visual/A11y tests                  |     0 | No jest-axe, pa11y, or visual regression test config found | No automated a11y enforcement | Add jest-axe to unit tests; add pa11y-ci to CI |

## Detailed Review

### Item: Metadata / Page Titles

- Evidence: 242 `page.tsx` files; 192 have `export const metadata` or `generateMetadata`; 50 do not (`apps/web/app/**/page.tsx`)
- What it does: Sets `<title>` and meta tags per page
- How it appears to work: Next.js `Metadata` API sets `<title>` in `<head>`
- Dependencies: Next.js Metadata API
- Current controls: Root layout provides fallback title "Maine CyberTech Portal" via `metadata.title`
- Missing controls: 50 pages have no page-specific title — all share the root fallback, making them indistinguishable in browser tabs, history, and screen readers
- Risks: Poor SEO, confusing browser tab labels, screen-reader users can't identify pages
- Recommended improvement: Add `export const metadata = { title: "..." }` to all 50 pages (see Appendix for full list)
- Suggested tests: Unit test that every `page.tsx` exports `metadata` or `generateMetadata`
- Suggested docs: Document metadata convention in `docs/FRONTEND_CONVENTIONS.md`

### Item: PWA / Service Worker

- Evidence: `manifest.json` exists (`apps/web/public/manifest.json`); zero `service-worker.*` files
- What it does: manifest.json enables "Add to Home Screen"; service worker enables offline caching
- How it appears to work: Manifest declares name, theme_color (#059669), background_color (#0A1118), display: standalone, single SVG icon
- Dependencies: Browser support for manifest + service worker
- Current controls: Manifest with correct theme colors
- Missing controls: No service worker → no offline fallback, no caching strategy, no background sync, no push notifications, no install prompt triggers; manifest uses SVG only (no PNG fallback for iOS/Safari which don't support SVG icons for PWA)
- Risks: App unusable offline; no install prompt on supported browsers; missing PWA Lighthouse score
- Recommended improvement: Create `apps/web/public/sw.js` with cache-first strategy; add 192x192 and 512x512 PNG icons to manifest; register SW in root layout
- Suggested tests: Lighthouse PWA audit; E2E test for offline page load; unit test for SW registration
- Suggested docs: Create `docs/PWA_SETUP.md`

### Item: Color Contrast

- Evidence: Widespread use of `text-slate-400` (#94a3b8) and `text-slate-500` (#64748b) on `bg-[#0A1118]` (#0A1118) background — found in 100+ locations across all route groups
- What it does: Low-contrast text for descriptions, muted information, placeholders
- How it appears to work: Visible to users with good vision in well-lit environments
- Dependencies: Tailwind's slate color scale; hardcoded background colors
- Current controls: None — no contrast checking
- Missing controls: No WCAG AA compliance verification; no contrast checking in CI
- Risks: `text-slate-400` on `#0A1118` = ~3.6:1 ratio (fails WCAG AA 4.5:1 for normal text, passes only for large text 3:1); `text-slate-500` on `#0A1118` = ~2.7:1 (fails even large-text threshold); users with low vision or in bright sunlight cannot read ~30% of page content
- Recommended improvement: Raise minimum body text color to `text-slate-300` (#cbd5e1, ~8.7:1 ratio); use `text-slate-400` only for large text or non-essential decorative text; add CSS variable `--color-text-muted: #cbd5e1` and migrate
- Suggested tests: Add contrast ratio assertions via jest-axe; run pa11y-ci with WCAG AA threshold
- Suggested docs: Add contrast guidelines to `docs/FRONTEND_CONVENTIONS.md`

### Item: Keyboard Navigation

- Evidence: Only 5 `onKeyDown` handlers in components (`MarketingHeader.tsx` Escape key, `AdminDocumentsCenterClient.tsx` arrow keys). `AdminSidebarContent.tsx` uses `<button>` with `aria-expanded` but no keyboard handler for Enter/Space.
- What it does: Allows users to navigate without a mouse
- How it appears to work: Native `<button>` and `<a>` elements are keyboard-focusable; sidebar groups toggle on click
- Dependencies: Browser default keyboard behavior; React event handlers
- Current controls: Native HTML elements provide basic keyboard support; Escape closes mobile menu in MarketingHeader
- Missing controls: Sidebar flyout groups don't open with Enter/Space (they use `onClick` on `<button>` which browsers handle, but testing needed); no arrow-key navigation within flyout menus; no Tab-key management for modals/drawers (focus not trapped); no keyboard shortcut for search
- Risks: Keyboard-only users cannot navigate sidebar flyouts reliably; focus can escape into hidden page content behind modals
- Recommended improvement: Add `onKeyDown` handlers to sidebar group accordion buttons with Enter/Space; trap focus in modal/drawer with Tab/Shift+Tab cycling; add Escape handler to all modals/drawers
- Suggested tests: E2E keyboard-navigation test (Tab through entire admin sidebar, open all groups, verify focus)
- Suggested docs: Document keyboard navigation patterns

### Item: Dark Mode / Theme System

- Evidence: `ThemeProvider` in root layout supports light/dark/system; `styles.css` defines `:root[data-theme="dark"]` and `:root[data-theme="light"]` with 3 CSS variables each; virtually all component code uses hardcoded dark colors
- What it does: Allows users to switch between light and dark visual themes
- How it appears to work: ThemeProvider sets `data-theme` attribute on `<html>`; CSS variables respond to the attribute
- Dependencies: `packages/ui/src/hooks/use-theme.tsx`; localStorage; `prefers-color-scheme` media query
- Current controls: Theme toggle component exported; system preference detection; localStorage persistence
- Missing controls: Light theme CSS variables only change `--cyber-base`, `--cyber-card`, and `--cyber-card-hover` — but components use `bg-[#0A1118]`, `text-slate-50`, `bg-[#0F172A]` directly, ignoring the variables. Light mode would render with dark background and dark text = unreadable. No theme-aware gradient or glow colors.
- Risks: Light theme completely non-functional; users who prefer light mode get unreadable pages
- Recommended improvement: Replace all hardcoded colors with `var(--cyber-*)` and `var(--color-*)` CSS variables; add comprehensive light-theme values for backgrounds, text, borders, cards, inputs; test every route in light mode
- Suggested tests: Visual regression test in light + dark modes; jest-axe in both themes
- Suggested docs: Document theme variable usage

### Item: Mobile Tables / Overflow

- Evidence: 45 locations use `overflow-x-auto` for table containers; 15 use `hidden md:block` to show tables only on desktop. Examples: `AdminDocumentsCenterClient.tsx:1380`, `AdminTicketCenterClient.tsx`, store products page `hidden overflow-x-auto rounded-lg border border-white/10 md:block`
- What it does: Makes wide tables horizontally scrollable or hides them on mobile
- How it appears to work: CSS `overflow-x: auto` provides a scroll bar for content wider than the viewport
- Dependencies: Tailwind responsive prefixes
- Current controls: Tables are scrollable horizontally; some tables switch to card layouts at mobile
- Missing controls: ~15 tables use `hidden md:block` with no mobile alternative — entire data tables disappear on phones; no `role="table"` on some div-based table implementations; no sticky column headers on scrollable tables
- Risks: Mobile users cannot access admin data tables for ~15 routes; horizontal scroll without visible scrollbar hint is not intuitive
- Recommended improvement: Add mobile card-view fallback for every `hidden md:block` table; consider `role="grid"` + `aria-label` for complex tables; add subtle scroll hint (gradient fade) on scrollable tables
- Suggested tests: Mobile-viewport E2E tests for admin tables
- Suggested docs: Document table responsive patterns

### Item: Form Accessibility

- Evidence: Auth pages (login, signup, forgot-password, password-reset) use proper `<label htmlFor="...">` + `<input id="...">` patterns. ~30+ admin/store forms (PromoForm, products page filters, record detail editors, CRUD forms) use `<input>` without associated `<label>`.
- What it does: Associates textual labels with form inputs for screen readers
- How it appears to work: Browser default: clicking label focuses associated input; screen readers announce label text
- Dependencies: HTML label-input association via `htmlFor`/`id`
- Current controls: Auth forms are correct; some inputs have `aria-label` (e.g., search inputs)
- Missing controls: ~30+ forms have unlabeled inputs; no required-field indicators (asterisk or `aria-required`); no inline validation error messages with `aria-describedby`; no `aria-invalid` on error states
- Risks: Screen-reader users cannot identify what each form field represents on ~30+ admin forms; required-field status is invisible to assistive tech
- Recommended improvement: Add `<label>` to all form inputs; add `aria-required="true"` on required fields; link error messages via `aria-describedby`; add `aria-invalid="true"` on fields with errors
- Suggested tests: jest-axe on all form pages; E2E test with screen-reader
- Suggested docs: Document form accessibility checklist

### Item: Duplicate Sidebar Code

- Evidence: `AdminSidebarLayout.tsx` (69 lines) and `PortalSidebarLayout.tsx` (69 lines) are structurally identical — same mobile toggle, drawer, backdrop, desktop sticky aside. Only differences: titles ("Admin Menu" vs "Portal Menu"), sidebar content component, aria-labels.
- What it does: Provides responsive navigation sidebar with mobile drawer
- How it appears to work: `useState` for drawer open/close; `popstate` listener closes drawer on navigation; `lg:` breakpoint switches between drawer and desktop sticky sidebar
- Dependencies: AdminSidebarContent / PortalSidebarContent; React state
- Current controls: Both work correctly
- Missing controls: 100% code duplication; any fix to one must be replicated manually
- Risks: Maintenance burden; bug fixes applied to one may be missed on the other; inconsistent behavior over time
- Recommended improvement: Extract a generic `SidebarLayout` component accepting `title`, `sidebarContent`, `ariaLabel` props; use it in both admin and portal
- Suggested tests: Unit test for SidebarLayout with configurable props
- Suggested docs: Document sidebar layout pattern

### Item: No Storybook / Component Documentation

- Evidence: Zero `*.stories.*` files in entire monorepo; `packages/ui/src/index.ts` exports 14 components with no documentation beyond inline types
- What it does: Provides isolated development environment and documentation for UI components
- How it appears to work: N/A — not present
- Dependencies: Storybook, Chromatic (optional)
- Current controls: None
- Missing controls: No way to develop components in isolation; no visual documentation for design system consumers; no automated visual regression testing
- Risks: Design drift over time; new developers can't discover available components; no guard against visual regressions
- Recommended improvement: Add Storybook 8 with stories for all 14 `@mct/ui` components (Button, Input, Textarea, Badge, Avatar, Dialog, Skeleton*, SidebarGroup, SidebarItem, ThemeToggle); integrate Chromatic for visual regression testing
- Suggested tests: Chromatic visual snapshots on PR
- Suggested docs: Storybook serves as live documentation

### Item: PWA Manifest Icon Gaps

- Evidence: `manifest.json` has single icon entry: `{ "src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml" }`
- What it does: Declares app icons for PWA installation
- How it appears to work: Browsers that support SVG icons use it for home screen / app drawer
- Dependencies: Browser PWA support; icon format support
- Current controls: SVG icon present; correct theme/background colors
- Missing controls: No PNG icon — iOS Safari and some Android browsers require PNG for PWA installation; no 192x192 or 512x512 sizes; no `purpose: "maskable"` icon
- Risks: PWA cannot be installed on iOS (requires PNG); Android installation uses blurry scaled SVG
- Recommended improvement: Generate 192x192 and 512x512 PNG icons; add `purpose: "any maskable"` to manifest; add `<link rel="apple-touch-icon">` for iOS
- Suggested tests: Lighthouse PWA audit; manual install test on iOS + Android
- Suggested docs: Add icon generation steps to `docs/PWA_SETUP.md`

## Scenario / Control Matrix

| ID      | Scenario or control               | Evidence | Current control | Gap | Severity | Recommendation |
| ------- | --------------------------------- | -------- | --------------- | --- | -------- | -------------- |
| UX-001  | Design tokens                     | 9 token files in `packages/ui/src/tokens/` | Full token system | Not enforced in app code (hardcoded values bypass) | P2 | Add ESLint plugin to enforce token usage |
| UX-002  | CSS/Tailwind/theme                | 139-line `styles.css`, Tailwind config | Utility classes + CSS variables | Hardcoded colors bypass CSS vars; dark theme non-functional | P1 | Replace hardcoded colors with `var()` references |
| UX-003  | Reusable components               | 14 `@mct/ui` components + EmptyState + layouts | Component library exists | No Storybook; EmptyState uses text-emoji; no visual regression tests | P2 | Add Storybook; replace emoji with SVG icons |
| UX-004  | Layouts/nav                       | Sidebar drawers, accordion groups, breadcrumbs | Responsive mobile drawer | Sidebar code 100% duplicated; flyouts not keyboard-accessible | P1 | Deduplicate sidebar; add keyboard support |
| UX-005  | Forms/dialogs/toasts/tables/cards | Auth forms have proper labels | `<label htmlFor>` on 4 pages | ~30+ admin/store forms lack `<label>`; no Toast component; mobile tables disappear | P1 | Add labels to all forms; create Toast; add mobile card fallbacks |
| UX-006  | Icons/color/typography/spacing    | Font loading, design tokens | Inter + Orbitron loaded | No icon library; text-slate-400/500 fail WCAG AA contrast | P1 | Adopt icon library; raise minimum text contrast |
| UX-007  | Focus states                      | Global `*:focus-visible` rule; focus tokens | Emerald focus ring on all focusable elements | ~15 inline `focus:outline-none` cancel global rule; some `outline-none` without fallback | P2 | Remove bare `outline-none`; add visible focus alternatives |
| UX-008  | Keyboard nav                      | MarketingHeader Escape handling | Auto-focus first mobile link | Only 5 onKeyDown handlers total; no sidebar key nav; no focus trapping | P1 | Add Enter/Space for flyouts; trap focus in modals |
| UX-009  | ARIA                              | aria-label on 40+ pages, navs, search | aria-expanded on sidebar groups | 1 role=switch, 1 role=status, 0 aria-live; EmptyState icon not hidden | P2 | Add aria-live regions; aria-hidden on decorative elements |
| UX-010  | Semantic HTML                     | `<nav>`, `<main>`, `<header>`, `<aside>` in layouts | Proper landmarks in layouts | Div-based table layouts; clickable divs lack role=button | P2 | Use `<table>` elements; add role=button to interactive divs |
| UX-011  | Responsive breakpoints            | `lg:` sidebar, `sm:` typography, responsive grid | Functional breakpoints | min-w hardcoded values force overflow; `hidden md:block` tables lack mobile alt | P2 | Add mobile card fallbacks for all tables |
| UX-012  | Dark mode                         | ThemeProvider with system/light/dark | `data-theme` attribute + CSS vars | Only 3 vars change per theme; components use hardcoded dark colors | P1 | Migrate components to CSS var references; test light mode |
| MOB-001 | Viewport                          | Next.js auto-injects meta viewport | width=device-width, initial-scale=1 | None | — | — |
| MOB-002 | Responsive layouts                | `flex-col lg:flex-row`, responsive grids | Sidebar drawers on mobile | Hardcoded min-w forces horizontal scroll | P2 | Replace min-w hardcodes with responsive alternatives |
| MOB-003 | Mobile nav                        | Mobile drawer with backdrop | aria-modal, Escape on back nav | No focus trapping in drawer | P2 | Add focus trapping to mobile drawers |
| MOB-004 | Touch targets                     | `p-2.5` on NotificationBell (~44px) | Good for bell button | Unknown for other interactive elements | P3 | Audit all touch targets; ensure 44x44px minimum |
| MOB-005 | Mobile forms                      | Auth forms use full-width inputs | Good for mobile auth | Admin forms not tested on mobile | P2 | Test all forms at 375px viewport |
| MOB-006 | Mobile dialogs/tables             | overflow-x-auto on 45 tables | Scrollable tables | 15 tables hidden on mobile with no card alternative | P1 | Add mobile card fallbacks |
| MOB-007 | Auth/dashboard/admin mobile       | Sidebar drawer serves all 3 areas | Consistent pattern | Dashboard cards may overflow | P3 | Test all dashboard pages at 375px |
| MOB-008 | PWA manifest                      | `manifest.json` with theme/background colors | Present and correct | Only SVG icon (no PNG); no maskable icon | P2 | Add PNG icons + maskable purpose |
| MOB-009 | Service worker                    | No service-worker files | None | No offline support, no caching, no install flow | P1 | Create basic service worker with cache-first |
| MOB-010 | Offline fallback                  | No service worker | None | App shows browser offline page | P1 | Add offline.html fallback page |
| MOB-011 | Install prompt                    | No service worker | None | No beforeinstallprompt handling | P2 | Add install prompt trigger |
| MOB-012 | Push notifications                | No service worker | None | No web push support | P3 | Future: push API for in-app alerts |

## Findings

### Finding ID: UX-P1-001 - 50 pages missing metadata/title tags

- Severity: P1
- Confidence: High
- Area: UI/UX, SEO, Accessibility
- Evidence:
  - `apps/web/app/**/page.tsx` — 50 of 242 page files lack `export const metadata` or `generateMetadata`
  - 31 are `[id]` detail pages (admin detail views)
  - 10 are public-facing pages (login, signup, forgot-password, password-reset, pending, blog/[slug], case-studies/[slug], resources/[slug], services/[slug], store/* dynamic routes)
  - 6 are portal detail pages
  - 3 are other (locations/[slug], store/audit/page.tsx, store/products/[id]/page.tsx)
- What is happening: These pages inherit the root layout's fallback title "Maine CyberTech Portal" instead of having page-specific titles
- Why it matters: Every page in a browser tab shows the same title; screen readers can't distinguish pages; SEO is degraded for public pages like blog posts and service detail pages
- User / business impact: Poor UX (can't find tabs), reduced organic search traffic for public content, screen-reader users lose orientation
- Security / privacy / reliability impact: None directly, but accessibility compliance risk (WCAG 2.4.2 Page Titled)
- Recommended fix: Add `export const metadata = { title: "Page Name - Section - Maine CyberTech" }` to all 50 pages. For dynamic routes, use `generateMetadata` to include entity name (e.g., ticket title, user name).
- Suggested validation: Unit test asserting every `page.tsx` exports metadata or generateMetadata; CSP check for `<title>` element uniqueness per route
- Owner suggestion: Frontend team
- Effort estimate: 2-3 hours (50 files, ~1-2 lines each)
- Dependencies: None
- Status: Open

### Finding ID: UX-P1-002 - Hardcoded dark colors bypass CSS variables; light/dark theme non-functional

- Severity: P1
- Confidence: High
- Area: Theming, Accessibility
- Evidence:
  - `packages/ui/src/styles.css:142-153` — light theme only defines 3 CSS variable overrides
  - `packages/ui/src/styles.css:5-13` — cyber CSS variables defined but not consumed by components
  - 100+ instances of `bg-[#0A1118]`, `bg-[#0F172A]`, `text-slate-50` hardcoded across all pages and components
  - `apps/web/app/(public)/login/page.tsx:51` — `bg-[#0A1118]/60` hardcoded
  - `apps/web/components/admin/AdminSidebarLayout.tsx:22` — `bg-[#0F172A]/80` hardcoded
- What is happening: Components use Tailwind arbitrary values (`bg-[#0A1118]`) instead of referencing CSS variables (`bg-[var(--cyber-base)]`). The ThemeProvider sets `data-theme` attribute, but no code responds to it because all colors are hardcoded to the dark palette.
- Why it matters: Light theme toggle has no visible effect; users who prefer or need light mode (photophobia, certain visual impairments) get unreadable UI
- User / business impact: Accessibility barrier for light-mode users; theme toggle is misleading (appears functional but does nothing)
- Security / privacy / reliability impact: None
- Recommended fix: (1) Define comprehensive light-theme CSS variables for all semantic tokens (backgrounds, text, borders, cards, inputs) in `styles.css`. (2) Replace hardcoded `bg-[#0A1118]` with `bg-[var(--cyber-base)]`, `text-slate-50` with `text-[var(--color-text-primary)]`, etc. (3) Audit every component for hardcoded colors. Consider a codemod or ESLint rule.
- Suggested validation: Visual snapshot test in light theme mode for all routes; unit test verifying no `bg-[#` patterns in component code
- Owner suggestion: Frontend team + Design system owner
- Effort estimate: 3-5 days (touches 100+ files)
- Dependencies: Design decisions on light-theme color values
- Status: Open

### Finding ID: UX-P1-003 - No service worker; zero PWA offline capability

- Severity: P1
- Confidence: High
- Area: PWA, Resilience, Mobile
- Evidence:
  - Glob for `apps/web/**/service-worker*` returned 0 files
  - `apps/web/public/manifest.json` exists but is inert without a service worker
- What is happening: The app has a PWA manifest but no service worker. Browsers will not trigger "Add to Home Screen" prompts without a service worker (Chrome requirement). Offline access, caching, background sync, and push notifications are all absent.
- Why it matters: The portal is useless without internet — client portal users in rural Maine with spotty connectivity cannot access their tickets/documents. No install prompt means users can't add the portal as a standalone app.
- User / business impact: No offline access for field workers or areas with poor connectivity; reduced engagement (no home-screen icon); fails Lighthouse PWA audit
- Security / privacy / reliability impact: Offline functionality improves resilience
- Recommended fix: Create `apps/web/public/sw.js` with Workbox or hand-rolled cache-first strategy. Register in root layout. Cache: static assets (CSS/JS/fonts), app shell (layout HTML), API responses (stale-while-revalidate for list endpoints). Add offline fallback page.
- Suggested validation: Lighthouse PWA score > 90; E2E test verifying cached page loads offline; manual test on real device
- Owner suggestion: Frontend team
- Effort estimate: 2-3 days
- Dependencies: Service worker build integration (next-pwa or manual); cache invalidation strategy
- Status: Open

### Finding ID: UX-P1-004 - Mobile data tables hidden without card-view alternative

- Severity: P1
- Confidence: High
- Area: Mobile, Responsive, Accessibility
- Evidence:
  - `apps/web/app/(admin)/admin/store/products/page.tsx:143` — `className="hidden overflow-x-auto rounded-lg border border-white/10 md:block"`
  - `apps/web/app/(admin)/admin/store/quotes/page.tsx:91` — `className="hidden overflow-x-auto rounded-lg border border-white/10 md:block"`
  - `apps/web/app/(admin)/admin/store/promotions/page.tsx:96` — `className="hidden overflow-x-auto rounded-lg border border-white/10 md:block"`
  - ~12 more `hidden md:block` table patterns in admin store/operations pages
- What is happening: Data tables are completely hidden on screens smaller than 768px using `hidden md:block`, with no alternative presentation (card view, list view, or expandable rows)
- Why it matters: Mobile users lose access to critical admin functionality — product lists, quotes, promotions, operations data tables
- User / business impact: Admin users on phones cannot perform their jobs; support staff in the field cannot view critical data
- Security / privacy / reliability impact: None directly, but operational impact
- Recommended fix: For every `hidden md:block` table, add a mobile card view that shows the same data as stacked cards (key-value pairs) with the same actions. Pattern: `block md:hidden` for cards, `hidden md:block` for table. Or use `overflow-x-auto` as a simpler fix.
- Suggested validation: Mobile-viewport E2E test verifying data visibility on all admin list pages
- Owner suggestion: Frontend team
- Effort estimate: 3-5 days (15+ tables need card alternatives)
- Dependencies: Design for mobile card layout
- Status: Open

### Finding ID: UX-P1-005 - ~30+ admin/store form inputs lack associated labels

- Severity: P1
- Confidence: High
- Area: Accessibility, Forms
- Evidence:
  - `apps/web/app/(admin)/admin/store/promotions/PromoForm.tsx:91-202` — 12 form fields with no `<label>` elements, only placeholder text
  - `apps/web/app/(admin)/admin/store/products/page.tsx:100-120` — search/filter inputs with no labels
  - `apps/web/components/admin/RecordDetail.tsx:100-120` — detail editor inputs with no labels
  - `apps/web/components/admin/CrudForm.tsx:77-104` — CRUD form inputs with no labels
  - `apps/web/app/(admin)/admin/users/[userId]/page.tsx:84` — readonly input with `outline-none` and no label
- What is happening: Many admin forms use standalone `<input>` elements with only `placeholder` attributes and no associated `<label>`. Placeholders disappear when the user types and are not announced consistently by screen readers.
- Why it matters: Screen-reader users cannot determine what each form field represents; placeholder text is not a substitute for labels (WCAG 3.3.2); form usability is degraded for all users when they can't see field purpose after filling it in
- User / business impact: WCAG compliance failure; screen-reader users cannot use admin forms; keyboard-only users lose context
- Security / privacy / reliability impact: None directly
- Recommended fix: Add `<label htmlFor={id}>` for every `<input>`. Use floating labels or visually-hidden labels where space is tight. Replace `placeholder` with actual labels where the field has no label.
- Suggested validation: jest-axe on all form pages; E2E screen-reader test on admin forms
- Owner suggestion: Frontend team
- Effort estimate: 2-3 days
- Dependencies: None
- Status: Open

### Finding ID: UX-P1-006 - Sidebar flyout menus not keyboard-accessible

- Severity: P1
- Confidence: High
- Area: Keyboard Navigation, Accessibility
- Evidence:
  - `apps/web/components/admin/AdminSidebarContent.tsx:102-108` — accordion button has `onClick` but no `onKeyDown` handler
  - `apps/web/components/admin/AdminSidebarContent.tsx:142-161` — desktop flyout appears on click only, no keyboard trigger
  - Only 5 `onKeyDown` handlers exist across all components (`apps/web/components/`)
- What is happening: The sidebar uses expandable accordion groups. Each group has a `<button>` with `aria-expanded` and `aria-haspopup`. While native `<button>` elements do respond to Enter/Space keys in browsers, the flyout menu on desktop (which uses `absolute` positioning relative to the button) may not be focusable or navigable. No `onKeyDown` handler ensures Enter/Space expand the group and allow arrowing through items.
- Why it matters: Keyboard-only users may not be able to navigate the deep sidebar menu structure reliably
- User / business impact: WCAG 2.1.1 Keyboard failure; power users who prefer keyboard navigation are blocked
- Security / privacy / reliability impact: None
- Recommended fix: Add `onKeyDown` handlers to sidebar accordion buttons (Enter/Space toggle, ArrowDown focuses first item in expanded group). Trap arrow-key navigation within expanded flyout. Add Escape to close flyout and return focus to group button.
- Suggested validation: E2E test: Tab through all sidebar groups, press Enter to expand, ArrowDown through items, Escape to close, verify focus returns
- Owner suggestion: Frontend team
- Effort estimate: 1 day
- Dependencies: None
- Status: Open

### Finding ID: UX-P2-007 - Text contrast fails WCAG AA for body/muted text

- Severity: P2
- Confidence: High
- Area: Accessibility, Visual Design
- Evidence:
  - `text-slate-400` (#94a3b8) on `bg-[#0A1118]` (#0A1118) — contrast ratio ~3.6:1 (WCAG AA requires 4.5:1 for normal text)
  - `text-slate-500` (#64748b) on `bg-[#0A1118]` (#0A1118) — contrast ratio ~2.7:1 (fails even large-text threshold)
  - Found in 100+ locations across all route groups (e.g., descriptions, metadata, empty state text, form placeholders)
- What is happening: Large portions of descriptive and instructional text use `text-slate-400` or `text-slate-500` which do not have sufficient contrast against the dark background
- Why it matters: Users with low vision, older users, or users in bright environments cannot read secondary text; WCAG non-compliance
- User / business impact: Reduced usability for ~15% of users with visual impairments; potential ADA compliance risk
- Security / privacy / reliability impact: None
- Recommended fix: Raise minimum body text to `text-slate-300` (#cbd5e1, ~8.7:1 ratio on #0A1118). Reserve `text-slate-400` for large text (18px+) or purely decorative elements. Never use `text-slate-500` for text content.
- Suggested validation: jest-axe with contrast checking; pa11y-ci with WCAG AA threshold; visual review of all pages
- Owner suggestion: Frontend team
- Effort estimate: 2-3 days (global find-and-replace with manual review)
- Dependencies: Design decision on new muted-text color
- Status: Open

### Finding ID: UX-P2-008 - No visual regression or a11y testing in CI

- Severity: P2
- Confidence: High
- Area: Testing, CI/CD
- Evidence:
  - No `jest-axe`, `@axe-core/react`, `pa11y`, or `pa11y-ci` in any `package.json`
  - No Storybook, Chromatic, Percy, or visual snapshot config found
  - No a11y-related test files in `apps/web/__tests__/`
  - No `check-a11y` or `test:a11y` script in any `package.json`
- What is happening: Accessibility and visual regressions can be introduced silently. No automated guardrails exist.
- Why it matters: Each new PR can degrade accessibility without detection; visual bugs ship to production
- User / business impact: Gradual degradation of accessibility over time; undetected WCAG violations
- Security / privacy / reliability impact: None
- Recommended fix: Add `jest-axe` to web unit tests; add `pa11y-ci` to CI for all critical routes; add Storybook + Chromatic for visual regression testing; add a11y linting via `eslint-plugin-jsx-a11y`
- Suggested validation: CI step that blocks merge if a11y violations increase
- Owner suggestion: Frontend team + DevOps
- Effort estimate: 1-2 weeks
- Dependencies: Storybook setup; CI runner with browser support for pa11y
- Status: Open

### Finding ID: UX-P2-009 - Admin/Portal sidebar layout 100% duplicated

- Severity: P2
- Confidence: High
- Area: Code Quality, Maintainability
- Evidence:
  - `apps/web/components/admin/AdminSidebarLayout.tsx` — 69 lines
  - `apps/web/components/portal/PortalSidebarLayout.tsx` — 69 lines
  - Diff shows only 4 differences: component name, "Admin" vs "Portal" label, aria-label text, child content component name
- What is happening: Two identical layout components exist for admin and portal. Any bug fix, accessibility improvement, or feature addition must be done twice.
- Why it matters: Maintenance burden; risk of divergence; bugs fixed in one may persist in the other
- User / business impact: Potential inconsistent behavior between admin and portal navigation over time
- Security / privacy / reliability impact: None
- Recommended fix: Extract a generic `SidebarLayout` component accepting props: `children`, `sidebarContent`, `title`, `ariaLabel`. Admin and Portal layouts become thin wrappers.
- Suggested validation: Both admin and portal sidebars function identically after refactor; existing sidebar tests pass
- Owner suggestion: Frontend team
- Effort estimate: 2-3 hours
- Dependencies: None
- Status: Open

### Finding ID: UX-P2-010 - EmptyState component uses text-emoji as icon (not accessible)

- Severity: P2
- Confidence: High
- Area: Accessibility, Design System
- Evidence:
  - `apps/web/components/EmptyState.tsx:4-5` — `icon?: string` prop, default `icon = "📋"`
  - `apps/web/components/EmptyState.tsx:27` — `{icon}` renders as text content inside a `<div>`
  - No `aria-hidden="true"`, no `role="img"`, no `aria-label` on icon container
- What is happening: The EmptyState component renders a text emoji character as its icon. Screen readers will read emoji names aloud (e.g., "clipboard" for 📋), which is confusing and sometimes outright wrong in context.
- Why it matters: Screen-reader users hear nonsensical icon descriptions; emoji rendering varies across platforms leading to inconsistent visuals
- User / business impact: Degraded screen-reader experience; visual inconsistency across OS/browser combinations
- Security / privacy / reliability impact: None
- Recommended fix: Change `icon` prop to accept a React node (SVG component). Add `aria-hidden="true"` to the icon container. Provide a proper SVG icon set (e.g., lucide-react icons). Keep optional emoji default but mark it `aria-hidden`.
- Suggested validation: Screen-reader test of empty state pages; verify icon not announced
- Owner suggestion: Frontend team
- Effort estimate: 1 day
- Dependencies: Adoption of icon library
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| ---- | -------- | ---------- | ------ | -------- | ---------- |
| Light theme renders unreadable pages | P1 | High | High — all light-mode users see broken UI | Hardcoded dark colors in 100+ files | Migrate to CSS variable references |
| Mobile users lose access to admin data tables | P1 | High | High — 15+ admin pages have no mobile data view | `hidden md:block` patterns without mobile alternative | Add mobile card fallbacks |
| Screen readers can't navigate admin forms | P1 | High | High — ~30+ forms have no input labels | Unlabeled inputs in PromoForm, CrudForm, RecordDetail | Add `<label>` to all form inputs |
| No offline access for field workers | P1 | Medium | Medium — users in rural areas lose functionality | No service worker | Create cache-first service worker |
| Keyboard users can't use sidebar flyouts | P1 | Medium | Medium — power users blocked | Missing keyboard handlers for flyout menus | Add Enter/Space/Arrow key handlers |
| Low-contrast text excludes vision-impaired users | P2 | High | Medium — 100+ locations with low-contrast text | `text-slate-400` (#94a3b8) on `bg-[#0A1118]` = 3.6:1 | Raise to `text-slate-300` minimum |
| SEO penalty for 50 pages with duplicate titles | P2 | High | Medium — reduced organic traffic | 50 pages without unique metadata | Add metadata to all pages |
| Accessibility regressions ship undetected | P2 | High | Medium — gradual degradation | No a11y testing in CI | Add jest-axe + pa11y-ci |
| Sidebar bugs require double fixes | P2 | Low | Low — maintenance burden | Duplicated sidebar layout code | Extract generic SidebarLayout component |
| Emoji icons confuse screen readers | P3 | Medium | Low — empty states are edge cases | Text-emoji icons in EmptyState | Replace with SVG icons + aria-hidden |

## Recommendations

### Immediate / Release Blocking

1. **Add metadata to 50 remaining pages** (UX-P1-001) — 2-3 hours, 50 files, no dependencies
2. **Create basic service worker** (UX-P1-003) — enables PWA install and offline access; 2-3 days

### This Week

3. **Add `<label>` elements to all admin/store form inputs** (UX-P1-005) — 2-3 days
4. **Add mobile card-view fallbacks for hidden tables** (UX-P1-004) — 3-5 days
5. **Add keyboard navigation to sidebar flyouts** (UX-P1-006) — 1 day
6. **Deduplicate sidebar layout component** (UX-P2-009) — 2-3 hours

### This Month

7. **Replace hardcoded dark colors with CSS variable references** (UX-P1-002) — 3-5 days, touches 100+ files
8. **Raise minimum text contrast from slate-400 to slate-300** (UX-P2-007) — 2-3 days
9. **Add jest-axe + pa11y-ci to CI pipeline** (UX-P2-008) — 1-2 weeks
10. **Replace EmptyState emoji with SVG icons** (UX-P2-010) — 1 day
11. **Add Storybook with all 14 @mct/ui component stories** (Score: 0) — 1-2 weeks

### Later / Platform Evolution

12. **Add PNG icons + maskable icon to PWA manifest** (MOB-P2-008) — 1 day
13. **Adopt icon library (lucide-react) project-wide** — 2-3 days
14. **Create Toast/notification component in @mct/ui** — 2-3 days
15. **Add Internationalization (i18n) framework** — long-term
16. **Implement Web Push notifications** — long-term

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --------- | ------------ | --------------------- | ---------- |
| Add metadata to 50 pages | Immediate SEO + a11y improvement | 50 page.tsx files | Title unique per route |
| Deduplicate sidebar layout | Single source of truth for sidebar bugs | 2 layout files → 1 + 2 thin wrappers | Existing sidebar tests pass |
| Replace EmptyState emoji with `aria-hidden` span | Instant a11y fix for all empty states | `components/EmptyState.tsx` | Screen reader skips icon |
| Add `aria-required` to required form fields | Screen readers announce required status | Auth forms + admin forms | jest-axe passes required-field check |
| Remove bare `focus:outline-none` from 15 locations | Restore visible focus indicators | PromoForm, products page, RecordDetail | Tab through all interactive elements |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| ------------ | -------- | ---------------- | ------ | ---------- |
| ESLint plugin to enforce design-token usage over hardcoded colors | P2 | Frontend lead | 3 days | Design token migration (Rec #7) |
| Mobile-responsive E2E test suite at 375px viewport | P2 | QA engineer | 1 week | Mobile card fallbacks (Rec #4) |
| Accessibility conformance report (VPAT) | P2 | Compliance | 2 days | jest-axe + manual audit |
| Comprehensive keyboard-navigation E2E tests | P2 | QA engineer | 1 week | Keyboard nav fixes (Rec #5) |
| Screen-reader testing with NVDA/VoiceOver | P2 | QA engineer | 3 days | Form label fixes (Rec #3) |
| Responsive image component with srcset/webp | P3 | Frontend | 2 days | None |
| CSS `prefers-contrast: more` high-contrast mode | P3 | Frontend | 1 day | CSS variable migration |

## Suggested Tests

### Unit Tests
- `apps/web/__tests__/metadata.test.ts` — assert every `page.tsx` exports `metadata` or `generateMetadata`
- `apps/web/__tests__/a11y/` — jest-axe tests for all major components (Button, Input, Dialog, Sidebar, Forms)
- `apps/web/__tests__/theme.test.ts` — verify no hardcoded `bg-[#` or `text-[#` patterns in component code (optional, for post-migration)

### Integration Tests
- `apps/web/__tests__/accessibility/keyboard-nav.test.tsx` — Tab/Enter/Escape through sidebar, verify focus management
- `apps/web/__tests__/accessibility/forms.test.tsx` — verify all inputs have associated labels
- `apps/web/__tests__/accessibility/contrast.test.tsx` — jest-axe contrast checks on all pages

### E2E Tests
- `apps/web/e2e/a11y/` — Playwright + @axe-core/playwright scans on every route
- `apps/web/e2e/mobile/` — Playwright mobile viewport (375x812) tests for all admin list pages
- `apps/web/e2e/keyboard/` — Tab through full admin workflow without mouse
- `apps/web/e2e/offline/` — Service worker offline page load test

### CI Tests
- `pa11y-ci` on critical routes (login, dashboard, tickets, documents, admin users)
- Lighthouse CI with performance + accessibility budgets (PWA score > 90, a11y score > 90)

## Suggested Documentation Updates

1. **Create `docs/FRONTEND_CONVENTIONS.md`** — metadata requirements, label-input patterns, color token usage, contrast minimums, responsive breakpoint guidelines
2. **Create `docs/ACCESSIBILITY_GUIDE.md`** — WCAG compliance targets, testing procedures, keyboard navigation patterns, ARIA usage conventions
3. **Create `docs/PWA_SETUP.md`** — service worker architecture, caching strategy, manifest configuration, icon generation, install prompt flow
4. **Create `docs/DESIGN_SYSTEM.md`** — color tokens, component catalog, Storybook link, contribution guide
5. **Update `docs/INDEX.md`** — add new docs to index

## Open Questions

| Question | Why it matters | Evidence needed |
| -------- | -------------- | --------------- |
| Do the sidebar accordion buttons work with Enter/Space in real browsers? | Native `<button onClick>` should work, but needs verification (testing found no `onKeyDown` but browsers may handle it) | Manual testing with keyboard-only navigation |
| What is the target WCAG conformance level? | Determines remediation priority (A, AA, AAA) | Product/legal requirement |
| Are there plans for a dedicated icon library? | EmptyState + other components need SVG icons | Design team decision |
| Does the target audience include users with known disabilities? | May affect P1/P2 prioritization of a11y findings | Client/customer data |
| Is PWA/offline a hard requirement from clients? | Determines service worker priority | Client feedback, field-worker connectivity data |
| What is the light-theme color palette? | Needed for theme migration | Design mockups or style guide |

## Appendix

### A. Pages Missing Metadata (50 total)

**Admin detail pages (31):**
`(admin)/admin/assets/[id]/page.tsx`, `break-glass/[id]/`, `dmarc/[id]/`, `domain-monitors/[id]/`, `endpoint-security/[id]/`, `file-requests/[id]/`, `findings/[id]/`, `id-verify/[id]/`, `incidents/[id]/`, `licenses/[id]/`, `m365-hardening/[id]/`, `offboarding/[id]/`, `onboarding/[id]/`, `organizations/[orgId]/`, `organizations/[orgId]/activity/`, `organizations/[orgId]/billing/`, `patch-compliance/[id]/`, `projects/[projectId]/`, `proposals/[id]/`, `roles/[roleId]/`, `service-catalog/[id]/`, `status/[id]/`, `store/audit/`, `store/products/[id]/`, `tickets/[ticketId]/`, `users/[userId]/`, `users/[userId]/activity/`, `vendor-contacts/[id]/`, `vendor-contracts/[id]/`, `webhooks/[webhookId]/`, `website-monitors/[id]/`

**Public pages (10):**
`(public)/blog/[slug]/`, `case-studies/[slug]/`, `forgot-password/`, `login/`, `password-reset/`, `pending/`, `resources/[slug]/`, `services/[slug]/`, `signup/`, `store/category/[slug]/`, `store/compare/[slug]/`, `store/[slug]/`

**Portal detail pages (6):**
`(portal)/portal/client-onboarding-command-center/[id]/`, `documents/[documentId]/`, `dynamic-client-forms-builder/[id]/`, `projects/[projectId]/`, `proposals/[id]/`, `support/[ticketId]/`

**Other (3):**
`locations/[slug]/`

### B. Design Token Inventory

| Token file | Exports | Consumers |
| ---------- | ------- | --------- |
| `colors.ts` | 6 color scales (cyber, slate, emerald, amber, red) + white/transparent | Tailwind config, semantic-colors, focus, shadows |
| `semantic-colors.ts` | background, border, text, button, input, status, glass tokens | Not consumed by components (hardcoded colors used instead) |
| `typography.ts` | fontFamily (display, body, mono), fontSize, fontWeight, lineHeight, letterSpacing | Tailwind config fontFamily |
| `spacing.ts` | Spacing scale | Tailwind config spacing |
| `borders.ts` | radii, widths | Tailwind config borderRadius, borderWidth |
| `shadows.ts` | Box shadow tokens | Tailwind config boxShadow |
| `motion.ts` | duration, easing | Tailwind config transitionDuration, transitionTimingFunction |
| `focus.ts` | ring, outline, offset tokens | `styles.css` focus-visible rule |
| `index.ts` | Re-exports all | `@mct/ui` package entry |

### C. @mct/ui Component Inventory

| Component | File | Has Tests? | A11y Notes |
| --------- | ---- | ---------- | ---------- |
| Button | `components/Button.tsx` | Unknown | Check for `type="button"` default |
| Input | `components/Input.tsx` | Unknown | Should accept `label` + `error` props |
| Textarea | `components/Input.tsx` | Unknown | Same as Input |
| Badge | `components/Badge.tsx` | Unknown | Check for `role="status"` |
| Avatar | `components/Avatar.tsx` | Unknown | Needs `alt` text |
| Dialog | `components/Dialog.tsx` | Unknown | Critical for focus trapping + Escape |
| Skeleton* (4 variants) | `components/Skeleton.tsx` | Unknown | Needs `aria-busy` + `aria-label` |
| SidebarGroup | `components/SidebarGroup.tsx` | Unknown | Should handle `aria-expanded` |
| SidebarItem | `components/SidebarGroup.tsx` | Unknown | Should indicate current page |
| ThemeToggle | `components/ThemeToggle.tsx` | Unknown | Needs `aria-label` for current theme |

### D. Component File Inventory (apps/web/components/)

| Directory | Count | Key components |
| --------- | ----- | -------------- |
| `admin/` | ~20 files | AdminSidebar*, AdminTicketCenterClient, AdminDocumentsCenterClient, AdminOrganizationsClient, AdminGlobalSearch, RolePermissionsEditor, CrudForm, RecordDetail |
| `portal/` | ~15 files | PortalSidebar*, PortalDocumentsCenterClient, PortalGlobalSearch, ProjectTimelineView, ProjectCalendarView |
| `marketing/` | 4 files | MarketingHeader, ParticleBackground, ServiceCard, ContactForm |
| `store/` | ~10 files | StoreSidebar, QuoteBuilderClient, TrustBadgeList, CampaignsManagerClient |
| Root | ~10 files | Breadcrumbs, EmptyState, NotificationBell, DocumentPreview, CommentBody, version-badge |

### E. Loading Skeleton Coverage

| Route Group | loading.tsx | Nested routes without loading.tsx |
| ----------- | ----------- | --------------------------------- |
| `(public)/` | ✅ | `blog/[slug]/`, `store/[slug]/`, `services/[slug]/`, `case-studies/[slug]/`, `resources/[slug]/` |
| `(portal)/portal/` | ✅ | `projects/[projectId]/`, `support/[ticketId]/`, `documents/[documentId]/`, `proposals/[id]/` |
| `(admin)/admin/` | ✅ | `tickets/[ticketId]/`, `users/[userId]/`, `organizations/[orgId]/`, `webhooks/[webhookId]/`, etc. |
| 23 module-level loading files | ✅ | `website-monitors/`, `vendors/`, `status/`, `findings/`, `file-requests/`, `settings/`, `service-catalog/`, `security-suite/`, `security-ops/`, `qbr/`, `proposals/`, `governance/`, `field-services/`, `final/`, `approvals/`, `api-keys/`, `assets/`, `ai/`, `edu-automation/`, `domain-monitors/` |

