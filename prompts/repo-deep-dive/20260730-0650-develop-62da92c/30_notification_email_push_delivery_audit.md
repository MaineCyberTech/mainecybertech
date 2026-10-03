# Prompt 30 — Notification, Email, and Push Delivery Audit

**Repo:** `mainecybertech-portal` (develop @ 62da92c)
**Date:** 2026-07-30  
**Run ID:** `20260730-0650-develop-62da92c`

---

## Evidence Inventory

### Notification Models
- `notifications` table (migration 5302029): id, user_id, organization_id, title, body, module, module_id, action, read, read_at, created_at
- `notification_preferences` table: user_id, organization_id, module, channel (email/in-app), enabled (boolean), version
- Enums: `module` = tickets, projects, documents, billing, system; `action` = created, updated, assigned, due_soon, overdue, comment, mention, status_change

### Email Templates
- No email template system exists
- SMTP env vars are optional (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` — all `.optional()` in config/env.ts)
- `apps/worker/src/email.ts` — email sender module using `nodemailer`-like transport (SMTP configured)
- Worker task `send-email` sends transactional emails
- No HTML email templates — likely plaintext or basic HTML

### Push Subscriptions
- No push notification system
- No Web Push API integration
- No VAPID keys configured
- No service worker for push handling

### VAPID/Config
- Not present — no VAPID key env vars
- No push notification infrastructure

### Reminder Jobs
- Worker task: `scheduled-notifications` at `apps/worker/src/tasks/`
- BullMQ schedule for periodic notification generation
- Ticket due-soon and overdue detection logic
- No email reminder scheduling

### Preferences
- `notification_preferences` table: per-user, per-module, per-channel toggle
- API: `GET/PUT /api/v1/notification-preferences` — returns `{ preferences, modules, channels }` envelope
- UI: `NotificationPreferencesClient.tsx` — per-module toggle switches for email/in-app
- Bell dropdown links to preferences page

### Tenant Scoping
- Notifications scoped to `user_id` (personal — user sees only their own)
- `organization_id` optional — used for org-scoped queries (markAllRead)
- Notification preferences scoped to user + organization

### Unsubscribe/Opt-Out
- Notification preferences (`enabled` toggle per module/channel) serves as opt-out
- No global "unsubscribe all" mechanism
- No email unsubscribe link in email bodies (no email templates)

### Retries
- No retry mechanism for notification delivery
- If Supabase insert fails, notification is silently lost (caller may not handle error)
- Worker email task has no explicit retry logic

### Failure Handling
- SSE stream notifications: if Supabase Realtime channel subscription fails, the stream continues without notifications (error logged but not surfaced)
- Notification create: admin-only endpoint (`requireAdmin`), errors throw to global error handler
- No dead-letter queue for failed notification deliveries

### Duplicate Prevention
- No dedup logic for notification creation
- Multiple trigger events for the same action could create duplicate notifications for the same user
- Idempotency system (Redis-based) not used for notification creation

### Rate Limiting
- No rate limiting on notification creation
- Default global rate limit applies to API routes (300 req/15min)

### Sensitive Content
- Notification titles and bodies stored in plaintext
- No sensitivity check before creating notifications (possible to include PII in notification body)
- SSE stream sends full notification body including potentially sensitive details

### Permission UX
- Notification preferences UI: per-module toggles (email/in-app)
- Preferences page accessible from bell dropdown and dedicated page
- No initial preference setup flow (default: all enabled)

### Sender Config
- SMTP: optional env vars, no default configuration
- `EMAIL_FROM` configurable but not set by default
- No email verification/sender identity setup

### Worker Queues
- BullMQ queue for email sending
- Worker task `send-email` handler at `apps/worker/src/email.ts`
- SQS fallback for queue backend

### Audit Logs
- Notification create/read/delete/mark-all-read all create audit events
- Audit events include notification id and action type
- No audit for SSE connections or notification delivery

### Tests/Docs
- Notification API tests: `apps/api/src/__tests__/notifications.test.ts`
- Notification components tested in web test suite
- Notification flow E2E tests: `apps/web/e2e/portal/notification-flow.spec.ts`

---

## Notification Channel Inventory

| Channel | Type | Status | Configuration |
|---|---|---|---|
| In-app (SSE) | Real-time push via SSE | ✅ Complete | Supabase Realtime channel per user |
| In-app (polling) | 30s polling in NotificationBell | ✅ Complete | Falls back when SSE disconnected |
| Email | SMTP via worker | ⚠️ Partial | SMTP optional, no templates |
| Push (Web Push API) | Browser push notifications | ❌ Absent | No VAPID, no service worker |
| SMS | Text message | ❌ Absent | Not configured |

---

## Findings

### NOTIF-P0-001 — No email notification delivery in production without SMTP config (P0 Critical)

**Evidence:** `config/env.ts:13-17` — SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM are all `.optional()`. No default SMTP configuration. If these vars are unset (likely in current deployment — AGENTS.md doesn't list them as required), email notifications silently fail. Worker email task (`worker/src/email.ts`) will error at runtime.

**Risk:** Password reset emails, ticket assignment notifications, and system alerts are silently dropped. Users cannot receive email notifications regardless of preference settings.

**Recommendation:** Make SMTP configuration required in production. Use a transactional email service (SendGrid, Resend, Amazon SES) instead of raw SMTP. Add startup check that logs WARN or fails if SMTP is unconfigured but email notifications are enabled.

---

### NOTIF-P1-001 — No duplicate notification prevention (P1 High)

**Evidence:** Notification create endpoint (`notifications.ts:210-247`) has no dedup logic. If a trigger event fires twice (e.g., webhook replay, double-save in admin UI), the same notification is created twice for the same user.

**Risk:** Users receive duplicate notifications for the same event. Notification bell badge shows inflated unread count.

**Recommendation:** Add a uniqueness constraint or idempotency check based on (user_id, module, module_id, action, created_at window). Use Redis idempotency system with a notification-specific key scheme like `notif-{userId}-{module}-{moduleId}-{action}`.

---

### NOTIF-P1-002 — SSE stream sends full notification body without sensitivity filtering (P1 High)

**Evidence:** `notifications.ts:48` — `res.write('event: notification\ndata: ' + JSON.stringify(payload.new) + '\n\n')`. The entire notification row (title, body, metadata) is pushed to the client via SSE without filtering.

**Risk:** If a notification body contains sensitive information (e.g., from a system-generated alert), it's transmitted in plaintext over the SSE connection. The SSE stream has no per-message auth check (only initial auth).

**Recommendation:** Strip sensitive fields from SSE payloads. Consider sending only notification id + title and fetching full body on click. Add token re-validation on SSE messages.

---

### NOTIF-P2-001 — No push notification support (P2 Medium)

**Evidence:** No Web Push API integration. No service worker registration for push. No VAPID keys. The notification system is limited to in-app (SSE/polling) and email.

**Risk:** Users who are not actively browsing the portal miss time-sensitive notifications (ticket assignments, payment failures, approval requests).

**Recommendation:** Add Web Push API integration using `web-push` package. Create a service worker that handles push events and shows desktop notifications. Add VAPID key env vars to config schema.

---

### NOTIF-P2-002 — No global unsubscribe or notification digest (P2 Medium)

**Evidence:** Notification preferences support per-module toggle but no global "disable all" or digest mode (daily/weekly summary).

**Risk:** Users must toggle off each module individually to stop notifications. No way to receive a daily summary instead of real-time alerts.

**Recommendation:** Add a "disable all" toggle at the top of notification preferences. Add digest mode option (realtime, hourly, daily, off) per module.

---

### NOTIF-P3-001 — No email template system (P3 Low)

**Evidence:** Worker email task (`worker/src/email.ts`) likely sends plaintext or basic HTML. No template engine integrated. No branded email templates.

**Risk:** Transactional emails lack branding and formatting. Cannot support rich HTML emails with action buttons.

**Recommendation:** Integrate an email template system (React Email, MJML, or Handlebars). Create branded templates for password reset, ticket assignment, invoice notification, and approval request.

---

## Preference Review

| Aspect | Current | Recommended |
|---|---|---|
| Module-based toggles | ✅ Per-module email/in-app | Keep |
| Global toggle | ❌ Absent | Add "Disable all" |
| Digest mode | ❌ Absent | Add realtime/hourly/daily/off |
| Initial setup flow | ❌ Absent | Add onboarding preference wizard |
| Channel toggles | ✅ email/in-app | Add push toggle |
| Preference defaults | ✅ All enabled | Review based on module criticality |

---

## Delivery Reliability Review

| Component | Reliable? | Gaps |
|---|---|---|
| SSE stream | ⚠️ Partial | No reconnection after disconnect, no ack, no backfill |
| In-app polling | ✅ | 30s interval, works after page reload |
| Email via worker | ❌ | Optional SMTP, no retries, no templates |
| Push | ❌ | Not implemented |

---

## Summary

| Severity | Count | Key Areas |
|---|---|---|
| P0 (Critical) | 1 | No SMTP config means no email delivery at all |
| P1 (High) | 2 | Duplicate notifications, SSE sends sensitive content unfiltered |
| P2 (Medium) | 2 | No push support, no global unsubscribe |
| P3 (Low) | 1 | No email template system |
| **Total** | **6** | |

Strengths: Comprehensive in-app notification system with SSE real-time push + polling fallback, per-module/per-channel preference toggles, proper tenant scoping, and audit logging for all notification actions. The critical gap is the optional SMTP configuration — in the current deployment without SMTP configured, email notifications silently fail. Push notification support would also significantly improve user experience.
