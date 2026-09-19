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

Key tables: `webhook_endpoints` (organization_id, name, url, secret, events, is_active, version, last_success_at, last_failure_at, last_error), `webhook_deliveries` (webhook_id, event, status, request_body, response_status, response_body, error, duration_ms, idempotency_key)

## Access Control

- All authenticated users (org-scoped): list, get webhooks
- Admin: create, update, delete, test webhooks
