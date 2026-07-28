# UniFi Site Survey Planner

**Category:** Network
**API Routes:** `apps/api/src/routes/unifi-survey.ts`
**SDK:** `packages/sdk/src/unifi-survey.ts`

## Overview

Site survey planning and AP placement tool for UniFi wireless deployments. Captures floor plans, square footage, wall types, client density estimates, and generates recommended AP models with placement coordinates.

## Key Features

- Survey project CRUD per client site with status tracking (draft/in-progress/completed)
- Floor plan upload with annotated measurement references
- Recommended AP placement with model (U6-LR, U6-Pro, U6-Enterprise, etc.) and X/Y coordinates
- Coverage gap analysis based on wall type density and client count
- Bill of materials generation from placement recommendations
- Survey report export (PDF summary with floor plan overlay)

## Endpoints

| Method | Path                                               | Description                                                |
| ------ | -------------------------------------------------- | ---------------------------------------------------------- |
| GET    | /api/v1/unifi-survey/projects                      | List survey projects (paginated, filterable by org/status) |
| POST   | /api/v1/unifi-survey/projects                      | Create survey project                                      |
| GET    | /api/v1/unifi-survey/projects/:id                  | Get project detail with placements                         |
| PATCH  | /api/v1/unifi-survey/projects/:id                  | Update project                                             |
| DELETE | /api/v1/unifi-survey/projects/:id                  | Delete project                                             |
| POST   | /api/v1/unifi-survey/projects/:id/placements       | Add AP placement                                           |
| PUT    | /api/v1/unifi-survey/projects/:id/placements/:apId | Update placement                                           |
| GET    | /api/v1/unifi-survey/projects/:id/bom              | Generate bill of materials                                 |
| GET    | /api/v1/unifi-survey/projects/:id/export           | Export survey report as PDF                                |

## Data Model

`unifi_survey_projects` (organization_id, site_name, square_footage, wall_type (drywall/brick/concrete/mixed), client_density (low/medium/high), floors, status, notes). `unifi_ap_placements` (project_id, ap_model, quantity, x_coord, y_coord, floor, purpose (coverage/capacity/outdoor)).

## Access Control

- Admin: full CRUD on all survey projects
- Client: read-only view of their org's completed surveys
- requireOrgAccess enforced; RLS via organization_id
- Audit logging on project create, update, delete, and export
