# Service Catalog

**Category:** Business
**API Routes:** `apps/api/src/routes/service-catalog.ts`
**SDK:** `packages/sdk/src/service-catalog.ts`

## Overview
Service catalog and billing models for defining, pricing, and managing MSP service offerings including bundled services and overture rates.

## Key Features
- Service definitions with categories (security, infrastructure, support, etc.)
- Multiple billing models (per-user, per-device, flat-rate, tiered)
- Base price, unit, included units, and overture rate pricing
- Bundle support (group services into packages)
- Active/inactive service toggling
- Visibility control (internal, client, public)

## Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/service-catalog | List all services (paginated, grouped by category) |
| POST | /api/v1/service-catalog | Create a new service |
| GET | /api/v1/service-catalog/:id | Get service by ID |
| PATCH | /api/v1/service-catalog/:id | Update service |
| DELETE | /api/v1/service-catalog/:id | Delete a service |

## Data Model
Key fields: `name`, `description`, `category`, `billing_model`, `unit`, `base_price`, `included_units`, `overture_rate`, `is_bundled`, `bundle_id`, `is_active`, `visibility`, `organization_id`, `created_by`

## Access Control
- Admin: full CRUD
- Client: read-only (portal, view active client-visible services)
