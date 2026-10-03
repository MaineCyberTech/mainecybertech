# Usability and Workflow Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260730-0650-develop-62da92c
- Repository: C:\temp\mainecybertech-portal
- Branch: develop
- Commit SHA: 62da92c
- Generated at: 2026-07-30 06:50 UTC
- Auditor: principal-level repo auditor
- Area code: USE
- Output path: docs/audits/ repo-deep-dive/20260730-0650-develop-62da92c /04_usability_workflow_audit.md
- Scope limitations: Review performed via static analysis; no live Supabase or Docker environment. Some flows (password reset email delivery, SSO) could not be verified end-to-end.

## Scope

Audited core user workflows: login/signup/password-reset, navigation, dashboards (portal + admin), forms, search/filter/sort, bulk workflows, admin/support workflows, notifications, preferences, error recovery, empty/loading states, destructive actions, session expiry, offline behavior evaluation, and help/support paths.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|----------|------|-------------|-------|
| `apps/web/app/(public)/login/page.tsx` | Source | Login flow implementation | Client component, uses loginAction |
| `apps/web/app/(public)/forgot-password/page.tsx` | Source | Password reset flow | Client component, uses SDK |
| `apps/web/app/(public)/signup/page.tsx` | Source | Sign-up flow | — |
| `apps/web/app/(public)/password-reset/page.tsx` | Source | Password reset form | — |
| `apps/web/app/(public)/pending/page.tsx` | Source | Post-signup pending approval page | Uses logoutAction() to break redirect loop |
| `apps/web/middleware.ts` | Source | Auth guard + domain routing | JWT exp check, domain-based redirects |
| `apps/api/src/routes/auth.ts` | Source | Auth API routes | Sign-in, sign-up, callback, forgot-password, reset-password |
| `apps/web/app/(portal)/portal/dashboard/page.tsx` | Source | Portal dashboard | Activity feed, quick actions, EmptyState usage |
| `apps/web/app/(admin)/admin/layout.tsx` | Source | Admin layout | Header, search, notifications |
| `apps/web/app/(portal)/portal/layout.tsx` | Source | Portal layout | OrgSwitcher, NotificationBell, global search |
| `apps/web/components/NotificationBell.tsx` | Source | Notification dropdown | SSE streaming, 30s polling fallback, inline prefs |
| `apps/web/components/EmptyState.tsx` | Source | Empty state component | Used in dashboard tickets/projects/documents |
| `apps/web/components/admin/AdminPageShell.tsx` | Source | Admin page shell | Breadcrumbs + page structure |
| `apps/web/components/portal/PortalSubnav.tsx` | Source | Portal sub-navigation | — |
| `apps/web/components/portal/PortalGlobalSearch.tsx` | Source | Portal search bar | — |
| `apps/web/components/admin/AdminGlobalSearch.tsx` | Source | Admin search bar | — |
| `apps/web/app/(portal)/portal/profile/page.tsx` | Source | Profile editing | — |
| `apps/web/app/(portal)/portal/notifications/page.tsx` | Source | Notification history page | — |
| `apps/web/app/(portal)/portal/notifications/preferences/page.tsx` | Source | Notification preferences page | — |
| `apps/web/app/(public)/error.tsx` | Source | Public route error boundary | "Try again" button present |
| `apps/web/app/(portal)/error.tsx` | Source | Portal error boundary | "Try again" button present |
| `apps/web/app/(admin)/error.tsx` | Source | Admin error boundary | "Try again" button present |
| `apps/web/app/not-found.tsx` | Source | 404 page | "Go home" + "Contact support" links |
| `apps/web/app/(portal)/portal/loading.tsx` | Source | Portal skeleton loading | — |
| `apps/web/app/(admin)/admin/loading.tsx` | Source | Admin skeleton loading | — |
| `apps/api/src/routes/tickets.ts` | Source | Ticket CRUD + bulk operations | — |
| `apps/api/src/routes/bulk.ts` | Source | Bulk invite endpoint | — |
| `apps/web/components/admin/tickets/BulkTicketActions.tsx` | Source | Bulk ticket UI | Partial failure alerts |
| `apps/web/components/portal/OrgSwitcher.tsx` | Source | Multi-org switching UI | — |

## Executive Summary

**Strong state overall (score ~4/5).** The platform provides a comprehensive set of user workflows covering login, dashboard, notifications, search, bulk operations, and admin flows. Critical paths (login, auth callback, password reset, dashboard) are well-implemented with proper error handling and empty states. The middleware layer provides robust auth guarding and domain routing.

