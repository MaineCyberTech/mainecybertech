# Mobile, PWA, and Responsive Access Audit

**Run ID:** `20260728-0142-develop-21a10d6`
**Finding Area Code:** MOB

## Executive Summary

**Overall: 3/10.** No PWA capabilities — no web app manifest, no service worker, no offline support, no installability. Functional on mobile via responsive Tailwind CSS. Push notifications approximated via SSE with 30s polling. Significant gaps in mobile UX patterns.

**17 findings** (2 Critical, 3 High, 7 Medium, 4 Low, 1 Info)

## Critical Findings

### MOB-001: No PWA Web App Manifest

**Severity:** CRITICAL
**Evidence:** No `manifest.json` or `manifest.webmanifest` anywhere in repo. Root layout metadata has no `manifest` property.
**Recommendation:** Create `public/manifest.json` with name, short_name, description, start_url, display: standalone, icons, theme_color.

### MOB-002: No Service Worker

**Severity:** CRITICAL
**Evidence:** No `sw.js`, no `navigator.serviceWorker.register()`, no offline caching.
**Recommendation:** Implement Workbox/Serwist service worker with precaching, offline fallback page.

## High Findings

- **MOB-003:** Missing viewport meta tag in root layout (Next.js default may cover, but explicit config recommended)
- **MOB-004:** No theme-color, missing apple-touch-icon.png, no splash screen metadata
- **MOB-005:** No push notification support (Web Push API not implemented)

## Medium Findings

- **MOB-006:** VersionBadge fixed position overlaps content on mobile
- **MOB-007:** Portal Subnav: 35+ items in horizontal scroll strip
- **MOB-008:** Admin Subnav dividers rendered inline in mobile scroll
- **MOB-009:** Small touch targets below 44px WCAG recommendation (toggles, badges, selects)
- **MOB-010:** No offline fallback or network status detection

## Priority Recommendations

### P0

1. Create `public/manifest.json` with app metadata
2. Implement service worker with Workbox

### P1

3. Add viewport config to root layout
4. Add theme-color and missing apple-touch-icon
5. Implement Web Push with VAPID keys

### P2

6. Hide VersionBadge on mobile (`hidden sm:block`)
7. Collapsible subnav on mobile with grouped items
8. Audit and increase touch targets to 44px minimum
