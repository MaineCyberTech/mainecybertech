# Notification, Email, and Push Delivery Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260801-0233-develop-a585f1d
- Repository: C:\temp\mainecybertech-portal
- Branch: develop
- Commit SHA: a585f1d
- Generated at: 2026-08-01 02:33 UTC
- Auditor: principal-level repo auditor
- Area code: NOTIF
- Output path: prompts/repo-deep-dive/20260801-0233-develop-a585f1d/30_notification_email_push_delivery_audit.md
- Prior audit: 20260730-0650-develop-62da92c (1 P0, 2 P1, 2 P2, 1 P3 — dedup logic partially added since)
- Scope limitations: Static analysis only. No runtime SMTP verification. No load testing of SSE connections. No verification of email deliverability.

## Scope

Audited notification models, email templates, push subscriptions, VAPID/config, reminder jobs, preferences, tenant scoping, unsubscribe/opt-out, retries, failure handling, duplicate prevention, rate limiting, sensitive content in notifications, sender config, worker queues, audit logs, and tests/docs.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|----------|------|-------------|-------|
| `supabase/migrations/5302029_create_notifications_table.sql` | Migration | Notification table schema | id, user_id, organization_id, title, body, module, module_id, action, read, read_at, created_at |
| `supabase/migrations/5302026_*.sql` (L231-240) | Migration | Notification preferences table | user_id, organization_id, module_key, channel, enabled, version |
| `supabase/migrations/5302107_notification_dedup_and_indexes.sql` | Migration | Dedup key + indexes | notification_key column added |
| `apps/api/src/routes/notifications.ts` | Source | Notification CRUD + SSE | Full CRUD, SSE stream, dedup check at L243-255 |
| `apps/api/src/routes/notification-preferences.ts` | Source | Preference CRUD | GET/PUT with module+channel toggles |
| `apps/worker/src/tasks/scheduled-notifications.ts` | Source | Reminder/notification job | Task-due, membership-approved, ticket-responded, custom |
| `apps/worker/src/email.ts` | Source | Worker email sender | Dynamic import of nodemailer, no redaction |
| `apps/api/src/lib/email.ts` | Source | API email sender | nodemailer transport, no redaction on `{ to }` key |
| `apps/api/src/config/env.ts` | Source | API env schema | SMTP vars all `.optional()` |
| `apps/worker/src/env.ts` | Source | Worker env schema | SMTP vars all `.optional()` |
| `apps/api/src/main.ts:10-19` | Source | Startup SMTP check | Warns on missing SMTP in production |
| `apps/web/components/NotificationBell.tsx` | Source | Bell badge + dropdown | SSE + 30s polling fallback, preferences inline |
| `apps/web/app/(portal)/portal/notifications/preferences/NotificationPreferencesClient.tsx` | Source | Preferences UI | Per-module email/in-app toggles |
| `apps/web/lib/notifications-actions.ts` | Source | Server actions | markRead, markAllRead, dismiss |
| `packages/sdk/src/notifications.ts` | Source | SDK notifications module | list, unreadCount, markRead, markAllRead, create, remove, listPreferences, updatePreferences |
| `apps/api/src/__tests__/notifications.test.ts` | Test | API notification tests | Suite exists |
| `apps/web/e2e/portal/notification-flow.spec.ts` | E2E | Notification flow E2E | Covers bell badge + notification creation |
| `apps/api/src/lib/logger.ts` | Source | API logger redaction | Has redact config |
| `apps/worker/src/logger.ts` | Source | Worker shared logger | Has redact config |
| `apps/worker/src/email.ts:4` | Source | Worker email logger | Creates OWN pino WITHOUT redaction |
| `apps/worker/src/tasks/scheduled-notifications.ts:6` | Source | Notification task logger | Creates OWN pino WITHOUT redaction |

## Executive Summary

**Notification infrastructure is functional and well-tested, with SSE real-time push and polling fallback, but email delivery is effectively non-functional in production (SMTP optional) and PII leaks through unredacted Worker loggers.** The notification preferences system is robust with per-module/per-channel toggles. Tenant scoping is correct (notifications filtered by `user_id`, preferences by `user_id + organization_id`). Dedup logic was added since the prior audit (notification_key-based check at notifications.ts:243-255).

**Critical gap (unchanged from prior audit):** Email delivery requires SMTP configuration which is optional — if unset, all email notifications silently fail. Password reset, ticket assignment alerts, and system notifications are never delivered.

