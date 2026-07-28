# ISP Phone Network Consolidation

**Category:** Network
**API Routes:** `apps/api/src/routes/isp-phone.ts`
**SDK:** `packages/sdk/src/isp-phone.ts`

## Overview

Centralized inventory and cost-analysis tool for managing ISP circuits, phone lines, and SD-WAN links across client locations. Provides contract tracking, cost comparison, renewal alerts, and consolidation recommendations.

## Key Features

- Circuit inventory (fiber, cable, DSL, LTE, SD-WAN) with provider, bandwidth, contract dates
- Phone line tracking (POTS, SIP, PRI, hosted VoIP) with usage metrics and cost per line
- Cost aggregation with monthly/ annual spend totals and per-location breakdowns
- Renewal calendar with 30/60/90-day alerts and automated notification triggers
- Consolidation opportunity engine — detects overlapping services at the same site

## Endpoints

| Method | Path                            | Description                                                       |
| ------ | ------------------------------- | ----------------------------------------------------------------- |
| GET    | /api/v1/isp-phone/circuits      | List circuits (paginated, filterable by org/type/provider/status) |
| POST   | /api/v1/isp-phone/circuits      | Create circuit record                                             |
| PATCH  | /api/v1/isp-phone/circuits/:id  | Update circuit                                                    |
| DELETE | /api/v1/isp-phone/circuits/:id  | Soft-delete circuit                                               |
| GET    | /api/v1/isp-phone/lines         | List phone lines                                                  |
| POST   | /api/v1/isp-phone/lines         | Create phone line                                                 |
| GET    | /api/v1/isp-phone/renewals      | Upcoming renewals grouped by month                                |
| GET    | /api/v1/isp-phone/consolidation | Consolidation opportunities per org                               |
| GET    | /api/v1/isp-phone/spend         | Cost summary per org/location                                     |

## Data Model

`isp_circuits` (organization_id, location_id, provider, circuit_type, bandwidth_mbps, contract_start, contract_end, monthly_cost, status, notes). `isp_phone_lines` (organization_id, location_id, provider, line_type, number, monthly_cost, usage_monthly_minutes, contract_end). Both have `created_at`, `updated_at`, `created_by`.

## Access Control

- Admin: full CRUD across all org circuits and lines
- Client (portal): read-only view of their org's circuits and lines
- requireOrgAccess enforced on all endpoints
- Audit logging on create, update, delete for both entities