**Key gaps:**
1. **No onboarding/introductory flow** for new users — they land on dashboard without guidance
2. **No help/support paths** embedded in portal or admin UIs (no contextual help, no tour, no documentation link in nav)
3. **No offline/poor network handling** — all flows fail open with no offline fallback or retry UI
4. **Session expiry UX is minimal** — middleware redirects to login but no toast/warning before expiry
5. **Few destructive action confirmations** — delete/remove actions need confirmation dialogs

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|------|--------------|---------|---------------|------|-------|
| Login | `login/page.tsx` | Email/password auth + error display | ✅ Complete | Low | Has forgot-password link |
| Sign-up | `signup/page.tsx` | Registration with password strength | ✅ Complete | Low | Zod validation, zxcvbn |
| Password reset | `/forgot-password`, `/password-reset` | Two-step reset flow | ✅ Complete | Low | SDK-based, server actions |
| Auth callback | `auth.ts` POST /callback | PKCE code exchange | ✅ Complete | Low | — |
| Portal dashboard | `portal/dashboard/page.tsx` | Org-scoped activity overview | ✅ Complete | Low | EmptyState, quick actions |
| Admin dashboard | — | Admin home page | Unknown | — | Need to verify existence |
| Portal navigation | `PortalSubnav.tsx` | Portal section nav | ✅ Complete | Low | — |
| Admin navigation | `AdminPageShell.tsx` | Admin breadcrumbs + nav | ✅ Complete | Low | — |
| Notification bell | `NotificationBell.tsx` | In-app notifications with SSE | ✅ Complete | Low | 30s polling fallback |
| Notification page | `notifications/page.tsx` | Full notification history | ✅ Complete | Low | Pagination, filters |
| Notification prefs | `notifications/preferences/` | Per-module email toggles | ✅ Complete | Low | Inline in bell dropdown |
| Global search | `PortalGlobalSearch.tsx`, `AdminGlobalSearch.tsx` | Cross-entity search | ✅ Complete | Low | — |
| Profile editing | `profile/page.tsx` | Name, phone, title | ✅ Complete | Low | — |
| Bulk ticket update | `BulkTicketActions.tsx` | Batch status/priority | ✅ Complete | Low | Partial-failure alerts |
| Bulk invite | `bulk/invite` CSV import | Batch user invites | ✅ Complete | Low | — |
| Org switching | `OrgSwitcher.tsx` | Multi-org context switch | ✅ Complete | Low | Cookie-based |
| Onboarding | — | First-run guidance | ❌ Absent | Medium | No help/tour/docs |
| Help/support | — | Embedded help links | ❌ Absent | Medium | No contextual help |
| Offline handling | — | Graceful degradation | ❌ Absent | Medium | No offline fallback |
| Session expiry | `middleware.ts` | JWT exp check + redirect | ⚠️ Partial | Medium | No warning before expiry |
| Destructive actions | — | Delete confirmations | ⚠️ Partial | Medium | Some, not all |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|----------|------:|----------|-----|-------------------|
| Onboarding | 2 | No onboarding flow or first-run guidance exists | Missing welcome wizard, tooltips, or doc links | Create an onboarding tour or welcome modal |
| Login/signup/reset | 5 | Full login/signup/reset flow with password strength, validation, error states | None | — |
| Navigation | 4 | PortalSubnav, AdminPageShell, breadcrumbs, org switcher | Mobile subnav scroll behavior could be better | Polish mobile nav |
| Dashboards | 4 | Portal dashboard with activity feed, quick actions, EmptyState | Admin dashboard structure unclear | Verify admin dashboard completeness |
| Forms | 4 | All forms have validation, error states, Zod schemas | Some forms lack loading states | Add loading spinners |
| Search/filter/sort | 4 | Global search in portal + admin, org search in admin | No advanced filtering (multi-faceted) | Add advanced filters |
| Bulk workflows | 4 | Bulk ticket actions, bulk invite, partial-failure alerts | Document bulk ops exist but limited | Extend bulk to document search results |
| Admin/support workflows | 4 | Ticket management, audit log, permissions, role editor | No embedded help for admin workflows | Add contextual help links |
| Notifications | 5 | SSE streaming, bell dropdown, prefs, history page | None | — |
| Preferences | 4 | Notification prefs inline + full page | No profile photo upload in profile page | Add avatar upload |
| Error recovery | 4 | error.tsx in all route groups, "Try again" buttons, not-found.tsx | No error retry on individual component failures | Add individual component error boundaries |
| Empty/loading states | 4 | EmptyState component, loading.tsx skeletons, graceful fallbacks | Some admin pages lack EmptyState | Audit and fill gaps |