**New finding since prior audit:** Worker task loggers (7 files) create bare pino instances without redaction, leaking email addresses in plaintext via `scheduled-notifications.ts:103,127,152` and `worker/src/email.ts:40`. The `sanitizeNotification` function for SSE strips some fields but includes business data in plaintext.

**Improvements since prior audit:**
- Notification dedup via `notification_key` column (NOTIF-P1-001 partially addressed)
- Notification preferences now optionally scoped by `organization_id` in query

## Notification Channel Inventory

| Channel | Type | Status | Configuration |
|---------|------|--------|--------------|
| In-app (SSE) | Supabase Realtime per user | ✅ Complete | Channel per userId, keepalive 30s, auth revalidation 5min |
| In-app (polling) | 30s polling in NotificationBell | ✅ Complete | Falls back when SSE fails, connectionError state |
| Email (API) | nodemailer via API `lib/email.ts` | ⚠️ Optional | SMTP optional; API warns on missing in prod startup |
| Email (Worker) | nodemailer via Worker `src/email.ts` | ⚠️ Optional | SMTP optional; no startup warning |
| Push (Web Push API) | Browser push notifications | ❌ Absent | No VAPID, no service worker |
| SMS | Text message | ❌ Absent | Listed as channel option in preferences but not implemented |

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|------|--------------|---------|---------------|------|-------|
| Notification model | `notifications` table | Store user notifications | ✅ Complete | Low | RLS: SELECT/UPDATE/DELETE scoped to user_id |
| Notification preferences | `notification_preferences` table | Per-module, per-channel toggles | ✅ Complete | Low | Unique on (org_id, user_id, module_key, channel) |
| Email templates | — | HTML email formatting | ❌ Absent | P3 | Only basic HTML in scheduled-notifications.ts |
| Push subscriptions | — | Web Push API | ❌ Absent | — | No implementation |
| VAPID/config | — | Web Push auth | ❌ Absent | — | No implementation |
| Reminder jobs | `worker/src/tasks/scheduled-notifications.ts` | Task-due, membership, ticket alerts | ⚠️ Partial | P1 | Creates in-app + email; email silent if SMTP missing |
| Preferences UI | `NotificationPreferencesClient.tsx` | Toggle switches per module/channel | ✅ Complete | Low | email + in_app channels |
| Tenant scoping | API routes `notifications.ts` | user_id filter on all queries | ✅ Complete | Low | organization_id optional in markAllRead |
| Unsubscribe/opt-out | Preferences toggle | Per-module disable | ⚠️ Partial | P2 | No global "opt out all" toggle; no email unsubscribe link |
| Retries | — | Failed delivery retry | ❌ Absent | P2 | No retry mechanism for notification or email |
| Failure handling | SSE + API | Error logging | ⚠️ Partial | P2 | SSE silently fails on unsubscribe; API throws to global handler |
| Duplicate prevention | `notifications.ts:243-255` | notification_key dedup | ✅ Improved | Low | Dedup check before insert, since prior audit |
| Rate limiting | Global rate limiter | Applies to notification routes | ⚠️ Inherited | P3 | Same as global: 300 req/15min |
| Sensitive content | SSE + create endpoint | Notification body in plaintext | ⚠️ Partial | P2 | SSE pushes full body; create endpoint has no sensitivity check |
| Sender config | `api/main.ts:10-19` | SMTP startup check | ⚠️ Optional | P1 | Warns but doesn't block startup |
| Worker queues | BullMQ | Email sending via queue | ✅ Complete | Low | BullMQ with SQS fallback |
| Audit logs | `notifications.ts` | All notification mutations logged | ✅ Complete | Low | create, read, markAllRead, delete all logged |
| Notification key | `notification_key` column | Dedup key on (userId, module, moduleId, action) | ✅ Added | Low | Added since prior audit |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|----------|------:|----------|-----|-------------------|
| Notification models | 5 | Well-structured with RLS, dedup keys, indexes | None | — |
| Email templates | 1 | Only basic HTML in worker task | No template system | Add React Email or MJML |
| Push subscriptions | 0 | Not implemented | Complete absence | Future roadmap |
| VAPID/config | 0 | Not implemented | Complete absence | Future roadmap |
| Reminder jobs | 2 | Type-based handler works but email silent | SMTP optional | Make SMTP required |
| Preferences | 4 | Per-module/channel, tenant-scoped | No global toggle, no digest mode | Add global opt-out |
| Tenant scoping | 5 | user_id on all queries, org_id optional | None | — |
| Unsubscribe/opt-out | 2 | Per-module toggle only | No email unsubscribe link, no global toggle | Add List-Unsubscribe header |
| Retries | 1 | No retry mechanism | Email drops silently on failure | Add BullMQ retry with backoff |
| Failure handling | 3 | API errors propagate to global handler | SSE disconnect not surfaced to user | Add SSE reconnect with backoff |
| Duplicate prevention | 4 | notification_key dedup added | Granular — per (user, module, moduleId, action) | Good for current use cases |
| Rate limiting | 3 | Inherits global rate limiter | No notification-specific limits | Add notification create rate limit |

