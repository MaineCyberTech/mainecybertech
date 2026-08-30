# Mobile, PWA, and Responsive Access Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260730-0650-develop-62da92c
- Repository: C:\temp\mainecybertech-portal
- Branch: develop
- Commit SHA: 62da92c
- Generated at: 2026-07-30 06:50 UTC
- Auditor: principal-level repo auditor
- Area code: MOB
- Output path: docs/audits/repo-deep-dive/20260730-0650-develop-62da92c/17_mobile_pwa_responsive_access.md
- Scope limitations: Static analysis only. No real mobile device testing. No Lighthouse audit run. No PWA installability test.

## Scope

Audited viewport, responsive layouts, mobile nav, touch targets, mobile forms, mobile dialogs/tables, auth/dashboard/admin mobile views, PWA manifest, service worker, offline fallback, install prompt, push notifications, icons, cache strategy, update flow, background sync, mobile E2E tests, and touch accessibility.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|----------|------|-------------|-------|
| `apps/web/app/layout.tsx` | Source | Root layout — viewport via Next.js, skip link | No explicit viewport meta (Next.js default) |
| `apps/web/app/(portal)/portal/layout.tsx` | Source | Portal layout with responsive classes | sm: breakpoints, flex-wrap, gap adjustments |
| `apps/web/app/(admin)/admin/layout.tsx` | Source | Admin layout | sm:hidden for search, responsive header |
| `apps/web/app/(public)/page.tsx` | Source | Marketing homepage | Many responsive sm: classes |
| `apps/web/middleware.ts` | Source | CSP + nonce for scripts | No device/mobile detection |
| `apps/web/next.config.mjs` | Config | Next.js config | No PWA plugin, no manifest |
| `apps/web/app/(portal)/portal/dashboard/page.tsx` | Source | Portal dashboard | md:flex-row, lg:grid-cols-2, flex-wrap |
| `apps/web/components/NotificationBell.tsx` | Source | Notification bell | Absolute positioning may overflow on mobile |
| `apps/web/components/EmptyState.tsx` | Source | Empty state | Centered, responsive max-w-md |
| `packages/ui/src/styles.css` | Source | CSS utilities | cyber-grid-cards has sm:, xl: grid |
| `apps/web/components/marketing/MarketingHeader.tsx` | Source | Marketing header | Mobile hamburger menu |
| `apps/web/components/marketing/ParticleBackground.tsx` | Source | Particle animation | Heavy on mobile CPU |
| `apps/web/vercel.json` | Config | Vercel config | No PWA/manifest config |
| `apps/web/tailwind.config.ts` | Config | Tailwind breakpoints | Default breakpoints |

## Executive Summary

**Responsive design is functional but incomplete (score ~3/5).** The marketing site has good mobile responsiveness with hamburger menus and responsive grids. The portal and admin layouts use responsive utilities (sm/md/lg breakpoints) with wrap/flex adjustments. However, there is **no PWA support at all** (no manifest.json, no service worker, no offline fallback, no install prompt). Mobile navigation in the portal/admin could be improved with a drawer sidebar.

