# Search (Admin)

**Category:** Administration
**API Routes:** `apps/api/src/routes/search.ts`
**SDK:** `packages/sdk/src/search.ts`

## Overview

Global admin search across users, organizations, tickets, projects and documents. Requires a platform admin (`requireAuth` + `requireOrgAccess` + `requireAdmin`), is rate limited, and every query is audit-logged with a truncated hash of the term instead of the raw text.

## Key Features

- Minimum 2-character search requirement; shorter/empty terms return empty sets without touching the database
- Parallel queries across `profiles`, `organizations`, `tickets`, `projects` and `documents`
- ILIKE substring matching plus a generated `search_vector` full-text (`wfts`) branch for tickets/projects/documents
- Caller-tunable page size: `?limit` (default 5, hard cap 25); documents over-fetch a bounded window and are then filtered by the `can_read_document` visibility model (SEARCH-P2-008)
- Response includes per-entity `counts` and the applied `limit` alongside the entity arrays
- Tenant scoping: tenant admins see only their approved orgs; only a `super_admin` profile flag **and** a cross-tenant role key sees every tenant
- Staff PII projection: emails/phones are returned only to super admins; other admins get name/title
- Rate limited (`rateLimitSearch`) and counted in `portal_search_queries_total`
- Audit event `search.query` stores `queryHash` + `queryLength` + `resultCounts`, never the raw term (SEARCH-P2-001)

## Endpoints

| Method | Path           | Description                                                             |
| ------ | -------------- | ----------------------------------------------------------------------- |
| GET    | /api/v1/search | Global search across all entity types (min 2 chars, optional `?limit`) |

## Response Shape

```json
{
  "users": [],
  "organizations": [],
  "tickets": [],
  "projects": [],
  "documents": [],
  "counts": { "users": 0, "organizations": 0, "tickets": 0, "projects": 0, "documents": 0 },
  "limit": 5
}
```

`counts` are exact DB totals for users/organizations/tickets/projects. The documents count is the readable subset of the fetched window (or the exact total for super admins), so hidden private/internal documents cannot be inferred.

## Data Model

Source tables: `profiles`, `organizations`, `tickets`, `projects`, `documents` (read-only; document rows are filtered by the `can_read_document` visibility model).

## Access Control

- Admin: platform admins only; results are scoped to the caller's approved orgs unless they are a cross-tenant super admin
- Client: no access (use `/api/v1/search/portal`)
