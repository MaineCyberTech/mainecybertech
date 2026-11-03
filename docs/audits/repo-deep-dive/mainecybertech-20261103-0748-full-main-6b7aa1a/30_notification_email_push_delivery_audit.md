# 30_notification_email_push_delivery_audit — Prompt 30 - Notification, Email, and Push Delivery Audit

- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Target: `mainecybertech` @ `6b7aa1a` (branch `main`)
- Domain: `30_notification_email_push_delivery_audit.md` (area NOTIF, prompt)

## Verification Performed

Read-only re-verification at 6b7aa1a5. 21/24 previous NOTIF findings are verified fixed, 3 are partially fixed (NOTIF-P1-002, NOTIF-P2-002, NOTIF-P2-011), 0 regressed. NOTIF-P2-012 (prefetching scanners silently opting users out) is closed: GET is side-effect free, POST performs RFC 8058 one-click, tokens expire after 90 days and List-Unsubscribe/-Post headers are sent. NOTIF-P1-002 remains partial only because the fix migration shares version 5302463 with another migration, so `supabase db push` can skip it (preflight fails; see INV-P1-001); the 42P10 bug it fixes was real (536 dev failures) and the 7dd0402 claim was premature. SMTP provisioning and critical-alert delivery remain operator-gated (P2-002/P2-011). Two new findings: NOTIF-P2-013 (global unsubscribe is invisible/irreversible in the UI) and NOTIF-P3-009 (unsubscribe writes no audit row). Executed: promtool check rules (26 SUCCESS) + rule tests (SUCCESS); read all notification senders, push path, SSE scoping and unsubscribe tests. Residual outside NOTIF: alert delivery remains unexercised (OBS-P2-014) and the unsubscribe URL still carries a reusable bearer token in the query string (browser history/Referer), accepted for one-click compatibility.

## Findings

| ID | Severity | Title |
|---|---|---|
| NOTIF-P1-001 | P1 | Notification preferences are stored and displayed but never enforced on any send path |
| NOTIF-P1-002 | P1 | API-originated notifications bypass the dedup unique index |
| NOTIF-P1-003 | P1 | No delivery observability: email/notification failures are silent and unalerted |
| NOTIF-P1-004 | P1 | Notification preference writes from the web UI omit organization_id (NOT NULL) so toggles cannot persist |
| NOTIF-P2-001 | P2 | Web Push channel is entirely absent (no subscriptions, no VAPID, no service worker) |
| NOTIF-P2-002 | P2 | SMTP remains optional; email silently degrades to no-op in production |
| NOTIF-P2-003 | P2 | Worker lacks an `unhandledRejection` handler |
| NOTIF-P2-004 | P2 | Scheduled reminder inserts and email sends are not atomic; retries can double-send |
| NOTIF-P2-005 | P2 | Sensitive ticket content is stored and emailed verbatim with no sensitivity filter |
| NOTIF-P2-006 | P2 | API inline email fallback has no retry and ignores the send result |
| NOTIF-P2-007 | P2 | Realtime/SSE notification channel is scoped by user only, with no org assertion |
| NOTIF-P2-008 | P2 | Backup-failure alerting is present but cannot be trusted to deliver |
| NOTIF-P2-009 | P2 | notifyAndEmail enqueues email even when the in-app notification was deduped |
| NOTIF-P2-010 | P2 | Notification delivery SLO counts a queued email hand-off as success and excludes worker send outcomes |
| NOTIF-P2-011 | P2 | Alertmanager→ntfy critical alert delivery is optional in production and has no in-repo exercise evidence |
| NOTIF-P3-001 | P3 | No email template system; repetitive inline HTML diverges between senders |
| NOTIF-P3-002 | P3 | `sms` channel is a dead preference option; UI copy misstates enforcement |
| NOTIF-P3-003 | P3 | SSE polling fallback interval is not cleared on unmount |
| NOTIF-P3-004 | P3 | `notification-preferences` PUT accepts a body `organizationId` without `assertOrgScopeMatches` |
| NOTIF-P3-005 | P3 | No unsubscribe link or global opt-out in notification emails |
| NOTIF-P3-006 | P3 | Worker reminder preference lookups omit the organization, so any org's opt-out suppresses the channel for all |
| NOTIF-P3-007 | P3 | No per-recipient send throttle on notification producers |
| NOTIF-P3-008 | P3 | Worker ticket-responded email builds the deep link from unescaped payload metadata (latent XSS-in-email) |
| NOTIF-P2-012 | P2 | One-click unsubscribe is an unauthenticated GET with no expiry or confirmation; mail-security link scanners can silently opt users out |
| NOTIF-P2-013 | P2 | Global email opt-out is invisible and cannot be reversed in the notification-preferences UI |
| NOTIF-P3-009 | P3 | One-click unsubscribe changes delivery preferences without an audit event |