## Detailed Review

### Item: Email Delivery — SMTP Optional

- **Evidence:**
  - `apps/api/src/config/env.ts:13-17` — `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` all `.optional()`
  - `apps/worker/src/env.ts:26-30` — same, all `.optional()`
  - `apps/api/src/main.ts:10-19` — startup check warns if missing in production
  - `apps/api/src/lib/email.ts:14-17` — returns `false` silently if `SMTP_HOST` not set
  - `apps/worker/src/email.ts:15-18` — same silent return
- **What it does:** When SMTP is not configured (likely in the current deployment — AGENTS.md doesn't list SMTP vars as required), all email sending silently returns `false`. No error is surfaced to the caller, no fallback, no alert.
- **How it appears to work:** API startup logs a warning about missing SMTP in production, but the server starts anyway. Password reset emails, ticket assignment notifications, membership approval emails — all silently dropped.
- **Current controls:** API startup warning in production mode
- **Missing controls:**
  1. No health check that verifies SMTP connectivity
  2. No alert when email delivery fails
  3. No fallback email provider
  4. Worker has NO startup SMTP check at all
- **Risks:** P1 — Users don't receive password reset emails, ticket notifications, or membership approval alerts. This is a functional gap, not just a compliance issue.
- **Recommended improvement:** Either make SMTP required in production (remove `.optional()`) or use a transactional email service (SendGrid, Resend) with API key auth instead of SMTP.
- **Suggested tests:** Integration test that verifies SMTP connectivity on startup. Test that email sending fails gracefully with clear error when SMTP is misconfigured.
- **Suggested docs:** Update `docs/ENVIRONMENT_VARIABLES.md` to mark SMTP vars as required for production.

### Item: Notification Deduplication

- **Evidence:**
  - `apps/api/src/routes/notifications.ts:243-255` — dedup check before create
  - `supabase/migrations/5302107_*.sql` — `notification_key` column + index
- **What it does:** Before inserting a notification, checks for an existing row with the same `notification_key` (composed of `${userId}-${module}-${moduleId || "none"}-${action}`). If found, returns the existing notification instead of creating a duplicate.
- **How it appears to work:** Admin-only create endpoint deduplicates by user+module+action. Worker-created notifications (via `scheduled-notifications.ts`) do NOT use the create endpoint — they insert directly into the `notifications` table, bypassing the dedup check.
- **Current controls:** Dedup in admin create endpoint
- **Missing controls:** Worker task `scheduled-notifications.ts` inserts directly via `supabase.from("notifications").insert(...)` without any dedup check. This means task-due, membership-approved, and ticket-responded notifications can still be duplicated if the worker task is triggered multiple times.
- **Risks:** P2 — Worker-generated notifications may duplicate. Since these are the most common notification types (task reminders, membership updates), the dedup gap is notable.
- **Recommended improvement:** Add `notification_key` generation and dedup check to the `createInAppNotification` function in `scheduled-notifications.ts:17-30`.
- **Suggested tests:** Integration test that triggers the same scheduled-notification twice and verifies only one notification is created.
- **Status:** Partially fixed since prior audit

### Item: SSE Stream Sensitivity

- **Evidence:**
  - `apps/api/src/routes/notifications.ts:15-25` — `sanitizeNotification()` strips `user_id`, `body`, `module`, `organization_id`
  - `apps/api/src/routes/notifications.ts:73-74` — SSE pushes `sanitizeNotification(payload.new)`
  - Sanitized fields returned: `id`, `title`, `module`, `module_id`, `action`, `read`, `created_at`
- **What is happening:** The `sanitizeNotification` function strips `user_id`, `body`, and `organization_id` from SSE payloads. However, it includes `title` which may contain business-sensitive data (e.g., ticket titles with client names, project names with internal codenames). The initial unread notifications sent on SSE connect (line 106-107) pass through `sanitizeNotification` correctly.
- **Current controls:** Field stripping of user_id, body, organization_id
- **Missing controls:** No content sensitivity check on `title` or `action`. No per-message auth revalidation (only every 5 minutes at line 50-58).
- **Risks:** P2 — Low risk since SSE is authenticated and tenant-scoped (channel per userId), but defense-in-depth would strip or mask business-sensitive titles.
- **Recommended improvement:** Consider keeping only `id`, `action`, and `created_at` in SSE payloads — force clients to fetch full details on click. This limits what's pushed over the wire.
- **Status:** Acceptable for current threat model given authenticated SSE connection

### Item: Email Unsubscribe / List-Unsubscribe Header

- **Evidence:**
  - `apps/worker/src/tasks/scheduled-notifications.ts:75-80,120-124,145-149` — sends email with `to`, `subject`, `text`, `html`
  - `apps/api/src/lib/email.ts:30-36` — sends email via nodemailer
  - No `List-Unsubscribe` header in either sender
  - No unsubscribe URL in email body
- **What is happening:** Transactional emails (password reset, ticket notifications, membership approval) are sent without a `List-Unsubscribe` header or unsubscribe link. While transactional emails are typically exempt from marketing consent requirements, best practice and deliverability standards (Google/Yahoo 2024 requirements) now mandate `List-Unsubscribe` for bulk senders.
- **Why it matters:** Without `List-Unsubscribe`, emails may be flagged as spam by Gmail/Yahoo. The `List-Unsubscribe` header (RFC 8058) improves deliverability even for transactional email.
- **Recommended fix:** Add `List-Unsubscribe` header to all outgoing emails with a mailto: link or one-click unsubscribe URL. Add footer text with opt-out instructions.
- **Suggested tests:** Verify email headers include `List-Unsubscribe` in sent emails.
- **Effort estimate:** Small (1 hour)

### Item: Notification Preferences — No Global Toggle

- **Evidence:**
  - `apps/web/app/(portal)/portal/notifications/preferences/NotificationPreferencesClient.tsx:22-25` — per-channel toggles per module
  - No "Disable all notifications" toggle in UI
  - No digest mode (realtime / hourly / daily / off)
- **What is happening:** Users must toggle off 5 modules x 2 channels = 10 individual switches to disable all notifications.
- **Current controls:** Per-module, per-channel toggles
- **Missing controls:** Global "disable all" toggle. Digest/summary mode.
- **Risks:** P2 — UX friction; no compliance issue
- **Recommended improvement:** Add a "Disable all notifications" toggle at the top of the preferences page. Consider adding digest mode (realtime/hourly/daily/weekly) per module.
- **Effort estimate:** Small (1 day)

### Item: Worker Task Loggers Leak Email PII

- **Evidence:**
  - `apps/worker/src/tasks/scheduled-notifications.ts:6` — `const logger = pino({ level: env.LOG_LEVEL })` — NO redaction
  - `apps/worker/src/tasks/scheduled-notifications.ts:103` — `logger.info({ email: profile.email }, "Membership approved notification sent")`
  - `apps/worker/src/tasks/scheduled-notifications.ts:127` — `logger.info({ email: profile.email, title: p.title, emailSent }, "Ticket responded notification sent")`
  - `apps/worker/src/tasks/scheduled-notifications.ts:152` — `logger.info({ email: profile.email, title: p.title, emailSent }, "Custom notification sent")`
  - `apps/worker/src/email.ts:4` — `const logger = pino({ level: env.LOG_LEVEL })` — NO redaction
  - `apps/worker/src/email.ts:40,44` — logs `{ to, subject }` without redaction
- **What is happening:** Every notification task that reads a user's email and sends them an email ALSO logs their email address in plaintext to the Worker's log output. The Worker's shared logger (`worker/src/logger.ts`) has pino redaction, but the task files create their own bare pino instances.
- **Why it matters:** PII leakage to logs. See PRIV-P1-001 in the privacy audit for full details.
- **Recommended fix:** Replace all bare `pino()` in Worker task files with imports of the shared logger from `../logger`.
- **Cross-reference:** PRIV-P1-001, PRIV-P1-002 in 18_privacy_compliance_data_governance.md

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|----|-------------------|----------|----------------|-----|----------|---------------|
| NOTIF-001 | Notification models | `notifications` table, RLS | Per-user RLS, dedup key | None | — | — |
| NOTIF-002 | Email templates | Basic HTML in worker task | Manual HTML strings | No template system | P3 | Add React Email or MJML |
| NOTIF-003 | Push subscriptions | — | Not implemented | Complete absence | P3 | Future roadmap |
| NOTIF-004 | VAPID/config | — | Not implemented | Complete absence | P3 | Future roadmap |
| NOTIF-005 | Reminder jobs | `scheduled-notifications.ts` | Type-based handler | Email silent if SMTP missing; no dedup in worker | P1 | Require SMTP; add worker dedup |
| NOTIF-006 | Preferences | `notification_preferences` table + UI | Per-module/channel toggles | No global toggle | P2 | Add "disable all" |
| NOTIF-007 | Tenant scoping | `notifications.ts` queries | user_id on all queries | None | — | — |
| NOTIF-008 | Unsubscribe/opt-out | Per-module toggle | Individual toggle per module/channel | No email List-Unsubscribe header | P2 | Add header |
| NOTIF-009 | Retries | — | No retry mechanism | Email drops silently | P2 | Add BullMQ retry with backoff |
| NOTIF-010 | Failure handling | Global error handler | API errors propagate | SSE disconnect silent; worker email failures silent | P2 | Add reconnect + alerting |
| NOTIF-011 | Duplicate prevention | `notification_key` dedup | Admin create endpoint dedup | Worker bypasses dedup | P2 | Add dedup to worker |
| NOTIF-012 | Rate limiting | Global rate limiter | 300 req/15min | No notification-specific limit | P3 | Add per-user notif create limit |

## Findings

### Finding ID: NOTIF-P1-001 — Email delivery non-functional without SMTP configuration

- Severity: P1
- Confidence: High
- Area: Email delivery
- Evidence:
  - `apps/api/src/config/env.ts:13-17` — SMTP vars all `z.string().optional()`
  - `apps/worker/src/env.ts:26-30` — same
  - `apps/api/src/main.ts:10-19` — warns but doesn't block startup
  - `apps/api/src/lib/email.ts:14-17` — silently returns `false` if no SMTP_HOST
  - `apps/worker/src/email.ts:15-18` — same
- What is happening: SMTP configuration is entirely optional. When unset (the default), all email sending silently fails. Password reset, ticket assignment notifications, membership approval, and task reminders never reach users. The API logs a warning at startup in production, but the Worker has no equivalent check.
- Why it matters: Email is the primary out-of-band notification channel. Without it, users cannot reset passwords, receive time-sensitive alerts, or get membership approvals.
- User / business impact: Users cannot complete password reset flow. Support tickets go unnoticed. Onboarding stalls if membership approval emails are expected.
- Recommended fix: Either make SMTP required in production (remove `.optional()` from schema), integrate a transactional email service API (SendGrid, Resend, Postmark), or add a clear admin-facing health check that surfaces the missing configuration. At minimum, add a Worker startup check similar to `apps/api/src/main.ts:10-19`.
- Suggested validation: Health check endpoint returns degraded status when SMTP is unconfigured. Admin dashboard shows email configuration status.
- Owner suggestion: Platform/Backend engineer
- Effort estimate: Small (2 days for SMTP setup + health check)
- Dependencies: SMTP credentials or transactional email API key
- Status: Open (carried forward from prior audit)

### Finding ID: NOTIF-P1-002 — Worker task loggers leak email addresses in plaintext

- Severity: P1
- Confidence: High
- Area: PII in notification logs
- Evidence:
  - `apps/worker/src/tasks/scheduled-notifications.ts:6` — bare `pino()` without redaction
  - `apps/worker/src/tasks/scheduled-notifications.ts:103,127,152` — logs `email: profile.email`
  - `apps/worker/src/email.ts:4` — bare `pino()` without redaction
  - `apps/worker/src/email.ts:40` — logs `{ to, subject }` (raw email)
  - `apps/worker/src/logger.ts:4-40` — shared logger HAS redaction (unused by tasks)
- What is happening: The Worker's task files and email module create their own pino logger instances without the `redact` configuration that the shared logger has. Every email sent by the Worker logs the recipient's email address in plaintext.
- Why it matters: Email addresses are personal data under GDPR. Logging them in plaintext violates data minimization and exposes PII in container logs.
- User / business impact: Customer email addresses appear in log files, potentially shipped to centralized logging services without redaction.
- Recommended fix: Replace all bare `pino()` calls in Worker source files with `import { logger } from "../logger"` (or `../../logger` for task files). The shared logger already has comprehensive pino redaction.
- Suggested validation: `rg "pino\(\{" apps/worker/src/ --include="*.ts"` should return exactly 1 match.
- Owner suggestion: Backend engineer
- Effort estimate: Small (1 day)
- Dependencies: None
- Cross-reference: PRIV-P1-001
- Status: Open

### Finding ID: NOTIF-P2-001 — Worker notification creation bypasses dedup logic

- Severity: P2
- Confidence: High
- Area: Duplicate prevention
- Evidence:
  - `apps/api/src/routes/notifications.ts:243-255` — dedup check at admin create endpoint
  - `apps/worker/src/tasks/scheduled-notifications.ts:17-29` — `createInAppNotification()` inserts without dedup check
- What is happening: The admin notification creation endpoint has dedup logic (checks `notification_key` before insert). The Worker task `scheduled-notifications.ts` has its own `createInAppNotification()` helper that inserts directly into the `notifications` table without any dedup check. If the worker task is triggered twice for the same event (e.g., BullMQ retry, manual re-trigger), duplicate notifications are created.
- Why it matters: Task-due and ticket-responded notifications are the most common types. Duplicates inflate the unread count and create a noisy user experience.
- Recommended fix: Add `notification_key` computation and dedup check to the `createInAppNotification()` function. Use the same key pattern: `${userId}-${module}-${moduleId || "none"}-${action}`.
- Suggested validation: Integration test triggering the same notification twice, verifying only one row exists.
- Effort estimate: Small (30 min)
- Status: Open

### Finding ID: NOTIF-P2-002 — No List-Unsubscribe header on transactional emails

- Severity: P2
- Confidence: High
- Area: Email deliverability
- Evidence:
  - `apps/api/src/lib/email.ts:30-36` — sends email via nodemailer, no custom headers
  - `apps/worker/src/email.ts:32-38` — same
  - `apps/worker/src/tasks/scheduled-notifications.ts:75-80` — sends email without unsubscribe
- What is happening: All outgoing emails lack the `List-Unsubscribe` header (RFC 8058). Google and Yahoo now require this header for bulk senders and penalize deliverability without it. While MCT sends relatively low volume, the header is still a best practice that improves inbox placement.
- Why it matters: Emails may be flagged as spam or blocked by Gmail/Yahoo. Low deliverability means users miss password resets and notifications.
- Recommended fix: Add `List-Unsubscribe` header with a `mailto:` link (e.g., `mailto:unsubscribe@mainecybertech.com?subject=unsubscribe`). Optionally add a one-click unsubscribe URL. Also add a footer to email bodies with opt-out instructions.
- Suggested validation: Inspect sent email headers in test environment, verify `List-Unsubscribe` is present.
- Effort estimate: Small (1 hour)
- Status: Open

### Finding ID: NOTIF-P2-003 — No email sending retry mechanism

- Severity: P2
- Confidence: High
- Area: Delivery reliability
- Evidence:
  - `apps/api/src/lib/email.ts:40-44` — catches error, logs, returns `false`
  - `apps/worker/src/email.ts:42-46` — same pattern
  - `apps/worker/src/tasks/scheduled-notifications.ts:75` — calls `sendEmail()` and tracks `emailSent` boolean
- What is happening: When email sending fails (SMTP timeout, connection refused, auth error), both API and Worker email senders catch the error, log it, and return `false`. There is no retry with backoff. The Worker task records the failure but doesn't re-queue.
- Why it matters: Transient SMTP failures (network blip, rate limit) cause permanent email loss. This is especially impactful for password reset emails where the user is actively waiting.
- Recommended fix: Add retry with exponential backoff to the Worker's `sendEmail()` (3 attempts, 1s/2s/4s delay). For the API email sender, consider queuing the email through BullMQ instead of sending synchronously.
- Suggested validation: Integration test with a mock SMTP that fails twice then succeeds — verify email is sent on third attempt.
- Effort estimate: Small (1 day)
- Status: Open

### Finding ID: NOTIF-P2-004 — No global notification preference toggle

- Severity: P2
- Confidence: High
- Area: User experience
- Evidence:
  - `apps/web/app/(portal)/portal/notifications/preferences/NotificationPreferencesClient.tsx` — 5 modules x 2 channels = 10 individual toggles
  - No "Disable all" or "Enable all" button
  - No digest mode option
- What is happening: Users must toggle off each module/channel combination individually to stop notifications. There's no way to receive a daily digest instead of real-time alerts.
- Why it matters: UX friction. Users who want to temporarily mute all notifications must click 10 times.
- Recommended fix: Add a "Disable all notifications" toggle at the top of the preferences page. Add a digest mode selector (realtime / hourly / daily / off).
- Suggested validation: E2E test: toggle "disable all" → verify all individual toggles turn off.
- Effort estimate: Small (1 day)
- Status: Open

### Finding ID: NOTIF-P3-001 — No email template system

- Severity: P3
- Confidence: High
- Area: Email formatting
- Evidence:
  - `apps/worker/src/tasks/scheduled-notifications.ts:78-79` — HTML emails built with string concatenation
  - `apps/worker/src/tasks/scheduled-notifications.ts:123-124` — same for ticket-responded
  - `apps/worker/src/tasks/scheduled-notifications.ts:148-149` — same for custom
- What is happening: All HTML emails are constructed with inline string interpolation. No templating engine. No shared email layout. No branding consistency.
- Why it matters: Emails lack professional branding. Changes require editing code rather than templates. Hard to maintain consistent look across all email types.
- Recommended fix: Integrate a lightweight email template system (React Email, MJML, or Handlebars). Create branded templates for each notification type.
- Effort estimate: Medium (3 days)
- Status: Open

### Finding ID: NOTIF-P3-002 — No push notification (Web Push API) support

- Severity: P3
- Confidence: High
- Area: Notification channels
- Evidence: No service worker for push, no VAPID key configuration, no `web-push` library, no browser permission request
- What is happening: The platform only supports in-app notifications (visible while browsing) and email. When users close the browser tab, they miss all real-time notifications until they return.
- Why it matters: Time-sensitive alerts (ticket assignments, critical system notifications) don't reach users who aren't actively browsing.
- Recommended fix: Add Web Push API integration with VAPID keys. Register a service worker for push event handling.
- Effort estimate: Large (5 days)
- Status: Open (future roadmap)

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|------|----------|------------|--------|----------|-----------|
| Email non-delivery (SMTP missing) | P1 | High | High | SMTP all optional | Configure SMTP or API-based email |
| Worker email PII in logs | P1 | High | Medium | Bare pino in 7 files | Use shared logger with redaction |
| Worker duplicate notifications | P2 | Medium | Low | No dedup in worker task | Add notification_key to worker inserts |
| Email marked as spam | P2 | Medium | Medium | No List-Unsubscribe header | Add header to all outgoing emails |
| Transient email failures cause permanent loss | P2 | Medium | Medium | No retry mechanism | Add exponential backoff retry |
| User can't easily mute all notifications | P2 | Low | Low | No global toggle | Add "disable all" |

## Recommendations

### Immediate / Release Blocking

None — no critical security vulnerabilities.

### This Week

1. **Configure SMTP or transactional email (NOTIF-P1-001):** Either set up SMTP credentials or integrate SendGrid/Resend. Add Worker startup health check for SMTP.
2. **Fix Worker logger PII leakage (NOTIF-P1-002):** Replace bare `pino()` with shared logger. Cross-cuts with PRIV-P1-001.

### This Month

1. **Add Worker notification dedup (NOTIF-P2-001):** Add `notification_key` to `createInAppNotification()`.
2. **Add List-Unsubscribe header (NOTIF-P2-002):** Add to both API and Worker email senders.
3. **Add email retry with backoff (NOTIF-P2-003):** 3 attempts with exponential delay in Worker email sender.
4. **Add global notification toggle (NOTIF-P2-004):** "Disable all" at top of preferences page.

### Later / Platform Evolution

1. **Add email template system (NOTIF-P3-001):** React Email or MJML integration.
2. **Add Web Push API support (NOTIF-P3-002):** Browser push notifications with VAPID.
3. **Add SMS channel:** Wire up the SMS option listed in CHANNELS but not implemented.
4. **Add notification digest mode:** Realtime / hourly / daily / weekly summary emails.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|-----------|-------------|----------------------|-----------|
| Replace Worker bare pino with shared logger | Stops PII leakage in 7 files | `worker/src/email.ts`, `worker/src/tasks/*.ts` | grep for bare `pino({` |
| Add notification_key to worker inserts | Prevents duplicate notifications | `worker/src/tasks/scheduled-notifications.ts:17-29` | Integration test |
| Add List-Unsubscribe header | Improves email deliverability | `api/src/lib/email.ts:30`, `worker/src/email.ts:32` | Inspect headers |
| Add Worker startup SMTP check | Surfaces missing config early | `worker/src/main.ts` | Health check endpoint |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|-------------|----------|-----------------|--------|-----------|
| Configure SMTP / email service | P1 | Platform engineer | 2 days | SMTP credentials |
| Fix Worker logger PII leakage | P1 | Backend engineer | 1 day | None |
| Worker notification dedup | P2 | Backend engineer | 30 min | None |
| List-Unsubscribe header | P2 | Backend engineer | 1 hour | None |
| Email retry with backoff | P2 | Backend engineer | 1 day | None |
| Global notification toggle | P2 | UI engineer | 1 day | None |
| Email template system | P3 | UI engineer | 3 days | None |
| Web Push API | P3 | Platform engineer | 5 days | VAPID key generation |
| SMS channel | P3 | Backend engineer | 3 days | Twilio or similar API key |

## Suggested Tests

- **API Unit:** `notifications.test.ts` — test dedup logic: create same notification twice, verify only one row
- **API Unit:** `notifications.test.ts` — test SSE sanitizeNotification strips user_id, body, organization_id
- **API Integration:** `email.test.ts` — test email sender with mock SMTP that fails twice then succeeds
- **Worker Integration:** `scheduled-notifications.test.ts` — test dedup on double trigger
- **Worker Integration:** `scheduled-notifications.test.ts` — verify logger output contains no raw email addresses
- **E2E:** Notification flow: create ticket → verify badge increments → mark read → verify count decrements
- **E2E:** Notification preferences: toggle email for "tickets" off → create ticket event → verify no email sent
- **Manual:** Verify email headers include `List-Unsubscribe` in sent emails
- **Manual:** Send test email from admin health dashboard

## Suggested Documentation Updates

- Create `docs/EMAIL_DELIVERY.md` — SMTP configuration, provider setup, deliverability monitoring
- Create `docs/NOTIFICATION_SYSTEM.md` — architecture overview, channel inventory, flow diagrams
- Update `docs/ENVIRONMENT_VARIABLES.md` — mark SMTP vars as required for production
- Update `docs/MONITORING_AND_ALERTING.md` — add email delivery failure alert configuration
- Update `docs/modules/notifications.md` — add dedup logic, notification_key, SSE sanitization details
- Update `docs/modules/notification-preferences.md` — add global toggle + digest mode plans

## Open Questions

| Question | Why it matters | Evidence needed |
|----------|---------------|----------------|
| What SMTP provider is used in the production deployment? | Determines if SMTP vars are set or if email is truly non-functional | Infrastructure review |
| What is the expected email volume per day? | Determines need for transactional email API vs raw SMTP | Business intelligence |
| Are there deliverability monitoring tools (e.g., Mailgun webhooks)? | Determines if bounced/rejected emails are tracked | Infrastructure review |
| Is a dedicated "unsubscribe" email address configured? | Required for List-Unsubscribe mailto: | Operations decision |
| Are notification bodies ever reviewed for sensitivity before creation? | Determines if content filtering is needed on SSE | Product decision |

## Appendix

### Notification Flow Diagram

```
Trigger Event (ticket update, task due, membership change)
  │
  ├─→ Worker (BullMQ) → scheduled-notifications task
  │     │
  │     ├─→ createInAppNotification() → Supabase INSERT (notifications table)
  │     │     │
  │     │     └─→ Supabase Realtime → SSE stream → NotificationBell (live)
  │     │
  │     └─→ sendEmail() → nodemailer → SMTP → User inbox
  │           │
  │           └─→ [NO RETRY on failure]
  │
  └─→ Admin create endpoint (POST /api/v1/notifications)
        │
        ├─→ dedup check (notification_key)
        └─→ Supabase INSERT → audit log
```

### Notification Preferences Model

```
notification_preferences
├── organization_id (uuid, optional — null = global default)
├── user_id (uuid, required)
├── module_key (text: "tickets" | "projects" | "documents" | "billing" | "system")
├── channel (text: "email" | "in_app")
├── enabled (boolean, default true)
└── unique(organization_id, user_id, module_key, channel)
```

### Email Configuration Status

| Environment | SMTP_HOST set? | Email functional? | Startup warning? |
|-------------|---------------|-------------------|-----------------|
| Local dev (.env) | Empty | No (silent) | No (not production) |
| DO .env.example | Empty | No (silent) | API: yes; Worker: no check |
| Production (DO) | Unknown | Unknown | API: warns if missing; Worker: silent |
