# Batch

**Category:** Operations
**API Routes:** `apps/api/src/routes/batch.ts`

## Overview

Batch operations module for managing licenses, status items, website monitors, and DMARC assessments. Provides CRUD endpoints for each entity type plus aggregated status views and license savings calculations.

## Key Features

- CRUD for licenses, status items, website monitors, and DMARC assessments
- Public status endpoint for external status pages
- License savings calculator
- Filterable by organization and status
- Pagination on all list endpoints

## Endpoints

| Method | Path                               | Description                           |
| ------ | ---------------------------------- | ------------------------------------- |
| GET    | /api/v1/batch/licenses             | List licenses (paginated, filterable) |
| POST   | /api/v1/batch/licenses             | Create a license                      |
| DELETE | /api/v1/batch/licenses/:id         | Delete a license                      |
| GET    | /api/v1/batch/licenses/savings     | Get license savings summary           |
| GET    | /api/v1/batch/status               | List status items                     |
| POST   | /api/v1/batch/status               | Create a status item                  |
| DELETE | /api/v1/batch/status/:id           | Delete a status item                  |
| GET    | /api/v1/batch/status/public        | Public status endpoint (no auth)      |
| GET    | /api/v1/batch/website-monitors     | List website monitors                 |
| POST   | /api/v1/batch/website-monitors     | Create a website monitor              |
| DELETE | /api/v1/batch/website-monitors/:id | Delete a website monitor              |
| GET    | /api/v1/batch/dmarc                | List DMARC assessments                |
| POST   | /api/v1/batch/dmarc                | Create a DMARC assessment             |
| DELETE | /api/v1/batch/dmarc/:id            | Delete a DMARC assessment             |

## Data Model

Key tables: `license_tracking`, `status_items`, `website_monitors`, `dmarc_assessments`

## Access Control

- Admin: full CRUD on all batch entities
- Public: read-only access to `/status/public`