**Key gaps:**
1. **No PWA manifest** — app is not installable on mobile devices
2. **No service worker** — no offline caching, no background sync
3. **No push notifications** — only in-app SSE + polling
4. **Heavy particle animation on mobile** — ParticleBackground runs on all public pages
5. **Admin global search hidden on mobile** — shown via sm:hidden but occupies full width

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|------|--------------|---------|---------------|------|-------|
| Viewport | `app/layout.tsx` | Default Next.js viewport | ✅ Adequate | Low | No explicit meta but Next.js handles it |
| Responsive layouts | Portal + admin layouts | sm/md/lg breakpoints | ✅ Functional | Low | Mostly flex-wrap + grid |
| Mobile nav | Portal header | OrgSwitcher, bell, profile | ⚠️ Partial | Medium | No mobile drawer sidebar |
| Touch targets | Buttons, inputs | Interactive elements | ✅ Adequate | Low | Standard sizing |
| Mobile forms | Login, signup, profile | Full-width inputs | ✅ Good | Low | Responsive max-w-md |
| Mobile tables | Data tables | Horizontal scroll | ⚠️ Partial | Medium | cyber-table-responsive uses overflow-x-auto |
| PWA manifest | — | Installable web app | ❌ Absent | Medium | No manifest.json |
| Service worker | — | Offline caching | ❌ Absent | High | No offline fallback |
| Offline fallback | — | Graceful offline UI | ❌ Absent | High | No offline detection |
| Install prompt | — | Add to home screen | ❌ Absent | Medium | No beforeinstallprompt handler |
| Push notifications | — | Native push | ❌ Absent | Medium | SSE only |
| Mobile E2E | — | Mobile Playwright tests | ❌ Absent | Medium | No viewport tests |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|----------|------:|----------|-----|-------------------|
| Viewport | 4 | Next.js handles viewport meta | None | — |
| Responsive layouts | 4 | sm/md/lg breakpoints throughout | Some tables need responsive variants | Add responsive table variants |
| Mobile nav | 3 | Portal header is compact | No drawer/mobile sidebar | Add mobile drawer for portal nav |
| Touch targets | 3 | Buttons are 40px+ | Some small dismiss buttons | Increase touch targets |
| Mobile forms | 4 | Full-width, max-w constrained | None | — |
| Mobile dialogs/tables | 2 | cyber-table-responsive exists | Tables still overflow on very small screens | Add card view for mobile tables |
| Auth/dashboard/admin mobile | 3 | Responsive headers, wrap layouts | Admin layout stacks poorly on mobile | Improve admin mobile layout |
| PWA manifest | 0 | No manifest.json | Complete absence | Create manifest.json |
| Service worker | 0 | No SW | Complete absence | Create service worker |
| Offline fallback | 0 | No offline handling | Complete absence | Add offline detection + fallback page |
| Install prompt | 0 | No prompt | Complete absence | Add beforeinstallprompt listener |
| Push notifications | 0 | No push | Complete absence | Add push notification support |

## Detailed Review

### Item: Mobile Navigation

- **Evidence:** `apps/web/app/(portal)/portal/layout.tsx:94-107`, `apps/web/app/(admin)/admin/layout.tsx:38-45`
- **What it does:** Portal header has inline icons (bell, profile, org switcher) in a flex row. Admin layout hides global search on mobile (sm:hidden) and shows it below the header.
- **Missing controls:** No hamburger menu, no drawer sidebar. PortalSubnav items may overflow horizontally (has `overflow-x-auto`).
- **Risks:** Medium — mobile users have limited navigation options

### Item: PWA Manifest

- **Evidence:** No `manifest.json` found at any location in `apps/web/`
- **What is happening:** The app has no web app manifest, so it cannot be installed on mobile home screens
- **Risks:** Medium — users who frequently access the portal cannot add it to their home screen
- **Recommended fix:** Create `public/manifest.json` with app name, icons, theme color, display mode

### Item: Service Worker

- **Evidence:** No service worker file found anywhere
- **What is happening:** No offline caching, no background sync, no push notification support
- **Risks:** High — network failures cause complete app failure

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|----|-------------------|----------|----------------|-----|----------|---------------|
| MOB-001 | Viewport responsive | Root layout | Next.js viewport | None | — | — |
| MOB-002 | Mobile nav works | Portal layout | Inline icon row | No drawer sidebar | P2 | Add mobile hamburger menu |
| MOB-003 | Touch targets adequate | Various | Standard 40px+ | Small dismiss buttons | P3 | Increase dismiss button size |
| MOB-004 | Mobile forms usable | Login, signup, profile | Full-width, max-w-md | None | — | — |
| MOB-005 | Mobile tables scroll | Various | cyber-table-responsive | Overflow on tiny screens | P2 | Add card view for mobile |
| MOB-006 | PWA installable | — | Missing | No manifest.json | P2 | Create manifest.json |
| MOB-007 | Service worker | — | Missing | No SW | P1 | Create SW with cache-first strategy |
| MOB-008 | Offline fallback | — | Missing | No offline page | P1 | Add offline fallback |
| MOB-009 | Push notifications | — | Missing | No push | P2 | Add push notification support |
| MOB-010 | Mobile E2E tests | — | Missing | No mobile viewport tests | P2 | Add Playwright mobile tests |

## Findings

### Finding ID: MOB-P1-001 - No service worker or offline support

