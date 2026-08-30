# Governance

**Category:** Operations
**API Routes:** `apps/api/src/routes/governance.ts`
**SDK:** `packages/sdk/src/governance.ts`

## Overview
Governance module covering change requests, risk register, retention policies, and tabletop exercise tracking for MSP compliance and operational governance.

## Key Features
- Change request management with approval workflow
- Risk register with scoring and mitigation tracking
- Data retention policy management
- Tabletop exercise planning and execution tracking
- CRUD operations for all four sub-modules

## Endpoints
### Change Requests
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/governance/change-requests | List change requests (paginated) |
| POST | /api/v1/governance/change-requests | Create change request |
| GET | /api/v1/governance/change-requests/:id | Get by ID |
| PATCH | /api/v1/governance/change-requests/:id | Update |
| DELETE | /api/v1/governance/change-requests/:id | Delete |

### Risks
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/governance/risks | List risks |
| POST | /api/v1/governance/risks | Create risk |
| GET | /api/v1/governance/risks/:id | Get by ID |
| PATCH | /api/v1/governance/risks/:id | Update |
| DELETE | /api/v1/governance/risks/:id | Delete |

### Retention
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/governance/retention | List retention policies |
| POST | /api/v1/governance/retention | Create policy |
| GET | /api/v1/governance/retention/:id | Get by ID |
| PATCH | /api/v1/governance/retention/:id | Update |
| DELETE | /api/v1/governance/retention/:id | Delete |

### Tabletop Exercises
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/governance/tabletop | List tabletop exercises |
| POST | /api/v1/governance/tabletop | Create exercise |
| GET | /api/v1/governance/tabletop/:id | Get by ID |
| PATCH | /api/v1/governance/tabletop/:id | Update |
| DELETE | /api/v1/governance/tabletop/:id | Delete |

## Data Model
Key fields (per table): `change_requests` (title, status, risk_level, approver), `risk_register` (risk, likelihood, impact, score, mitigation), `retention_policies` (data_type, retention_period, legal_basis), `tabletop_exercises` (scenario, date, participants, findings) — all have `organization_id`, `created_by`, `created_at`

## Access Control
- Admin: full CRUD across all sub-modules
- Client: read-only (portal, own org data)
