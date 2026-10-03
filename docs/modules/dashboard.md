# Dashboard

**Category:** Administration
**API Routes:** `apps/api/src/routes/dashboard.ts`

## Overview

Admin dashboard summary endpoint providing aggregate entity counts across the platform. Returns a snapshot of organizations, tickets, projects, documents, and memberships for the admin home page.

## Key Features

- Single aggregated endpoint for dashboard statistics
- Cached for 30 seconds to reduce database load
- Counts across all major entity types
- Organization-aware scoping

## Endpoints

| Method | Path                      | Description                       |
| ------ | ------------------------- | --------------------------------- |
| GET    | /api/v1/dashboard/summary | Get aggregate counts (cached 30s) |

## Data Model

Source tables: `organizations`, `tickets`, `projects`, `documents`, `memberships` (read-only aggregates)

## Access Control

- Admin: full access to dashboard summary
- Client: no access
