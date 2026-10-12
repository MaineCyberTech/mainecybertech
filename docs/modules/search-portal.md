# Search (Portal)

**Category:** Portal
**API Routes:** `apps/api/src/routes/search-portal.ts`
**SDK:** `packages/sdk/src/search.ts`

## Overview

Org-scoped search for portal users across tickets, projects and documents, limited to the caller's approved organization memberships. Requires authentication only (no admin role) and fails closed when the caller has no approved memberships.

## Key Features

- Minimum 2-character search requirement; shorter/empty terms return empty sets without touching the database
- Parallel queries across `tickets`, `projects` and `documents`
- ILIKE substring matching plus a generated `search_vector` full-text (`wfts`) branch
- Fixed page size of 5 results per entity (documents over-fetch a bounded window, are filtered by the `can_read_document` visibility model, then trimmed to 5)
- Scoped to the caller's approved memberships; an empty membership list returns empty sets (never "all")
- Rate limited (`rateLimitSearch`) and counted in `portal_search_queries_total` (SEARCH-P2-005)

## Endpoints

| Method | Path                  | Description                                            |
| ------ | --------------------- | ------------------------------------------------------ |
| GET    | /api/v1/search/portal | Org-scoped search (min 2 chars, scoped to user's orgs) |

## Response Shape

```json
{ "tickets": [], "projects": [], "documents": [] }
```

No counts or `limit` — the portal page size is fixed at 5.

## Data Model

Source tables: `memberships` (caller's org scope), `tickets`, `projects`, `documents` (filtered by org and document visibility).

## Access Control

- Client: can search only within their own organizations' data
- Admin: no special handling here — the admin surface is `/api/v1/search`
