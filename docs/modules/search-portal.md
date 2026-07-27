# Search (Portal)

**Category:** Portal
**API Routes:** `apps/api/src/routes/search.ts`
**SDK:** `packages/sdk/src/search.ts`

## Overview

Org-scoped search for portal users. Performs parallel queries across tickets and projects limited to the user's organization memberships, ensuring tenant isolation.

## Key Features

- Minimum 2-character search requirement
- Scoped to user's organization memberships
- Parallel queries across tickets and projects
- ILIKE-based text matching for partial matches
- Results grouped by entity type

## Endpoints

| Method | Path                  | Description                                            |
| ------ | --------------------- | ------------------------------------------------------ |
| GET    | /api/v1/search/portal | Org-scoped search (min 2 chars, scoped to user's orgs) |

## Data Model

Source tables: `memberships` (user's org scope), `tickets`, `projects` (filtered by org)

## Access Control

- Client: can search only within own organization's data (portal)
- Admin: no special handling (uses admin search endpoint)
