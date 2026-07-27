# Assets

**Category:** Operations
**API Routes:** `apps/api/src/routes/assets.ts`
**SDK:** `packages/sdk/src/assets.ts`

## Overview
Client asset and warranty tracker for managing hardware inventory, warranty expiration, QR labeling, and replacement recommendations across client organizations.

## Key Features
- Asset lifecycle management (active, retired, decommissioned)
- Warranty expiration tracking with 90-day early warning
- QR label generation for physical asset tagging
- Replacement recommendation tracking
- Asset type categorization (server, workstation, network, etc.)
- Site/location assignment
- Comments and timeline events per asset
- CSV/JSON export
- Stats endpoint with status/type breakdown

## Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/assets | List all assets (paginated, filterable by status/type/warranty) |
| GET | /api/v1/assets/export | Export assets as CSV/JSON |
| GET | /api/v1/assets/stats | Get asset statistics (by status, by type, expiring warranties) |
| GET | /api/v1/assets/:id | Get asset by ID (with comments and timeline) |
| POST | /api/v1/assets | Create a new asset |
| PATCH | /api/v1/assets/:id | Update asset (optimistic locking) |
| DELETE | /api/v1/assets/:id | Delete an asset |

## Data Model
Key fields: `name`, `asset_type`, `make`, `model`, `serial_number`, `asset_tag`, `qr_label`, `location`, `site`, `purchase_date`, `warranty_expires`, `replacement_recommended`, `status`, `organization_id`, `created_by`

## Access Control
- Admin: full CRUD
- Client: read-only (portal, own org assets)
