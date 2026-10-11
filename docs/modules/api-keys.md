# API Keys

**Category:** Tools
**API Routes:** `apps/api/src/routes/api-keys.ts`
**SDK:** `packages/sdk/src/api-keys.ts`

## Overview
API key management for generating, revoking, and tracking organization-level API keys used for programmatic access to the MCT platform.

## Key Features
- Secure key generation with SHA-256 hashing
- Key prefix for identification without full key exposure
- Optional expiration dates, enforced at authentication time (`expires_at <= now` is rejected; unparsable timestamps fail closed)
- Permission scopes (`${module}:${action}`) enforced on every `requirePermission`-gated route
- Activation/deactivation (revoke) without deletion
- Last-used tracking for security auditing
- Full key only returned once at creation time
- Expired keys are deactivated by the daily `api-key-prune` worker task and deleted after a 30-day grace period

## Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/api-keys | List API keys for an org (no pagination); requires `api-keys:view` |
| POST | /api/v1/api-keys | Create a new API key (returns full key once); requires `api-keys:manage` |
| PATCH | /api/v1/api-keys/:id | Update key (name, is_active toggle); requires `api-keys:manage` |
| DELETE | /api/v1/api-keys/:id | Permanently delete a key; requires `api-keys:manage` |

## Data Model
Key fields: `name`, `key_prefix`, `key_hash`, `permissions`, `expires_at`, `last_used_at`, `is_active`, `organization_id`, `created_by`

## Access Control
- Admin: full CRUD (`api-keys:view` / `api-keys:manage`)
- Client: no direct access (admin-managed)
- API-key requests: the key's stored `permissions` scope list caps what it may do. A key acts with the **intersection** of its stored scopes and its creator's current effective permissions, and never inherits the creator's admin/super_admin bypass. A key with no scopes is denied every gated route (fail closed).

## Lifecycle & RLS note
- Scope format is the permission catalog key `${module}:${action}` (for example `tickets:view`); malformed scopes are rejected at creation.
- The worker task `api-key-prune` runs daily: it deactivates expired keys so they surface as revoked, then deletes keys that expired more than 30 days ago. Both phases are batched and bounded per run.
- API-key requests use the service-role Supabase client (RLS bypassed), like other API requests; tenant scoping comes from `requireOrgAccess` pinning the key's organization. ACM-P2-002 tracks the service-role/RLS backstop gap.
