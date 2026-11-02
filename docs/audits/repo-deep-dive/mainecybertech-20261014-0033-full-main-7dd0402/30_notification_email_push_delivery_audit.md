# 30_notification_email_push_delivery_audit — Prompt 30 - Notification, Email, and Push Delivery Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `30_notification_email_push_delivery_audit.md` (area NOTIF, prompt)

## Verification Performed

Domain subagent produced 24 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

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