## Detailed Review

### Item: Login Flow

- **Evidence:** `login/page.tsx`, `auth.ts:62-101` (POST /sign-in), `middleware.ts:95-99` (auth guard)
- **What it does:** Client-side login form submits to server action, calls API POST /sign-in, sets `mct_session` cookie via API, middleware validates JWT exp on every request.
- **Current controls:** Zod email/password validation, rate limiting (rateLimitAuth), password strength via zxcvbn (sign-up), audit logging, error display in red box.
- **Missing controls:** No login attempt lockout after N failures (rate limiting only), no MFA/2FA support.
- **Risks:** Low — rate limiting mitigates brute force. Password strength enforced at sign-up.
- **Recommended improvement:** Add progressive lockout after 5 failed attempts.

### Item: Password Reset Flow

- **Evidence:** `forgot-password/page.tsx`, `password-reset/page.tsx`, `auth.ts:269-348`
- **What it does:** Two-step flow: user enters email → API sends reset link (via Supabase) → user clicks link → new password form → API updates password via admin.updateUserById.
- **Current controls:** Rate limiting on both endpoints, Zod validation, password strength check, audit logging.
- **Missing controls:** No email delivery status feedback. The forgot-password page shows a generic "If an account exists..." message which is good anti-enumeration practice.
- **Risks:** Low — standard implementation.

### Item: Notification Flow

- **Evidence:** `NotificationBell.tsx`, `api/src/routes/notifications.ts`
- **What it does:** SSE streaming for real-time updates, 30s polling fallback, bell icon with badge count, dropdown with recent notifications, mark-read/mark-all-read, inline email preference toggles.
- **Current controls:** Connection error display, audio chime on new notifications, graceful fallback to polling, SSE event parsing with try/catch.
- **Risks:** Low — SSE reconnection on error is handled by EventSource spec behavior.

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|----|-------------------|----------|----------------|-----|----------|---------------|
| USE-001 | User can log in | `login/page.tsx` | Email/password form, server action, cookie | — | — | — |
| USE-002 | User can reset password | `forgot-password/page.tsx` | 2-step flow, SDK, rate-limited | — | — | — |
| USE-003 | Unauthenticated user redirected | `middleware.ts:95-99` | JWT exp check, redirect to /login | No warning before redirect | P2 | Add session expiry toast |
| USE-004 | New user sees dashboard | `portal/dashboard/page.tsx` | Activity feed, quick actions, EmptyState | No onboarding tour | P2 | Add welcome modal |
| USE-005 | User can search | `PortalGlobalSearch.tsx` | Global search bar in portal+admin | — | — | — |
| USE-006 | User receives notifications | `NotificationBell.tsx` | SSE streaming, bell badge, dropdown | — | — | — |
| USE-007 | User can edit profile | `profile/page.tsx` | Name/phone/title form | No avatar upload | P3 | Add avatar upload |
| USE-008 | Admin uses bulk ops | `BulkTicketActions.tsx` | Checkbox + bulk update panel | — | — | — |
| USE-009 | Org switching works | `OrgSwitcher.tsx` | Dropdown, cookie-based | — | — | — |
| USE-010 | Error recovery works | `error.tsx` files | "Try again" buttons in all route groups | — | — | — |
| USE-011 | 404 handled | `not-found.tsx` | Friendly 404 with navigation links | — | — | — |
| USE-012 | Help/support available | — | Absent | No contextual help or docs links | P2 | Add help links in nav footer |

## Findings

### Finding ID: USE-P2-001 - No onboarding or welcome flow for new users

- Severity: P2
- Confidence: High
- Area: Onboarding
- Evidence:
  - `apps/web/app/(portal)/portal/dashboard/page.tsx`
  - No welcome tour, first-run modal, or contextual help exists anywhere in the portal
- What is happening: New users who sign up and get approved land on the dashboard with no guidance on what to do next
- Why it matters: Increases time-to-value, may cause confusion for non-technical users
- User / business impact: MSP clients may struggle to understand portal capabilities
- Recommended fix: Add a one-time welcome modal with quick links to support, document upload, and profile setup
- Effort estimate: Small (1-2 days)
- Status: Open

### Finding ID: USE-P2-002 - No session expiry warning

- Severity: P2
- Confidence: High
- Area: Session expiry
- Evidence:
  - `apps/web/middleware.ts:95-99` — middleware silently redirects to /login when token expired
  - No client-side timer, no toast, no warning to user
