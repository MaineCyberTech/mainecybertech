# Security Operations

**Category:** Security
**API Routes:** `apps/api/src/routes/security-ops.ts`
**SDK:** `packages/sdk/src/security-ops.ts`

## Overview
Security operations module covering offboarding checklists, break-glass accounts, client onboarding, and patch compliance for day-to-day security operations.

## Key Features
- Offboarding checklist management (revocation, backups, account disable)
- Break-glass account inventory and audit
- Client onboarding workflows with security requirements
- Patch compliance tracking with device-level statistics
- Compliance rate calculation and critical patch tracking

## Endpoints
### Offboarding
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/security-ops/offboarding | List offboarding checklists |
| POST | /api/v1/security-ops/offboarding | Create checklist |
| GET | /api/v1/security-ops/offboarding/:id | Get by ID |
| PATCH | /api/v1/security-ops/offboarding/:id | Update |
| DELETE | /api/v1/security-ops/offboarding/:id | Delete |

### Break Glass
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/security-ops/break-glass | List break-glass accounts |
| POST | /api/v1/security-ops/break-glass | Create account |
| GET | /api/v1/security-ops/break-glass/:id | Get by ID |
| PATCH | /api/v1/security-ops/break-glass/:id | Update |
| DELETE | /api/v1/security-ops/break-glass/:id | Delete |

### Onboarding
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/security-ops/onboarding | List onboarding clients |
| POST | /api/v1/security-ops/onboarding | Create onboarding |
| GET | /api/v1/security-ops/onboarding/:id | Get by ID |
| PATCH | /api/v1/security-ops/onboarding/:id | Update |
| DELETE | /api/v1/security-ops/onboarding/:id | Delete |

### Patch Compliance
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/security-ops/patch-compliance | List patch compliance records |
| GET | /api/v1/security-ops/patch-compliance/stats | Get aggregate stats (total devices, patched, critical, compliance rate) |
| POST | /api/v1/security-ops/patch-compliance | Create record |
| GET | /api/v1/security-ops/patch-compliance/:id | Get by ID |
| PATCH | /api/v1/security-ops/patch-compliance/:id | Update |
| DELETE | /api/v1/security-ops/patch-compliance/:id | Delete |

## Data Model
Key fields (per table): `offboarding_checklists` (employee, tasks, status), `break_glass_accounts` (account, credential_vault, last_used), `onboarding_clients` (client_name, requirements, status), `patch_compliance` (total_devices, patched_devices, critical_patches, group_name) — all have `organization_id`, `created_by`, `created_at`

## Access Control
- Admin: full CRUD across all sub-modules
- Client: read-only (portal, own org data)

## Worker Tasks
- `patch-compliance-check`: Scheduled patch compliance verification
