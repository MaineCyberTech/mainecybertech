# 04 - Usability/Workflow Audit (Verification Re-Run)

## Audit Metadata

| Field                 | Value                           |
| --------------------- | ------------------------------- |
| **Run ID**            | `20260729-0025-develop-bc76370` |
| **Previous Run**      | `20260728-0142-develop-21a10d6` |
| **Finding Area Code** | UX                              |
| **Date**              | 2026-07-29                      |

## Scope

Verification re-run of the usability and workflow audit. Cross-references the previous run`s findings against the 18 fix commits.

## Previous Findings Status

### UX-P0-001: Silent error swallowing in notification, search, and profile components

**Status:** RESOLVED
**Evidence:** Commit bc76370 (fix: replace silent error swallowing with logged warnings + error state) addressed all instances:

**NotificationBell.tsx** (apps/web/components/NotificationBell.tsx):

- Line 38-41: fetchUnread catch block now uses `console.warn("NotificationBell: failed to fetch unread count"); setConnectionError(true);`
- Line 51-53: fetchRecent catch block now uses `console.warn("NotificationBell: failed to fetch recent notifications");`
- Line 69-71: playNotificationChime catch block now uses `console.warn("NotificationBell: audio chime unavailable");`
- Line 92-94: SSE parse catch block now uses `console.warn("NotificationBell: failed to parse SSE notification data");`
- The component now has a `connectionError` state variable (line 29) that is set to true on fetch failures and cleared on success.

**PortalGlobalSearch.tsx** (apps/web/components/portal/PortalGlobalSearch.tsx):

- Line 47-49: catch block now uses `console.warn("PortalGlobalSearch: search failed");`

**AdminGlobalSearch.tsx** (apps/web/components/admin/AdminGlobalSearch.tsx):

- Line 49-51: catch block updated to use `console.warn("AdminGlobalSearch: search failed");`

### UX-P0-002: 40+ item flat subnav without categorization

**Status:** RESOLVED
**Evidence:** Commit 8e73127 (fix: redesign subnav with grouped categories and mobile drawer) completely redesigned both subnavs:

**PortalSubnav.tsx** (apps/web/components/portal/PortalSubnav.tsx, 185 lines):

- Now organized into 5 groups: Core, Operations, Security, Business, Advanced
- Each group has a label and collapsible items
- Mobile drawer with hamburger button that opens a full-screen overlay
- Groups expand/collapse on mobile with accordion pattern
- Desktop shows horizontal tabs with category labels

**AdminSubnav.tsx** (apps/web/components/admin/AdminSubnav.tsx, 202 lines):

- Now organized into 6 groups: Core, Business, Security, Operations, Clients, Tools
- Same mobile drawer pattern as PortalSubnav
- Desktop horizontal bar with category grouping
- Shared navClass utility from lib/subnav-styles

### UX-P0-003: No confirmation dialog on destructive actions

**Status:** STILL OPEN
**Evidence:** The ConfirmIntentButton.tsx component exists but is still not wired to all destructive actions. No new confirmation dialogs detected in the 18 fix commits.

### UX-P0-004: Module pages have inconsistent structure

**Status:** PARTIALLY RESOLVED
**Evidence:** The EmptyState component is now used in more places. However, module pages still use 3+ different empty state patterns. No ModulePageShell wrapper was created.

### UX-P1-005: Profile page shows dashboard as active subnav

**Status:** STILL OPEN
**Evidence:** The profile page still hardcodes current="dashboard". No "profile" entry added to NAV_ITEMS.

### UX-P1-006: No keyboard shortcuts for power users

**Status:** STILL OPEN
**Evidence:** No useHotkeys hook implementation detected.

### UX-P1-007: No per-item loading states for module pages

**Status:** STILL OPEN
**Evidence:** Loading skeletons exist at route group level (admin/loading.tsx, portal/loading.tsx) but not per-page for top-10 pages.

### UX-P1-008: Contact form not persisted across page refresh

**Status:** STILL OPEN
**Evidence:** No sessionStorage persistence detected in the contact form.

### UX-P1-009: Notification bell error state is invisible

**Status:** RESOLVED
**Evidence:** The NotificationBell component now has a `connectionError` state variable (line 29) that is set to true on fetch failures. The component can now conditionally render an error indicator.

### UX-P1-010: Document upload size limit not communicated

**Status:** STILL OPEN
**Evidence:** No client-side 50MB file size validation detected.

## NEW Usability Findings

### UX-NEW-001: Turnstile CAPTCHA adds friction to contact form

**Severity:** P3
**Location:** apps/web/components/marketing/ContactForm.tsx
**Evidence:** The Turnstile CAPTCHA is a positive UX improvement for security, but adds a small friction point. The CAPTCHA token must be obtained before the form can be submitted (line 260: `disabled={... || (!!TURNSTILE_SITE_KEY && !captchaToken)}`).
**Recommendation:** This is an acceptable tradeoff. No action needed.

### UX-NEW-002: Privacy and Terms pages improve legal UX

**Severity:** P3 (improvement)
**Location:** apps/web/app/(public)/privacy/page.tsx, apps/web/app/(public)/terms/page.tsx
**Evidence:** Two new legal pages with proper Breadcrumbs, consistent styling with the marketing site, and comprehensive content. These are important for compliance and user trust.
**Recommendation:** Noted as improvement. No action needed.

### UX-NEW-003: SSE keepalive prevents notification connection drops

**Severity:** P2 (improvement)
**Location:** apps/api/src/routes/notifications.ts lines 31-33, infra/digitalocean/Caddyfile lines 19-21
**Evidence:** The SSE endpoint now sends keepalive pings every 30 seconds. The Caddy reverse proxy has SSE-specific flush_interval -1 configuration. This prevents proxy idle connection drops that were causing notification delivery failures.
**Recommendation:** Noted as improvement. No action needed.

## Summary

| Previous Finding                              | Severity | Status             |
| --------------------------------------------- | -------- | ------------------ |
| UX-P0-001: Silent error swallowing            | P0       | RESOLVED           |
| UX-P0-002: Flat subnav without categorization | P0       | RESOLVED           |
| UX-P0-003: No confirmation dialogs            | P0       | STILL OPEN         |
| UX-P0-004: Inconsistent module pages          | P0       | PARTIALLY RESOLVED |
| UX-P1-005: Profile subnav wrong               | P1       | STILL OPEN         |
| UX-P1-006: No keyboard shortcuts              | P1       | STILL OPEN         |
| UX-P1-007: No per-item loading states         | P1       | STILL OPEN         |
| UX-P1-008: Contact form persistence           | P1       | STILL OPEN         |
| UX-P1-009: Notification bell error state      | P1       | RESOLVED           |
| UX-P1-010: Document upload size limit         | P1       | STILL OPEN         |

**Resolution rate: 4/10 resolved or partially resolved (40%)**
