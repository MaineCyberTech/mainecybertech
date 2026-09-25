# Organizations

**Category:** Core
**API Routes:** `apps/api/src/routes/organizations.ts`
**SDK:** `packages/sdk/src/organizations.ts`

## Overview

Full CRUD for organizations including domain management, logo upload, and a compound detail endpoint that returns organization data with domains, memberships, profiles, and roles in a single request. Updates use optimistic locking.

## Key Features

- List organizations (cached 60s, filterable by status or IDs)
- Compound detail endpoint with domains, memberships, profiles, and roles
- Domain management (CRUD on `organization_domains`)
- Logo upload to Supabase storage (`logos` bucket)
- Branding fields: logo_url, brand_color, accent_color, custom_domain
- Optimistic locking on updates (version check)
- Cache invalidation on create/update/delete

## Endpoints

| Method | Path                                        | Description                                        |
| ------ | ------------------------------------------- | -------------------------------------------------- |
| GET    | /api/v1/organizations                       | List organizations (cached, filterable)            |
| GET    | /api/v1/organizations/:id                   | Get organization by ID                             |
| GET    | /api/v1/organizations/:id/detail            | Get org with domains, memberships, profiles, roles |
| POST   | /api/v1/organizations                       | Create an organization (admin)                     |
| PATCH  | /api/v1/organizations/:id                   | Update an organization (admin, optimistic lock)    |
| DELETE | /api/v1/organizations/:id                   | Delete an organization (admin)                     |
| GET    | /api/v1/organizations/:id/domains           | List domains for an organization                   |
| POST   | /api/v1/organizations/:id/domains           | Add a domain (admin)                               |
| PATCH  | /api/v1/organizations/:id/domains/:domainId | Update domain auto-approve (admin)                 |
| DELETE | /api/v1/organizations/:id/domains/:domainId | Remove a domain (admin)                            |
| POST   | /api/v1/organizations/:id/logo              | Upload org logo (multipart, 5MB max)               |

## Data Model

Key tables: `organizations` (name, slug, status, primary_domain, support_plan, logo_url, brand_color, accent_color, custom_domain, version), `organization_domains` (domain, auto_approve)

## Access Control

- All authenticated users: list organizations
- Org members: view org detail, domains
- Admin: create, update, delete organizations; manage domains; upload logo
