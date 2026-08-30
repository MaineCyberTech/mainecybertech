# API Keys

**Category:** Tools
**API Routes:** `apps/api/src/routes/api-keys.ts`
**SDK:** `packages/sdk/src/api-keys.ts`

## Overview
API key management for generating, revoking, and tracking organization-level API keys used for programmatic access to the MCT platform.

## Key Features
- Secure key generation with SHA-256 hashing
- Key prefix for identification without full key exposure
- Optional expiration dates
- Activation/deactivation (revoke) without deletion
- Last-used tracking for security auditing
- Full key only returned once at creation time

## Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/api-keys | List API keys for an org (no pagination) |
| POST | /api/v1/api-keys | Create a new API key (returns full key once) |
| PATCH | /api/v1/api-keys/:id | Update key (name, is_active toggle) |
| DELETE | /api/v1/api-keys/:id | Permanently delete a key |

## Data Model
Key fields: `name`, `key_prefix`, `key_hash`, `permissions`, `expires_at`, `last_used_at`, `is_active`, `organization_id`, `created_by`

## Access Control
- Admin: full CRUD
- Client: no direct access (admin-managed)
