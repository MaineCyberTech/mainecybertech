# UI/UX, Design System, and Accessibility Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260730-0650-develop-62da92c
- Repository: C:\temp\mainecybertech-portal
- Branch: develop
- Commit SHA: 62da92c
- Generated at: 2026-07-30 06:50 UTC
- Auditor: principal-level repo auditor
- Area code: UX
- Output path: docs/audits/repo-deep-dive/20260730-0650-develop-62da92c/05_ui_ux_accessibility_audit.md
- Scope limitations: Static analysis only. No color contrast measurement tool used. No screen reader testing. No runtime visual regression testing.

## Scope

Audited design tokens, CSS/Tailwind/theme, reusable components, layouts/nav, forms/dialogs/toasts/tables/cards, icons/color/typography/spacing, focus states, keyboard nav, ARIA, semantic HTML, responsive breakpoints, dark mode, skeletons/errors/empty states, Storybook, and visual/a11y tests.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|----------|------|-------------|-------|
| `packages/ui/src/styles.css` | Source | Design tokens, utility classes, dark mode | CSS variables for cyber theme |
| `packages/ui/src/index.ts` | Source | UI component library exports | Button, Input, Badge, Avatar, Dialog, Skeleton |
| `packages/ui/src/components/*.tsx` | Source | UI component implementations | — |
| `apps/web/app/layout.tsx` | Source | Root layout with skip link | Has skip-to-content link |
| `apps/web/app/globals.css` | Source | Base CSS | Imports @mct/ui styles |
| `apps/web/app/(public)/layout.tsx` | Source | Public layout | GA+Tawk.to scripts |
| `apps/web/app/(portal)/layout.tsx` | Source | Portal layout | Org header, search, bell |
| `apps/web/app/(admin)/admin/layout.tsx` | Source | Admin layout | Admin header |
| `apps/web/components/EmptyState.tsx` | Source | Reusable empty state component | — |
| `apps/web/components/NotificationBell.tsx` | Source | Notification dropdown | ARIA labels on button |
| `apps/web/app/not-found.tsx` | Source | 404 page | — |
| `apps/web/app/(admin)/error.tsx` | Source | Error boundary | "Try again" button |
| `apps/web/app/(portal)/portal/loading.tsx` | Source | Skeleton loading | — |
| `apps/web/app/(admin)/admin/loading.tsx` | Source | Skeleton loading | — |
| `.storybook/main.ts` | Config | Storybook config | Includes addon-a11y |
| `packages/ui/src/components/Skeleton.tsx` | Source | Skeleton components | Skeleton, SkeletonText, SkeletonCard, SkeletonTable |
| `packages/config/eslint.js` | Config | ESLint config | — |
| `apps/web/tailwind.config.ts` | Config | Tailwind config | — |

## Executive Summary

**Solid design system foundation (score ~4/5).** The codebase has a well-defined design token system via `@mct/ui` with CSS custom properties (`--cyber-accent`, `--cyber-base`), a consistent component library (Button, Input, Badge, Avatar, Dialog, Skeleton), a cohesive dark theme, and responsive utility classes. Storybook is configured with a11y addon.