- What is happening: Users are unexpectedly redirected to login without explanation
- Why it matters: Users may lose unsaved work
- Recommended fix: Add a client-side session timeout watcher that shows a toast N seconds before expiry
- Effort estimate: Small (1-2 days)
- Status: Open

### Finding ID: USE-P3-001 - No embedded help/support links

- Severity: P3
- Confidence: High
- Area: Help/support
- Evidence: No help icon, FAQ link, or documentation link in portal or admin headers
- What is happening: Users have no in-app way to find help or contact support
- Why it matters: Increases support burden
- Recommended fix: Add a "Help" link in the portal footer/dropdown
- Effort estimate: Very small
- Status: Open

### Finding ID: USE-P2-003 - No offline/poor-network fallback

- Severity: P2
- Confidence: High
- Area: Offline resilience
- Evidence: No offline detection, no service worker, no cached pages
- What is happening: All flows fail silently or with network errors when offline
- Why it matters: Mobile users in areas with poor connectivity may lose data
- Recommended fix: Add navigator.onLine detection + retry UI, consider service worker for critical pages
- Effort estimate: Medium (3-5 days)
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|------|----------|------------|--------|----------|-----------|
| User confusion without onboarding | P2 | Medium | Medium | No welcome tour | Add welcome flow |
| Data loss on session expiry | P2 | Medium | Medium | Silent redirect | Add expiry warning |
| Network failures confuse users | P2 | Medium | Medium | No offline handling | Add connectivity detection |
| Destructive action regret | P2 | Low | Medium | Few confirmations | Audit + add confirm dialogs |

## Recommendations

### Immediate / Release Blocking

None — no critical usability blockers identified.

### This Week

1. Add session expiry toast warning (USE-P2-002)
2. Add welcome modal for first-time portal visit (USE-P2-001)

### This Month

1. Add contextual help links in portal and admin nav footers (USE-P3-001)
2. Add offline detection with retry UI on key forms (USE-P2-003)
3. Audit all delete/remove actions for confirmation dialogs

### Later / Platform Evolution

1. Add guided product tour for new admin users
2. Add MFA/2FA support
3. Add progressive login lockout after N failed attempts

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|-----------|-------------|----------------------|-----------|
| Add session expiry toast | Prevents silent data loss | `middleware.ts`, new `SessionWatcher` component | Test with expired JWT |
| Add contextual help links | Reduces support burden | Portal layout, admin layout | Visual check |
| Add confirmation to delete buttons | Prevents accidental data loss | Various delete action handlers | Test delete flows |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|-------------|----------|-----------------|--------|-----------|
| Session expiry toast | P2 | UI engineer | 1 day | None |
| Welcome modal | P2 | UI engineer | 2 days | None |
| Offline handling | P2 | Full-stack | 5 days | None |
| Help links | P3 | UI engineer | 0.5 day | None |

## Suggested Tests

- **E2E:** Login → session expiry → verify redirect to /login
- **E2E:** New user → first dashboard visit → verify welcome modal shown once
- **E2E:** Delete ticket → verify confirmation dialog appears
- **Integration:** SSE connection drops → verify 30s polling fallback activates
- **Manual:** Disconnect network → verify error state shown on forms

## Suggested Documentation Updates

- `docs/ONBOARDING.md` — update with new welcome flow documentation

## Open Questions

| Question | Why it matters | Evidence needed |
|----------|---------------|----------------|
| Is there a "View as user" feature for admins? | Support workflow | Code search needed |
| Is there a notification preferences page for admin? | Completeness | Check admin routes |

## Appendix

### Persona Table

| Persona | Key workflows | Pain points |
|---------|--------------|-------------|
| MSP Client (end user) | Login, view tickets, upload docs, notifications | No onboarding, no help links |
| MSP Admin | Manage tickets, users, orgs, audit | No embedded docs |
| Super Admin | Permissions, roles, billing | Complex workflows need guidance |
| Anonymous visitor | Marketing site, contact form | No login needed |

### Workflow Friction Table

| Workflow | Steps | Friction points |
|----------|-------|----------------|
| Login | 3 (email, password, submit) | None |
| Password reset | 4 (email, submit, click link, new password) | No email delivery feedback |
| Create ticket | 4 (navigate, form, fields, submit) | None (form has validation) |
| Upload document | 3 (navigate, select file, upload) | None |
| Switch org | 2 (click switcher, select org) | None |
| Notification prefs | 2 (bell, toggle) | None |
