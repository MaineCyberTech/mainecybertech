# Webhooks (Inbound)

**Category:** Integration
**API Routes:** `apps/api/src/routes/webhooks.ts`

## Overview

Inbound webhook receivers for external service integrations. Each handler verifies the webhook signature (when configured), deduplicates via idempotency keys in Redis, processes the event, and logs the delivery. No authentication middleware — endpoints are secured by signature verification.

## Key Features

- Stripe webhook processing (invoice paid/failed, subscription lifecycle, checkout session)
- Jira webhook processing (issue status sync to `project_tasks`)
- JSM webhook processing (issue status sync to `tickets`)
- M365 webhook logging
- Signature verification via HMAC (Stripe, Jira, JSM, M365)
- Idempotency deduplication via Redis
- Webhook delivery logging to `webhook_deliveries` table
- Audit logging on all events

## Endpoints

| Method | Path                    | Description                                               |
| ------ | ----------------------- | --------------------------------------------------------- |
| POST   | /api/v1/webhooks/stripe | Stripe webhook receiver (invoice, subscription, checkout) |
| POST   | /api/v1/webhooks/jira   | Jira webhook receiver (issue status sync)                 |
| POST   | /api/v1/webhooks/jsm    | JSM webhook receiver (ticket status sync)                 |
| POST   | /api/v1/webhooks/m365   | M365 webhook receiver (event logging)                     |

## Data Model

Reads: `billing_customers`, `invoices`, `subscriptions`, `project_tasks`, `tickets`
Writes: `invoices`, `subscriptions`, `billing_customers`, `project_tasks`, `tickets`, `webhook_deliveries`, `audit_logs`

## Access Control

- No `requireAuth` — these are public endpoints secured by webhook signature verification
- Stripe: `stripe-signature` header verified against `STRIPE_WEBHOOK_SECRET`
- Jira/JSM/M365: `x-hub-signature` header verified against respective `*_WEBHOOK_SECRET`

## Ingress hardening (WH-P2-006)

Each provider route has an explicit body cap enforced by
`apps/api/src/middleware/webhook-body.ts` **before** the body is parsed or any
signature/clientState check runs (oversized → `413 PAYLOAD_TOO_LARGE`):

| Provider | Cap   |
| -------- | ----- |
| stripe   | 1mb   |
| jira     | 512kb |
| jsm      | 512kb |
| m365     | 256kb |

Minimal per-provider Zod schemas (`apps/api/src/lib/webhook-schemas.ts`) reject
non-object/malformed payloads with `400 VALIDATION` before handler logic. They
are shape checks, not full provider contracts — unknown fields are preserved.

Residual: inbound webhook paths are still exempt from the global IP rate
limiter (`app.ts`) because provider retries can burst; a dedicated per-provider
rate limit remains a tracked follow-up.

## Retention (WH-P3-009)

The worker `retention` task purges both webhook tables daily in bounded
batches (`apps/worker/src/tasks/retention.ts`):

| Table | Default window | Notes |
| ----- | -------------- | ----- |
| `webhook_deliveries` | 90 days | delivery log/audit rows |
| `webhook_dead_letters` | 180 days | kept longer so an operator can triage/replay |

Windows are overridable through the `retention_policies` registry (longest
matching policy wins) or a manual payload override; a purge error fails the
task run. Indexes supporting the purge ship in migration `5302454`.

## Status Maps

**Jira:** To Do→todo, In Progress→in_progress, Under Review/Code Review→in_review, Done→done, Blocked→blocked

**JSM:** Open→new, In Progress→in_progress, Waiting for Customer→waiting_on_client, Waiting for Support→in_progress, Resolved→resolved, Closed→closed