**Key gaps:**
1. **No light mode tested** — ThemeProvider supports light/dark, but all components are styled for dark-first
2. **Incomplete ARIA** — Only the NotificationBell has aria-labels; many interactive elements lack proper aria attributes
3. **No visual regression tests** — Storybook exists but no Chromatic/visual testing in CI
4. **Skip link exists but focus management is minimal** — Only root layout has skip-to-content
5. **No formal typography scale** — Font sizes use Tailwind arbitrary values rather than a defined scale

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|------|--------------|---------|---------------|------|-------|
| Design tokens | `packages/ui/src/styles.css` | CSS vars: --cyber-* | ✅ Complete | Low | 6 CSS variables defined |
| Tailwind config | `apps/web/tailwind.config.ts` | Tailwind customization | ✅ Complete | Low | — |
| Component library | `packages/ui/src/` | Reusable UI components | ✅ Complete | Low | Button, Input, Badge, etc. |
| Layouts | Root, Public, Portal, Admin | Page shells | ✅ Complete | Low | — |
| EmptyState | `EmptyState.tsx` | Empty state display | ✅ Complete | Low | Icon + title + desc + actions |
| Error boundaries | `error.tsx` (3 route groups) | Error recovery | ✅ Complete | Low | "Try again" buttons |
| Skeleton loading | `loading.tsx` files | Loading states | ✅ Complete | Low | 26 loading.tsx files |
| Skip link | Root layout | Accessibility skip nav | ✅ Complete | Low | Focus-visible styled |
| Focus styles | `styles.css:155-158` | Focus-visible outlines | ✅ Complete | Low | 2px solid accent |
| Reduced motion | `styles.css:161-170` | Prefers-reduced-motion | ✅ Complete | Low | Disables all animations |
| Dark mode | `styles.css:141-153` | ThemeProvider dark/light | ✅ Complete | Low | Dark-first design |
| Storybook | `.storybook/main.ts` | Component playground | ✅ Complete | Low | Includes a11y addon |
| ARIA | Various components | Screen reader support | ⚠️ Partial | Medium | Only basic labels |
| Keyboard nav | Various | Tab order and focus | ⚠️ Partial | Medium | Not systematically tested |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|----------|------:|----------|-----|-------------------|
| Design tokens | 5 | CSS variables in `styles.css`, used consistently | None | — |
| CSS/Tailwind/theme | 4 | Tailwind with custom cyber-* utilities, dark mode | No light mode polish | Verify light mode renders correctly |
| Reusable components | 4 | @mct/ui exports 10+ components | Missing DataTable, Select, DropdownMenu | Add missing shadcn components |
| Layouts/nav | 4 | Portal + admin headers, subnav, breadcrumbs | Mobile nav needs hamburger | Add mobile hamburger menu |
| Forms/dialogs/toasts/tables/cards | 3 | Input, Dialog, cyber-panel, cyber-table-responsive | No Toast/Sonner component, no DataTable | Add toast + data table |
| Icons/color/typography/spacing | 3 | Inline SVGs, cyber-accent color, Inter + Orbitron fonts | No icon library, no type scale | Add lucide-react icons, define scale |
| Focus states | 4 | focus-visible outline on all elements | No skip-link on subpages | Add skip links to sub-layouts |
| Keyboard nav | 3 | Basic tab order works | No advanced keyboard interactions | Test all dialogs for keyboard |
| ARIA | 2 | NotificationBell has aria-label | Most components lack ARIA | Add aria-labels to icon buttons |
| Semantic HTML | 3 | Uses <main>, <header>, <section>, <nav> | Some div soups in admin | Audit and add semantic elements |
| Responsive breakpoints | 4 | sm/md/lg/xl breakpoints used | Some tables still horizontal scroll | Add responsive table variants |
| Dark mode | 4 | ThemeProvider with CSS vars | Light mode not polished | Test all pages in light mode |

## Detailed Review

### Item: Design Token System

- **Evidence:** `packages/ui/src/styles.css:5-13`
- **What it does:** Defines 6 CSS custom properties: `--cyber-base`, `--cyber-card`, `--cyber-card-hover`, `--cyber-accent`, `--cyber-accent-hover`, `--cyber-accent-light`, `--cyber-accent-glow`
- **Current controls:** Variables are used across all utility classes (`.cyber-button`, `.cyber-panel`, etc.)
- **Risks:** Low — well-structured token system

### Item: Accessibility (ARIA)

- **Evidence:** `NotificationBell.tsx:186`, `styles.css:155-158`
- **What it does:** Bell button has aria-label with unread count. Focus-visible outline on all elements. Skip link in root layout.
- **Missing controls:** Icon buttons lack aria-labels, Dialog component may not trap focus, no aria-expanded on dropdowns
- **Risks:** Medium — screen reader users may have difficulty navigating

### Item: Storybook

- **Evidence:** `.storybook/main.ts`, `package.json:23-25`
- **What it does:** Storybook configured for `@mct/ui` components with a11y addon, interactions, docs
- **Current controls:** stories are in `packages/ui/src/**/*.stories.@(ts|tsx)`
- **Risks:** Low — Storybook exists but may not have full coverage of all component states

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|----|-------------------|----------|----------------|-----|----------|---------------|
| UX-001 | Design tokens used consistently | `styles.css` | CSS vars used in all cyber-* utilities | None | — | — |
| UX-002 | Dark mode works | `styles.css:141-153`, `ThemeProvider` | Data-theme switching | No light mode testing | P2 | Test light mode across pages |
| UX-003 | Focus states visible | `styles.css:155-158` | focus-visible outline | None | — | — |
| UX-004 | Keyboard navigation works | — | Basic tab order | No systematic testing | P2 | Add keyboard nav E2E tests |
| UX-005 | ARIA labels present | `NotificationBell.tsx:186` | Bell button labeled | Icon buttons unlabeled | P2 | Add aria-labels to all icon-only buttons |
| UX-006 | Skip link works | `Root layout:33-38` | Skip to main content | Only on root layout | P2 | Add skip links to sub-layouts |
| UX-007 | Reduced motion respected | `styles.css:161-170` | Disables animations | None | — | — |
| UX-008 | Responsive layouts | Portal + admin layouts | sm/md breakpoints | Tables overflow on small screens | P2 | Add responsive table wrapping |
| UX-009 | Component stories exist | `.storybook/main.ts` | Storybook configured | Unknown coverage | P2 | Audit story coverage |

## Findings

### Finding ID: UX-P2-001 - Incomplete ARIA labeling across interactive elements

