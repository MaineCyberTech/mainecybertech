# 17_mobile_pwa_responsive_access — Prompt 17 - Mobile, PWA, and Responsive Access Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `17_mobile_pwa_responsive_access.md` (area MOB, prompt)

## Verification Performed

Domain subagent produced 11 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| MOB-P2-001 | P2 | Service worker apps/web/public/sw.js is never registered, so PWA/offline support is inert |
| MOB-P2-002 | P2 | sw.js cache strategy would persist authenticated API responses and all GET 200s if registered as-is |
| MOB-P2-003 | P2 | No mobile-viewport E2E or accessibility coverage (Desktop Chrome only) |
| MOB-P2-004 | P2 | About 41% of form controls render below 16px and trigger iOS Safari focus zoom |
| MOB-P2-005 | P2 | Several modal dialogs have no max-height or vertical scroll and clip on small screens |
| MOB-P3-001 | P3 | PWA manifest ships only an SVG icon and is duplicated across three sources |
| MOB-P3-002 | P3 | Icon-only controls have touch targets well below the 44x44 recommendation |
| MOB-P3-003 | P3 | Notification dropdown is a fixed 320px panel anchored right-0 and clips on narrow phones |
| MOB-P3-004 | P3 | themeColor is declared in the deprecated metadata export, so the theme-color meta tag is not emitted |
| MOB-P3-005 | P3 | favicon.ico contains SVG bytes and no apple-touch-icon is declared |
| MOB-P3-006 | P3 | Mobile-WebKit horizontal overflow on /login, /store and /store/quote is acknowledged but fixme'd out of the mobile gate |
