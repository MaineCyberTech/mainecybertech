# Security Suite

**Category:** Security
**API Routes:** `apps/api/src/routes/security-suite.ts`
**SDK:** `packages/sdk/src/security-suite.ts`

## Overview
Comprehensive security suite covering M365 tenant hardening, incident response, identity verification, and endpoint security management across client organizations.

## Key Features
- M365 tenant security hardening assessments and recommendations
- Incident response plan tracking with detection/containment/recovery phases
- Identity verification workflows (MFA status, conditional access)
- Endpoint security coverage monitoring (EDR, AV, patch status)
- CRUD operations for all four sub-modules

## Endpoints
### M365 Hardening
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/security-suite/m365-hardening | List M365 hardening assessments |
| POST | /api/v1/security-suite/m365-hardening | Create assessment |
| GET | /api/v1/security-suite/m365-hardening/:id | Get by ID |
| PATCH | /api/v1/security-suite/m365-hardening/:id | Update |
| DELETE | /api/v1/security-suite/m365-hardening/:id | Delete |

### Incidents
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/security-suite/incidents | List incident responses |
| POST | /api/v1/security-suite/incidents | Create incident |
| GET | /api/v1/security-suite/incidents/:id | Get by ID |
| PATCH | /api/v1/security-suite/incidents/:id | Update |
| DELETE | /api/v1/security-suite/incidents/:id | Delete |

### Identity Verification
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/security-suite/identity-verification | List identity verifications |
| POST | /api/v1/security-suite/identity-verification | Create verification |
| GET | /api/v1/security-suite/identity-verification/:id | Get by ID |
| PATCH | /api/v1/security-suite/identity-verification/:id | Update |
| DELETE | /api/v1/security-suite/identity-verification/:id | Delete |

### Endpoint Security
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/security-suite/endpoint-security | List endpoint security records |
| POST | /api/v1/security-suite/endpoint-security | Create record |
| GET | /api/v1/security-suite/endpoint-security/:id | Get by ID |
| PATCH | /api/v1/security-suite/endpoint-security/:id | Update |
| DELETE | /api/v1/security-suite/endpoint-security/:id | Delete |

## Data Model
Key fields (per table): `m365_hardening` (tenant, score, findings), `incident_responses` (type, severity, detection_date, containment_date, recovery_date), `identity_verifications` (user_count, mfa_enabled, conditional_access), `endpoint_security` (device_count, edr_status, av_status, patch_compliance) — all have `organization_id`, `created_by`, `created_at`

## Access Control
- Admin: full CRUD across all sub-modules
- Client: read-only (portal, own org data)

## Worker Tasks
- `m365-hardening-scan`: Recurring M365 tenant security baseline check
- `endpoint-security-check`: Periodic endpoint coverage verification