- Severity: P1
- Confidence: High
- Area: Offline fallback
- Evidence: No service worker file in repo, no offline detection in any component
- What is happening: Complete network failure causes app to be completely unusable
- Why it matters: Mobile users in areas with poor connectivity lose all access
- User / business impact: MSP clients in rural Maine (primary target market) may experience poor connectivity
- Recommended fix: Create service worker with cache-first strategy for static assets, add offline fallback page
- Effort estimate: Medium (5-7 days)
- Status: Open

### Finding ID: MOB-P2-001 - No PWA manifest or install support

- Severity: P2
- Confidence: High
- Area: PWA manifest
- Evidence: No manifest.json found in apps/web/public
- What is happening: App cannot be installed on mobile devices
- Recommended fix: Create manifest.json with icons, theme_color, display: standalone
- Effort estimate: Small (1 day)
- Status: Open

### Finding ID: MOB-P2-002 - Mobile navigation lacks drawer/hamburger

- Severity: P2
- Confidence: High
- Area: Mobile nav
- Evidence: Portal layout has no drawer/hamburger; PortalSubnav uses overflow-x-auto for horizontal scroll
- What is happening: Portal has many nav sections but no collapsed mobile navigation
- Recommended fix: Add mobile drawer component (can use Dialog from @mct/ui) with all nav links
- Effort estimate: Small (2 days)
- Status: Open

### Finding ID: MOB-P2-003 - No mobile viewport E2E tests

- Severity: P2
- Confidence: High
- Area: Mobile E2E
- Evidence: No Playwright test uses mobile viewport
- What is happening: Mobile layout regressions go undetected
- Recommended fix: Add Playwright tests with iPhone/Android viewport
- Effort estimate: Small (1 day)
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|------|----------|------------|--------|----------|-----------|
| No offline support | P1 | Medium | High | No SW | Create SW with caching |
| No PWA manifest | P2 | Low | Medium | No manifest.json | Create manifest |
| Mobile nav poor UX | P2 | Medium | Medium | No drawer | Add hamburger menu |
| Particle animation on mobile | P2 | High | Low | Runs on all public pages | Disable on mobile |

## Recommendations

### Immediate / Release Blocking

None — mobile responsiveness is functional for core flows.

### This Week

1. Create PWA manifest.json (MOB-P2-001)
2. Add mobile viewport E2E tests (MOB-P2-003)
3. Disable ParticleBackground on mobile devices

### This Month

1. Create service worker with cache-first strategy (MOB-P1-001)
2. Add mobile hamburger drawer for portal navigation (MOB-P2-002)

### Later / Platform Evolution

1. Add push notification support via service worker
2. Add install prompt handler
3. Add offline fallback page
4. Add background sync for form submissions

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|-----------|-------------|----------------------|-----------|
| Create manifest.json | Enables home screen install | `apps/web/public/manifest.json`, `app/layout.tsx` | Lighthouse PWA audit |
| Disable particles on mobile | Reduces CPU/battery drain | `ParticleBackground.tsx` | Check mobile Chrome DevTools |
| Add mobile E2E tests | Prevents mobile regressions | `apps/web/e2e/mobile/` | Run with iPhone viewport |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|-------------|----------|-----------------|--------|-----------|
| Service worker | P1 | Full-stack | 7 days | None |
| PWA manifest | P2 | UI engineer | 1 day | None |
| Mobile nav drawer | P2 | UI engineer | 2 days | None |
| Push notifications | P2 | Full-stack | 5 days | Service worker |
| Offline fallback page | P2 | UI engineer | 2 days | Service worker |

## Suggested Tests

- **E2E:** Set viewport to iPhone 12 → verify portal renders without overflow
- **E2E:** Set viewport to iPad → verify table displays correctly
- **Manual:** Add to home screen on Android → verify standalone mode
- **Manual:** Enable airplane mode → verify offline fallback

## Suggested Documentation Updates

- `docs/ENVIRONMENT_VARIABLES.md` — add any PWA-related env vars
- Create `docs/PWA_IMPLEMENTATION.md` when service worker is added

## Open Questions

| Question | Why it matters | Evidence needed |
|----------|---------------|----------------|
| What is the mobile usage share? | Prioritization | Analytics data needed |
| Are there any budget constraints for PWA? | Feasibility | Product decision |

## Appendix

None.
