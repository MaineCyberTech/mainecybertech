# Search (Admin)

**Category:** Administration
**API Routes:** `apps/api/src/routes/search.ts`
**SDK:** `packages/sdk/src/search.ts`

## Overview

Global admin search across users, organizations, tickets, and projects. Performs parallel ILIKE queries with a minimum 2-character requirement for all search terms.

## Key Features

- Minimum 2-character search requirement
- Parallel queries across profiles, organizations, tickets, and projects
- ILIKE-based substring matching, plus a full-text (`tsvector`) branch for tickets/projects/documents
- Prefix columns (`profiles.full_name`, `organizations.name/slug`) are btree-indexed; wildcard columns use GIN trigram indexes
- Results grouped by entity type
- Fast response via concurrent database queries

## Endpoints

| Method | Path           | Description                                         |
| ------ | -------------- | --------------------------------------------------- |
| GET    | /api/v1/search | Global search across all entity types (min 2 chars) |

## Data Model

Source tables: `profiles`, `organizations`, `tickets`, `projects` (read-only across all)

## Access Control

- Admin: can search across all organizations and entities
- Client: no access
