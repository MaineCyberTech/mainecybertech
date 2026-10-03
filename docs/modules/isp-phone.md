# ISP / Phone / Network Consolidation Assessment

**Category:** Field Services
**API Routes:** `apps/api/src/routes/field-services.ts` (mounted at `/api/v1/field-services`)
**SDK:** `packages/sdk/src/field-services.ts` (`fieldServices.isp`)
**Table:** `isp_assessments` (migration `5302072_field_services.sql` + `5302097_isp_unifi_scoring_fields.sql`)

## Overview

Bill/service intake and consolidation recommendation tool for ISP, phone, VoIP, Wi-Fi, and telecom projects. Admins record current vs recommended providers and costs, then score the consolidation opportunity.

## Key Features

- Provider/service intake (current + recommended, costs, bandwidth, phone lines, VoIP readiness)
- `POST /isp/:id/score` computes a consolidation score and recommendation from monthly cost and contract length
- Contract status tracking

## Endpoints

| Method | Path                                 | Description                                  |
| ------ | ------------------------------------ | -------------------------------------------- |
| GET    | /api/v1/field-services/isp           | List assessments (paginated, org-scoped)     |
| GET    | /api/v1/field-services/isp/:id       | Get single assessment                        |
| POST   | /api/v1/field-services/isp           | Create assessment                            |
| PATCH  | /api/v1/field-services/isp/:id       | Update assessment                            |
| DELETE | /api/v1/field-services/isp/:id       | Delete assessment                            |
| POST   | /api/v1/field-services/isp/:id/score | Compute consolidation score + recommendation |

## Data Model

`isp_assessments` (id, organization_id, client_name, current_provider, current_cost, recommended_provider, recommended_cost, services, bandwidth_current, bandwidth_needed, contract_status, phone_lines, voip_ready, notes, status, created_by, created_at, updated_at). Scoring columns added by `5302097`: `monthly_cost`, `contract_length_months`, `consolidation_score`, `recommendation`.

## Access Control

- `requireAuth` + `requireOrgAccess` on all routes
- RLS via `isp_assessments` org policies
- Admin pages at `apps/web/app/(admin)/admin/field-services/isp/`; portal read-only list at `apps/web/app/(portal)/portal/field-services/`