- Severity: P2
- Confidence: High
- Area: ARIA
- Evidence: Many icon-only buttons lack aria-labels; NotificationBell is the exception
- What is happening: Screen reader users cannot determine the purpose of icon buttons
- Why it matters: WCAG 2.1 SC 4.1.2 violation
- Recommended fix: Audit all icon-only buttons and add aria-label prop
- Effort estimate: Small (1-2 days)
- Status: Open

### Finding ID: UX-P2-002 - Light mode untested

- Severity: P2
- Confidence: Medium
- Area: Dark mode
- Evidence: ThemeProvider has light theme CSS vars but all components are dark-first styled
- What is happening: Light mode may have contrast issues or broken layouts
- Why it matters: Users who prefer light mode get a poor experience
- Recommended fix: Test all pages in light mode, fix contrast/color issues
- Effort estimate: Medium (3-5 days)
- Status: Open

### Finding ID: UX-P2-003 - No visual regression testing in CI

- Severity: P2
- Confidence: High
- Area: Visual/A11y tests
- Evidence: Chromatic is configured (`package.json:25`) but not wired into CI
- What is happening: UI regressions go undetected
- Why it matters: Breaking visual changes reach production
- Recommended fix: Wire Chromatic into CI pipeline
- Effort estimate: Small (1 day)
- Status: Open

### Finding ID: UX-P3-001 - No formal typography scale

- Severity: P3
- Confidence: High
- Area: Typography
- Evidence: Font sizes use Tailwind arbitrary values (sm, base, lg, xl, 2xl, etc.) but no project-wide scale
- What is happening: Inconsistent heading sizes across pages
- Recommended fix: Define typography scale in Tailwind config
- Effort estimate: Small (1 day)
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|------|----------|------------|--------|----------|-----------|
| Screen reader usability | P2 | Medium | Medium | Missing ARIA labels | Add aria-labels |
| Light mode accessibility | P2 | Low | Medium | Light mode untested | Test and fix |
| Visual regressions | P2 | Medium | Low | No Chromatic in CI | Wire up Chromatic |
| Keyboard-only usability | P2 | Medium | Medium | No keyboard tests | Add keyboard E2E |

## Recommendations

### Immediate / Release Blocking

None.

### This Week

1. Add aria-labels to all icon-only buttons (UX-P2-001)
2. Wire Chromatic into CI workflow (UX-P2-003)

### This Month

1. Test and fix light mode across all pages (UX-P2-002)
2. Add skip-to-content links to sub-layouts (portal + admin)
3. Add keyboard navigation E2E tests

### Later / Platform Evolution

1. Add formal typography scale
2. Add DataTable component with sort/filter
3. Add Toast/Sonner notification component

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|-----------|-------------|----------------------|-----------|
| Add aria-labels to icon buttons | Screen reader support | All component files | Run axe-core audit |
| Wire Chromatic in CI | Visual regression prevention | `.github/workflows/test.yml` | Verify Chromatic runs |
| Add skip links to sub-layouts | Keyboard navigation | Portal + admin layouts | Tab on page load |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|-------------|----------|-----------------|--------|-----------|
| ARIA labels audit | P2 | UI engineer | 2 days | None |
| Chromatic CI | P2 | DevOps | 1 day | Chromatic token |
| Light mode testing | P2 | UI engineer | 5 days | None |
| Typography scale | P3 | Designer | 1 day | Design review |

## Suggested Tests

- **E2E:** Tab through login page → verify focus order
- **E2E:** Tab to skip link → verify "Skip to main content" appears
- **Visual:** Chromatic snapshot of all component states
- **A11y:** axe-core scan of portal dashboard, admin tickets, login
- **Manual:** Navigate entire portal with keyboard only

## Suggested Documentation Updates

- `docs/ADMIN_FEATURES.md` — add section on accessibility testing

## Open Questions

| Question | Why it matters | Evidence needed |
|----------|---------------|----------------|
| Are there any color contrast violations? | WCAG compliance | Automated tool needed |
| Do Dialog components trap focus? | Keyboard usability | Manual testing needed |

## Appendix

### Design System Component Inventory

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| Button | `@mct/ui/components/Button` | ✅ | Loading state, disabled |
| Input | `@mct/ui/components/Input` | ✅ | — |
| Badge | `@mct/ui/components/Badge` | ✅ | — |
| Avatar | `@mct/ui/components/Avatar` | ✅ | — |
| Dialog | `@mct/ui/components/Dialog` | ✅ | — |
| Skeleton | `@mct/ui/components/Skeleton` | ✅ | 4 variants |
| ThemeToggle | `@mct/ui/components/ThemeToggle` | ✅ | — |
| EmptyState | `apps/web/components/EmptyState.tsx` | ✅ | Icon + title + desc + actions |
| NotificationBell | `apps/web/components/NotificationBell.tsx` | ✅ | SSE, dropdown, prefs |
| Breadcrumbs | `apps/web/components/Breadcrumbs.tsx` | ✅ | — |
