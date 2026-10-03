# Usability and Workflow Audit

## Audit Metadata

| Field                 | Value                           |
| --------------------- | ------------------------------- |
| **Audit Name**        | `repo-deep-dive`                |
| **Run ID**            | `20260728-0142-develop-21a10d6` |
| **Date**              | 2026-07-28                      |
| **Branch / SHA**      | develop / 21a10d6               |
| **Finding Area Code** | UX                              |

## Scope

Core user-facing workflows across public, portal, and admin route groups. Login/signup/password reset, portal dashboard, ticket management, document workflows, notification flows, admin dashboards, error/empty/loading states, mobile responsiveness.

## Evidence Reviewed

~100+ pages across (public), (portal), (admin) route groups; ~60+ components (EmptyState, Breadcrumbs, CommentBody, DocumentPreview, NotificationBell, PortalSubnav, AdminSubnav, PortalGlobalSearch, AdminGlobalSearch, MarketingHeader, ContactForm, etc.); layouts, middleware, actions.

## Executive Summary

The Maine CyberTech Portal demonstrates a **mature, well-structured user interface** with strong patterns: comprehensive empty state handling, dedicated error boundaries with "Try again" buttons, loading skeletons, breadcrumbs, responsive design, notification bell with SSE streaming, document preview, skip-to-content link, clean login/signup/password-reset flow.

**Critical gaps (4 P0):**

1. Silent error swallowing in notification/search components
2. 40+ item flat subnav without categorization or mega-menu
3. No confirmation dialogs on destructive actions
4. Inconsistent module page patterns

## Findings

### UX-P0-001: Silent error swallowing in notification, search, and profile components

**Location:** `NotificationBell.tsx` (lines 37-38, 47-50, 66-68, 89-91, 118-119, 142-143, 152-153, 166-167), `PortalGlobalSearch.tsx` (47-49), `AdminGlobalSearch.tsx` (49-51)
**Evidence:** Empty catch blocks (`/* ignore */`).
**Recommendation:** Replace empty catch blocks with logged errors and user-facing error indicators.

### UX-P0-002: 40+ item flat subnav without categorization

**Location:** `PortalSubnav.tsx` (40 items), `AdminSubnav.tsx` (40+ items with dividers)
**Evidence:** Flat horizontal list, no grouping, no collapse/expand. On mobile, `cyber-subnav-scroll` makes navigation impractical.
**Recommendation:** Redesign as mega-menu or collapsible sidebar.

### UX-P0-003: No confirmation dialog on destructive actions

**Location:** `ConfirmIntentButton.tsx` exists but not wired everywhere. Ticket deletion, document deletion, bulk operations lack confirmation.
**Recommendation:** Audit all destructive actions and wrap with confirmation.

### UX-P0-004: Module pages have inconsistent structure

**Evidence:** 60+ portal module pages use 3+ different empty state patterns (EmptyState component, inline `<p>` text, custom styled div).
**Recommendation:** Create `ModulePageShell` wrapper for consistent patterns.

### UX-P1-005: Profile page shows "dashboard" as active subnav

**Location:** `profile/page.tsx` — hardcodes `current="dashboard"`.
**Recommendation:** Add "profile" to NAV_ITEMS, update to `current="profile"`.

### UX-P1-006: No keyboard shortcuts for power users

**Recommendation:** Implement `useHotkeys` hook for `/` (search), `c` (create ticket), `Esc` (close modals).

### UX-P1-007: No per-item loading states for module pages

**Recommendation:** Add per-page `loading.tsx` for top 10 most-visited pages.

### UX-P1-008: Contact form not persisted across page refresh

**Recommendation:** Implement `sessionStorage` persistence.

### UX-P1-009: Notification bell error state is invisible

**Recommendation:** Add visual indicator when notification fetching fails.

### UX-P1-010: Document upload size limit not communicated

**Recommendation:** Add client-side 50MB file size validation.

## Quick Wins

| #   | Finding                      | Fix                                 | Effort | Impact |
| --- | ---------------------------- | ----------------------------------- | ------ | ------ |
| 1   | Wrong subnav on profile page | Add "profile" to NAV_ITEMS          | 5 min  | Medium |
| 2   | Skip-to-content broken       | Add `id="main-content"` to `<main>` | 5 min  | Medium |
| 3   | Missing route-group 404s     | Create 3 `not-found.tsx`            | 15 min | Medium |
| 4   | Empty catch blocks           | Add `console.warn`                  | 30 min | High   |
| 5   | File size validation         | Add 50MB check before upload        | 15 min | High   |
