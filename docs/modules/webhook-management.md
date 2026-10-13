# Webhook Management

**Category:** Admin
**API Routes:** `apps/api/src/routes/webhook-management.ts`
**SDK:** `packages/sdk/src/webhooks.ts`

## Overview

Admin CRUD for outbound webhook endpoints. Manage webhook subscriptions, test delivery, and review delivery history. Updates use optimistic locking.

## Key Features

- List webhook endpoints (filterable by organization)
- Create, update, delete webhook endpoints
- Test webhook delivery (sends a ping event and records the result)
- View paginated delivery history per webhook
- Optimistic locking on updates (version check)
- Audit logging on all mutations

## Endpoints

| Method | Path                                     | Description                                  |
| ------ | ---------------------------------------- | -------------------------------------------- |
| GET    | /api/v1/webhook-endpoints                | List webhooks (filter by organization_id)    |
| GET    | /api/v1/webhook-endpoints/:id            | Get webhook by ID                            |
| POST   | /api/v1/webhook-endpoints                | Create a webhook endpoint (admin)            |
| PATCH  | /api/v1/webhook-endpoints/:id            | Update a webhook endpoint (admin, opt. lock) |
| DELETE | /api/v1/webhook-endpoints/:id            | Delete a webhook endpoint (admin)            |
| GET    | /api/v1/webhook-endpoints/:id/deliveries | Paginated delivery history                   |
| POST   | /api/v1/webhook-endpoints/:id/test       | Send a test ping delivery                    |

## Data Model

Key tables: `webhook_endpoints` (organization_id, name, url, secret, secret_rotated_at, secret_expires_at, events, is_active, version, last_success_at, last_failure_at, last_error), `webhook_deliveries` (webhook_id, event, status, request_body, response_status, response_body, error, duration_ms, idempotency_key)

## Access Control

- `webhooks:view`: list, get webhooks, delivery history, dead letters (read routes)
- `webhooks:manage`: create, update, delete, test webhooks, retry/dismiss dead letters

## Signing secrets (WH-P2-008 / ACM-P2-007)

Endpoint signing secrets are **encrypted at rest** (AES-256-GCM via
`apps/api/src/lib/field-encryption.ts`; legacy plaintext values keep working and
are re-encrypted on the next write). Responses always mask the secret
(first 4 / last 4 chars). Every write records `secret_rotated_at` and defaults
`secret_expires_at` to +90 days (override with `secretExpiresAt`); expiry is
advisory and does not gate delivery. Rotation procedure:
`docs/SECRETS_ROTATION.md` → "Outbound webhook signing secrets".

## Test ping (WH-P3-001)

`POST /:id/test` derives a deterministic idempotency key from the endpoint and
the exact ping payload (including its timestamp) and claims it before sending —
mirroring the shared dispatcher — so an exact replay is deduplicated. The claim
is released when the delivery fails. Outbound responses (test and real
deliveries) are read through `pinnedFetch`, which caps the buffered body at
64 KiB (WH-P3-007).
