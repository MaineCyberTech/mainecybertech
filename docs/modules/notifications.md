# Notifications

**Category:** Core
**API Routes:** `apps/api/src/routes/notifications.ts`
**SDK:** `packages/sdk/src/notifications.ts`

## Overview

In-app notification system with real-time SSE streaming, unread counts, and org-scoped mark-all-read. Supports both system-generated and admin-created notifications with full CRUD.

## Key Features

- Real-time Server-Sent Events (SSE) streaming endpoint
- Paginated notification list with read/unread status
- Unread count for badge display
- Individual and bulk mark-as-read
- Org-scoped mark-all-read (prevents cross-org side effects)
- Admin can create and delete notifications
- Preference-aware delivery

## Endpoints

| Method | Path                                | Description                                |
| ------ | ----------------------------------- | ------------------------------------------ |
| GET    | /api/v1/notifications/stream        | SSE stream for real-time notifications     |
| GET    | /api/v1/notifications               | List notifications (paginated, filterable) |
| GET    | /api/v1/notifications/unread-count  | Get unread notification count              |
| POST   | /api/v1/notifications/:id/read      | Mark single notification as read           |
| POST   | /api/v1/notifications/mark-all-read | Mark all notifications read (org-scoped)   |
| POST   | /api/v1/notifications               | Create a notification (admin only)         |
| DELETE | /api/v1/notifications/:id           | Delete a notification                      |
| GET    | /api/v1/notifications/unsubscribe   | One-click global email opt-out (signed token, no session) |

## Data Model

Key fields: `id`, `user_id`, `title`, `body`, `type`, `read`, `organization_id`, `entity_type`, `entity_id`, `created_at`

## Access Control

- Admin: full CRUD + create/delete any notification
- Client: read own notifications + mark read (portal)

## Content Sensitivity (NOTIF-P2-005)

Notification bodies are filtered by `redactSensitiveContent`
(`apps/api/src/lib/notification-content.ts`, mirrored in
`apps/worker/src/notification-content.ts`): credential-like values
(password/API-key/token assignments, bearer tokens, provider key shapes,
PEM private-key blocks), SSNs and Luhn-valid card numbers are replaced with
`[redacted]` before the row is stored or an email is queued. Ticket-comment
notifications carry an abstract body plus the deep link instead of the raw
comment excerpt.

## Delivery Metrics (NOTIF-P2-010)

A successful API-side email enqueue is recorded as
`portal_notification_delivery_total{status="queued"}` — a hand-off, not a
delivery. The worker records the terminal outcome
(`worker_notification_delivery_total`); the delivery SLO in `docs/SLO.md` and
`MCTNotificationDeliveryFailureRateHigh` are computed from those worker
outcomes.

## Email template (NOTIF-P3-001)

All notification senders (API `lib/notify.ts`, worker
`tasks/scheduled-notifications.ts`, admin test-email) render through the shared
`@mct/sdk/email-template` helper: one subject prefix, one layout, one footer.
Every interpolated value is escaped by the helper, so a deep link or body can
never break out of the email HTML (NOTIF-P3-008).

## Unsubscribe and global opt-out (NOTIF-P3-005)

Notification emails carry a **Manage notification preferences** link and a
signed **Unsubscribe from these emails** link. The unsubscribe link is an
HMAC token over `{userId, organizationId}` (key derived from the service-role
key via HKDF — no extra secret to provision); `GET
/api/v1/notifications/unsubscribe?token=…` writes a `module_key = 'all'` row in
`notification_preferences`, which both the API and worker resolvers honour for
every module. In-app notifications are not affected. The token is per
organization; a user in several orgs unsubscribes per org.

## Preference scoping (NOTIF-P3-006)

`notification_preferences` is org-scoped, and both the API and worker resolvers
match `organization_id` exactly when it is known. The worker scheduled
reminders (task-due, ticket-responded, custom) now pass the notification's
organization, so an opt-out in one org cannot silence the same channel in
another.

## Per-recipient email throttle (NOTIF-P3-007)

Every send path checks a recipient-scoped bucket before emailing: at most
**30 emails per recipient per hour** (keyed by a hash of the address, Redis
`INCR` with a two-hour TTL so the limit holds across replicas). Throttled sends
are counted as `portal_notification_throttled_total` /
`worker_notification_throttled_total` and drop only the email — the in-app row
is still created. The check fails open if the counter store is unavailable.
